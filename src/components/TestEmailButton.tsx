"use client";

import { useState } from "react";

export default function TestEmailButton() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function sendTest() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      setResult(
        res.ok
          ? { ok: true, text: data.message ?? "Odesláno." }
          : { ok: false, text: data.error ?? "Odeslání selhalo." }
      );
    } catch {
      setResult({ ok: false, text: "Nelze se spojit se serverem." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="adresa pro testovací mail"
          className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        <button
          onClick={sendTest}
          disabled={sending || !to}
          className="whitespace-nowrap rounded-full border border-black/10 px-4 py-2 text-sm transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
        >
          {sending ? "Odesílám…" : "Poslat testovací mail"}
        </button>
      </div>
      {result && (
        <p
          className={`text-sm ${
            result.ok
              ? "text-green-700 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
