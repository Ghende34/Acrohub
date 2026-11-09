import assert from "node:assert/strict";
import { test } from "node:test";
import { contestSignature, hash, pilotSignature } from "./watch";
import type { ContestDetail, PilotProfile } from "./types";

test("contest and pilot signatures change when a score changes", () => {
  const contest = {
    id: 1,
    name: "Cup",
    year: 2026,
    start: "2026-11-06",
    region: "SouthWest",
    city: "Marana",
    state: "AZ",
    chapter: "62",
    director: "",
    categoryResults: [
      {
        sequence: 1,
        name: "Sportsman Power",
        level: "sportsman",
        aircat: "P",
        flights: [],
        pilots: [
          {
            id: 5136,
            givenName: "Gavin",
            familyName: "Henderson",
            chapter: "52",
            iacId: 443240,
            rank: 3,
            points: "2400",
            totalPossible: 3000,
            horsConcours: false,
            starQualifying: true,
            airplane: { make: "Extra", model: "EA300L", reg: "N83KS" },
          },
        ],
        judges: [],
      },
    ],
  } satisfies ContestDetail;
  const before = contestSignature(contest);
  contest.categoryResults[0]!.pilots[0]!.points = "2500";
  assert.notEqual(contestSignature(contest), before);

  const profile = {
    id: 5136,
    name: "Gavin Henderson",
    fetchedScoreCount: 1,
    totalAppearances: 1,
    appearances: [
      {
        date: "2026-11-06",
        contestId: 1054,
        contestName: "Tequila Cup",
        region: "SouthWest",
        categoryName: "Sportsman Power",
        scoreStatus: "loaded",
        score: {
          rank: 3,
          points: "2400",
          totalPossible: 3000,
          percent: "81.66%",
          airplane: "Extra EA300L",
          reg: "N83KS",
          starQualifying: true,
          horsConcours: false,
          chapter: "52",
          iacId: 443240,
        },
      },
    ],
  } satisfies PilotProfile;
  const pilotBefore = pilotSignature(profile);
  profile.appearances.push({ ...profile.appearances[0]!, contestId: 999, contestName: "Next" });
  assert.notEqual(pilotSignature(profile), pilotBefore);
  assert.equal(hash("same"), hash("same"));
});
