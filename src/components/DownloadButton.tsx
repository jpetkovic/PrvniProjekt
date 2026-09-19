"use client";

import { useState } from "react";

type Props = {
  url: string;
  filename: string;
};

export default function DownloadButton({ url, filename }: Props) {
  const [progress, setProgress] = useState<number | null>(null); // 0–100, or null
  const [indeterminate, setIndeterminate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloading = progress !== null;

  async function handleDownload() {
    setError(null);
    setProgress(0);
    setIndeterminate(false);

    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error("Stahování se nezdařilo");

      const total = Number(res.headers.get("Content-Length")) || 0;
      if (!total) setIndeterminate(true);

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) setProgress(Math.round((received / total) * 100));
      }

      // Sestav soubor a spusť uložení.
      const blob = new Blob(chunks as BlobPart[], {
        type: "application/vnd.android.package-archive",
      });
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      setError("Stahování se nezdařilo, zkus to prosím znovu.");
    } finally {
      setProgress(null);
      setIndeterminate(false);
    }
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background shadow-lg shadow-black/10 transition-transform hover:scale-[1.03] disabled:opacity-70 disabled:hover:scale-100"
      >
        {downloading
          ? indeterminate
            ? "Stahuji…"
            : `Stahuji… ${progress}%`
          : "⬇ Stáhnout pro Android"}
      </button>

      {downloading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className={
              indeterminate
                ? "h-full w-1/3 animate-pulse rounded-full bg-foreground"
                : "h-full rounded-full bg-foreground transition-[width] duration-150"
            }
            style={indeterminate ? undefined : { width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
