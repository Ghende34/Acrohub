import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeasonBook } from "@/components/SeasonBook";
import { getContestIndex, getPilotProfile, getPilotSeason } from "@/lib/iaccdb";
import { profileYears } from "@/lib/pilot-stats";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return { title: "Pilot" };
  try {
    const profile = await getPilotProfile(Number(id));
    if (!profile) return { title: "Pilot" };
    return {
      title: profile.name,
      description: `${profile.name} contest appearances from the IAC Contest Database.`,
    };
  } catch {
    return { title: "Pilot" };
  }
}

export default async function PilotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const profile = await getPilotProfile(Number(id));
  if (!profile) notFound();
  const years = profileYears(profile);
  const requested = Number(query.year);
  const index = years.length === 0 ? await getContestIndex() : null;
  const year = years.includes(requested)
    ? requested
    : years.includes(new Date().getUTCFullYear())
      ? new Date().getUTCFullYear()
      : (years[0] ?? index?.contestYear ?? new Date().getUTCFullYear());
  const book = await getPilotSeason(profile, year);
  return (
    <div className="wrap stack">
      <SeasonBook profile={profile} book={book} years={years.length > 0 ? years : [year]} />
    </div>
  );
}
