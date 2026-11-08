import assert from "node:assert/strict";
import { test } from "node:test";
import { computeScoresheet, displayMark } from "./scoresheet";

const kValues = [12, 16, 16, 10, 21, 16, 14, 4, 15];

test("decodes IACCDB grade sentinels", () => {
  assert.deepEqual(displayMark(-10), { label: "A", kind: "average" });
  assert.deepEqual(displayMark(-20), { label: "CA", kind: "conference" });
  assert.deepEqual(displayMark(-30), { label: "HZ", kind: "hard-zero" });
  assert.equal(displayMark(0).label, "0.0");
  assert.equal(displayMark(65).label, "6.5");
  assert.equal(displayMark(80).label, "8.0");
});

test("Lupian Known matches the published sportsman glider sheet", () => {
  const sheet = computeScoresheet({
    year: 2026,
    penalty: 0,
    totalPossible: 1240,
    kValues,
    judges: [
      { name: "Barrett Hines", values: [-10, 80, 70, 70, 70, 65, 55, 70, 70] },
      { name: "Matthew Smith", values: [80, 85, 80, 70, 80, 70, 60, 85, 70] },
      { name: "Jeffery Granger", values: [90, 90, 90, 85, 80, 75, 80, 90, 80] },
    ],
  });
  assert.deepEqual(
    sheet.figures[0].marks.map((mark) => mark.label),
    ["A", "8.0", "9.0"],
  );
  assert.equal(sheet.figures[0].average, "8.50");
  assert.equal(sheet.figures[0].pointsLeft, "18.0");
  assert.equal(sheet.figures[0].k, 12);
  assert.equal(sheet.figures[7].label, "8");
  assert.equal(sheet.figures[7].average, "8.18");
  assert.equal(sheet.figures[7].pointsLeft, "7.3");
  assert.equal(sheet.figures[8].label, "P");
  assert.deepEqual(sheet.judgeTotals, ["873.0", "933.0", "1037.0"]);
  assert.equal(sheet.points, "947.67");
  assert.equal(sheet.pointsEarned, "947.67");
  assert.equal(sheet.maxPossible, 1240);
  assert.equal(sheet.percent, "76.43%");
});

test("minority hard zeros are marked HZ and averaged for the total", () => {
  const sheet = computeScoresheet({
    year: 2026,
    penalty: 0,
    totalPossible: 1240,
    kValues,
    judges: [
      { name: "J1", values: [80, 85, 75, 70, 65, 75, 70, 75, 60] },
      { name: "J2", values: [90, 85, 80, 70, -30, 65, 55, 65, 55] },
      { name: "J3", values: [80, 90, 80, 90, 80, 80, 70, 85, 80] },
    ],
  });
  assert.deepEqual(
    sheet.figures[4].marks.map((mark) => mark.label),
    ["6.5", "HZ", "8.0"],
  );
  assert.equal(sheet.figures[4].average, "7.25");
  assert.equal(sheet.figures[4].pointsLeft, "57.7");
  assert.deepEqual(sheet.judgeTotals, ["896.5", "883.8", "1006.0"]);
  assert.equal(sheet.pointsEarned, "928.77");
});

test("a figure of hard zeros averages to zero", () => {
  const sheet = computeScoresheet({
    year: 2026,
    penalty: 0,
    kValues: [16],
    judges: [
      { name: "J1", values: [-30] },
      { name: "J2", values: [-30] },
      { name: "J3", values: [-30] },
    ],
  });
  assert.equal(sheet.figures[0].label, "P");
  assert.deepEqual(
    sheet.figures[0].marks.map((mark) => mark.label),
    ["HZ", "HZ", "HZ"],
  );
  assert.equal(sheet.figures[0].average, "0.00");
  assert.equal(sheet.pointsEarned, "0.00");
});

test("a numeric zero counts, and before 2014 it is scored as a hard zero", () => {
  const modern = computeScoresheet({
    year: 2026,
    penalty: 0,
    kValues: [10],
    judges: [
      { name: "J1", values: [50] },
      { name: "J2", values: [0] },
      { name: "J3", values: [60] },
    ],
  });
  assert.equal(modern.figures[0].marks[1].label, "0.0");
  assert.equal(modern.figures[0].average, "3.67");

  const archival = computeScoresheet({
    year: 2013,
    penalty: 0,
    kValues: [10],
    judges: [
      { name: "J1", values: [50] },
      { name: "J2", values: [0] },
      { name: "J3", values: [60] },
    ],
  });
  assert.equal(archival.figures[0].marks[1].label, "0.0");
  assert.equal(archival.figures[0].average, "5.50");
});
