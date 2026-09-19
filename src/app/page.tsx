import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientIp, BUILD_UPLOAD_IP } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("cs-CZ", { dateStyle: "long" });

export default async function Home() {
  const latest = await prisma.sbbApp.findFirst({ orderBy: { datum: "desc" } });
  const canUpload = (await getClientIp()) === BUILD_UPLOAD_IP;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden p-8">
      {/* jemný dekorativní gradient v pozadí */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/10 to-transparent blur-3xl"
      />

      <header className="z-10 text-center">
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
            <a
              href={latest.apkUrl}
              className="rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background shadow-lg shadow-black/10 transition-transform hover:scale-[1.03]"
            >
              ⬇ Stáhnout pro Android
            </a>
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
        <div className="z-10">
          <Link
            href="/builds"
            className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            + Přidat APK
          </Link>
        </div>
      )}
    </main>
  );
}
