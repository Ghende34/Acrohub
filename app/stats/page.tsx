import type { Metadata } from "next";
import { StatsExplorer } from "@/components/StatsExplorer";
import { getSeasonResults } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats",
  description: "Highest averages, wins, and best scores from posted IACCDB category results.",
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const season = await getSeasonResults(params.year);
  return (
    <div className="wrap stack">
      <StatsExplorer
        key={season.year}
        year={season.year}
        years={season.years}
        results={season.results}
        contestsPosted={season.contestsPosted}
      />
    </div>
  );
}
