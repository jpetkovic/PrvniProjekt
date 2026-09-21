import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip")?.trim() ?? null;
}

/** Region z Vercel geo hlaviček (země / region / město), co je k dispozici. */
function region(h: Headers): string | null {
  const parts = [
    h.get("x-vercel-ip-city"),
    h.get("x-vercel-ip-country-region"),
    h.get("x-vercel-ip-country"),
  ]
    .map((v) => (v ? decodeURIComponent(v) : null))
    .filter(Boolean);
  return parts.length ? Array.from(new Set(parts)).join(", ") : null;
}

/** Verze Androidu z User-Agent, např. "Android 14". */
function androidVersion(h: Headers): string | null {
  const ua = h.get("user-agent") ?? "";
  const m = ua.match(/Android\s+([\d.]+)/i);
  return m ? m[1] : null;
}

/**
 * Public: stable URL that always redirects to the latest APK in Blob storage.
 * Each hit is logged (IP, date, region, Android version) for admin stats.
 */
export async function GET() {
  const h = await headers();

  const latest = await prisma.sbbApp.findFirst({
    where: { apkUrl: { not: null } },
    orderBy: [{ datum: "desc" }, { id: "desc" }],
    select: { apkUrl: true },
  });

  if (!latest?.apkUrl) {
    return NextResponse.json(
      { error: "Žádná verze není k dispozici" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Zaznamenej stažení (chyba zápisu nesmí zablokovat stahování).
  try {
    await prisma.sbbDownload.create({
      data: {
        ip: clientIp(h),
        region: region(h),
        androidVersion: androidVersion(h),
      },
    });
  } catch {
    /* ignore logging errors */
  }

  const res = NextResponse.redirect(latest.apkUrl, 307);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
