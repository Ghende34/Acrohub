import { contestUrl } from "./constants";
import { cleanText } from "./format";
import type {
  CategoryResult,
  ContestDetail,
  ContestSummary,
  FlightDetail,
  FlightPilotScore,
  JudgeLeaders,
  JudgeLeaderRow,
  LineJudge,
  ParsedAppearance,
  PilotHit,
  RegionalSeries,
  StandingJudge,
  StandingPilot,
  YearIndex,
} from "./types";

const LOCALHOST = /^https?:\/\/localhost(?::\d+)?(?=\/|$)/i;
const IACCDB_HOST = /^https?:\/\/(?:www\.)?iaccdb\.iac\.org(?=\/|$)/i;

export function rewriteIaccdbLinks<T>(value: T): T {
  return rewrite(value) as T;
}

function rewrite(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(LOCALHOST, "https://iaccdb.iac.org").replace(IACCDB_HOST, "https://iaccdb.iac.org");
  }
  if (Array.isArray(value)) return value.map(rewrite);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) out[key] = rewrite(child);
    return out;
  }
  return value;
}

export function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, digits: string) => fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromCodePoint(parseInt(hex, 16)));
}

function fromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

export function textContent(html: string): string {
  return cleanText(decodeHtml(html.replace(/<[^>]+>/g, " ")));
}

function contentHtml(html: string): string {
  const match = html.match(/<div id=["']content["']>([\s\S]*?)<div id=["']footer["']>/i);
  return match ? match[1] : html;
}

function asPoints(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  return "";
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asRank(value: unknown): number | null {
  const numeric = asNumber(value);
  return numeric == null ? null : numeric;
}

export function parseContestIndex(raw: unknown): YearIndex {
  const data = rewriteIaccdbLinks(raw) as {
    years?: unknown;
    contest_year?: unknown;
    contests?: unknown;
  };
  if (!data || !Array.isArray(data.contests)) {
    throw new Error("Unexpected contests payload");
  }
  const years = (Array.isArray(data.years) ? data.years : [])
    .map((url) => {
      const match = String(url).match(/year=(\d{4})/);
      return match ? Number(match[1]) : null;
    })
    .filter((year): year is number => year != null);
  const contests = data.contests
    .map(parseSummary)
    .filter((contest): contest is ContestSummary => contest != null);
  return {
    years: [...new Set(years)].sort((a, b) => b - a),
    contestYear: String(data.contest_year ?? ""),
    contests,
  };
}

function parseSummary(raw: unknown): ContestSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const contest = raw as Record<string, unknown>;
  const id = asNumber(contest.id);
  if (id == null || contest.name == null) return null;
  return {
    id,
    name: cleanText(String(contest.name)),
    city: cleanText(String(contest.city ?? "")),
    state: cleanText(String(contest.state ?? "")),
    start: String(contest.start ?? ""),
    chapter: (contest.chapter as number | string | undefined) ?? "",
    director: cleanText(String(contest.director ?? "")),
    region: cleanText(String(contest.region ?? "")),
    hasResults: contest.has_results === true,
    url: contestUrl(id),
  };
}

export function parseContestDetail(raw: unknown): ContestDetail {
  const data = rewriteIaccdbLinks(raw) as Record<string, unknown>;
  const id = asNumber(data.id);
  if (id == null) throw new Error("Unexpected contest payload");
  const categories = Array.isArray(data.category_results) ? data.category_results : [];
  return {
    id,
    start: String(data.start ?? ""),
    name: cleanText(String(data.name ?? "")),
    year: asNumber(data.year) ?? 0,
    region: cleanText(String(data.region ?? "")),
    city: cleanText(String(data.city ?? "")),
    state: cleanText(String(data.state ?? "")),
    chapter: (data.chapter as number | string | undefined) ?? "",
    director: cleanText(String(data.director ?? "")),
    categoryResults: categories.map(parseCategory),
  };
}

function parseCategory(raw: unknown): CategoryResult {
  const category = (raw ?? {}) as Record<string, unknown>;
  const flights = (Array.isArray(category.flights) ? category.flights : []).map((flight) => {
    const row = flight as Record<string, unknown>;
    return {
      id: asNumber(row.id) ?? 0,
      sequence: asNumber(row.sequence) ?? 0,
      name: cleanText(String(row.name ?? "")),
    };
  });
  flights.sort((a, b) => a.sequence - b.sequence);
  const pilots = (Array.isArray(category.pilot_results) ? category.pilot_results : [])
    .map(parseStandingPilot)
    .filter((pilot): pilot is StandingPilot => pilot != null);
  pilots.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
  const judges = (Array.isArray(category.judge_results) ? category.judge_results : [])
    .map(parseJudge)
    .filter((judge): judge is StandingJudge => judge != null);
  return {
    sequence: asNumber(category.sequence) ?? 0,
    aircat: String(category.aircat ?? ""),
    name: cleanText(String(category.name ?? "")),
    level: cleanText(String(category.level ?? "")).toLowerCase(),
    flights,
    pilots,
    judges,
  };
}

function parseStandingPilot(raw: unknown): StandingPilot | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const pilot = (row.pilot ?? {}) as Record<string, unknown>;
  const airplane = (row.airplane ?? {}) as Record<string, unknown>;
  const result = (row.result ?? {}) as Record<string, unknown>;
  const id = asNumber(pilot.id);
  if (id == null) return null;
  return {
    id,
    iacId: asNumber(pilot.iac_id),
    givenName: cleanText(String(pilot.given_name ?? "")),
    familyName: cleanText(String(pilot.family_name ?? "")),
    chapter: pilot.chapter == null ? "" : String(pilot.chapter),
    airplane: {
      make: cleanText(String(airplane.make ?? "")),
      model: cleanText(String(airplane.model ?? "")),
      reg: cleanText(String(airplane.reg ?? "")),
    },
    rank: asRank(result.category_rank),
    points: asPoints(result.category_value),
    totalPossible: asNumber(result.total_possible) ?? 0,
    starQualifying: result.star_qualifying === true,
    horsConcours: Boolean(result.hors_concours),
  };
}

function parseJudge(raw: unknown): StandingJudge | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const judge = (row.judge ?? {}) as Record<string, unknown>;
  const result = (row.result ?? {}) as Record<string, unknown>;
  const id = asNumber(judge.id);
  if (id == null) return null;
  return {
    id,
    iacId: asNumber(judge.iac_id),
    givenName: cleanText(String(judge.given_name ?? "")),
    familyName: cleanText(String(judge.family_name ?? "")),
    gamma: asNumber(result.gamma),
    rho: asNumber(result.rho),
    flightCount: asNumber(result.flight_count),
    minorityZeros: asNumber(result.minority_zero_ct),
    minorityGrades: asNumber(result.minority_grade_ct),
  };
}

export function parseFlight(raw: unknown): FlightDetail {
  const data = rewriteIaccdbLinks(raw) as { flight?: Record<string, unknown> };
  const flight = data.flight;
  if (!flight || asNumber(flight.id) == null) throw new Error("Unexpected flight payload");
  const pilots = (Array.isArray(flight.pilot_results) ? flight.pilot_results : []).map((row) => {
    const pilot = row as Record<string, unknown>;
    const person = (pilot.pilot ?? {}) as Record<string, unknown>;
    const score: FlightPilotScore = {
      pilotId: asNumber(person.id) ?? 0,
      name: cleanText(String(person.name ?? "")),
      penalty: asNumber(pilot.penalty_total) ?? 0,
      score: asPoints(pilot.score),
      scoreBeforePenalties: asPoints(pilot.score_before_penalties),
      rank: asRank(pilot.rank),
      rankBeforePenalties: asRank(pilot.rank_before_penalties),
      totalPossible: asNumber(pilot.total_possible) ?? 0,
    };
    return score;
  });
  const lineJudges = (Array.isArray(flight.line_judges) ? flight.line_judges : [])
    .map(parseLineJudge)
    .filter((judge): judge is LineJudge => judge != null);
  return {
    id: asNumber(flight.id) ?? 0,
    sequence: asNumber(flight.sequence) ?? 0,
    name: cleanText(String(flight.name ?? "")),
    pilots,
    lineJudges,
  };
}

function parseLineJudge(raw: unknown): LineJudge | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const judge = (row.judge ?? {}) as Record<string, unknown>;
  const assistant = (row.assistant ?? {}) as Record<string, unknown>;
  const id = asNumber(judge.id);
  if (id == null) return null;
  const ri = row.ri == null || row.ri === "" ? null : String(row.ri).trim();
  return {
    id,
    name: cleanText(String(judge.name ?? "")),
    assistant: cleanText(String(assistant.name ?? "")),
    rho: asNumber(row.rho),
    gamma: asNumber(row.gamma),
    ri,
    pilotCount: asNumber(row.pilot_count),
    pairCount: asNumber(row.pair_count),
    flightCount: asNumber(row.flight_count),
    averagePilots: asNumber(row.average_flight_size),
    figureCount: asNumber(row.figure_count),
    averageK: asNumber(row.average_k),
    minorityZeros: asNumber(row.minority_zeros),
    minorityGrades: asNumber(row.minority_grades),
  };
}

export function parsePilotIndex(html: string): PilotHit[] {
  const expression = /<a href="\/pilots\/(\d+)">([^<]*)<\/a>/g;
  const pilots: PilotHit[] = [];
  const seen = new Set<number>();
  for (const match of html.matchAll(expression)) {
    const id = Number(match[1]);
    const name = textContent(match[2]);
    if (!name || seen.has(id)) continue;
    seen.add(id);
    pilots.push({ id, name });
  }
  return pilots;
}

export function searchPilots(pilots: PilotHit[], query: string, limit = 25): { total: number; pilots: PilotHit[] } {
  const normalized = query.trim().toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ");
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) return { total: 0, pilots: [] };
  const scored = pilots.flatMap((pilot) => {
    const name = pilot.name.toLowerCase();
    if (!tokens.every((token) => name.includes(token))) return [];
    let score = 3;
    if (name === normalized) score = 0;
    else if (name.startsWith(normalized)) score = 1;
    else if (name.includes(` ${normalized}`) || name.includes(normalized)) score = 2;
    return [{ pilot, score }];
  });
  scored.sort((a, b) => a.score - b.score || a.pilot.name.localeCompare(b.pilot.name));
  return { total: scored.length, pilots: scored.slice(0, limit).map((row) => row.pilot) };
}

export function parsePilotPage(html: string): { name: string; appearances: ParsedAppearance[] } | null {
  const scoped = contentHtml(html);
  const heading = scoped.match(/<h1>([\s\S]*?)<\/h1>/i);
  if (!heading) return null;
  const name = textContent(heading[1]);
  if (!name || name.toLowerCase() === "iac pilots") return null;
  const expression =
    /<li>\s*(\d{4}-\d{2}-\d{2})\s*<a href="\/pilots\/\d+\/scores\/(\d+)">([\s\S]*?)<\/a>\s*\(([^,]+),\s*([^)]+)\)\s*<\/li>/g;
  const appearances: ParsedAppearance[] = [];
  for (const match of scoped.matchAll(expression)) {
    appearances.push({
      date: match[1],
      contestId: Number(match[2]),
      contestName: textContent(match[3]),
      region: textContent(match[4]),
      categoryName: textContent(match[5]),
    });
  }
  return { name, appearances };
}

export function parseRegionalSeries(html: string): RegionalSeries | null {
  const scoped = contentHtml(html);
  const yearLinks = [...html.matchAll(/\/leaders\/regionals\/(\d{4})/g)].map((match) => Number(match[1]));
  const years = [...new Set(yearLinks)].sort((a, b) => b - a);
  const heading = textContent((scoped.match(/<h1>([\s\S]*?)<\/h1>/i) ?? [])[1] ?? "");
  const year = Number(heading.match(/(\d{4})/)?.[1] ?? years[0]);
  if (!Number.isFinite(year)) return null;

  const regions: RegionalSeries["regions"] = [];
  const regionParts = scoped.split(/<h2\b[^>]*>/i).slice(1);
  for (const part of regionParts) {
    const close = part.search(/<\/h2>/i);
    if (close === -1) continue;
    const regionName = textContent(part.slice(0, close));
    if (!regionName) continue;
    const categories: RegionalSeries["regions"][number]["categories"] = [];
    const categoryParts = part.slice(close).split(/<h3\b[^>]*>/i).slice(1);
    for (const categoryPart of categoryParts) {
      const categoryClose = categoryPart.search(/<\/h3>/i);
      if (categoryClose === -1) continue;
      const categoryName = textContent(categoryPart.slice(0, categoryClose));
      if (!categoryName || /chapter membership/i.test(categoryName)) continue;
      const pilots = parseRegionalTable(categoryPart.slice(categoryClose));
      if (pilots.length === 0) continue;
      categories.push({ name: categoryName, pilots });
    }
    if (categories.length > 0) regions.push({ name: regionName, categories });
  }

  return { year, years, regions };
}

function parseRegionalTable(html: string): RegionalSeries["regions"][number]["categories"][number]["pilots"] {
  const pilots: RegionalSeries["regions"][number]["categories"][number]["pilots"] = [];
  let current: (typeof pilots)[number] | null = null;
  for (const match of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const row = match[1];
    if (row.includes("regional_series_pilot_name")) {
      const person = row.match(/href="\/pilots\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!person) continue;
      const rank = row.match(/<td>\s*(\d+)\s*<\/td>/);
      const percent = [...row.matchAll(/class=['"]total_percent['"]>([^<]*)</g)].at(-1);
      current = {
        id: Number(person[1]),
        name: textContent(person[2]),
        rank: rank ? Number(rank[1]) : pilots.length + 1,
        percent: textContent(percent?.[1] ?? ""),
        contests: [],
      };
      pilots.push(current);
      continue;
    }
    if (current && row.includes("regional_series_pilot_contest")) {
      const contest = row.match(/href="\/contests\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!contest) continue;
      const averages = [...row.matchAll(/class=['"]total_average['"]>([^<]*)</g)];
      const percent = [...row.matchAll(/class=['"]total_percent['"]>([^<]*)</g)];
      current.contests.push({
        id: Number(contest[1]),
        name: textContent(contest[2]),
        points: textContent(averages[0]?.[1] ?? ""),
        possible: textContent(averages[1]?.[1] ?? ""),
        percent: textContent(percent[0]?.[1] ?? ""),
      });
    }
  }
  return pilots;
}

export function parseJudgeLeaders(html: string): JudgeLeaders | null {
  const scoped = contentHtml(html);
  const years = [...new Set([...html.matchAll(/\/leaders\/judges\/(\d{4})/g)].map((match) => Number(match[1])))].sort(
    (a, b) => b - a,
  );
  const heading = textContent((scoped.match(/<h1>([\s\S]*?)<\/h1>/i) ?? [])[1] ?? "");
  const year = Number(heading.match(/(\d{4})/)?.[1] ?? years[0]);
  if (!Number.isFinite(year)) return null;
  const categories: JudgeLeaders["categories"] = [];
  for (const match of scoped.matchAll(/<h4>([\s\S]*?)<\/h4>\s*<table class=['"]judge_leaders['"]>([\s\S]*?)<\/table>/gi)) {
    const name = textContent(match[1]);
    const judges = parseJudgeLeaderRows(match[2]);
    if (!name || judges.length === 0) continue;
    categories.push({ name, judges });
  }
  return { year, years, categories };
}

function parseJudgeLeaderRows(table: string): JudgeLeaderRow[] {
  const judges: JudgeLeaderRow[] = [];
  for (const match of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const row = match[1];
    const person = row.match(/href="\/judge\/(\d+)\/cv"[^>]*>([\s\S]*?)<\/a>/i);
    if (!person) continue;
    const counts = [...row.matchAll(/class=['"]count['"]>([^<]*)</g)].map((cell) => textContent(cell[1]));
    const averages = [...row.matchAll(/class=['"]avg['"]>([^<]*)</g)].map((cell) => textContent(cell[1]));
    if (counts.length < 6 || averages.length < 2) continue;
    judges.push({
      id: Number(person[1]),
      name: textContent(person[2]),
      order: judges.length + 1,
      rho: textContent(row.match(/class=['"]rho['"]>([^<]*)</)?.[1] ?? ""),
      gamma: textContent(row.match(/class=['"]gamma['"]>([^<]*)</)?.[1] ?? ""),
      pilotFlights: counts[0],
      pilotPairs: counts[1],
      flightPrograms: counts[2],
      averagePilots: averages[0],
      grades: counts[3],
      averageK: averages[1],
      minorityZeros: counts[4],
      minorityGrades: counts[5],
    });
  }
  return judges;
}
