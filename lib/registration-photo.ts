import https from "node:https";
import type { PlanePhoto } from "./airplane-media";

const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { expires: number; photo: PlanePhoto | null }>();

/**
 * Photograph of one registration. Commons and Openverse first (licensed photos),
 * then Airport-Data's public thumbnail API, which returns a URL and the photographer.
 * The image is not copied into the app.
 */
export async function findRegistrationPhoto(registration: string): Promise<PlanePhoto | null> {
  const reg = registration.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (reg.length < 4 || reg.length > 8) return null;
  const hit = cache.get(reg);
  if (hit && hit.expires > Date.now()) return hit.photo;
  const photo = (await searchCommons(reg)) ?? (await searchOpenverse(reg)) ?? (await searchAirportData(reg));
  cache.set(reg, { expires: Date.now() + CACHE_MS, photo });
  return photo;
}

async function searchCommons(reg: string): Promise<PlanePhoto | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `intitle:${reg}`,
    gsrnamespace: "6",
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "800",
  });
  const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = Object.values(
    ((data.query as { pages?: Record<string, CommonsPage> } | undefined)?.pages ?? {}) as Record<string, CommonsPage>,
  );
  const match = pages.find((page) => {
    const info = page.imageinfo?.[0];
    const title = (page.title ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return Boolean(info?.mime?.startsWith("image/") && info.thumburl && title.includes(reg));
  });
  const info = match?.imageinfo?.[0];
  if (!info?.thumburl || !match?.title) return null;
  const artist = stripHtml(info.extmetadata?.Artist?.value ?? "");
  return {
    src: info.thumburl,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(match.title).replace(/%20/g, "_")}`,
    license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? "Wikimedia Commons"),
    credit: artist || "Wikimedia Commons",
  };
}

async function searchOpenverse(reg: string): Promise<PlanePhoto | null> {
  const data = await getJson(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(`"${reg}"`)}&license_type=commercial&page_size=5`,
  );
  const results = (data.results as OpenverseHit[] | undefined) ?? [];
  const match = results.find((item) => {
    const title = `${item.title ?? ""} ${item.foreign_landing_url ?? ""}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return Boolean(item.url && title.includes(reg) && item.license);
  });
  if (!match?.url) return null;
  return {
    src: match.url,
    page: match.foreign_landing_url || match.url,
    license: match.license_version ? `${match.license.toUpperCase()} ${match.license_version}` : match.license.toUpperCase(),
    credit: match.creator || match.source || "Openverse",
  };
}

async function searchAirportData(reg: string): Promise<PlanePhoto | null> {
  const data = await getJson(`https://airport-data.com/api/ac_thumb.json?r=${encodeURIComponent(reg)}&n=1`);
  const row = ((data.data as AirportThumb[] | undefined) ?? [])[0];
  if (data.status !== 200 || !row?.image || !row.link) return null;
  if (!row.image.startsWith("https://airport-data.com/")) return null;
  return {
    src: row.image,
    page: row.link,
    license: "Airport-Data.com",
    credit: row.photographer || "Airport-Data.com",
  };
}

type CommonsPage = {
  title?: string;
  imageinfo?: { thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }[];
};

type OpenverseHit = {
  title?: string;
  url?: string;
  foreign_landing_url?: string;
  license: string;
  license_version?: string;
  creator?: string;
  source?: string;
};

type AirportThumb = { image?: string; link?: string; photographer?: string };

async function getJson(url: string): Promise<Record<string, unknown>> {
  try {
    const body = await getText(url);
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers: { "User-Agent": "Acrohub/1.0 (unofficial contest viewer; photo attribution)", Accept: "application/json" }, timeout: 12_000 },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status === 404) {
          response.resume();
          reject(new Error("not found"));
          return;
        }
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    request.on("error", reject);
  });
}
