import { getContest, getPilotProfile } from "@/lib/iaccdb";
import { mapPool } from "@/lib/pool";
import { fail } from "@/lib/respond";
import { contestSignature, pilotSignature, type WatchContest, type WatchPilot } from "@/lib/watch";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const contestIds = parseIds(url.searchParams.get("contests")).slice(0, 20);
  const pilotIds = parseIds(url.searchParams.get("pilots")).slice(0, 20);
  if (contestIds.length === 0 && pilotIds.length === 0) {
    return NextResponse.json({ checkedAt: new Date().toISOString(), contests: [], pilots: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const contests = await mapPool(contestIds, 4, loadContest);
    const pilots = await mapPool(pilotIds, 2, loadPilot);
    return NextResponse.json(
      {
        checkedAt: new Date().toISOString(),
        contests: contests.filter((item): item is WatchContest => item != null),
        pilots: pilots.filter((item): item is WatchPilot => item != null),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(error);
    return fail(502, "Watch check failed");
  }
}

function parseIds(value: string | null): number[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((part) => Number(part)).filter((id) => Number.isInteger(id) && id > 0))];
}

async function loadContest(id: number): Promise<WatchContest | null> {
  const contest = await getContest(id);
  if (!contest) return null;
  return {
    id: contest.id,
    name: contest.name,
    year: contest.year,
    hasResults: contest.categoryResults.some((category) => category.pilots.length > 0),
    signature: contestSignature(contest),
  };
}

async function loadPilot(id: number): Promise<WatchPilot | null> {
  const profile = await getPilotProfile(id);
  if (!profile) return null;
  const latest = profile.appearances[0];
  return {
    id: profile.id,
    name: profile.name,
    signature: pilotSignature(profile),
    latest: latest ? `${latest.date.slice(0, 10)} ${latest.contestName}` : "",
  };
}
