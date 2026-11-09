import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadersBoard } from "@/components/LeadersBoard";
import { getRegionalSeries } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regional series",
  description: "IACCDB regional series standings, unofficially presented by Acrohub.",
};

export default async function LeadersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year && /^\d{4}$/.test(params.year) ? params.year : undefined;
  const series = await getRegionalSeries(year);
  if (!series) notFound();
  return (
    <div className="wrap stack">
      <LeadersBoard key={series.year} series={series} />
    </div>
  );
}
