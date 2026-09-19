export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="flex justify-end">
        <span
          aria-disabled="true"
          className="cursor-not-allowed rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background opacity-50"
        >
          Přejít do aplikace →
        </span>
      </div>
    </main>
  );
}
