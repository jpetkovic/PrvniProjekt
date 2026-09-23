import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import DownloadGroups, {
  type DownloadGroup,
} from "@/components/DownloadGroups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

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

  // Načti všechna stažení (nejnovější první) a seskup je podle IP v paměti,
  // ať můžeme každou skupinu rozbalit na jednotlivé záznamy.
  const rows = await prisma.sbbDownload.findMany({
    orderBy: { datum: "desc" },
  });

  const byIp = new Map<string, DownloadGroup>();
  for (const r of rows) {
    const key = r.ip ?? "unknown";
    let g = byIp.get(key);
    if (!g) {
      g = { ip: r.ip, count: 0, last: r.datum.toISOString(), items: [] };
      byIp.set(key, g);
    }
    g.count += 1;
    g.items.push({
      id: r.id,
      datum: r.datum.toISOString(),
      androidVersion: r.androidVersion,
      region: r.region,
    });
  }
  // rows už jsou seřazené sestupně, takže první výskyt IP = její poslední stažení.
  const groups = Array.from(byIp.values());
  const totalDownloads = rows.length;

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

      <DownloadGroups groups={groups} />
    </main>
  );
}
