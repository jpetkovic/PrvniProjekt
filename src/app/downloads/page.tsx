import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium" });

export default async function DownloadsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Přístup zamítnut</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Přehled stažení je dostupný jen administrátorům.
        </p>
        <Link
          href="/"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          ← Zpět na úvod
        </Link>
      </main>
    );
  }

  const groups = await prisma.sbbDownload.groupBy({
    by: ["ip"],
    _count: { _all: true },
    _max: { datum: true },
    orderBy: { _max: { datum: "desc" } },
  });

  const totalDownloads = groups.reduce((sum, g) => sum + g._count._all, 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stažení</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {groups.length} IP adres · celkem {totalDownloads} stažení.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          ← Úvod
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[.03] text-xs uppercase tracking-wide text-gray-500 dark:border-white/15 dark:bg-white/[.04] dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">IP adresa</th>
              <th className="px-4 py-3 font-medium">Poslední stažení</th>
              <th className="px-4 py-3 font-medium text-right">Počet stažení</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Zatím žádná stažení.
                </td>
              </tr>
            )}
            {groups.map((g) => (
              <tr
                key={g.ip ?? "unknown"}
                className="border-b border-black/5 last:border-0 dark:border-white/10"
              >
                <td className="px-4 py-3 font-mono text-xs">{g.ip ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {g._max.datum ? dateFmt.format(new Date(g._max.datum)) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {g._count._all}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
