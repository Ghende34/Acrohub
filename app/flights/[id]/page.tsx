import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPercent, placeWord } from "@/lib/format";
import { getFlight } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return { title: "Flight" };
  const flight = await getFlight(Number(id)).catch(() => null);
  return { title: flight ? `${flight.name} flight` : "Flight" };
}

export default async function FlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const flight = await getFlight(Number(id));
  if (!flight) notFound();
  return (
    <div className="wrap stack">
      <header>
        <p className="kicker">{flight.contest?.name || "Flight"}</p>
        <h1 className="contest-title">{flight.name}</h1>
        <div className="actions">
          {flight.contest?.id ? <Link href={`/contests/${flight.contest.id}`}>{flight.contest.name}</Link> : null}
        </div>
      </header>
      <ul className="hits">
        {flight.pilots.map((pilot) => (
          <li key={pilot.pilotFlightId || pilot.pilotId}>
            {pilot.pilotFlightId > 0 ? (
              <Link className="hit" href={`/scoresheets/${pilot.pilotFlightId}`}>
                <span className="pilot-name">{pilot.name}</span>
                <span className="meta">
                  {pilot.rank != null ? placeWord(pilot.rank) : "Scoresheet"}
                  {pilot.totalPossible > 0 ? ` · ${formatPercent(pilot.score, pilot.totalPossible)}` : ""}
                </span>
              </Link>
            ) : (
              <span className="hit">
                <span className="pilot-name">{pilot.name}</span>
                <span className="meta">No figure record</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
