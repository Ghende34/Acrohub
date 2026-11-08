import type { CategoryResult } from "./types";

const AIR_ORDER = ["P", "G", "F"];
const LEVEL_ORDER = ["primary", "sportsman", "intermediate", "advanced", "unlimited", "four minute"];

export type AirGroup = {
  aircat: string;
  label: string;
  categories: CategoryResult[];
};

export function airLabel(aircat: string): string {
  if (aircat === "P") return "Power";
  if (aircat === "G") return "Glider";
  if (aircat === "F") return "Four-minute";
  return "Other";
}

function indexOf(list: string[], value: string): number {
  const index = list.indexOf(value);
  return index === -1 ? 99 : index;
}

export function groupCategories(categories: CategoryResult[]): AirGroup[] {
  const sorted = [...categories].sort((a, b) => {
    const byAir = indexOf(AIR_ORDER, a.aircat) - indexOf(AIR_ORDER, b.aircat);
    if (byAir) return byAir;
    const byLevel =
      indexOf(LEVEL_ORDER, a.level.toLowerCase()) - indexOf(LEVEL_ORDER, b.level.toLowerCase());
    if (byLevel) return byLevel;
    return a.sequence - b.sequence;
  });

  const groups: AirGroup[] = [];
  for (const category of sorted) {
    let group = groups.find((item) => item.aircat === category.aircat);
    if (!group) {
      group = { aircat: category.aircat, label: airLabel(category.aircat), categories: [] };
      groups.push(group);
    }
    group.categories.push(category);
  }
  return groups;
}
