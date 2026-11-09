import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { alignCard, familyName, parseSequenceItems, publishedCaptions, type TextItem } from "./sequence-card";

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
  assert.equal(labeled.captions[0]?.name, "Single line");
  assert.equal(labeled.captions[0]?.catalog, "1.1.6.1");
  assert.equal(labeled.captions[2]?.name, "Half Cuban");
  assert.equal(labeled.captions[2]?.catalog, "8.5.6.1 + 9.1.4.2");
  assert.equal(labeled.captions[7]?.name, "Stall turn");
  assert.equal(labeled.captions[10]?.catalog, "7.2.2.1 + 9.4.3.2");
  assert.equal(labeled.captions[11], null);
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
  assert.equal(familyName(["5.2.1.1"]), "Stall turn");
  const aligned = alignCard(SPORTSMAN_K, card);
  assert.ok(!("error" in aligned));
  const wrong = alignCard([10, 13, 14, 99, 11, 10, 4, 17, 10, 17, 11, 10], card);
  assert.ok("error" in wrong);
  assert.match(wrong.error, /Figure 4/);
});
