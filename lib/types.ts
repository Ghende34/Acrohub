export type ContestSummary = {
  id: number;
  name: string;
  city: string;
  state: string;
  start: string;
  chapter: number | string;
  director: string;
  region: string;
  hasResults: boolean;
  url: string;
};

export type YearIndex = {
  years: number[];
  contestYear: string;
  contests: ContestSummary[];
};

export type Airplane = {
  make: string;
  model: string;
  reg: string;
};

/** One row of category_results.pilot_results. */
export type StandingPilot = {
  id: number;
  iacId: number | null;
  givenName: string;
  familyName: string;
  chapter: string;
  airplane: Airplane;
  rank: number | null;
  points: string;
  totalPossible: number;
  starQualifying: boolean;
  horsConcours: boolean;
};

export type FlightRef = {
  id: number;
  sequence: number;
  name: string;
};

/** One row of category_results.judge_results. */
export type StandingJudge = {
  id: number;
  iacId: number | null;
  givenName: string;
  familyName: string;
  gamma: number | null;
  rho: number | null;
  flightCount: number | null;
  minorityZeros: number | null;
  minorityGrades: number | null;
};

export type CategoryResult = {
  sequence: number;
  aircat: string;
  name: string;
  level: string;
  flights: FlightRef[];
  pilots: StandingPilot[];
  judges: StandingJudge[];
};

export type ContestDetail = {
  id: number;
  start: string;
  name: string;
  year: number;
  region: string;
  city: string;
  state: string;
  chapter: number | string;
  director: string;
  categoryResults: CategoryResult[];
};

/** One pilot on flights/{id}.json → flight.pilot_results. */
export type FlightPilotScore = {
  /** flights JSON pilot_results.id — the pilot_flights record. */
  pilotFlightId: number;
  pilotId: number;
  name: string;
  penalty: number;
  score: string;
  scoreBeforePenalties: string;
  rank: number | null;
  rankBeforePenalties: number | null;
  totalPossible: number;
};

export type FlightContest = {
  id: number | null;
  name: string;
  year: number | null;
  start: string;
};

/** One judging line on flights/{id}.json → flight.line_judges. */
export type LineJudge = {
  id: number;
  name: string;
  assistant: string;
  rho: number | null;
  gamma: number | null;
  /** CIVA ranking index, kept as published. */
  ri: string | null;
  pilotCount: number | null;
  pairCount: number | null;
  flightCount: number | null;
  averagePilots: number | null;
  figureCount: number | null;
  averageK: number | null;
  minorityZeros: number | null;
  minorityGrades: number | null;
};

export type FlightDetail = {
  id: number;
  sequence: number;
  name: string;
  contest: FlightContest | null;
  pilots: FlightPilotScore[];
  lineJudges: LineJudge[];
};

export type PilotFlightRecord = {
  id: number;
  penalty: number;
  horsConcours: boolean;
  chapter: string;
  pilot: { id: number; name: string; iacId: number | null };
  airplane: { make: string; model: string; reg: string };
  flight: {
    id: number;
    name: string;
    categories: { name: string; level: string; aircat: string }[];
  };
  judges: { id: number; name: string; assistant: string; values: number[] }[];
  kValues: number[];
  totalK: number | null;
};

export type PilotHit = {
  id: number;
  name: string;
};

export type PilotScoreStatus = "loaded" | "missing" | "not-fetched" | "unavailable";

export type PilotScore = {
  rank: number | null;
  points: string;
  totalPossible: number;
  percent: string;
  airplane: string;
  reg: string;
  starQualifying: boolean;
  horsConcours: boolean;
  chapter: string;
  iacId: number | null;
};

export type PilotAppearance = {
  date: string;
  contestId: number;
  contestName: string;
  region: string;
  categoryName: string;
  scoreStatus: PilotScoreStatus;
  score: PilotScore | null;
};

export type PilotProfile = {
  id: number;
  name: string;
  appearances: PilotAppearance[];
  fetchedScoreCount: number;
  totalAppearances: number;
};

export type ParsedAppearance = {
  date: string;
  contestId: number;
  contestName: string;
  region: string;
  categoryName: string;
};

export type RegionalContest = {
  id: number;
  name: string;
  points: string;
  possible: string;
  percent: string;
};

export type RegionalPilot = {
  id: number;
  name: string;
  rank: number;
  percent: string;
  contests: RegionalContest[];
};

export type RegionalCategory = {
  name: string;
  pilots: RegionalPilot[];
};

export type RegionalRegion = {
  name: string;
  categories: RegionalCategory[];
};

export type RegionalSeries = {
  year: number;
  years: number[];
  regions: RegionalRegion[];
};

/** One row of the IACCDB judge-experience table. Values stay as published. */
export type JudgeLeaderRow = {
  id: number;
  name: string;
  order: number;
  rho: string;
  gamma: string;
  pilotFlights: string;
  pilotPairs: string;
  flightPrograms: string;
  averagePilots: string;
  grades: string;
  averageK: string;
  minorityZeros: string;
  minorityGrades: string;
};

export type JudgeLeaders = {
  year: number;
  years: number[];
  categories: { name: string; judges: JudgeLeaderRow[] }[];
};
