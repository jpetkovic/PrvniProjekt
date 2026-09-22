"use client";

import { Fragment, useState } from "react";

export type DownloadItem = {
  id: number;
  datum: string; // ISO
  androidVersion: string | null;
  region: string | null;
};

export type DownloadGroup = {
  ip: string | null;
  count: number;
  last: string; // ISO
  items: DownloadItem[];
};

const dayFmt = new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("cs-CZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function DownloadGroups({ groups }: { groups: DownloadGroup[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setOpen((o) => ({ ...o, [key]: !o[key] }));
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 p-6 text-center text-gray-400 dark:border-white/15">
        Zatím žádná stažení.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-black/10 bg-black/[.03] text-xs uppercase tracking-wide text-gray-500 dark:border-white/15 dark:bg-white/[.04] dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 font-medium">IP adresa</th>
            <th className="px-4 py-3 font-medium">Poslední stažení</th>
            <th className="px-4 py-3 font-medium text-right">Počet stažení</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const key = g.ip ?? "unknown";
            const isOpen = !!open[key];
            return (
              <Fragment key={key}>
                <tr
                  onClick={() => toggle(key)}
                  className="cursor-pointer border-b border-black/5 transition-colors hover:bg-black/[.03] last:border-0 dark:border-white/10 dark:hover:bg-white/[.04]"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="mr-2 inline-block w-3 text-gray-400">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    {g.ip ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {dayFmt.format(new Date(g.last))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{g.count}</td>
                </tr>
                {isOpen && (
                  <tr className="bg-black/[.02] dark:bg-white/[.03]">
                    <td colSpan={3} className="px-4 py-3">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] uppercase tracking-wide text-gray-400">
                          <tr>
                            <th className="py-1 pr-4 font-medium">Datum a čas</th>
                            <th className="py-1 pr-4 font-medium">Android</th>
                            <th className="py-1 font-medium">Region</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.items.map((d) => (
                            <tr key={d.id}>
                              <td className="py-1 pr-4 text-gray-600 dark:text-gray-300">
                                {dateTimeFmt.format(new Date(d.datum))}
                              </td>
                              <td className="py-1 pr-4">
                                {d.androidVersion ?? "—"}
                              </td>
                              <td className="py-1 text-gray-500 dark:text-gray-400">
                                {d.region ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
