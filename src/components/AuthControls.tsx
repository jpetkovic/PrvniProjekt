"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type User = { id: string; email: string; name: string | null; role: string };
type Mode = "login" | "register";

export default function AuthControls() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));

    // Show a banner after returning from the e-mail verification link.
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (verified === "success") {
      setBanner("E-mail byl potvrzen — teď se můžeš přihlásit.");
    } else if (verified === "invalid") {
      setBanner("Potvrzovací odkaz je neplatný nebo vypršel.");
    } else if (verified === "error") {
      setBanner("Potvrzení e-mailu se nezdařilo, zkus to prosím znovu.");
    }
    if (verified) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    const google = params.get("google");
    if (google === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh user after Google login redirect
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => setUser(d.user))
        .catch(() => {});
    }
  }, []);

  function openDialog(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setVerifyUrl(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setPassword("");
    setError(null);
    setNotice(null);
    setVerifyUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    setVerifyUrl(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login" ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          [data.error, data.detail].filter(Boolean).join(": ") ||
            "Něco se pokazilo"
        );
        return;
      }

      if (mode === "register") {
        // No auto-login — the user must confirm their e-mail first.
        const base =
          data.message ?? "Účet byl vytvořen. Potvrď účet z ověřovacího odkazu.";
        setNotice(data.detail ? `${base} (${data.detail})` : base);
        setVerifyUrl(data.verifyUrl ?? null);
        setMode("login");
        setPassword("");
        return;
      }

      setUser(data.user);
      closeDialog();
      setEmail("");
      setName("");
    } catch {
      setError("Nelze se spojit se serverem");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (!loaded) {
    return <div className="h-9" />;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {banner && (
        <p className="rounded-lg border border-black/10 bg-black/5 px-4 py-2 text-sm dark:border-white/15 dark:bg-white/10">
          {banner}
        </p>
      )}

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Přihlášen jako <strong>{user.name ?? user.email}</strong>
            </span>
            {user.role === "ADMIN" && (
              <Link
                href="/uzivatele"
                className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Uživatelé
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Odhlásit se
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => openDialog("login")}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Přihlásit se
            </button>
            <button
              onClick={() => openDialog("register")}
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Registrovat
            </button>
          </>
        )}
      </div>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="m-auto w-[90vw] max-w-sm rounded-2xl bg-background p-0 text-foreground backdrop:bg-black/50"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <h2 className="text-xl font-semibold">
            {mode === "login" ? "Přihlášení" : "Registrace"}
          </h2>

          {mode === "register" && (
            <label className="flex flex-col gap-1 text-sm">
              Jméno (nepovinné)
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-foreground dark:border-white/20"
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-foreground dark:border-white/20"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Heslo
            <input
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-foreground dark:border-white/20"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {notice && (
            <p className="text-sm text-green-700 dark:text-green-400">{notice}</p>
          )}
          {verifyUrl && (
            <a
              href={verifyUrl}
              className="break-all text-sm text-blue-600 underline dark:text-blue-400"
            >
              Potvrdit účet (dev odkaz)
            </a>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Odesílám…"
              : mode === "login"
                ? "Přihlásit se"
                : "Vytvořit účet"}
          </button>

          <div className="relative flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/15" />
            <span className="text-xs text-gray-400">nebo</span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/15" />
          </div>

          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {mode === "register"
              ? "Registrovat přes Google"
              : "Pokračovat přes Google"}
          </a>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-gray-500 underline-offset-2 hover:underline"
            >
              {mode === "login"
                ? "Nemáš účet? Registruj se"
                : "Už máš účet? Přihlas se"}
            </button>
            <button
              type="button"
              onClick={closeDialog}
              className="text-gray-500 underline-offset-2 hover:underline"
            >
              Zavřít
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
