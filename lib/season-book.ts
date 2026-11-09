import { percentNumber } from "./format";

export type SeasonFlight = {
  pilotFlightId: number;
  flightId: number;
  name: string;
  percentLabel: string | null;
  percent: number | null;
  rank: number | null;
  horsConcours: boolean;
};

export type SeasonFigure = {
  contestId: number;
  contestName: string;
  flightName: string;
  pilotFlightId: number;
  figure: string;
  average: number;
  k: number | null;
};

export type SeasonContest = {
  contestId: number;
  name: string;
  date: string;
  region: string;
  categoryName: string;
  rank: number | null;
  percentLabel: string | null;
  percent: number | null;
  points: string;
  totalPossible: number;
  horsConcours: boolean;
  starQualifying: boolean;
  make: string;
  model: string;
  reg: string;
  flights: SeasonFlight[];
  figures: SeasonFigure[];
};

export type SeasonBook = {
  year: number;
  contests: SeasonContest[];
  scoredCount: number;
  horsConcoursExcluded: number;
  average: number | null;
  bestContest: SeasonContest | null;
  weakestContest: SeasonContest | null;
  bestFlight: (SeasonFlight & { contestId: number; contestName: string }) | null;
  weakestFlight: (SeasonFlight & { contestId: number; contestName: string }) | null;
  trend: { contestId: number; contestName: string; date: string; percent: number }[];
  strengths: SeasonFigure[];
  weaknesses: SeasonFigure[];
  stars: SeasonContest[];
};

const FLIGHT_ORDER = ["known", "free", "unknown"];

/** One block per competition, even when a pilot flew more than one category there. */
export function groupSeasonContests(contests: SeasonContest[]): SeasonContest[][] {
  const groups: SeasonContest[][] = [];
  const index = new Map<number, SeasonContest[]>();
  for (const contest of contests) {
    const existing = index.get(contest.contestId);
    if (existing) existing.push(contest);
    else {
      const group = [contest];
      index.set(contest.contestId, group);
      groups.push(group);
    }
  }
  return groups;
}

export function buildSeasonBook(year: number, contests: SeasonContest[]): SeasonBook {
  const ordered = [...contests].sort((a, b) => a.date.localeCompare(b.date) || a.contestId - b.contestId);
  for (const contest of ordered) {
    contest.flights.sort((a, b) => flightRank(a.name) - flightRank(b.name) || a.flightId - b.flightId);
  }
  const scored = ordered.filter((contest) => !contest.horsConcours && contest.percent != null);
  const flights = ordered.flatMap((contest) =>
    contest.flights
      .filter((flight) => !flight.horsConcours && flight.percent != null)
      .map((flight) => ({ ...flight, contestId: contest.contestId, contestName: contest.name })),
  );
  const figures = ordered.flatMap((contest) => contest.figures);
  const byAverage = [...figures].sort((a, b) => b.average - a.average || (b.k ?? 0) - (a.k ?? 0));
  const byWeak = [...figures].sort((a, b) => a.average - b.average || (b.k ?? 0) - (a.k ?? 0));
  return {
    year,
    contests: ordered,
    scoredCount: scored.length,
    horsConcoursExcluded: ordered.filter((contest) => contest.horsConcours).length,
    average: scored.length ? mean(scored.map((contest) => contest.percent as number)) : null,
    bestContest: best(scored, (contest) => contest.percent as number, true),
    weakestContest: scored.length > 1 ? best(scored, (contest) => contest.percent as number, false) : null,
    bestFlight: best(flights, (flight) => flight.percent as number, true),
    weakestFlight: flights.length > 1 ? best(flights, (flight) => flight.percent as number, false) : null,
    trend: scored.map((contest) => ({
      contestId: contest.contestId,
      contestName: contest.name,
      date: contest.date,
      percent: contest.percent as number,
    })),
    strengths: uniqueFigures(byAverage).slice(0, 4),
    weaknesses: uniqueFigures(byWeak).slice(0, 4),
    stars: ordered.filter((contest) => contest.starQualifying),
  };
}

export function figureAverage(value: string | null): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function sheetPercent(label: string | null): number | null {
  if (!label) return null;
  return percentNumber(label.replace("%", ""), 100);
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function best<T>(items: T[], value: (item: T) => number, highest: boolean): T | null {
  if (items.length === 0) return null;
  return items.reduce((winner, item) => {
    const better = highest ? value(item) > value(winner) : value(item) < value(winner);
    return better ? item : winner;
  });
}

function flightRank(name: string): number {
  const lower = name.toLowerCase();
  if (/\bunknown\b/.test(lower)) return 2;
  if (/\bfree\b/.test(lower)) return 1;
  if (/\bknown\b/.test(lower)) return 0;
  return FLIGHT_ORDER.length;
}

function uniqueFigures(figures: SeasonFigure[]): SeasonFigure[] {
  const seen = new Set<string>();
  const picked: SeasonFigure[] = [];
  for (const figure of figures) {
    const key = `${figure.contestId}:${figure.pilotFlightId}:${figure.figure}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(figure);
  }
  return picked;
}
