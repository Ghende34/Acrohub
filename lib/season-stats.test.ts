import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyStatsFilter,
  bestSingles,
  byAverage,
  byContests,
  byWins,
  formatAverage,
  seasonResultsFromContest,
  summarizePilots,
  withMinimum,
  type SeasonResult,
} from "./season-stats";
import type { ContestDetail } from "./types";

function result(partial: Partial<SeasonResult> & Pick<SeasonResult, "pilotId" | "pilotName" | "percent">): SeasonResult {
  return {
    contestId: 1,
    contestName: "Contest",
    date: "2026-05-01",
    region: "SouthWest",
    categoryName: "Sportsman Power",
    level: "sportsman",
    aircat: "P",
    chapter: "12",
    make: "Extra",
    model: "330SC",
    reg: "N1",
    rank: 1,
    points: "80.00",
    totalPossible: 100,
    horsConcours: false,
    starQualifying: false,
    ...partial,
  };
}

test("flattens posted category percentages and keeps hors concours flagged", () => {
  const contest = {
    id: 1043,
    start: "2026-11-06",
    name: "Tequila Cup",
    year: 2026,
    region: "SouthWest",
    city: "Marana",
    state: "AZ",
    chapter: 62,
    director: "Mark Matticola",
    categoryResults: [
      {
        sequence: 2,
        aircat: "P",
        name: "Sportsman Power",
        level: "sportsman",
        flights: [],
        judges: [],
        pilots: [
          {
            id: 5136,
            iacId: 443240,
            givenName: "Gavin",
            familyName: "Henderson",
            chapter: "12",
            airplane: { make: "Extra", model: "EA300L", reg: "N83KS" },
            rank: 3,
            points: "3356.43",
            totalPossible: 4110,
            starQualifying: false,
            horsConcours: false,
          },
          {
            id: 9,
            iacId: null,
            givenName: "Ada",
            familyName: "Pilot",
            chapter: "1",
            airplane: { make: "Extra", model: "300", reg: "N2" },
            rank: 1,
            points: "90.00",
            totalPossible: 100,
            starQualifying: true,
            horsConcours: true,
          },
        ],
      },
    ],
  } satisfies ContestDetail;
  const rows = seasonResultsFromContest(contest);
  assert.equal(rows[0].pilotName, "Gavin Henderson");
  assert.equal(rows[0].percent, 81.66);
  assert.equal(rows[0].aircat, "P");
  assert.equal(rows[1].horsConcours, true);
});

test("averages exclude hors concours and honor airplane filters", () => {
  const rows = [
    result({ pilotId: 1, pilotName: "Ada Pilot", percent: 80, contestId: 1, make: "Extra", model: "330SC" }),
    result({ pilotId: 1, pilotName: "Ada Pilot", percent: 90, contestId: 2, rank: 2, make: "extra", model: "330sc" }),
    result({
      pilotId: 1,
      pilotName: "Ada Pilot",
      percent: 99,
      contestId: 3,
      horsConcours: true,
      make: "Extra",
      model: "330SC",
    }),
    result({ pilotId: 2, pilotName: "Bea Pilot", percent: 70, contestId: 1, rank: 1, make: "Pitts", model: "S-2B", aircat: "P" }),
    result({
      pilotId: 3,
      pilotName: "Cal Pilot",
      percent: 95,
      contestId: 4,
      rank: 1,
      categoryName: "Sportsman Glider",
      level: "sportsman",
      aircat: "G",
      make: "DG",
      model: "1000",
    }),
  ];
  const filtered = applyStatsFilter(rows, {
    region: "",
    level: "",
    aircat: "P",
    make: "extra",
    model: "330sc",
    chapter: "",
    name: "ada",
    minResults: 2,
  });
  const board = byAverage(withMinimum(summarizePilots(filtered), 2));
  assert.equal(board.length, 1);
  assert.equal(board[0].name, "Ada Pilot");
  assert.equal(board[0].scored, 2);
  assert.equal(board[0].contests, 2);
  assert.equal(formatAverage(board[0].average), "85.00%");
  assert.equal(board[0].wins, 1);
  assert.equal(bestSingles(filtered)[0].percent, 90);
});

test("most contests counts unique contests and wins count firsts", () => {
  const rows = [
    result({ pilotId: 1, pilotName: "Ada Pilot", percent: 80, contestId: 1, rank: 1, categoryName: "Sportsman Power" }),
    result({ pilotId: 1, pilotName: "Ada Pilot", percent: 70, contestId: 1, rank: 2, categoryName: "Four Minute Free", level: "four minute", aircat: "F" }),
    result({ pilotId: 1, pilotName: "Ada Pilot", percent: 75, contestId: 2, rank: 1 }),
    result({ pilotId: 2, pilotName: "Bea Pilot", percent: 88, contestId: 3, rank: 4 }),
  ];
  const summary = summarizePilots(rows);
  const ada = byContests(summary).find((row) => row.pilotId === 1);
  assert.equal(ada?.contests, 2);
  assert.equal(ada?.scored, 3);
  assert.equal(ada?.wins, 2);
  assert.equal(byWins(summary)[0].pilotId, 1);
  assert.equal(withMinimum(summary, 3).length, 1);
});
