import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PilotProfile } from "@/components/PilotProfile";
import { getPilotProfile } from "@/lib/iaccdb";

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

export default async function PilotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const profile = await getPilotProfile(Number(id));
  if (!profile) notFound();
  return (
    <div className="wrap stack">
      <PilotProfile profile={profile} />
    </div>
  );
}
