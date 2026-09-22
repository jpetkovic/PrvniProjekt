import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import DownloadButton from "@/components/DownloadButton";
import AuthControls from "@/components/AuthControls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("cs-CZ", { dateStyle: "long" });

export default async function Home() {
  const latest = await prisma.sbbApp.findFirst({
    orderBy: [{ datum: "desc" }, { id: "desc" }],
  });
  const user = await getCurrentUser();
  const canUpload = user?.role === "ADMIN";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden p-8">
      {/* jemný dekorativní gradient v pozadí */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/10 to-transparent blur-3xl"
      />

      {/* Přihlášení vpravo nahoře */}
      <div className="absolute right-6 top-6 z-20">
        <AuthControls />
      </div>

      <header className="z-10 flex flex-col items-center text-center">
        <Image
          src="/sbb-logo.png"
          alt="SBB Counter logo"
          width={180}
          height={180}
          priority
          className="mb-6 h-40 w-40 sm:h-44 sm:w-44"
        />
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl">
          SBB Counter
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Simple body building counter
        </p>
      </header>

      <section className="z-10 flex flex-col items-center gap-3">
        {latest?.apkUrl ? (
          <>
            <DownloadButton
              url="/api/apps/latest/download"
              filename={`SBB-Counter-${latest.build}.apk`}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Build <span className="font-mono font-medium">{latest.build}</span>
              {" · aktualizováno "}
              {dateFmt.format(new Date(latest.datum))}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Aplikace zatím není ke stažení.
          </p>
        )}
      </section>

      {canUpload && (
        <div className="z-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/builds"
            className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            + Přidat APK
          </Link>
          <Link
            href="/downloads"
            className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Downloads
          </Link>
        </div>
      )}
    </main>
  );
}
