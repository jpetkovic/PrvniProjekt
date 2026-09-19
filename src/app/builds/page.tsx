import Link from "next/link";
import { getCurrentAdmin } from "@/lib/session";
import BuildsManager from "@/components/BuildsManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BuildsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Přístup zamítnut</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Správa buildů je dostupná jen administrátorům.
        </p>
        <Link
          href="/app"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          ← Zpět do aplikace
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Buildy aplikace</h1>
        <Link
          href="/app"
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          ← Aplikace
        </Link>
      </div>
      <BuildsManager />
    </main>
  );
}
