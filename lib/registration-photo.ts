import https from "node:https";
import type { PlanePhoto } from "./airplane-media";

const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { expires: number; photo: PlanePhoto | null }>();

/** Look up a Wikimedia Commons photograph whose title contains this registration. */
export async function findRegistrationPhoto(registration: string): Promise<PlanePhoto | null> {
  const reg = registration.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (reg.length < 4 || reg.length > 8) return null;
  const hit = cache.get(reg);
  if (hit && hit.expires > Date.now()) return hit.photo;
  const photo = await searchCommons(reg);
  cache.set(reg, { expires: Date.now() + CACHE_MS, photo });
  return photo;
}

async function searchCommons(reg: string): Promise<PlanePhoto | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `"${reg}" aircraft`,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "800",
  });
  const body = await getText(`https://commons.wikimedia.org/w/api.php?${params}`);
  const data = JSON.parse(body) as {
    query?: { pages?: Record<string, { title?: string; imageinfo?: { thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }[] }> };
  };
  const pages = Object.values(data.query?.pages ?? {});
  const match = pages.find((page) => {
    const info = page.imageinfo?.[0];
    const title = (page.title ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return info?.mime?.startsWith("image/") && title.includes(reg) && info.thumburl;
  });
  const thumb = match?.imageinfo?.[0]?.thumburl;
  if (!thumb || !match?.title) return null;
  const info = match.imageinfo?.[0];
  const license = info?.extmetadata?.LicenseShortName?.value || "Wikimedia Commons";
  return {
    src: thumb,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(match.title).replace(/%20/g, "_")}`,
    license: license.replace(/<[^>]+>/g, ""),
    credit: "Wikimedia Commons",
  };
}

function getText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Acrohub/1.0 (unofficial contest viewer)" }, timeout: 12_000 }, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}
