import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoresheetTable } from "@/components/ScoresheetTable";
import { getScoresheet } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return { title: "Scoresheet" };
  try {
    const sheet = await getScoresheet(Number(id));
    if (!sheet) return { title: "Scoresheet" };
    return { title: `${sheet.pilot.name} ${sheet.flightName}` };
  } catch {
    return { title: "Scoresheet" };
  }
}

export default async function ScoresheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const sheet = await getScoresheet(Number(id));
  if (!sheet) notFound();
  return (
    <div className="wrap stack">
      <ScoresheetTable view={sheet} />
    </div>
  );
}
