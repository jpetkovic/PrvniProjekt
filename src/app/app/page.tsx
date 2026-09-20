import Link from "next/link";

// Stránka /app je dočasně znepřístupněná. Původní obsah je v historii gitu
// (commit před tímto) — pro obnovení vrať původní verzi tohoto souboru.
export default function AppPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Stránka je dočasně nedostupná</h1>
      <p className="text-gray-500 dark:text-gray-400">
        Tato část aplikace je momentálně vypnutá.
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
