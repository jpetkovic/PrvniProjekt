import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/**
 * Public: latest published build (the most recently uploaded one, by date).
 * The Android app calls this, compares its own versionCode with `versionCode`,
 * and if the server's is higher, downloads `apkUrl`. CORS-open, never cached.
 */
export async function GET() {
  const latest = await prisma.sbbApp.findFirst({
    where: { apkUrl: { not: null } },
    orderBy: [{ datum: "desc" }, { id: "desc" }],
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
      { status: 404, headers: NO_CACHE }
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
    { headers: NO_CACHE }
  );
}
