import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("cs-CZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function UsersPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Přístup zamítnut</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Tato stránka je dostupná jen přihlášeným administrátorům.
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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uživatelé</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Celkem {users.length}{" "}
            {users.length === 1 ? "účet" : users.length < 5 ? "účty" : "účtů"}.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          ← Úvod
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[.03] text-xs uppercase tracking-wide text-gray-500 dark:border-white/15 dark:bg-white/[.04] dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Jméno</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Ověřen</th>
              <th className="px-4 py-3 font-medium">Registrace</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-black/5 last:border-0 dark:border-white/10"
              >
                <td className="px-4 py-3">{u.name ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background"
                        : "rounded-full border border-black/15 px-2 py-0.5 text-xs dark:border-white/20"
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.emailVerified ? (
                    <span className="text-green-700 dark:text-green-400">
                      ✓ {dateFmt.format(u.emailVerified)}
                    </span>
                  ) : (
                    <span className="text-gray-400">ne</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {dateFmt.format(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
