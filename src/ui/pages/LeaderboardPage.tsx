import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  listLeaderboardSamples,
  type LeaderboardSample,
} from "../../lib/api/leaderboard";
import { testStations } from "../../lib/testStations";
import { useActiveClub } from "../../lib/useActiveClub";

type SexFilter = "all" | "M" | "F";

const toAgeYears = (dobIso: string, atIso: string) => {
  const dob = new Date(dobIso);
  const at = new Date(atIso);
  if (!Number.isFinite(dob.getTime()) || !Number.isFinite(at.getTime()))
    return null;
  const ms = at.getTime() - dob.getTime();
  if (ms < 0) return null;
  return ms / (365.25 * 24 * 60 * 60 * 1000);
};

type LeaderboardRow = {
  station_id: string;
  station_short_name: string;
  rank: number;
  time_seconds: number;
  tested_at: string;
  user_id: string;
  athlete_name: string;
  sex: string | null;
  age_at_test: number | null;
};

type LeaderboardStation = {
  station_id: string;
  station_short_name: string;
  rows: LeaderboardRow[];
};

export const LeaderboardPage = () => {
  const [stationId, setStationId] = useState<string>("");
  const [sex, setSex] = useState<SexFilter>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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

  const samplesQuery = useQuery({
    enabled: !!clubId,
    queryKey: ["leaderboard", { clubId, stationId, fromIso, toIso }],
    queryFn: () =>
      listLeaderboardSamples({
        clubId: clubId || "",
        stationId: stationId || undefined,
        fromIso: fromIso || undefined,
        toIso: toIso || undefined,
        limit: 5000,
      }),
  });

  const board = useMemo((): LeaderboardStation[] => {
    const minA = minAge ? Number(minAge) : null;
    const maxA = maxAge ? Number(maxAge) : null;

    const filtered = (samplesQuery.data || []).filter((s) => {
      if (sex !== "all" && (s.user.sex || "").toUpperCase() !== sex)
        return false;
      if (minA === null && maxA === null) return true;
      if (!s.user.dob) return false;
      const a = toAgeYears(s.user.dob, s.tested_at);
      if (a === null) return false;
      if (minA !== null && a < minA) return false;
      if (maxA !== null && a > maxA) return false;
      return true;
    });

    const bestByUserStation = new Map<string, LeaderboardSample>();

    for (const s of filtered) {
      const key = `${s.station_id}:${s.user.id}`;
      const prev = bestByUserStation.get(key);
      if (!prev) {
        bestByUserStation.set(key, s);
        continue;
      }
      if (s.time_seconds < prev.time_seconds) {
        bestByUserStation.set(key, s);
        continue;
      }
      if (s.time_seconds === prev.time_seconds) {
        if (
          new Date(s.tested_at).getTime() < new Date(prev.tested_at).getTime()
        ) {
          bestByUserStation.set(key, s);
        }
      }
    }

    const byStation = new Map<string, LeaderboardSample[]>();
    for (const s of bestByUserStation.values()) {
      const arr = byStation.get(s.station_id) || [];
      arr.push(s);
      byStation.set(s.station_id, arr);
    }

    const stationIds = stationId ? [stationId] : testStations.map((s) => s.id);

    return stationIds
      .map((sid) => {
        const samples = (byStation.get(sid) || []).slice();
        samples.sort((a, b) => a.time_seconds - b.time_seconds);
        const top = samples.slice(0, 3);

        const rows: LeaderboardRow[] = top.map((s, idx) => {
          const athleteName =
            `${s.user.first_name || ""} ${s.user.last_name || ""}`.trim();
          const age = s.user.dob ? toAgeYears(s.user.dob, s.tested_at) : null;
          return {
            station_id: s.station_id,
            station_short_name: s.station_short_name,
            rank: idx + 1,
            time_seconds: s.time_seconds,
            tested_at: s.tested_at,
            user_id: s.user.id,
            athlete_name: athleteName || s.user.id,
            sex: s.user.sex,
            age_at_test: age,
          };
        });

        const stationMeta = testStations.find((x) => x.id === sid);
        return {
          station_id: sid,
          station_short_name: stationMeta?.shortName || sid,
          rows,
        } satisfies LeaderboardStation;
      })
      .filter((s) => s.rows.length > 0);
  }, [maxAge, minAge, samplesQuery.data, sex, stationId]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Leaderboard
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Top 3 best results per station (best time per athlete).
            </div>
            {clubId ? (
              <div className="mt-2 text-xs text-slate-500">
                Club ID: <span className="font-mono">{clubId}</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
            <label className="block md:col-span-2">
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
              <div className="mb-1 text-xs font-medium text-slate-300">Sex</div>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as SexFilter)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="all">All</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Min age
              </div>
              <input
                inputMode="decimal"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="e.g. 12"
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Max age
              </div>
              <input
                inputMode="decimal"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                placeholder="e.g. 16"
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
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
        {activeClub.isLoading || samplesQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-300">Loading…</div>
        ) : activeClub.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load club context.
          </div>
        ) : !clubId ? (
          <div className="p-6 text-sm text-rose-300">
            No club assigned to this account (missing club_staff row).
          </div>
        ) : samplesQuery.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load leaderboard.
          </div>
        ) : board.length === 0 ? (
          <div className="p-6 text-sm text-slate-300">
            No leaderboard entries match these filters.
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {board.map((s) => (
              <div
                key={s.station_id}
                className="rounded-2xl border border-slate-800 bg-slate-950"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm font-semibold text-slate-100">
                    {s.station_short_name}
                  </div>
                  <div className="text-xs text-slate-500">Top 3</div>
                </div>
                <div className="overflow-auto">
                  <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                    <thead className="text-xs text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Athlete</th>
                        <th className="px-4 py-3">Sex</th>
                        <th className="px-4 py-3">Age</th>
                        <th className="px-4 py-3">Best time</th>
                        <th className="px-4 py-3">Tested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows.map((r) => (
                        <tr
                          key={`${s.station_id}:${r.user_id}`}
                          className="border-t border-slate-900"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            #{r.rank}
                          </td>
                          <td className="px-4 py-3 text-slate-200">
                            {r.athlete_name}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {r.sex || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {r.age_at_test !== null
                              ? r.age_at_test.toFixed(1)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-300">
                            {Number(r.time_seconds).toFixed(2)}s
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {new Date(r.tested_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
