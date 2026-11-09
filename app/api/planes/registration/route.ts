import { findRegistrationPhoto } from "@/lib/registration-photo";
import { fail, ok } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reg = new URL(request.url).searchParams.get("reg") ?? "";
  if (!/^[A-Za-z0-9-]{3,10}$/.test(reg)) return fail(400, "Invalid registration");
  try {
    const photo = await findRegistrationPhoto(reg);
    return ok({ photo });
  } catch (error) {
    console.error(error);
    return fail(502, "Photo lookup failed");
  }
}
