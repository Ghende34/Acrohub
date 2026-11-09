import assert from "node:assert/strict";
import { test } from "node:test";
import { identifyAirplane } from "./airplanes";

function id(make: string, model = ""): string {
  return identifyAirplane(make, model).id;
}

test("collapses Extra 300L spellings, including swapped make and model", () => {
  const names = [
    ["Extra", "300L"],
    ["Extra", "300 L"],
    ["Extra", "300/L"],
    ["Extra", "E300L"],
    ["Extra", "EA-300"],
    ["extra", "300LP"],
    ["Extra Flugzeugbau", "EA300L"],
    ["EA 300", "Extra 300L"],
    ["Extra EA 300L", ""],
    ["Extra EA 300L", "Extra EA 300L"],
  ];
  for (const [make, model] of names) {
    assert.equal(id(make, model), "extra-300l", `${make} | ${model}`);
  }
  assert.equal(identifyAirplane("Extra", "300L").name, "Extra 300L");
  assert.equal(identifyAirplane("Extra Flugzeugbau", "EA300L").entered, "Extra Flugzeugbau EA300L");
});

test("keeps distinct Extra and Pitts models apart", () => {
  assert.equal(id("Extra", "330SC"), "extra-330sc");
  assert.equal(id("Extra", "330LX"), "extra-330lx");
  assert.equal(id("Extra", "E330LX"), "extra-330lx");
  assert.equal(id("EXTRA", "EA 300/SC"), "extra-300sc");
  assert.equal(id("Extra", "300SC"), "extra-300sc");
  assert.equal(id("extra", "ng"), "extra-ng");
  assert.equal(id("Pitts", "S-2B"), "pitts-s2b");
  assert.equal(id("Pitts", "S2B"), "pitts-s2b");
  assert.equal(id("Pitts Special", "Pitts S2B"), "pitts-s2b");
  assert.equal(id("Pitts Special", "S-2C"), "pitts-s2c");
  assert.equal(id("PITTS", "S1S"), "pitts-s1s");
  assert.equal(id("Piits Model 12", "Pitts"), "pitts-12");
});

test("collapses Decathlon, Gamebird, Christen, Van's, and DG spellings", () => {
  assert.equal(id("American Champion", "8KCAB Super Decathlon"), "super-decathlon");
  assert.equal(id("ACA Super Decathalon", "8KCAB"), "super-decathlon");
  assert.equal(id("Bellanca", "8KCAB Super Decathlon"), "super-decathlon");
  assert.equal(id("Super D", "8KCAB"), "super-decathlon");
  assert.equal(id("ACA", "8-KCAB"), "super-decathlon");
  assert.equal(id("American Champion", "8KCAB Xtreme Decathlon"), "xtreme-decathlon");
  assert.equal(id("Game Composites", "GB1 Gamebird"), "gamebird");
  assert.equal(id("Game Composite", "GB1"), "gamebird");
  assert.equal(id("Gamebird", "GB1"), "gamebird");
  assert.equal(id("Game Aerospace", "Gamebird GB1"), "gamebird");
  assert.equal(id("Christen", "Eagle II"), "christen-eagle");
  assert.equal(id("CHRISTEN", "SUPER EAGLE 1"), "christen-eagle");
  assert.equal(id("Aviat", "Christen Eagle"), "christen-eagle");
  assert.equal(id("Van's", "RV-8"), "rv-8");
  assert.equal(id("Vans", "RV-8"), "rv-8");
  assert.equal(id("Van's RV", "RV-4"), "rv-4");
  assert.equal(id("dg", "1000"), "dg-1000");
  assert.equal(id("DG", "DG1000"), "dg-1000");
  assert.equal(id("DG Flugzeugbau", "DG-1000"), "dg-1000");
  assert.equal(id("DG-Flugzeubau", "DG-1001"), "dg-1001");
  assert.equal(id("DG Flugzeugbau", "DG-1001"), "dg-1001");
  assert.equal(id("Rebel Edge", "2300"), "rebel-2300");
  assert.equal(id("Rebel-Edge", "2300"), "rebel-2300");
});

test("unknown leftovers stay visible instead of being dropped", () => {
  const odd = identifyAirplane("Homebuilt", "Special");
  assert.equal(odd.known, false);
  assert.equal(odd.name, "Homebuilt Special");
  assert.equal(identifyAirplane("", "").id, "unknown");
  assert.equal(identifyAirplane("MDM-1", "Fox").id, "fox");
  assert.equal(identifyAirplane("S1 Swift", "Swfit 1").id, "swift-s1");
});
