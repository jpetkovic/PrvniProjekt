import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: stable URL that always redirects to the latest APK in Blob storage.
 * The Android app (or a browser) can just GET this to download the newest build.
 */
export async function GET() {
  const latest = await prisma.sbbApp.findFirst({
    where: { apkUrl: { not: null } },
    orderBy: [{ datum: "desc" }, { id: "desc" }],
    select: { apkUrl: true },
  });

  if (!latest?.apkUrl) {
    return NextResponse.json(
      { error: "Žádná verze není k dispozici" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(latest.apkUrl, 307);
}
