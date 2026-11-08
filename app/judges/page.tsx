import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JudgeBoard } from "@/components/JudgeBoard";
import { getJudgeLeaders } from "@/lib/iaccdb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Judge experience",
  description: "IACCDB judge experience standings, with rank agreement and pair agreement in plain language.",
};

export default async function JudgesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year && /^\d{4}$/.test(params.year) ? params.year : undefined;
  const leaders = await getJudgeLeaders(year);
  if (!leaders) notFound();
  return (
    <div className="wrap stack">
      <JudgeBoard key={leaders.year} leaders={leaders} />
    </div>
  );
}
