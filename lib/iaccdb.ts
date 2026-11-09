import https from "node:https";
import { CACHE_TTL_MS, IACCDB_ORIGIN, PILOT_SCORE_FETCH_LIMIT } from "./constants";
import { buildSeasonBook, figureAverage, sheetPercent, type SeasonBook, type SeasonContest, type SeasonFigure } from "./season-book";
import { mapPool } from "./pool";
import {
  parseContestDetail,
  parseContestIndex,
  parseFlight,
  parseJudgeLeaders,
  parsePilotFlight,
  parsePilotIndex,
  parsePilotPage,
  parseRegionalSeries,
  searchPilots,
} from "./parse";
import { computeScoresheet, type Scoresheet } from "./scoresheet";
import { seasonResultsFromContest, type SeasonResult } from "./season-stats";
import { matchPilotScore, toPilotScore } from "./scores";
import type {
  ContestDetail,
  FlightDetail,
  JudgeLeaders,
  ParsedAppearance,
  PilotAppearance,
  PilotFlightRecord,
  PilotHit,
  PilotProfile,
  RegionalSeries,
  YearIndex,
} from "./types";

/**
 * Server-side IACCDB client. The public contest JSON has no CORS header, and
 * some records still point at http://localhost:3000. Responses are cached for
 * about 10 minutes and identical in-flight requests are shared.
 */

const ERROR_TTL_MS = 20_000;
const MAX_BYTES = 5_000_000;

type CacheEntry = {
  expires: number;
  status: number;
  body: string;
  ok: boolean;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

export class UpstreamError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

function pruneCache(): void {
  if (cache.size < 200) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key);
  }
}

async function iaccdbFetch(path: string, accept: string): Promise<CacheEntry> {
  if (!path.startsWith("/")) throw new UpstreamError("Invalid IACCDB path", 400);
  const key = `${accept} ${path}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;

  const request = fetchEntry(path, accept)
    .then((entry) => {
      cache.set(key, entry);
      inflight.delete(key);
      return entry;
    })
    .catch((error: unknown) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, request);
  return request;
}

function fetchEntry(path: string, accept: string, redirects = 0): Promise<CacheEntry> {
  pruneCache();
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const request = https.get(
      `${IACCDB_ORIGIN}${path}`,
      {
        headers: {
          Accept: accept,
          "User-Agent": "Acrohub/1.0 (unofficial IACCDB viewer)",
        },
        timeout: 20_000,
      },
      (response) => {
        const status = response.statusCode ?? 502;
        const location = response.headers.location;
        if (status >= 300 && status < 400 && location && redirects < 3) {
          response.resume();
          const next = new URL(location, IACCDB_ORIGIN);
          if (next.origin !== IACCDB_ORIGIN) {
            fail(new UpstreamError("IACCDB redirect left the contest database", 502));
            return;
          }
          fetchEntry(`${next.pathname}${next.search}`, accept, redirects + 1).then(
            (entry) => {
              if (settled) return;
              settled = true;
              resolve(entry);
            },
            fail,
          );
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            request.destroy();
            fail(new UpstreamError("IACCDB response was too large", 502));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          if (settled) return;
          settled = true;
          if (status < 200 || status >= 300) console.error(`IACCDB ${status} ${path}`);
          const body = Buffer.concat(chunks)
            .toString("utf8")
            .replaceAll("http://localhost:3000", IACCDB_ORIGIN)
            .replaceAll("https://localhost:3000", IACCDB_ORIGIN);
          resolve({
            expires: Date.now() + (status >= 200 && status < 300 ? CACHE_TTL_MS : ERROR_TTL_MS),
            status,
            body,
            ok: status >= 200 && status < 300,
          });
        });
      },
    );
    request.on("timeout", () => {
      request.destroy();
      fail(new UpstreamError("IACCDB timed out", 504));
    });
    request.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ERR_STREAM_DESTROYED") return;
      fail(error);
    });
  });
}

async function readJson(path: string): Promise<unknown> {
  const response = await iaccdbFetch(path, "application/json");
  if (response.status === 404) throw new UpstreamError("Not found", 404);
  if (!response.ok) throw new UpstreamError(`IACCDB ${response.status}`, response.status || 502);
  try {
    return JSON.parse(response.body) as unknown;
  } catch {
    throw new UpstreamError("IACCDB returned invalid JSON", 502);
  }
}

async function readHtml(path: string): Promise<CacheEntry> {
  return iaccdbFetch(path, "text/html");
}

export async function getContestIndex(year?: string): Promise<YearIndex> {
  const path = year && /^\d{4}$/.test(year) ? `/contests.json?year=${year}` : "/contests.json";
  return parseContestIndex(await readJson(path));
}

export async function getSeasonResults(year?: string): Promise<{
  year: number;
  years: number[];
  results: SeasonResult[];
  contestsPosted: number;
}> {
  const requested = year && /^\d{4}$/.test(year) ? year : undefined;
  const index = await getContestIndex(requested);
  const selected = Number(requested ?? index.contestYear) || index.years[0];
  const posted = index.contests.filter((contest) => contest.hasResults);
  const details = await mapPool(posted, 4, (contest) => getContest(contest.id));
  const results = details.flatMap((contest) => (contest ? seasonResultsFromContest(contest) : []));
  return {
    year: selected,
    years: index.years,
    results,
    contestsPosted: posted.length,
  };
}

export async function getContest(id: number): Promise<ContestDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    return parseContestDetail(await readJson(`/contests/${id}.json`));
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) return null;
    throw error;
  }
}

export async function getFlight(id: number): Promise<FlightDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    return parseFlight(await readJson(`/flights/${id}.json`));
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) return null;
    console.error(`Flight ${id} unavailable`);
    return null;
  }
}

export type ScoresheetView = {
  pilotFlightId: number;
  pilot: PilotFlightRecord["pilot"];
  airplane: PilotFlightRecord["airplane"];
  chapter: string;
  horsConcours: boolean;
  flightId: number;
  flightName: string;
  categoryName: string;
  contestId: number | null;
  contestName: string;
  contestYear: number | null;
  rank: number | null;
  judges: { name: string; assistant: string }[];
  sheet: Scoresheet;
};

export async function getPilotFlight(id: number): Promise<PilotFlightRecord | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    return parsePilotFlight(await readJson(`/pilot_flights/${id}.json`));
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) return null;
    throw error;
  }
}

export async function getScoresheet(id: number): Promise<ScoresheetView | null> {
  const record = await getPilotFlight(id);
  if (!record) return null;
  const flight = record.flight.id > 0 ? await getFlight(record.flight.id) : null;
  const standing = flight?.pilots.find((pilot) => pilot.pilotFlightId === record.id);
  const sheet = computeScoresheet({
    judges: record.judges,
    kValues: record.kValues,
    penalty: record.penalty,
    year: flight?.contest?.year ?? null,
    totalPossible: standing?.totalPossible ?? null,
  });
  return {
    pilotFlightId: record.id,
    pilot: record.pilot,
    airplane: record.airplane,
    chapter: record.chapter,
    horsConcours: record.horsConcours,
    flightId: record.flight.id,
    flightName: record.flight.name,
    categoryName: record.flight.categories.map((category) => category.name).filter(Boolean).join(", "),
    contestId: flight?.contest?.id ?? null,
    contestName: flight?.contest?.name ?? "",
    contestYear: flight?.contest?.year ?? null,
    rank: standing?.rank ?? null,
    judges: record.judges.map((judge) => ({ name: judge.name, assistant: judge.assistant })),
    sheet,
  };
}

export async function getPilotContestSheets(pilotId: number, contestId: number): Promise<ScoresheetView[]> {
  const contest = await getContest(contestId);
  if (!contest) return [];
  const jobs = contest.categoryResults.flatMap((category) =>
    category.pilots.some((pilot) => pilot.id === pilotId)
      ? category.flights.map((flight) => flight.id)
      : [],
  );
  const uniqueFlights = [...new Set(jobs)];
  const sheets = await mapPool(uniqueFlights, 4, async (flightId) => {
    const flight = await getFlight(flightId);
    const standing = flight?.pilots.find((pilot) => pilot.pilotId === pilotId);
    if (!standing || standing.pilotFlightId <= 0) return null;
    return getScoresheet(standing.pilotFlightId);
  });
  return sheets.filter((sheet): sheet is ScoresheetView => sheet != null);
}

export async function searchPilotIndex(query: string): Promise<{ total: number; pilots: PilotHit[] }> {
  const trimmed = query.trim().slice(0, 80);
  if (trimmed.length < 2) return { total: 0, pilots: [] };
  const response = await readHtml("/pilots");
  if (!response.ok) throw new UpstreamError("Pilot index unavailable", response.status || 502);
  return searchPilots(parsePilotIndex(response.body), trimmed, 25);
}

export async function getPilotSeason(profile: PilotProfile, year: number): Promise<SeasonBook> {
  const selected = profile.appearances.filter((appearance) => appearance.date.startsWith(`${year}-`));
  const loaded = await mapPool(selected, 4, async (appearance) =>
    appearance.score ? appearance : enrichAppearance(appearance, profile.id),
  );
  const contestIds = [...new Set(loaded.map((appearance) => appearance.contestId))];
  const sheets = new Map<number, ScoresheetView[]>();
  await mapPool(contestIds, 2, async (contestId) => {
    sheets.set(contestId, await getPilotContestSheets(profile.id, contestId));
  });
  const contests: SeasonContest[] = loaded.map((appearance) => {
    const related = (sheets.get(appearance.contestId) ?? []).filter((sheet) =>
      categoriesMatch(sheet.categoryName, appearance.categoryName),
    );
    const figures: SeasonFigure[] = related.flatMap((sheet) =>
      sheet.sheet.figures.flatMap((figure) => {
        const average = figureAverage(figure.average);
        if (average == null) return [];
        return [
          {
            contestId: appearance.contestId,
            contestName: appearance.contestName,
            flightName: sheet.flightName || "Flight",
            pilotFlightId: sheet.pilotFlightId,
            figure: figure.label === "P" ? "Presentation" : figure.label,
            average,
            k: figure.k,
          },
        ];
      }),
    );
    return {
      contestId: appearance.contestId,
      name: appearance.contestName,
      date: appearance.date,
      region: appearance.region,
      categoryName: appearance.categoryName,
      rank: appearance.score?.rank ?? null,
      percentLabel: appearance.score?.percent && appearance.score.percent !== "—" ? appearance.score.percent : null,
      percent: readPercent(appearance.score?.percent),
      points: appearance.score?.points ?? "",
      totalPossible: appearance.score?.totalPossible ?? 0,
      horsConcours: appearance.score?.horsConcours ?? false,
      starQualifying: appearance.score?.starQualifying ?? false,
      make: appearance.score?.airplane ?? "",
      model: "",
      reg: appearance.score?.reg ?? "",
      flights: related.map((sheet) => ({
        pilotFlightId: sheet.pilotFlightId,
        flightId: sheet.flightId,
        name: sheet.flightName || "Flight",
        percentLabel: sheet.sheet.percent,
        percent: sheetPercent(sheet.sheet.percent),
        rank: sheet.rank,
        horsConcours: sheet.horsConcours,
      })),
      figures,
    };
  });
  return buildSeasonBook(year, contests);
}

function readPercent(label: string | null | undefined): number | null {
  if (!label || !label.endsWith("%")) return null;
  const value = Number(label.slice(0, -1));
  return Number.isFinite(value) ? value : null;
}

function categoriesMatch(sheetCategory: string, appearanceCategory: string): boolean {
  const sheet = sheetCategory.toLowerCase();
  const appearance = appearanceCategory.toLowerCase();
  if (!sheet || !appearance) return true;
  return sheet.includes(appearance) || appearance.includes(sheet);
}

export async function getPilotProfile(id: number): Promise<PilotProfile | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const response = await readHtml(`/pilots/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new UpstreamError("Pilot page unavailable", response.status || 502);
  const parsed = parsePilotPage(response.body);
  if (!parsed) return null;

  const head = parsed.appearances.slice(0, PILOT_SCORE_FETCH_LIMIT);
  const tail = parsed.appearances.slice(PILOT_SCORE_FETCH_LIMIT);
  const enriched = await mapPool(head, 4, (appearance) => enrichAppearance(appearance, id));
  const rest: PilotAppearance[] = tail.map((appearance) => ({
    ...appearance,
    scoreStatus: "not-fetched",
    score: null,
  }));
  return {
    id,
    name: parsed.name,
    appearances: [...enriched, ...rest],
    fetchedScoreCount: head.length,
    totalAppearances: parsed.appearances.length,
  };
}

async function enrichAppearance(appearance: ParsedAppearance, pilotId: number): Promise<PilotAppearance> {
  try {
    const contest = await getContest(appearance.contestId);
    if (!contest) return { ...appearance, scoreStatus: "unavailable", score: null };
    const pilot = matchPilotScore(contest, pilotId, appearance.categoryName);
    if (!pilot) return { ...appearance, scoreStatus: "missing", score: null };
    return { ...appearance, scoreStatus: "loaded", score: toPilotScore(pilot) };
  } catch {
    return { ...appearance, scoreStatus: "unavailable", score: null };
  }
}

export async function getJudgeLeaders(year?: string): Promise<JudgeLeaders | null> {
  const path = year && /^\d{4}$/.test(year) ? `/leaders/judges/${year}` : "/leaders/judges";
  const response = await readHtml(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new UpstreamError("Judge experience unavailable", response.status || 502);
  const leaders = parseJudgeLeaders(response.body);
  if (!leaders) throw new UpstreamError("Unexpected judge experience page", 502);
  return leaders;
}

export async function getRegionalSeries(year?: string): Promise<RegionalSeries | null> {
  const path = year && /^\d{4}$/.test(year) ? `/leaders/regionals/${year}` : "/leaders/regionals";
  const response = await readHtml(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new UpstreamError("Regional series unavailable", response.status || 502);
  const series = parseRegionalSeries(response.body);
  if (!series) throw new UpstreamError("Unexpected regional series page", 502);
  return series;
}
