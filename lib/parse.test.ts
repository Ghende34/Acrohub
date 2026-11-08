import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseContestDetail,
  parseContestIndex,
  parseFlight,
  parseJudgeLeaders,
  parsePilotIndex,
  parsePilotPage,
  parseRegionalSeries,
  rewriteIaccdbLinks,
  searchPilots,
} from "./parse";
import { matchPilotScore } from "./scores";

test("rewrites localhost links and leaves other hosts alone", () => {
  assert.equal(
    rewriteIaccdbLinks("http://localhost:3000/contests/1054.json"),
    "https://iaccdb.iac.org/contests/1054.json",
  );
  assert.equal(
    rewriteIaccdbLinks("https://iaccdb.iac.org/flights/1.json"),
    "https://iaccdb.iac.org/flights/1.json",
  );
  assert.equal(rewriteIaccdbLinks("http://example.com/a"), "http://example.com/a");
});

test("parses a contest index and builds the public contest URL", () => {
  const index = parseContestIndex({
    years: ["http://localhost:3000/contests.json?year=2026", "http://localhost:3000/contests.json?year=2013"],
    contest_year: "2026",
    contests: [
      {
        id: 1054,
        name: "Tequila Cup Glider",
        city: "Marana",
        state: "AZ",
        start: "2026-11-06",
        chapter: 62,
        director: "Mark Matticola",
        region: "SouthWest",
        has_results: true,
        url: "http://localhost:3000/contests/1054.json",
      },
      {
        id: 1038,
        name: "Central Canada",
        city: "Steinbach ",
        state: "MB",
        start: "2026-07-11",
        chapter: 78,
        director: "Abram Razon",
        region: "International",
        has_results: false,
        url: "http://localhost:3000/contests/1038.json",
      },
    ],
  });
  assert.deepEqual(index.years, [2026, 2013]);
  assert.equal(index.contests[0].url, "https://iaccdb.iac.org/contests/1054");
  assert.equal(index.contests[0].hasResults, true);
  assert.equal(index.contests[1].hasResults, false);
  assert.equal(index.contests[1].city, "Steinbach");
});

test("parses category points, stars, and flight links", () => {
  const contest = parseContestDetail({
    id: 1054,
    start: "2026-11-06",
    name: "Tequila Cup Glider",
    year: 2026,
    region: "SouthWest",
    city: "Marana",
    state: "AZ",
    chapter: 62,
    director: "Mark Matticola",
    category_results: [
      {
        sequence: 7,
        aircat: "G",
        name: "Sportsman Glider",
        level: "sportsman",
        flights: [
          { id: 26490, sequence: 1, name: "Known", url: "http://localhost:3000/flights/26490.json" },
        ],
        pilot_results: [
          {
            pilot: { id: 5456, iac_id: 443660, given_name: "Jonathan", family_name: "Lupian", chapter: "12" },
            airplane: { make: "dg", model: "1000", reg: "USAF" },
            result: {
              category_rank: 1,
              category_value: "2829.34",
              total_possible: 3720,
              star_qualifying: false,
              hors_concours: 0,
            },
          },
        ],
        judge_results: [
          {
            judge: { id: 708, iac_id: 432116, given_name: "Barrett", family_name: "Hines" },
            result: { gamma: 78, rho: 99, flight_count: 3, minority_zero_ct: 0, minority_grade_ct: 0 },
          },
        ],
      },
    ],
  });
  assert.equal(contest.categoryResults[0].pilots[0].points, "2829.34");
  assert.equal(contest.categoryResults[0].pilots[0].starQualifying, false);
  assert.equal(contest.categoryResults[0].pilots[0].horsConcours, false);
  assert.equal(contest.categoryResults[0].judges[0].gamma, 78);
  assert.equal(contest.categoryResults[0].flights[0].id, 26490);
});

test("parses a flight and drops the nbsp in pilot names", () => {
  const flight = parseFlight({
    flight: {
      id: 26490,
      sequence: 1,
      name: "Known",
      pilot_results: [
        {
          pilot: { id: 5456, name: "Jonathan\u00a0Lupian" },
          penalty_total: 0,
          score: "947.67",
          score_before_penalties: "947.67",
          rank: 1,
          rank_before_penalties: 1,
          total_possible: 1240,
        },
      ],
    },
  });
  assert.equal(flight.pilots[0].name, "Jonathan Lupian");
  assert.equal(flight.pilots[0].score, "947.67");
  assert.deepEqual(flight.lineJudges, []);
});

test("parses flight judging lines with the published rho and gamma", () => {
  const flight = parseFlight({
    flight: {
      id: 26490,
      sequence: 1,
      name: "Known",
      pilot_results: [],
      line_judges: [
        {
          judge: { id: 708, name: "Barrett Hines" },
          assistant: { id: 3224, name: "Brian Pham" },
          rho: 89,
          gamma: 81,
          ri: "4.33",
          pilot_count: 7,
          pair_count: 21,
          flight_count: 1,
          average_flight_size: 7,
          figure_count: 63,
          average_k: 13.777777777777779,
          minority_zeros: 0,
          minority_grades: 0,
        },
        {
          judge: { id: 1866, name: "Matthew Smith" },
          assistant: { name: "\u00a0" },
          rho: 96,
          gamma: 90,
          ri: "1.12",
          pilot_count: 7,
          pair_count: 21,
          flight_count: 1,
          minority_zeros: 4,
          minority_grades: 0,
        },
      ],
    },
  });
  assert.equal(flight.lineJudges[0].rho, 89);
  assert.equal(flight.lineJudges[0].gamma, 81);
  assert.equal(flight.lineJudges[0].ri, "4.33");
  assert.equal(flight.lineJudges[0].assistant, "Brian Pham");
  assert.equal(flight.lineJudges[0].minorityZeros, 0);
  assert.equal(flight.lineJudges[1].assistant, "");
  assert.equal(flight.lineJudges[1].minorityZeros, 4);
});

test("parses judge experience rows as published", () => {
  const leaders = parseJudgeLeaders(`
    <div id="content">
      <h1>Judge Experience 2026</h1>
      <a href="/leaders/judges/2026">2026</a>
      <a href="/leaders/judges/2025">2025</a>
      <h4>Primary Power</h4>
      <table class='judge_leaders'><tbody>
        <tr class='category'><th>Judge</th></tr>
        <tr>
          <td/><td/>
          <td><a href="/judge/4976/cv">Liam&nbsp;Shetterly</a></td>
          <td class='rho'>81</td>
          <td class='gamma'>68</td>
          <td class='count'>48</td>
          <td class='count'>216</td>
          <td class='count'>5</td>
          <td class='avg'>9.60</td>
          <td class='count'>336</td>
          <td class='avg'>9.00</td>
          <td class='count'>1</td>
          <td class='count'>0</td>
        </tr>
      </tbody></table>
      <div id="footer"></div>
    </div>
  `);
  assert.equal(leaders?.year, 2026);
  assert.deepEqual(leaders?.years, [2026, 2025]);
  assert.equal(leaders?.categories[0].name, "Primary Power");
  assert.equal(leaders?.categories[0].judges[0].name, "Liam Shetterly");
  assert.equal(leaders?.categories[0].judges[0].rho, "81");
  assert.equal(leaders?.categories[0].judges[0].gamma, "68");
  assert.equal(leaders?.categories[0].judges[0].pilotFlights, "48");
  assert.equal(leaders?.categories[0].judges[0].averagePilots, "9.60");
  assert.equal(leaders?.categories[0].judges[0].minorityZeros, "1");
  assert.equal(leaders?.categories[0].judges[0].minorityGrades, "0");
  assert.equal(leaders?.categories[0].judges[0].order, 1);
});

test("searches the pilot index, including Gavin Henderson", () => {
  const pilots = parsePilotIndex(`
    <a href="/pilots/5247"> </a>
    <a href="/pilots/5136">Gavin\u00a0Henderson</a>
    <a href="/pilots/332">Giles Henderson</a>
  `);
  assert.equal(pilots.length, 2);
  const gavin = searchPilots(pilots, "gavin henderson");
  assert.equal(gavin.total, 1);
  assert.equal(gavin.pilots[0].id, 5136);
  const family = searchPilots(pilots, "Henderson, Gavin");
  assert.equal(family.pilots[0].id, 5136);
});

test("parses a pilot history page", () => {
  const page = parsePilotPage(`
    <div id="content">
      <h1>Gavin Henderson</h1>
      <ul>
        <li>
          2026-11-06
          <a href="/pilots/5136/scores/1043">
            Tequila Cup
          </a>    (SouthWest, Sportsman Power)
        </li>
      </ul>
      <div id="footer"></div>
    </div>
  `);
  assert.equal(page?.name, "Gavin Henderson");
  assert.equal(page?.appearances[0].contestId, 1043);
  assert.equal(page?.appearances[0].categoryName, "Sportsman Power");
  assert.equal(page?.appearances[0].region, "SouthWest");
});

test("parses regional standings and skips the membership note", () => {
  const series = parseRegionalSeries(`
    <div id="content">
      <h1>Regional Series, 2026</h1>
      <p><a href="/leaders/regionals/2026">2026</a> <a href="/leaders/regionals/2025">2025</a></p>
      <h2 class='regional'>MidAmerica</h2>
      <h3 class='regional'>MidAmerica Sportsman Power</h3>
      <table><tbody>
        <tr><td>✓</td><td>1</td>
          <td class='regional_series_pilot_name'><a href="/pilots/4817">Bruce&nbsp;Shipp</a></td>
          <td colspan='2'/>
          <td class='total_percent'>85.62%</td>
        </tr>
        <tr><td colspan='2'/>
          <td class='regional_series_pilot_contest'><a href="/contests/1000">Midwest Attitude Adjustment</a></td>
          <td class='total_average'>1172.83</td>
          <td class='total_average'>1370</td>
          <td class='total_percent'>85.61%</td>
        </tr>
      </tbody></table>
      <h3 id='chapters'>Chapter membership requirement</h3>
      <p>Not a category.</p>
      <div id="footer"></div>
    </div>
  `);
  assert.equal(series?.year, 2026);
  assert.deepEqual(series?.years, [2026, 2025]);
  assert.equal(series?.regions.length, 1);
  assert.equal(series?.regions[0].name, "MidAmerica");
  assert.equal(series?.regions[0].categories.length, 1);
  assert.equal(series?.regions[0].categories[0].name, "MidAmerica Sportsman Power");
  assert.equal(series?.regions[0].categories[0].pilots[0].name, "Bruce Shipp");
  assert.equal(series?.regions[0].categories[0].pilots[0].percent, "85.62%");
  assert.equal(series?.regions[0].categories[0].pilots[0].contests[0].points, "1172.83");
  assert.equal(series?.regions[0].categories[0].pilots[0].contests[0].possible, "1370");
});

test("matches a pilot to the named category", () => {
  const contest = parseContestDetail({
    id: 1,
    name: "Sample",
    start: "2026-01-01",
    year: 2026,
    region: "SouthWest",
    city: "Marana",
    state: "AZ",
    chapter: 1,
    director: "CD",
    category_results: [
      {
        sequence: 1,
        aircat: "P",
        name: "Primary Power",
        level: "primary",
        flights: [],
        pilot_results: [
          {
            pilot: { id: 9, given_name: "Ada", family_name: "Pilot" },
            airplane: { make: "Extra", model: "300", reg: "N1" },
            result: { category_rank: 2, category_value: "100.00", total_possible: 200, star_qualifying: false, hors_concours: 0 },
          },
        ],
        judge_results: [],
      },
      {
        sequence: 2,
        aircat: "P",
        name: "Sportsman Power",
        level: "sportsman",
        flights: [],
        pilot_results: [
          {
            pilot: { id: 9, given_name: "Ada", family_name: "Pilot" },
            airplane: { make: "Extra", model: "300", reg: "N1" },
            result: { category_rank: 1, category_value: "300.00", total_possible: 400, star_qualifying: true, hors_concours: 0 },
          },
        ],
        judge_results: [],
      },
    ],
  });
  const sportsman = matchPilotScore(contest, 9, "Sportsman Power");
  assert.equal(sportsman?.points, "300.00");
  assert.equal(sportsman?.rank, 1);
});
