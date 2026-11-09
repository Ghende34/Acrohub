import { OFFICIAL_RESULTS_FROM_YEAR } from "./constants";

export function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function fullName(given: string, family: string): string {
  return cleanText(`${given} ${family}`);
}

export function airplaneLine(make: string, model: string): string {
  return cleanText(`${make} ${model}`);
}

const REGION_LABELS: Record<string, string> = {
  SouthWest: "Southwest",
  SouthEast: "Southeast",
  SouthCentral: "South Central",
  NorthEast: "Northeast",
  NorthWest: "Northwest",
  MidAmerica: "Mid-America",
  International: "International",
};

export const REGION_ORDER = Object.keys(REGION_LABELS);

export function regionLabel(region: string): string {
  return REGION_LABELS[region] ?? region;
}

export function levelLabel(level: string): string {
  return level.replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
}

export function isArchivalYear(year: number): boolean {
  return Number.isFinite(year) && year > 0 && year < OFFICIAL_RESULTS_FROM_YEAR;
}

export function percentNumber(points: string | number, possible: number): number | null {
  const value = typeof points === "number" ? points : Number(points);
  if (!Number.isFinite(value) || !Number.isFinite(possible) || possible <= 0) return null;
  return (value / possible) * 100;
}

/** Points ÷ possible, half-up to two decimals — the same figure IACCDB prints. */
export function formatPercent(points: string | number, possible: number): string {
  const value = typeof points === "number" ? points : Number(points);
  if (!Number.isFinite(value) || !Number.isFinite(possible) || possible <= 0) return "—";
  const rounded = Math.round((value / possible) * 10000) / 100;
  return `${rounded.toFixed(2)}%`;
}

export function formatPoints(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const raw = String(value).trim();
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return raw;
  const decimals = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPossible(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US");
}

export function formatMetric(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return String(value);
}

export function placeWord(rank: number): string {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

export type DateParts = {
  month: string;
  day: string;
  label: string;
  monthHeading: string;
  key: string;
};

export function dateParts(iso: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) {
    const fallback = iso || "Date unavailable";
    return { month: "", day: "", label: fallback, monthHeading: fallback, key: fallback };
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(date)
    .toUpperCase();
  const monthLong = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
  const day = String(Number(match[3]));
  return {
    month: monthShort,
    day,
    label: `${monthLong} ${day}, ${match[1]}`,
    monthHeading: `${monthLong} ${match[1]}`,
    key: `${match[1]}-${match[2]}`,
  };
}

export function locationLine(city: string, state: string): string {
  return [cleanText(city), cleanText(state)].filter(Boolean).join(", ");
}

export function yearFromDate(iso: string): number | null {
  const match = /^(\d{4})/.exec(iso);
  return match ? Number(match[1]) : null;
}
