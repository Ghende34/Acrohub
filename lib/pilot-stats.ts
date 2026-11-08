import type { PilotAppearance, PilotProfile } from "./types";

export type ScoredResult = {
  date: string;
  year: number | null;
  contestId: number;
  contestName: string;
  categoryName: string;
  region: string;
  rank: number | null;
  percent: number;
  percentLabel: string;
  points: string;
  totalPossible: number;
  horsConcours: boolean;
  starQualifying: boolean;
  airplane: string;
  reg: string;
  chapter: string;
  iacId: number | null;
};

export type GroupAverage = {
  label: string;
  count: number;
  averagePercent: number;
  bestRank: number | null;
};

export type PilotStats = {
  iacId: number | null;
  chapter: string | null;
  appearanceCount: number;
  contestCount: number;
  scoredCount: number;
  unscoredCount: number;
  averagePercent: number | null;
  bestFinish: ScoredResult | null;
  bestPercent: ScoredResult | null;
  stars: number;
  horsConcoursExcluded: number;
  byCategory: GroupAverage[];
  byYear: GroupAverage[];
  recent: ScoredResult[];
};

export function formatMean(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(Math.round(value * 100) / 100).toFixed(2)}%`;
}

export function pilotStats(profile: PilotProfile, year?: number | null): PilotStats {
  const appearances = year
    ? profile.appearances.filter((appearance) => appearance.date.startsWith(String(year)))
    : profile.appearances;
  const scored = appearances
    .map(toScored)
    .filter((result): result is ScoredResult => result != null);
  const competitive = scored.filter((result) => !result.horsConcours);
  const horsConcoursExcluded = scored.length - competitive.length;
  const contestCount = new Set(appearances.map((appearance) => appearance.contestId)).size;

  return {
    iacId: majorityIacId(scored),
    chapter: sharedChapter(competitive),
    appearanceCount: appearances.length,
    contestCount,
    scoredCount: competitive.length,
    unscoredCount: appearances.length - scored.length,
    averagePercent: mean(competitive.map((result) => result.percent)),
    bestFinish: bestByRank(competitive),
    bestPercent: bestByPercent(competitive),
    stars: competitive.filter((result) => result.starQualifying).length,
    horsConcoursExcluded,
    byCategory: groupAverages(competitive, (result) => result.categoryName),
    byYear: groupAverages(
      competitive.filter((result) => result.year != null),
      (result) => String(result.year),
    ).sort((a, b) => Number(b.label) - Number(a.label)),
    recent: [...competitive].sort(byDateDesc).slice(0, 8).reverse(),
  };
}

export function profileYears(profile: PilotProfile): number[] {
  const years = new Set<number>();
  for (const appearance of profile.appearances) {
    const match = /^(\d{4})/.exec(appearance.date);
    if (match) years.add(Number(match[1]));
  }
  return [...years].sort((a, b) => b - a);
}

function toScored(appearance: PilotAppearance): ScoredResult | null {
  if (appearance.scoreStatus !== "loaded" || !appearance.score) return null;
  const percent = Number.parseFloat(appearance.score.percent);
  if (!Number.isFinite(percent)) return null;
  const yearMatch = /^(\d{4})/.exec(appearance.date);
  return {
    date: appearance.date,
    year: yearMatch ? Number(yearMatch[1]) : null,
    contestId: appearance.contestId,
    contestName: appearance.contestName,
    categoryName: appearance.categoryName,
    region: appearance.region,
    rank: appearance.score.rank,
    percent,
    percentLabel: appearance.score.percent,
    points: appearance.score.points,
    totalPossible: appearance.score.totalPossible,
    horsConcours: appearance.score.horsConcours,
    starQualifying: appearance.score.starQualifying,
    airplane: appearance.score.airplane,
    reg: appearance.score.reg,
    chapter: appearance.score.chapter,
    iacId: appearance.score.iacId,
  };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function majorityIacId(results: ScoredResult[]): number | null {
  const counts = new Map<number, number>();
  for (const result of results) {
    if (result.iacId == null) continue;
    counts.set(result.iacId, (counts.get(result.iacId) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

function sharedChapter(results: ScoredResult[]): string | null {
  const chapters = new Set(results.map((result) => result.chapter).filter(Boolean));
  return chapters.size === 1 ? [...chapters][0] : null;
}

function bestByRank(results: ScoredResult[]): ScoredResult | null {
  const ranked = results.filter((result) => result.rank != null);
  ranked.sort((a, b) => {
    const byRank = (a.rank ?? 999) - (b.rank ?? 999);
    if (byRank) return byRank;
    const byPercent = b.percent - a.percent;
    if (byPercent) return byPercent;
    return b.date.localeCompare(a.date);
  });
  return ranked[0] ?? null;
}

function bestByPercent(results: ScoredResult[]): ScoredResult | null {
  if (results.length === 0) return null;
  return [...results].sort((a, b) => b.percent - a.percent || b.date.localeCompare(a.date))[0];
}

function groupAverages(results: ScoredResult[], labelOf: (result: ScoredResult) => string): GroupAverage[] {
  const groups = new Map<string, ScoredResult[]>();
  for (const result of results) {
    const label = labelOf(result);
    const list = groups.get(label) ?? [];
    list.push(result);
    groups.set(label, list);
  }
  return [...groups.entries()]
    .map(([label, rows]) => ({
      label,
      count: rows.length,
      averagePercent: mean(rows.map((row) => row.percent)) ?? 0,
      bestRank: rows.reduce<number | null>((best, row) => {
        if (row.rank == null) return best;
        return best == null ? row.rank : Math.min(best, row.rank);
      }, null),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function byDateDesc(a: ScoredResult, b: ScoredResult): number {
  return b.date.localeCompare(a.date);
}
