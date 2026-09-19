import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageBuilds } from "@/lib/session";

export const runtime = "nodejs";

/** List all builds (newest first). */
export async function GET() {
  const apps = await prisma.sbbApp.findMany({
    orderBy: { datum: "desc" },
  });
  return NextResponse.json({ apps });
}

/** Create a build record — ADMIN or allowed IP only. */
export async function POST(request: Request) {
  if (!(await canManageBuilds())) {
    return NextResponse.json({ error: "Přístup zamítnut" }, { status: 403 });
  }

  let body: {
    build?: string;
    versionCode?: number;
    popisZmen?: string;
    apkUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
  }

  const build = body.build?.trim();
  if (!build) {
    return NextResponse.json({ error: "Vyplň build" }, { status: 400 });
  }

  const app = await prisma.sbbApp.create({
    data: {
      build,
      versionCode:
        typeof body.versionCode === "number" ? body.versionCode : null,
      popisZmen: body.popisZmen?.trim() || null,
      apkUrl: body.apkUrl?.trim() || null,
    },
  });

  return NextResponse.json({ app }, { status: 201 });
}
