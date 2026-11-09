import { getContest, UpstreamError } from "@/lib/iaccdb";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return fail(404, "Not found");
  try {
    const contest = await getContest(Number(id));
    if (!contest) return fail(404, "Not found");
    return ok(contest);
  } catch (error) {
    console.error(error);
    const status = error instanceof UpstreamError ? 502 : 502;
    return fail(status, "IACCDB unavailable");
  }
}
