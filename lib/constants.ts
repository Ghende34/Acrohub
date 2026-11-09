export const IACCDB_ORIGIN = "https://iaccdb.iac.org";

/** IACCDB treats 2014 onward as official results. Earlier years are archival. */
export const OFFICIAL_RESULTS_FROM_YEAR = 2014;

export const CACHE_TTL_MS = 10 * 60 * 1000;

/** Cap contest-detail fetches when building one pilot's history. */
export const PILOT_SCORE_FETCH_LIMIT = 40;

export function contestUrl(id: number): string {
  return `${IACCDB_ORIGIN}/contests/${id}`;
}

export function pilotUrl(id: number): string {
  return `${IACCDB_ORIGIN}/pilots/${id}`;
}

export function flightUrl(id: number): string {
  return `${IACCDB_ORIGIN}/flights/${id}`;
}

export function pilotScoresUrl(pilotId: number, contestId: number): string {
  return `${IACCDB_ORIGIN}/pilots/${pilotId}/scores/${contestId}`;
}

export function judgeUrl(id: number): string {
  return `${IACCDB_ORIGIN}/judge/${id}/cv`;
}

export function regionalsUrl(year?: number | string): string {
  return year
    ? `${IACCDB_ORIGIN}/leaders/regionals/${year}`
    : `${IACCDB_ORIGIN}/leaders/regionals`;
}

export function notesUrl(): string {
  return `${IACCDB_ORIGIN}/pages/notes`;
}

export function judgeLeadersUrl(year?: number | string): string {
  return year ? `${IACCDB_ORIGIN}/leaders/judges/${year}` : `${IACCDB_ORIGIN}/leaders/judges`;
}
