import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { alignCard, figureName, parseSequenceItems, publishedCaptions, type TextItem } from "./sequence-card";

const SPORTSMAN_K = [10, 13, 14, 10, 11, 10, 4, 17, 10, 17, 11, 10];

test("2026 power sportsman known names match the published K list", () => {
  const labeled = publishedCaptions({
    year: 2026,
    categoryName: "Sportsman Power",
    flightName: "Known",
    kValues: SPORTSMAN_K,
  });
  assert.ok(labeled);
  assert.equal(labeled.source, "2026 IAC Power Sportsman Known");
  assert.equal(labeled.captions.length, 12);
  assert.deepEqual(
    labeled.captions.slice(0, 11).map((caption) => caption?.name),
    [
      "Vertical line",
      "1½ spin",
      "Half Cuban",
      "Half loop with ½ roll",
      "Half loop with 2 of 4",
      "Loop",
      "180° turn",
      "Hammerhead",
      "1 roll",
      "Vertical up, 45° down with ½ roll",
      "Half loop with 2 of 4",
    ],
  );
  assert.equal(labeled.captions[1]?.catalog, "1.1.6.3 + 9.11.1.6");
  assert.equal(labeled.captions[2]?.catalog, "8.5.6.1 + 9.1.4.2");
  assert.equal(labeled.captions[11], null);
  assert.equal(figureName(["1.1.6.3", "9.11.1.6"]), "1½ spin");
});

test("other contest years use that year's published Known", () => {
  const sequences = JSON.parse(
    readFileSync(new URL("./fixtures/published-sequences.json", import.meta.url), "utf8"),
  ) as { year: number; aircat: string; level: string; program: string; presentationK: number; figures: { k: number }[]; source: string }[];
  const sportsman2025 = sequences.find(
    (sequence) => sequence.year === 2025 && sequence.aircat === "P" && sequence.level === "sportsman" && sequence.program === "known",
  );
  assert.ok(sportsman2025);
  const kValues = [...sportsman2025.figures.map((figure) => figure.k), sportsman2025.presentationK];
  const labeled = publishedCaptions({
    year: 2025,
    categoryName: "Sportsman Power",
    flightName: "Known",
    kValues,
  });
  assert.equal(labeled?.source, "2025 IAC Power Sportsman Known");
  assert.equal(
    publishedCaptions({ year: 2026, categoryName: "Sportsman Power", flightName: "Known", kValues }),
    null,
  );
});

test("a K mismatch or a Free flight does not receive known names", () => {
  const shifted = [...SPORTSMAN_K];
  shifted[3] = 12;
  assert.equal(
    publishedCaptions({ year: 2026, categoryName: "Sportsman Power", flightName: "Known", kValues: shifted }),
    null,
  );
  assert.equal(
    publishedCaptions({ year: 2026, categoryName: "Sportsman Power", flightName: "Free", kValues: SPORTSMAN_K }),
    null,
  );
  assert.equal(
    publishedCaptions({ year: 2026, categoryName: "Sportsman Power", flightName: "Unknown", kValues: SPORTSMAN_K }),
    null,
  );
});

test("sequence card text lines up only when every figure K matches", () => {
  const items = JSON.parse(readFileSync(new URL("./fixtures/sportsman-power-known-2026.json", import.meta.url), "utf8")) as TextItem[];
  const card = parseSequenceItems(items);
  assert.ok(card);
  assert.deepEqual(card.figures.map((figure) => figure.k), SPORTSMAN_K.slice(0, -1));
  assert.equal(card.presentationK, 10);
  assert.equal(figureName(["5.2.1.1"]), "Hammerhead");
  const aligned = alignCard(SPORTSMAN_K, card);
  assert.ok(!("error" in aligned));
  const wrong = alignCard([10, 13, 14, 99, 11, 10, 4, 17, 10, 17, 11, 10], card);
  assert.ok("error" in wrong);
  assert.match(wrong.error, /Figure 4/);
});
