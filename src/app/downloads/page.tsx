import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("cs-CZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

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

  const downloads = await prisma.sbbDownload.findMany({
    orderBy: { datum: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stažení</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Celkem {downloads.length} stažení.
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
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[.03] text-xs uppercase tracking-wide text-gray-500 dark:border-white/15 dark:bg-white/[.04] dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">IP adresa</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Android</th>
              <th className="px-4 py-3 font-medium">Region</th>
            </tr>
          </thead>
          <tbody>
            {downloads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Zatím žádná stažení.
                </td>
              </tr>
            )}
            {downloads.map((d) => (
              <tr
                key={d.id}
                className="border-b border-black/5 last:border-0 dark:border-white/10"
              >
                <td className="px-4 py-3 font-mono text-xs">{d.ip ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {dateFmt.format(new Date(d.datum))}
                </td>
                <td className="px-4 py-3">{d.androidVersion ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {d.region ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
