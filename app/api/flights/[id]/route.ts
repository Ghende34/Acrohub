import { getFlight } from "@/lib/iaccdb";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return fail(404, "Not found");
  const flight = await getFlight(Number(id));
  if (!flight) return fail(404, "Not found");
  return ok(flight);
}
