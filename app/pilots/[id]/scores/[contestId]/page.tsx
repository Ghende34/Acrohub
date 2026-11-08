import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoresheetTable } from "@/components/ScoresheetTable";
import { getContest, getPilotContestSheets } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; contestId: string }>;
}): Promise<Metadata> {
  const { id, contestId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(contestId)) return { title: "Score sheets" };
  const contest = await getContest(Number(contestId)).catch(() => null);
  return { title: contest ? `${contest.name} score sheets` : "Score sheets" };
}

export default async function PilotContestSheetsPage({
  params,
}: {
  params: Promise<{ id: string; contestId: string }>;
}) {
  const { id, contestId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(contestId)) notFound();
  const pilotId = Number(id);
  const contest = await getContest(Number(contestId));
  if (!contest) notFound();
  const sheets = await getPilotContestSheets(pilotId, contest.id);
  const pilotName = sheets[0]?.pilot.name;
  return (
    <div className="wrap stack">
      <header>
        <p className="kicker">Score sheets</p>
        <h1 className="contest-title">{pilotName || "Pilot"}</h1>
        <p className="lede">
          {contest.name}. Each flight’s marks are read from that pilot’s IACCDB flight record.
        </p>
        <div className="actions">
          <Link href={`/contests/${contest.id}`}>{contest.name}</Link>
          <Link href={`/pilots/${pilotId}`}>Pilot profile</Link>
        </div>
      </header>
      {sheets.length === 0 ? (
        <div className="empty">
          <h2>No score sheets</h2>
          <p>IACCDB did not publish figure grades for this pilot at this contest.</p>
        </div>
      ) : (
        sheets.map((sheet) => <ScoresheetTable key={sheet.pilotFlightId} view={sheet} />)
      )}
    </div>
  );
}
