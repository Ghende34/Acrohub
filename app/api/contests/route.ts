import { getContestIndex, UpstreamError } from "@/lib/iaccdb";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const year = new URL(request.url).searchParams.get("year") ?? undefined;
  if (year && !/^\d{4}$/.test(year)) return fail(400, "Invalid year");
  try {
    return ok(await getContestIndex(year));
  } catch (error) {
    console.error(error);
    const status = error instanceof UpstreamError && error.status >= 400 && error.status < 500 ? error.status : 502;
    return fail(status, "IACCDB unavailable");
  }
}
