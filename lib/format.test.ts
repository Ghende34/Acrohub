import assert from "node:assert/strict";
import { test } from "node:test";
import { dateParts, formatPercent, formatPoints, isArchivalYear, regionLabel } from "./format";

test("percentages match published IACCDB rounding", () => {
  assert.equal(formatPercent("2829.34", 3720), "76.06%");
  assert.equal(formatPercent("947.67", 1240), "76.43%");
  assert.equal(formatPercent("2819.77", 3720), "75.80%");
  assert.equal(formatPercent("955.50", 1240), "77.06%");
  assert.equal(formatPercent("926.17", 1240), "74.69%");
  assert.equal(formatPercent("7655.29", 9730), "78.68%");
  assert.equal(formatPercent("0", 0), "—");
});

test("points keep source decimals and add grouping", () => {
  assert.equal(formatPoints("2829.34"), "2,829.34");
  assert.equal(formatPoints("1172.83"), "1,172.83");
});

test("dates stay on the contest calendar day", () => {
  const parts = dateParts("2026-11-06");
  assert.equal(parts.month, "NOV");
  assert.equal(parts.day, "6");
  assert.equal(parts.label, "November 6, 2026");
  assert.equal(parts.monthHeading, "November 2026");
});

test("official results begin in 2014", () => {
  assert.equal(isArchivalYear(2013), true);
  assert.equal(isArchivalYear(2014), false);
  assert.equal(regionLabel("SouthWest"), "Southwest");
});
