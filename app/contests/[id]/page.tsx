import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContestBoard } from "@/components/ContestBoard";
import { groupCategories } from "@/lib/categories";
import { getContest, getFlight } from "@/lib/iaccdb";
import type { FlightDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return { title: "Contest" };
  try {
    const contest = await getContest(Number(id));
    if (!contest) return { title: "Contest" };
    return {
      title: contest.name,
      description: `${contest.name} in ${contest.city}, ${contest.state}. Unofficial IACCDB standings on Acrohub.`,
    };
  } catch {
    return { title: "Contest" };
  }
}

export default async function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const contest = await getContest(Number(id));
  if (!contest) notFound();
  const first = groupCategories(contest.categoryResults)[0]?.categories[0];
  const initialFlights: FlightDetail[] = first
    ? (await Promise.all(first.flights.map((flight) => getFlight(flight.id)))).filter(
        (flight): flight is FlightDetail => flight != null,
      )
    : [];

  return (
    <div className="wrap stack">
      <ContestBoard key={contest.id} contest={contest} initialFlights={initialFlights} />
    </div>
  );
}
