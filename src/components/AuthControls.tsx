"use client";

import { useEffect, useRef, useState } from "react";

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
  }, []);

  function openDialog(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setPassword("");
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

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
        setNotice(
          data.message ??
            "Účet byl vytvořen. Potvrď e-mail z odkazu ve schránce."
        );
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
