import { getPilotProfile, UpstreamError } from "@/lib/iaccdb";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return fail(404, "Not found");
  try {
    const profile = await getPilotProfile(Number(id));
    if (!profile) return fail(404, "Not found");
    return ok(profile);
  } catch (error) {
    console.error(error);
    const status = error instanceof UpstreamError ? 502 : 502;
    return fail(status, "IACCDB unavailable");
  }
}
