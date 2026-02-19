import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { listResults } from "../../lib/api/results";
import { testStations } from "../../lib/testStations";
import { useActiveClub } from "../../lib/useActiveClub";

export const ResultsPage = () => {
  const [stationId, setStationId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const activeClub = useActiveClub();
  const clubId = activeClub.clubId;

  const fromIso = useMemo(() => {
    if (!fromDate) return "";
    return new Date(`${fromDate}T00:00:00`).toISOString();
  }, [fromDate]);

  const toIso = useMemo(() => {
    if (!toDate) return "";
    return new Date(`${toDate}T23:59:59`).toISOString();
  }, [toDate]);

  const resultsQuery = useQuery({
    enabled: !!clubId,
    queryKey: ["results", { clubId, stationId, fromIso, toIso }],
    queryFn: () =>
      listResults({
        clubId: clubId || "",
        stationId: stationId || undefined,
        fromIso: fromIso || undefined,
        toIso: toIso || undefined,
        limit: 250,
      }),
  });

  const resultsErrorMessage = resultsQuery.error
    ? resultsQuery.error instanceof Error
      ? resultsQuery.error.message
      : String(resultsQuery.error)
    : "";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">Results</div>
            <div className="mt-1 text-sm text-slate-400">
              Latest results for your club.
            </div>
            {clubId ? (
              <div className="mt-2 text-xs text-slate-500">
                Club ID: <span className="font-mono">{clubId}</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Station
              </div>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="">All</option>
                {testStations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                From
              </div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">To</div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2">
        {activeClub.isLoading || resultsQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-300">Loading…</div>
        ) : activeClub.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load club context.
            {activeClub.error ? (
              <div className="mt-2 text-xs text-rose-200">
                {activeClub.error}
              </div>
            ) : null}
          </div>
        ) : !clubId ? (
          <div className="p-6 text-sm text-rose-300">
            No club assigned to this account (missing club_staff row).
          </div>
        ) : resultsQuery.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load results.
            {resultsErrorMessage ? (
              <div className="mt-2 text-xs text-rose-200">
                {resultsErrorMessage}
              </div>
            ) : null}
          </div>
        ) : (resultsQuery.data || []).length === 0 ? (
          <div className="p-6 text-sm text-slate-300">No results found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tested</th>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {resultsQuery.data?.map((r) => (
                  <tr key={r.id} className="border-t border-slate-900">
                    <td className="px-4 py-3 text-slate-200">
                      {new Date(r.tested_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {r.user
                        ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim()
                        : r.user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.station_short_name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">
                      {Number(r.time_seconds).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
