import AuthControls from "@/components/AuthControls";
import TestEmailButton from "@/components/TestEmailButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          PrvníProjekt
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Prázdná webová aplikace připravená k vývoji.
        </p>
      </div>

      <AuthControls />

      <TestEmailButton />

      <ul className="flex flex-wrap items-center justify-center gap-3 text-sm">
        {["Next.js", "React", "Prisma", "Postgres (Neon)", "Vercel", "GitHub"].map(
          (tech) => (
            <li
              key={tech}
              className="rounded-full border border-black/10 px-4 py-1.5 font-mono dark:border-white/15"
            >
              {tech}
            </li>
          )
        )}
      </ul>

      <a
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        href="/api/health"
      >
        Zkontrolovat připojení k databázi →
      </a>
    </main>
  );
}
