import type { ContestDetail, PilotProfile } from "./types";

export type WatchContest = {
  id: number;
  name: string;
  year: number;
  hasResults: boolean;
  signature: string;
};

export type WatchPilot = {
  id: number;
  name: string;
  signature: string;
  latest: string;
};

export function contestSignature(contest: ContestDetail): string {
  const rows = contest.categoryResults.flatMap((category) =>
    category.pilots.map(
      (pilot) =>
        `${category.sequence}:${pilot.id}:${pilot.rank ?? ""}:${pilot.points}:${pilot.totalPossible}:${pilot.horsConcours ? 1 : 0}:${pilot.starQualifying ? 1 : 0}`,
    ),
  );
  return hash(rows.join("|") || "no-results");
}

export function pilotSignature(profile: PilotProfile): string {
  const rows = profile.appearances.map(
    (appearance) =>
      `${appearance.date}:${appearance.contestId}:${appearance.categoryName}:${appearance.score?.percent ?? ""}:${appearance.score?.rank ?? ""}:${appearance.score?.horsConcours ? 1 : 0}`,
  );
  return hash(rows.join("|") || "no-appearances");
}

export function hash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
