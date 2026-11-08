import assert from "node:assert/strict";
import { test } from "node:test";
import { groupCategories } from "./categories";
import type { CategoryResult } from "./types";

function category(partial: Pick<CategoryResult, "sequence" | "aircat" | "name" | "level">): CategoryResult {
  return { ...partial, flights: [], pilots: [], judges: [] };
}

test("orders power before glider and levels from primary upward", () => {
  const groups = groupCategories([
    category({ sequence: 8, aircat: "G", name: "Intermediate Glider", level: "intermediate" }),
    category({ sequence: 7, aircat: "G", name: "Sportsman Glider", level: "sportsman" }),
    category({ sequence: 5, aircat: "P", name: "Unlimited Power", level: "unlimited" }),
    category({ sequence: 2, aircat: "P", name: "Sportsman Power", level: "sportsman" }),
    category({ sequence: 11, aircat: "F", name: "Four Minute Free", level: "four minute" }),
  ]);
  assert.deepEqual(
    groups.map((group) => group.label),
    ["Power", "Glider", "Four-minute"],
  );
  assert.deepEqual(
    groups[0].categories.map((item) => item.level),
    ["sportsman", "unlimited"],
  );
  assert.equal(groups[1].categories[0].name, "Sportsman Glider");
});
