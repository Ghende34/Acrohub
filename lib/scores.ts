import { airplaneLine, formatPercent } from "./format";
import type { ContestDetail, PilotScore, StandingPilot } from "./types";

export function toPilotScore(pilot: StandingPilot): PilotScore {
  return {
    rank: pilot.rank,
    points: pilot.points,
    totalPossible: pilot.totalPossible,
    percent: formatPercent(pilot.points, pilot.totalPossible),
    airplane: airplaneLine(pilot.airplane.make, pilot.airplane.model),
    reg: pilot.airplane.reg,
    starQualifying: pilot.starQualifying,
    horsConcours: pilot.horsConcours,
    chapter: pilot.chapter,
    iacId: pilot.iacId,
  };
}

export function matchPilotScore(
  contest: ContestDetail,
  pilotId: number,
  categoryName: string,
): StandingPilot | null {
  const hint = categoryName.trim().toLowerCase();
  const matches = contest.categoryResults.flatMap((category) => {
    const pilot = category.pilots.find((row) => row.id === pilotId);
    return pilot ? [{ category, pilot }] : [];
  });
  if (matches.length === 0) return null;
  const exact = matches.find((match) => match.category.name.trim().toLowerCase() === hint);
  if (exact) return exact.pilot;
  if (matches.length === 1) return matches[0].pilot;
  const loose = matches.find((match) => {
    const name = match.category.name.trim().toLowerCase();
    return name.includes(hint) || hint.includes(name);
  });
  return loose?.pilot ?? null;
}
