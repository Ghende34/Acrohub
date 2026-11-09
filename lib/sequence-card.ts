import knownSequences from "./fixtures/published-sequences.json";

export type SequenceFigure = {
  name: string | null;
  catalog: string[];
  k: number;
};

export type SequenceCard = {
  year?: number;
  aircat?: "P" | "G";
  level?: string;
  program?: string;
  /** When set, the card belongs to a named contest, not every flight with the same K list. */
  contestHint?: string;
  presentationK: number | null;
  source: string;
  figures: SequenceFigure[];
};

export type FigureCaption = {
  name: string | null;
  catalog: string;
} | null;

export type TextItem = { x: number; y: number; text: string };

const KNOWN = knownSequences as SequenceCard[];

const FAMILIES: [string, string][] = [
  ["8.12", "Vertical-Cuban combination"],
  ["8.11", "Cuban-vertical combination"],
  ["8.10", "Reversing 1.25 loop"],
  ["8.8", "Double bump"],
  ["8.7", "Q loop"],
  ["8.6", "P loop"],
  ["8.5", "Half Cuban"],
  ["8.4", "Humpty bump"],
  ["7.8", "Horizontal eight"],
  ["7.5", "Horizontal S"],
  ["7.4", "Whole loop"],
  ["7.3", "Three-quarter loop"],
  ["7.2", "Half loop"],
  ["6.2", "Tail slide"],
  ["5.4", "Stall turn"],
  ["5.3", "Stall turn"],
  ["5.2", "Stall turn"],
  ["3.8", "Eight corners"],
  ["3.4", "Four corners"],
  ["3.3", "Three corners"],
  ["2.6", "Alternating turn"],
  ["2.5", "Alternating turn"],
  ["2.4", "360° turn"],
  ["2.3", "270° turn"],
  ["2.2", "180° turn"],
  ["2.1", "90° turn"],
  ["1.3", "Three lines"],
  ["1.2", "Two lines"],
  ["1.1", "Single line"],
];

const CATALOG = /^(?:\d+\.\d+\.\d+\.\d+|0\.1(?:\.\d+)?)$/;

export function familyName(catalogs: string[]): string | null {
  const base = catalogs.find((catalog) => !catalog.startsWith("9."));
  if (!base) return null;
  for (const [prefix, name] of FAMILIES) {
    if (base === prefix || base.startsWith(`${prefix}.`)) return name;
  }
  return null;
}

export function publishedCaptions(input: {
  year: number | null;
  categoryName: string;
  flightName: string;
  contestName?: string;
  kValues: number[];
}): { captions: FigureCaption[]; source: string } | null {
  const program = flightProgram(input.flightName);
  if (!program || input.year == null) return null;
  const category = categoryKey(input.categoryName);
  if (!category) return null;
  const contest = (input.contestName ?? "").toLowerCase();
  const matches = KNOWN.filter(
    (sequence) =>
      sequence.year === input.year &&
      sequence.aircat === category.aircat &&
      sequence.level === category.level &&
      sequence.program === program &&
      (!sequence.contestHint || contest.includes(sequence.contestHint.toLowerCase())),
  ).flatMap((card) => {
    const aligned = alignCard(input.kValues, card);
    return "error" in aligned ? [] : [{ source: card.source, captions: aligned.captions }];
  });
  if (matches.length !== 1) return null;
  return matches[0];
}

export function flightProgram(name: string): "known" | "free" | "unknown" | null {
  const text = name.toLowerCase();
  if (text.includes("unknown")) return "unknown";
  if (text.includes("free")) return "free";
  if (text.includes("known")) return "known";
  return null;
}

export function alignCard(
  kValues: number[],
  card: SequenceCard,
): { captions: FigureCaption[] } | { error: string } {
  const flight = kValues.filter((value) => Number.isFinite(value));
  const figureKs = card.figures.map((figure) => figure.k);
  let body = flight;
  let withPresentation = false;
  if (flight.length === figureKs.length + 1) {
    const last = flight[flight.length - 1];
    if (card.presentationK == null || last !== card.presentationK) {
      return {
        error: `This card does not match the flight. Card figures are K ${figureKs.join(", ")} with presentation K ${card.presentationK ?? "missing"}. The flight rows are K ${flight.join(", ")}. Names were not applied.`,
      };
    }
    body = flight.slice(0, -1);
    withPresentation = true;
  } else if (flight.length !== figureKs.length) {
    return {
      error: `This card has ${figureKs.length} figures (K ${figureKs.join(", ")}). This flight has ${flight.length} rows (K ${flight.join(", ")}). Names were not applied.`,
    };
  }
  const mismatch = body.findIndex((value, index) => value !== figureKs[index]);
  if (mismatch >= 0) {
    return {
      error: `Figure ${mismatch + 1} is K ${figureKs[mismatch]} on the card and K ${body[mismatch]} on this flight. Names were not applied.`,
    };
  }
  const captions: FigureCaption[] = card.figures.map((figure) => ({
    name: figure.name,
    catalog: figure.catalog.join(" + "),
  }));
  if (withPresentation) captions.push(null);
  return { captions };
}

/** Read an OpenAero / IAC Form A text layer. Returns null when the columns are not confident. */
export function parseSequenceItems(items: TextItem[]): SequenceCard | null {
  const rows = items
    .map((item) => ({ x: item.x, y: item.y, text: item.text.trim() }))
    .filter((item) => item.text);
  const cat = header(rows, "Cat. No.");
  const total = header(rows, "Total K");
  const elementK = header(rows, "K");
  if (!cat || !total || !elementK) return null;
  const scoreK = rows.find((row) => row.text === "K" && row.x > 400 && Math.abs(row.y - cat.y) < 25);
  const presentation = rows.find((row) => row.text === "Presentation");
  let presentationK: number | null = null;
  if (presentation && scoreK) {
    const mark = rows.find(
      (row) => /^\d{1,2}$/.test(row.text) && Math.abs(row.x - scoreK.x) < 28 && Math.abs(row.y - presentation.y) < 14,
    );
    if (mark) presentationK = Number(mark.text);
  }
  const catalogs: { y: number; catalog: string; k: number | null }[] = [];
  const kItems: { y: number; k: number }[] = [];
  const totals: { y: number; k: number }[] = [];
  for (const row of rows) {
    if (CATALOG.test(row.text) && Math.abs(row.x - cat.x) <= 16) {
      catalogs.push({ y: row.y, catalog: row.text, k: null });
    } else if (Math.abs(row.x - elementK.x) <= 14 && /^\d{1,2}(?: \d{1,3})?$/.test(row.text)) {
      const parts = row.text.split(" ").map(Number);
      kItems.push({ y: row.y, k: parts[0] });
      if (parts.length === 2) totals.push({ y: row.y, k: parts[1] });
    } else if (Math.abs(row.x - total.x) <= 16 && /^\d{1,3}$/.test(row.text)) {
      totals.push({ y: row.y, k: Number(row.text) });
    }
  }
  const used = new Set<number>();
  for (const figure of catalogs) {
    let best: number | null = null;
    let distance = 6.5;
    kItems.forEach((item, index) => {
      if (used.has(index)) return;
      const gap = Math.abs(item.y - figure.y);
      if (gap < distance) {
        distance = gap;
        best = index;
      }
    });
    if (best != null) {
      figure.k = kItems[best].k;
      used.add(best);
    }
  }
  catalogs.sort((a, b) => b.y - a.y);
  const clean: { y: number; k: number }[] = [];
  for (const item of [...totals].sort((a, b) => b.y - a.y)) {
    if (clean.some((existing) => Math.abs(existing.y - item.y) < 1.5)) continue;
    clean.push(item);
  }
  if (clean.length === 0) return null;
  const figures: SequenceFigure[] = [];
  for (let index = 0; index < clean.length; index += 1) {
    const current = clean[index];
    const upper = index === 0 ? 10_000 : clean[index - 1].y;
    const group = catalogs.filter((figure) => figure.y >= current.y - 8 && figure.y < upper - 4);
    if (group.length === 0 || group.some((figure) => figure.k == null)) return null;
    const sum = group.reduce((totalK, figure) => totalK + (figure.k ?? 0), 0);
    if (sum !== current.k) return null;
    const catalog = group.map((figure) => figure.catalog);
    figures.push({ name: familyName(catalog), catalog, k: current.k });
  }
  return { presentationK, source: "Uploaded sequence card", figures };
}

function header(rows: TextItem[], label: string): TextItem | null {
  return rows.find((row) => row.text === label && row.x < 260) ?? null;
}

function categoryKey(categoryName: string): { level: string; aircat: "P" | "G" } | null {
  const text = categoryName.toLowerCase();
  const level = ["primary", "sportsman", "intermediate", "advanced", "unlimited"].find((name) => text.includes(name));
  const aircat = text.includes("glider") ? "G" : text.includes("power") ? "P" : null;
  if (!level || !aircat) return null;
  return { level, aircat };
}
