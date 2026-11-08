import { NextResponse } from "next/server";

export function ok(data: unknown) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=600" },
  });
}

export function fail(status: number, error: string) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
