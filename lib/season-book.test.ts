import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSeasonBook, groupSeasonContests, type SeasonContest } from "./season-book";

function contest(partial: Partial<SeasonContest> & Pick<SeasonContest, "contestId" | "percent">): SeasonContest {
  return {
    name: "Contest",
    date: "2026-06-01",
    region: "South",
    categoryName: "Sportsman Power",
    rank: 1,
    percentLabel: partial.percent == null ? null : `${partial.percent.toFixed(2)}%`,
    points: "80.00",
    totalPossible: 100,
    horsConcours: false,
    starQualifying: false,
    make: "Extra",
    model: "EA300L",
    reg: "N83KS",
    flights: [],
    figures: [],
    ...partial,
  };
}

test("a contest with several categories keeps one group", () => {
  const early = contest({ contestId: 9, name: "Cup", date: "2026-04-01", percent: 70, categoryName: "Sportsman Power" });
  const later = contest({ contestId: 9, name: "Cup", date: "2026-04-01", percent: 80, categoryName: "Intermediate Power" });
  const other = contest({ contestId: 10, name: "Other", date: "2026-05-01", percent: 75 });
  const groups = groupSeasonContests([early, later, other]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.length, 2);
  assert.equal(groups[1]?.[0]?.contestId, 10);
});

test("season average skips hors concours and names best and weakest", () => {
  const book = buildSeasonBook(2026, [
    contest({
      contestId: 1,
      name: "Early",
      date: "2026-04-01",
      percent: 70,
      starQualifying: true,
      flights: [
        { pilotFlightId: 13, flightId: 3, name: "Unknown", percentLabel: "70.00%", percent: 70, rank: 2, horsConcours: false },
        { pilotFlightId: 12, flightId: 2, name: "Free", percentLabel: "72.00%", percent: 72, rank: 1, horsConcours: false },
        { pilotFlightId: 11, flightId: 1, name: "Known", percentLabel: "68.00%", percent: 68, rank: 2, horsConcours: false },
      ],
      figures: [
        { contestId: 1, contestName: "Early", flightName: "Known", pilotFlightId: 11, figure: "2", average: 5, k: 10 },
        { contestId: 1, contestName: "Early", flightName: "Known", pilotFlightId: 11, figure: "1", average: 9.5, k: 8 },
      ],
    }),
    contest({ contestId: 2, name: "Practice", date: "2026-05-01", percent: 99, horsConcours: true }),
    contest({ contestId: 3, name: "Late", date: "2026-09-01", percent: 80, starQualifying: false }),
  ]);
  assert.equal(book.scoredCount, 2);
  assert.equal(book.horsConcoursExcluded, 1);
  assert.equal(book.average, 75);
  assert.equal(book.bestContest?.name, "Late");
  assert.equal(book.weakestContest?.name, "Early");
  assert.equal(book.bestFlight?.name, "Free");
  assert.equal(book.weakestFlight?.percent, 68);
  assert.deepEqual(book.trend.map((item) => item.percent), [70, 80]);
  assert.equal(book.stars.length, 1);
  assert.equal(book.strengths[0]?.figure, "1");
  assert.equal(book.weaknesses[0]?.figure, "2");
  assert.deepEqual(
    book.contests[0]?.flights.map((flight) => flight.name),
    ["Known", "Free", "Unknown"],
  );
});
