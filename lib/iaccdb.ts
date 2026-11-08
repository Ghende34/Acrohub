import { CACHE_TTL_MS, IACCDB_ORIGIN, PILOT_SCORE_FETCH_LIMIT } from "./constants";
import { mapPool } from "./pool";
import {
  parseContestDetail,
  parseContestIndex,
  parseFlight,
  parseJudgeLeaders,
  parsePilotIndex,
  parsePilotPage,
  parseRegionalSeries,
  searchPilots,
} from "./parse";
import { matchPilotScore, toPilotScore } from "./scores";
import type {
  ContestDetail,
  FlightDetail,
  JudgeLeaders,
  ParsedAppearance,
  PilotAppearance,
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

async function fetchEntry(path: string, accept: string): Promise<CacheEntry> {
  pruneCache();
  const response = await fetch(`${IACCDB_ORIGIN}${path}`, {
    headers: {
      Accept: accept,
      "User-Agent": "Acrohub/1.0 (unofficial IACCDB viewer)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  if (body.length > MAX_BYTES) {
    throw new UpstreamError("IACCDB response was too large", 502);
  }
  if (!response.ok) {
    console.error(`IACCDB ${response.status} ${path}`);
  }
  return {
    expires: Date.now() + (response.ok ? CACHE_TTL_MS : ERROR_TTL_MS),
    status: response.status,
    body,
    ok: response.ok,
  };
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

export async function searchPilotIndex(query: string): Promise<{ total: number; pilots: PilotHit[] }> {
  const trimmed = query.trim().slice(0, 80);
  if (trimmed.length < 2) return { total: 0, pilots: [] };
  const response = await readHtml("/pilots");
  if (!response.ok) throw new UpstreamError("Pilot index unavailable", response.status || 502);
  return searchPilots(parsePilotIndex(response.body), trimmed, 25);
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
