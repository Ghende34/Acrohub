import { ContestExplorer } from "@/components/ContestExplorer";
import { getContestIndex } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const requested = params.year && /^\d{4}$/.test(params.year) ? params.year : undefined;
  const index = await getContestIndex(requested);
  const selectedYear = Number(requested ?? index.contestYear) || index.years[0];
  const years = index.years.length > 0 ? index.years : [selectedYear];

  return (
    <div className="wrap stack">
      <ContestExplorer key={selectedYear} years={years} selectedYear={selectedYear} contests={index.contests} />
    </div>
  );
}
