import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: latest published build. The Android app calls this, compares its own
 * versionCode with `versionCode`, and if the server's is higher, downloads
 * `apkUrl` (or hits /api/apps/latest/download). CORS-open so any client works.
 */
export async function GET() {
  const latest = await prisma.sbbApp.findFirst({
    where: { apkUrl: { not: null } },
    orderBy: [{ versionCode: "desc" }, { datum: "desc" }],
    select: {
      build: true,
      versionCode: true,
      datum: true,
      popisZmen: true,
      apkUrl: true,
    },
  });

  if (!latest) {
    return NextResponse.json(
      { error: "Žádná verze není k dispozici" },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  return NextResponse.json(
    {
      build: latest.build,
      versionCode: latest.versionCode,
      datum: latest.datum,
      popisZmen: latest.popisZmen,
      apkUrl: latest.apkUrl,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
