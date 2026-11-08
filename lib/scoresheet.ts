import { OFFICIAL_RESULTS_FROM_YEAR } from "./constants";
import { formatPercent } from "./format";

/**
 * Figure marks published by IACCDB on pilot_flights JSON.
 * Values are tenths of a grade. Sentinels match Score.display_score
 * and IAC::Constants in the IACCDB source: A -10, CA -20, HZ -30.
 */
const AVERAGE = -10;
const CONFERENCE_AVERAGE = -20;
const HARD_ZERO = -30;

export type MarkKind = "grade" | "average" | "conference" | "hard-zero";

export type Mark = {
  label: string;
  kind: MarkKind;
};

export type ScoresheetJudge = {
  name: string;
  values: number[];
};

export type ScoresheetFigure = {
  label: string;
  marks: Mark[];
  average: string | null;
  k: number | null;
  pointsLeft: string | null;
};

export type Scoresheet = {
  figures: ScoresheetFigure[];
  judgeTotals: string[];
  points: string | null;
  penalty: number;
  pointsEarned: string | null;
  maxPossible: number | null;
  percent: string | null;
};

export function displayMark(raw: number): Mark {
  if (raw <= HARD_ZERO) return { label: "HZ", kind: "hard-zero" };
  if (raw <= CONFERENCE_AVERAGE) return { label: "CA", kind: "conference" };
  if (raw < 0) return { label: "A", kind: "average" };
  return { label: (raw / 10).toFixed(1), kind: "grade" };
}

/**
 * Straight-average scoresheet totals, following IACCDB's SaComputer.
 * Hard zeros in the minority are replaced by the figure average for the
 * total. A majority of hard zeros zeros the figure. Grades of A and CA
 * are filled with that same average. Contest years before 2014 treat a
 * stored 0 as a hard zero for the total; the grid still shows 0.0.
 */
export function computeScoresheet(input: {
  judges: ScoresheetJudge[];
  kValues: number[];
  penalty: number;
  year?: number | null;
  totalPossible?: number | null;
}): Scoresheet {
  const judges = input.judges;
  const kays = input.kValues.filter((value) => Number.isFinite(value));
  const judgeCount = judges.length;
  const gradeLength = judgeCount === 0 ? 0 : Math.min(...judges.map((judge) => judge.values.length));
  const figureCount = kays.length > 0 ? Math.min(kays.length, gradeLength) : gradeLength;
  const hasSoftZero = input.year == null || input.year >= OFFICIAL_RESULTS_FROM_YEAR;
  const marks = figuresMarks(judges, figureCount);

  if (figureCount === 0 || kays.length === 0 || judgeCount === 0) {
    return {
      figures: marks.map((row, index) => ({
        label: figureLabel(index, figureCount),
        marks: row,
        average: null,
        k: kays[index] ?? null,
        pointsLeft: null,
      })),
      judgeTotals: [],
      points: null,
      penalty: input.penalty,
      pointsEarned: null,
      maxPossible: input.totalPossible ?? null,
      percent: null,
    };
  }

  const cells: number[][] = [];
  const zeroCount = Array<number>(figureCount).fill(0);
  const gradeCount = Array<number>(figureCount).fill(0);
  const scoreCount = Array<number>(figureCount).fill(0);

  for (let figure = 0; figure < figureCount; figure += 1) {
    cells[figure] = [];
    for (let judge = 0; judge < judgeCount; judge += 1) {
      let value = judges[judge].values[figure] ?? 0;
      if (!(value > 0) && !hasSoftZero && value === 0) value = HARD_ZERO;
      cells[figure][judge] = value;
      if (value === HARD_ZERO) zeroCount[figure] += 1;
      if (value !== AVERAGE) scoreCount[figure] += 1;
      if (value >= 0) gradeCount[figure] += 1;
    }
  }

  const scoreTotal = Array<number>(figureCount).fill(0);
  for (let figure = 0; figure < figureCount; figure += 1) {
    for (let judge = 0; judge < judgeCount; judge += 1) {
      const value = cells[figure][judge];
      if (value > 0) {
        const points = value * kays[figure];
        scoreTotal[figure] += points;
        cells[figure][judge] = points;
      }
    }
  }

  const averageScore = (figure: number) => {
    if (gradeCount[figure] > 0 && scoreTotal[figure] > 0) {
      return Math.round(scoreTotal[figure] / gradeCount[figure]);
    }
    return 0;
  };

  const resolveAverages = () => {
    for (let figure = 0; figure < figureCount; figure += 1) {
      if (gradeCount[figure] >= judgeCount) continue;
      const average = averageScore(figure);
      for (let judge = 0; judge < judgeCount; judge += 1) {
        const grade = cells[figure][judge];
        if (grade === CONFERENCE_AVERAGE || grade === AVERAGE) cells[figure][judge] = average;
      }
    }
  };

  resolveAverages();
  for (let figure = 0; figure < figureCount; figure += 1) {
    if (zeroCount[figure] <= 0) continue;
    if (scoreCount[figure] - zeroCount[figure] < zeroCount[figure]) {
      for (let judge = 0; judge < judgeCount; judge += 1) cells[figure][judge] = 0;
    } else {
      for (let judge = 0; judge < judgeCount; judge += 1) {
        if (cells[figure][judge] === HARD_ZERO) cells[figure][judge] = AVERAGE;
      }
    }
  }
  resolveAverages();

  const judgeTotals = Array<number>(judgeCount).fill(0);
  const figureTotals = Array<number>(figureCount).fill(0);
  for (let judge = 0; judge < judgeCount; judge += 1) {
    for (let figure = 0; figure < figureCount; figure += 1) {
      judgeTotals[judge] += cells[figure][judge];
      figureTotals[figure] += cells[figure][judge];
    }
  }
  for (let figure = 0; figure < figureCount; figure += 1) {
    figureTotals[figure] = Math.round(figureTotals[figure] / judgeCount);
  }

  const flightTotal = judgeTotals.reduce((sum, value) => sum + value, 0);
  const sequencePossible = kays.slice(0, figureCount).reduce((sum, value) => sum + value, 0) * 10;
  const maxPossible = input.totalPossible && input.totalPossible > 0 ? input.totalPossible : sequencePossible;
  const points = formatQuotient(flightTotal, judgeCount * 10, 2);
  const pointsEarned = Math.max(0, Number(points) - input.penalty).toFixed(2);

  return {
    figures: figureTotals.map((figurePoints, index) => ({
      label: figureLabel(index, figureCount),
      marks: marks[index],
      average: formatQuotient(figurePoints, kays[index] * 10, 2),
      k: kays[index],
      pointsLeft: formatQuotient(kays[index] * 100 - figurePoints, 10, 1),
    })),
    judgeTotals: judgeTotals.map((total) => formatQuotient(total, 10, 1)),
    points,
    penalty: input.penalty,
    pointsEarned,
    maxPossible,
    percent: maxPossible > 0 ? formatPercent(pointsEarned, maxPossible) : null,
  };
}

function figuresMarks(judges: ScoresheetJudge[], figureCount: number): Mark[][] {
  return Array.from({ length: figureCount }, (_, figure) =>
    judges.map((judge) => displayMark(judge.values[figure] ?? 0)),
  );
}

function figureLabel(index: number, figureCount: number): string {
  return index === figureCount - 1 ? "P" : String(index + 1);
}

/** Half-up formatting of numerator / denominator. */
function formatQuotient(numerator: number, denominator: number, decimals: number): string {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return (0).toFixed(decimals);
  }
  const factor = 10 ** decimals;
  const scaled = (numerator / denominator) * factor;
  const rounded = Math.round(scaled);
  return (rounded / factor).toFixed(decimals);
}
