import { searchPilotIndex, UpstreamError } from "@/lib/iaccdb";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const result = await searchPilotIndex(query);
    return ok({ query: query.trim().slice(0, 80), ...result });
  } catch (error) {
    console.error(error);
    const status = error instanceof UpstreamError ? 502 : 502;
    return fail(status, "IACCDB unavailable");
  }
}
