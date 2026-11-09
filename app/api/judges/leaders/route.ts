import { getJudgeLeaders, UpstreamError } from "@/lib/iaccdb";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const year = new URL(request.url).searchParams.get("year") ?? undefined;
  if (year && !/^\d{4}$/.test(year)) return fail(400, "Invalid year");
  try {
    const leaders = await getJudgeLeaders(year);
    if (!leaders) return fail(404, "Not found");
    return ok(leaders);
  } catch (error) {
    console.error(error);
    const status = error instanceof UpstreamError ? 502 : 502;
    return fail(status, "IACCDB unavailable");
  }
}