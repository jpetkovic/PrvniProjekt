"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { extractApkVersion } from "@/lib/apk";

type App = {
  id: number;
  build: string;
  datum: string;
  popisZmen: string | null;
  apkUrl: string | null;
};

const dateFmt = new Intl.DateTimeFormat("cs-CZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function BuildsManager() {
  const [apps, setApps] = useState<App[]>([]);
  const [build, setBuild] = useState("");
  const [versionCode, setVersionCode] = useState<number | null>(null);
  const [popisZmen, setPopisZmen] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(f: File | null) {
    setFile(f);
    if (!f) return;
    // Try to read versionName from the APK and prefill the build field.
    setDetecting(true);
    try {
      const { versionName, versionCode } = await extractApkVersion(f);
      const detected = versionName ?? (versionCode ? String(versionCode) : null);
      if (detected) setBuild(detected);
      setVersionCode(versionCode);
    } catch {
      /* ignore — user can fill it manually */
    } finally {
      setDetecting(false);
    }
  }

  async function load() {
    try {
      const res = await fetch("/api/apps");
      const data = await res.json();
      setApps(data.apps ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      let apkUrl: string | null = null;

      // 1) Upload the APK straight to Vercel Blob (into the "Soubory" folder),
      //    naming the file after the build version.
      if (file) {
        const safeBuild = (build || "app").trim().replace(/[^\w.\-]+/g, "_");
        const blob = await upload(`Soubory/SBB-${safeBuild}.apk`, file, {
          access: "public",
          handleUploadUrl: "/api/apps/upload",
        });
        apkUrl = blob.url;
      }

      // 2) Create the build record.
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build, versionCode, popisZmen, apkUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Uložení se nezdařilo");
        return;
      }

      setBuild("");
      setVersionCode(null);
      setPopisZmen("");
      setFile(null);
      setFileKey((k) => k + 1); // remount the file input to clear it
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Něco se pokazilo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/15"
      >
        <h2 className="text-lg font-semibold">Přidat build</h2>

        <label className="flex flex-col gap-1 text-sm">
          Build
          <input
            type="text"
            required
            value={build}
            onChange={(e) => setBuild(e.target.value)}
            placeholder="např. 1.0.3"
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-foreground dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Popis změn
          <textarea
            value={popisZmen}
            onChange={(e) => setPopisZmen(e.target.value)}
            rows={3}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-foreground dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          APK soubor
          <input
            id="apk-input"
            key={fileKey}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>
        {detecting && (
          <p className="text-xs text-gray-400">Zjišťuji verzi z APK…</p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Ukládám…" : "Uložit build"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[.03] text-xs uppercase tracking-wide text-gray-500 dark:border-white/15 dark:bg-white/[.04] dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Build</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Popis změn</th>
              <th className="px-4 py-3 font-medium">APK</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Zatím žádné buildy.
                </td>
              </tr>
            )}
            {apps.map((a) => (
              <tr
                key={a.id}
                className="border-b border-black/5 last:border-0 dark:border-white/10"
              >
                <td className="px-4 py-3 font-medium">{a.build}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {dateFmt.format(new Date(a.datum))}
                </td>
                <td className="px-4 py-3 whitespace-pre-wrap">
                  {a.popisZmen ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {a.apkUrl ? (
                    <a
                      href={a.apkUrl}
                      className="text-blue-600 underline dark:text-blue-400"
                    >
                      Stáhnout
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
