import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMean, pilotStats } from "./pilot-stats";
import type { PilotProfile } from "./types";

function appearance(
  partial: Partial<PilotProfile["appearances"][number]> & { date: string; contestId: number; categoryName: string },
): PilotProfile["appearances"][number] {
  return {
    contestName: partial.contestName ?? "Contest",
    region: partial.region ?? "SouthWest",
    scoreStatus: partial.scoreStatus ?? "loaded",
    score: partial.score === undefined ? score() : partial.score,
    ...partial,
  };
}

function score(overrides: Partial<NonNullable<PilotProfile["appearances"][number]["score"]>> = {}) {
  return {
    rank: 1,
    points: "80.00",
    totalPossible: 100,
    percent: "80.00%",
    airplane: "Extra 300",
    reg: "N1",
    starQualifying: false,
    horsConcours: false,
    chapter: "12",
    iacId: 443660,
    ...overrides,
  };
}

test("averages, best finish, and season groups use only scored results", () => {
  const profile: PilotProfile = {
    id: 5136,
    name: "Gavin Henderson",
    fetchedScoreCount: 3,
    totalAppearances: 4,
    appearances: [
      appearance({
        date: "2026-11-06",
        contestId: 1043,
        contestName: "Tequila Cup",
        categoryName: "Sportsman Power",
        score: score({ rank: 3, percent: "81.66%", points: "3356.43", totalPossible: 4110 }),
      }),
      appearance({
        date: "2026-05-22",
        contestId: 992,
        contestName: "Torrington",
        categoryName: "Sportsman Power",
        score: score({ rank: 1, percent: "70.00%", points: "700.00", totalPossible: 1000, starQualifying: true }),
      }),
      appearance({
        date: "2025-05-17",
        contestId: 956,
        contestName: "Torrington",
        categoryName: "Primary Power",
        score: score({ rank: 2, percent: "60.00%", points: "600.00", totalPossible: 1000, horsConcours: true }),
      }),
      appearance({
        date: "2024-01-01",
        contestId: 1,
        contestName: "Older",
        categoryName: "Primary Power",
        scoreStatus: "not-fetched",
        score: null,
      }),
    ],
  };

  const stats = pilotStats(profile);
  assert.equal(stats.iacId, 443660);
  assert.equal(stats.chapter, "12");
  assert.equal(stats.contestCount, 4);
  assert.equal(stats.scoredCount, 2);
  assert.equal(stats.horsConcoursExcluded, 1);
  assert.equal(formatMean(stats.averagePercent), "75.83%");
  assert.equal(stats.bestFinish?.rank, 1);
  assert.equal(stats.bestFinish?.contestName, "Torrington");
  assert.equal(stats.bestPercent?.percentLabel, "81.66%");
  assert.equal(stats.stars, 1);
  assert.equal(stats.byCategory.find((row) => row.label === "Sportsman Power")?.count, 2);
  assert.equal(stats.byYear.find((row) => row.label === "2025"), undefined);
  assert.deepEqual(stats.recent.map((row) => row.date), ["2026-05-22", "2026-11-06"]);

  const season = pilotStats(profile, 2026);
  assert.equal(season.contestCount, 2);
  assert.equal(season.averagePercent, stats.averagePercent);
});
