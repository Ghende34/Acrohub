import { identifyAirplane } from "./airplanes";
import { airLabel } from "./categories";
import { formatPercent, fullName, percentNumber } from "./format";
import type { ContestDetail } from "./types";

/** One posted category result. Hors concours rows stay in the list and are left out of averages. */
export type SeasonResult = {
  contestId: number;
  contestName: string;
  date: string;
  region: string;
  categoryName: string;
  level: string;
  aircat: string;
  pilotId: number;
  pilotName: string;
  chapter: string;
  make: string;
  model: string;
  reg: string;
  typeId: string;
  typeName: string;
  entered: string;
  rank: number | null;
  percent: number;
  points: string;
  totalPossible: number;
  horsConcours: boolean;
  starQualifying: boolean;
};

export type StatsFilter = {
  region: string;
  level: string;
  aircat: string;
  typeId: string;
  chapter: string;
  name: string;
  minResults: number;
};

export const DEFAULT_STATS_FILTER: StatsFilter = {
  region: "",
  level: "",
  aircat: "",
  typeId: "",
  chapter: "",
  name: "",
  minResults: 2,
};

export type PilotRow = {
  pilotId: number;
  name: string;
  scored: number;
  contests: number;
  average: number;
  bestRank: number | null;
  bestPercent: number;
  bestContestId: number;
  bestContestName: string;
  bestCategory: string;
  wins: number;
  stars: number;
  airplane: string;
  entered: string;
  make: string;
  model: string;
  reg: string;
};

export function seasonResultsFromContest(contest: ContestDetail): SeasonResult[] {
  const rows: SeasonResult[] = [];
  for (const category of contest.categoryResults) {
    for (const pilot of category.pilots) {
      const label = formatPercent(pilot.points, pilot.totalPossible);
      const percent = percentNumber(pilot.points, pilot.totalPossible);
      if (!label.endsWith("%") || percent == null) continue;
      const rounded = Number(label.slice(0, -1));
      if (!Number.isFinite(rounded)) continue;
      const airplane = identifyAirplane(pilot.airplane.make, pilot.airplane.model);
      rows.push({
        contestId: contest.id,
        contestName: contest.name,
        date: contest.start,
        region: contest.region,
        categoryName: category.name,
        level: category.level,
        aircat: category.aircat,
        pilotId: pilot.id,
        pilotName: fullName(pilot.givenName, pilot.familyName),
        chapter: pilot.chapter,
        make: pilot.airplane.make,
        model: pilot.airplane.model,
        reg: pilot.airplane.reg,
        typeId: airplane.id,
        typeName: airplane.name,
        entered: airplane.entered,
        rank: pilot.rank,
        percent: rounded,
        points: pilot.points,
        totalPossible: pilot.totalPossible,
        horsConcours: pilot.horsConcours,
        starQualifying: pilot.starQualifying,
      });
    }
  }
  return rows;
}

export function applyStatsFilter(results: SeasonResult[], filter: StatsFilter): SeasonResult[] {
  const nameTokens = filter.name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return results.filter((result) => {
    if (filter.region && result.region !== filter.region) return false;
    if (filter.level && result.level !== filter.level) return false;
    if (filter.aircat && result.aircat !== filter.aircat) return false;
    if (filter.typeId && result.typeId !== filter.typeId) return false;
    if (filter.chapter && result.chapter !== filter.chapter) return false;
    if (nameTokens.length > 0) {
      const name = result.pilotName.toLowerCase();
      if (!nameTokens.every((token) => name.includes(token))) return false;
    }
    return true;
  });
}

export function competitiveResults(results: SeasonResult[]): SeasonResult[] {
  return results.filter((result) => !result.horsConcours);
}

export function summarizePilots(results: SeasonResult[]): PilotRow[] {
  const groups = new Map<number, SeasonResult[]>();
  for (const result of competitiveResults(results)) {
    const list = groups.get(result.pilotId) ?? [];
    list.push(result);
    groups.set(result.pilotId, list);
  }
  const rows: PilotRow[] = [];
  for (const [pilotId, list] of groups) {
    const best = [...list].sort((a, b) => b.percent - a.percent || a.date.localeCompare(b.date))[0];
    const ranks = list.map((result) => result.rank).filter((rank): rank is number => rank != null);
    rows.push({
      pilotId,
      name: best.pilotName,
      scored: list.length,
      contests: new Set(list.map((result) => result.contestId)).size,
      average: mean(list.map((result) => result.percent)),
      bestRank: ranks.length ? Math.min(...ranks) : null,
      bestPercent: best.percent,
      bestContestId: best.contestId,
      bestContestName: best.contestName,
      bestCategory: best.categoryName,
      wins: list.filter((result) => result.rank === 1).length,
      stars: list.filter((result) => result.starQualifying).length,
      airplane: best.typeName,
      entered: best.entered,
      make: best.make,
      model: best.model,
      reg: best.reg,
    });
  }
  return rows;
}

export function withMinimum(rows: PilotRow[], minResults: number): PilotRow[] {
  const minimum = Number.isFinite(minResults) && minResults > 0 ? minResults : 1;
  return rows.filter((row) => row.scored >= minimum);
}

export function byAverage(rows: PilotRow[]): PilotRow[] {
  return [...rows].sort((a, b) => b.average - a.average || b.scored - a.scored || a.name.localeCompare(b.name));
}

export function byContests(rows: PilotRow[]): PilotRow[] {
  return [...rows].sort((a, b) => b.contests - a.contests || b.average - a.average || a.name.localeCompare(b.name));
}

export function byWins(rows: PilotRow[]): PilotRow[] {
  return [...rows].sort((a, b) => b.wins - a.wins || b.average - a.average || a.name.localeCompare(b.name));
}

export function byBestFinish(rows: PilotRow[]): PilotRow[] {
  return [...rows].sort((a, b) => {
    if (a.bestRank == null && b.bestRank == null) return b.average - a.average;
    if (a.bestRank == null) return 1;
    if (b.bestRank == null) return -1;
    return a.bestRank - b.bestRank || b.wins - a.wins || b.average - a.average || a.name.localeCompare(b.name);
  });
}

export function bestSingles(results: SeasonResult[]): SeasonResult[] {
  return [...competitiveResults(results)].sort(
    (a, b) => b.percent - a.percent || (a.rank ?? 99) - (b.rank ?? 99) || a.pilotName.localeCompare(b.pilotName),
  );
}

export type CategoryBoard = {
  category: string;
  aircat: string;
  level: string;
  leaders: PilotRow[];
  bestSingle: SeasonResult | null;
};

export function categoryBoards(results: SeasonResult[], minResults: number): CategoryBoard[] {
  const groups = new Map<string, SeasonResult[]>();
  for (const result of results) {
    const list = groups.get(result.categoryName) ?? [];
    list.push(result);
    groups.set(result.categoryName, list);
  }
  const boards: CategoryBoard[] = [];
  for (const [category, list] of groups) {
    const sample = list[0];
    const leaders = byAverage(withMinimum(summarizePilots(list), minResults)).slice(0, 3);
    const single = bestSingles(list)[0] ?? null;
    boards.push({
      category,
      aircat: sample.aircat,
      level: sample.level,
      leaders,
      bestSingle: single,
    });
  }
  const levelOrder = ["primary", "sportsman", "intermediate", "advanced", "unlimited", "four minute"];
  const airOrder = ["P", "G", "F"];
  boards.sort((a, b) => {
    const air = indexOf(airOrder, a.aircat) - indexOf(airOrder, b.aircat);
    if (air) return air;
    const level = indexOf(levelOrder, a.level) - indexOf(levelOrder, b.level);
    if (level) return level;
    return a.category.localeCompare(b.category);
  });
  return boards;
}

export function facetOptions(results: SeasonResult[], filter: StatsFilter): {
  regions: string[];
  levels: string[];
  aircats: { value: string; label: string }[];
  types: { value: string; label: string }[];
  chapters: string[];
} {
  return {
    regions: unique(results.map((result) => result.region)),
    levels: unique(results.map((result) => result.level)),
    aircats: unique(results.map((result) => result.aircat))
      .filter(Boolean)
      .map((value) => ({ value, label: airLabel(value) })),
    types: countLabels(results.map((result) => result.typeName)).map((item) => {
      const match = results.find((result) => result.typeName === item.label);
      return { value: match?.typeId ?? item.value, label: item.label };
    }).sort((a, b) => a.label.localeCompare(b.label)),
    chapters: unique(results.map((result) => result.chapter)).filter(Boolean),
  };
}

export function formatAverage(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${(Math.round(value * 100) / 100).toFixed(2)}%`;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function countLabels(values: string[]): { value: string; label: string }[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const raw of values) {
    const label = raw.trim();
    if (!label) continue;
    const id = label.toLowerCase();
    const current = counts.get(id);
    if (!current) counts.set(id, { label, count: 1 });
    else current.count += 1;
  }
  return [...counts.entries()]
    .map(([value, entry]) => ({ value, label: entry.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function indexOf(list: string[], value: string): number {
  const index = list.indexOf(value);
  return index === -1 ? 99 : index;
}
