import { alignCard } from "@/lib/sequence-card";
import { readSequencePdf } from "@/lib/sequence-pdf";
import { fail } from "@/lib/respond";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5_000_000;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const kField = String(form.get("k") ?? "");
  const kValues = kField
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a sequence-card PDF.");
  if (file.size > MAX_BYTES) return fail(400, "That PDF is larger than 5 MB.");
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return fail(400, "Upload a PDF sequence card.");
  }
  if (kValues.length < 2) return fail(400, "This flight has no K list to match.");
  try {
    const card = await readSequencePdf(new Uint8Array(await file.arrayBuffer()));
    if (!card) {
      return fail(422, "Could not read figure Ks from this PDF. Names were not applied.");
    }
    const aligned = alignCard(kValues, card);
    if ("error" in aligned) return fail(422, aligned.error);
    return NextResponse.json(
      { source: "Uploaded sequence card", captions: aligned.captions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(error);
    return fail(422, "Could not read that PDF. Names were not applied.");
  }
}
