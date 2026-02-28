import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteResult,
  deleteResultsByIds,
  insertResult,
  listResults,
  updateResult,
} from "../../lib/api/results";
import { listAthletes } from "../../lib/api/athletes";
import { testStations } from "../../lib/testStations";
import { useActiveClub } from "../../lib/useActiveClub";

const toDayKey = (iso: string) => {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const normalizeFoot = (foot: string | null | undefined) => {
  const f = String(foot || "").toLowerCase();
  if (f === "left" || f === "right") return f;
  return null;
};

export const ResultsPage = () => {
  const [stationId, setStationId] = useState("");
  const [athleteId, setAthleteId] = useState("");
  const [sortBy, setSortBy] = useState<
    "tested_desc" | "athlete_asc" | "station_asc"
  >("tested_desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const activeClub = useActiveClub();
  const clubId = activeClub.clubId;
  const qc = useQueryClient();

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
        limit: stationId === "5-0-5-test" ? 5000 : 250,
      }),
  });

  const athletesQuery = useQuery({
    enabled: !!clubId,
    queryKey: ["athletes", { clubId }],
    queryFn: () => listAthletes({ clubId: clubId || "", limit: 2000 }),
  });

  const updateMutation = useMutation({
    mutationFn: async (args: {
      resultId: string;
      timeSeconds?: number;
      foot?: "left" | "right" | null;
      testedAtIso?: string;
    }) => {
      if (!clubId) throw new Error("Missing club");
      await updateResult({
        clubId,
        resultId: args.resultId,
        timeSeconds: args.timeSeconds,
        foot: args.foot ?? undefined,
        testedAtIso: args.testedAtIso,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (args: { resultId: string }) => {
      if (!clubId) throw new Error("Missing club");
      await deleteResult({ clubId, resultId: args.resultId });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results"] });
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (args: {
      userId: string;
      testedAtIso: string;
      foot: "left" | "right";
      timeSeconds: number;
    }) => {
      if (!clubId) throw new Error("Missing club");
      const station = testStations.find((s) => s.id === "5-0-5-test");
      if (!station) throw new Error("Missing station metadata");
      await insertResult({
        clubId,
        userId: args.userId,
        stationId: "5-0-5-test",
        stationName: station.name,
        stationShortName: station.shortName,
        timeSeconds: args.timeSeconds,
        testedAtIso: args.testedAtIso,
        foot: args.foot,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results"] });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async (args: { resultIds: string[] }) => {
      if (!clubId) throw new Error("Missing club");
      await deleteResultsByIds({ clubId, resultIds: args.resultIds });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results"] });
    },
  });

  const resultsErrorMessage = resultsQuery.error
    ? resultsQuery.error instanceof Error
      ? resultsQuery.error.message
      : String(resultsQuery.error)
    : "";

  const mutationErrorMessage =
    (deleteMutation.error
      ? deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : String(deleteMutation.error)
      : "") ||
    (updateMutation.error
      ? updateMutation.error instanceof Error
        ? updateMutation.error.message
        : String(updateMutation.error)
      : "") ||
    (insertMutation.error
      ? insertMutation.error instanceof Error
        ? insertMutation.error.message
        : String(insertMutation.error)
      : "") ||
    (cleanupMutation.error
      ? cleanupMutation.error instanceof Error
        ? cleanupMutation.error.message
        : String(cleanupMutation.error)
      : "");

  const is505 = stationId === "5-0-5-test";
  const is505AthleteView = is505 && !!athleteId;

  const invalidFastIds = useMemo(() => {
    if (!is505) return [] as string[];
    return (resultsQuery.data || [])
      .filter((r) => Number(r.time_seconds) < 2)
      .map((r) => r.id);
  }, [is505, resultsQuery.data]);

  const paired505 = useMemo(() => {
    if (!is505)
      return [] as {
        user_id: string;
        name: string;
        dayKey: string;
        left?: { id: string; time_seconds: number; tested_at: string };
        right?: { id: string; time_seconds: number; tested_at: string };
      }[];

    const athletes = athletesQuery.data || [];
    const results = resultsQuery.data || [];

    type PairRow = {
      user_id: string;
      name: string;
      dayKey: string;
      left?: { id: string; time_seconds: number; tested_at: string };
      right?: { id: string; time_seconds: number; tested_at: string };
      latestIso: string;
    };

    const byUserDay = new Map<string, PairRow>();

    for (const r of results) {
      const dayKey = toDayKey(r.tested_at);
      if (!dayKey) continue;
      const foot = normalizeFoot(r.foot);
      if (!foot) continue;

      const key = `${r.user_id}:${dayKey}`;
      const name = r.user
        ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() ||
          r.user_id
        : r.user_id;

      const cur: PairRow = byUserDay.get(key) || {
        user_id: r.user_id,
        name,
        dayKey,
        latestIso: r.tested_at,
      };

      const attempt = {
        id: r.id,
        time_seconds: Number(r.time_seconds),
        tested_at: r.tested_at,
      };

      const next: PairRow = {
        ...cur,
        latestIso:
          new Date(r.tested_at).toISOString() >
          new Date(cur.latestIso).toISOString()
            ? r.tested_at
            : cur.latestIso,
      };

      if (foot === "left") {
        if (!cur.left || attempt.time_seconds < cur.left.time_seconds)
          next.left = attempt;
      } else {
        if (!cur.right || attempt.time_seconds < cur.right.time_seconds)
          next.right = attempt;
      }
      byUserDay.set(key, next);
    }

    const latestByUser = new Map<string, string>();
    for (const row of byUserDay.values()) {
      const prev = latestByUser.get(row.user_id);
      if (!prev || row.latestIso > prev)
        latestByUser.set(row.user_id, row.latestIso);
    }

    const rows = Array.from(byUserDay.values())
      .filter((r) => latestByUser.get(r.user_id) === r.latestIso)
      .map((r) => ({
        user_id: r.user_id,
        name: r.name,
        dayKey: r.dayKey,
        left: r.left,
        right: r.right,
      }));

    for (const a of athletes) {
      if (!a?.id) continue;
      if (rows.some((r) => r.user_id === a.id)) continue;
      const name = `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.id;
      rows.push({
        user_id: a.id,
        name,
        dayKey: "",
        left: undefined,
        right: undefined,
      });
    }

    const filtered = athleteId
      ? rows.filter((r) => r.user_id === athleteId)
      : rows;
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [athleteId, athletesQuery.data, is505, resultsQuery.data]);

  const filteredResults = useMemo(() => {
    const arr = resultsQuery.data || [];
    const onlyAthlete = athleteId
      ? arr.filter((r) => r.user_id === athleteId)
      : arr;

    const withNames = onlyAthlete.map((r) => {
      const name = r.user
        ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim()
        : "";
      return { r, name: name || r.user_id };
    });

    if (sortBy === "athlete_asc") {
      withNames.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "station_asc") {
      withNames.sort((a, b) =>
        String(a.r.station_short_name || a.r.station_id).localeCompare(
          String(b.r.station_short_name || b.r.station_id),
        ),
      );
    }
    return withNames.map((x) => x.r);
  }, [athleteId, resultsQuery.data, sortBy]);

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

            {mutationErrorMessage ? (
              <div className="mt-3 text-xs text-rose-300">
                {mutationErrorMessage}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
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
                Athlete
              </div>
              <select
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="">All</option>
                {(athletesQuery.data || [])
                  .map((a) => {
                    const name =
                      `${a.first_name || ""} ${a.last_name || ""}`.trim();
                    return {
                      id: a.id,
                      name: name || a.id,
                    };
                  })
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Sort
              </div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "tested_desc"
                      | "athlete_asc"
                      | "station_asc",
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="tested_desc">Tested (newest)</option>
                <option value="athlete_asc">Athlete (A–Z)</option>
                <option value="station_asc">Station (A–Z)</option>
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
        ) : is505AthleteView ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3">Foot</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredResults || []).map((r) => {
                  const foot = normalizeFoot(r.foot);
                  const athleteName = r.user
                    ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() ||
                      r.user_id
                    : r.user_id;
                  const day = toDayKey(r.tested_at);
                  return (
                    <tr key={r.id} className="border-t border-slate-900">
                      <td className="px-4 py-3 text-slate-200">
                        {athleteName}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{day || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          defaultValue={Number(r.time_seconds).toFixed(2)}
                          inputMode="decimal"
                          className="h-9 w-24 rounded-xl border border-slate-800 bg-slate-900 px-2 text-right text-sm text-white"
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isFinite(v) || v <= 0) return;
                            if (Math.abs(v - Number(r.time_seconds)) < 0.0001)
                              return;
                            updateMutation.mutate({
                              resultId: r.id,
                              timeSeconds: v,
                            });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {foot ? (
                          <div className="text-sm font-semibold text-slate-200">
                            {foot === "left" ? "Left" : "Right"}
                          </div>
                        ) : (
                          <select
                            value={""}
                            onChange={(e) => {
                              const v = e.target.value;
                              const next =
                                v === "left" || v === "right" ? v : null;
                              if (!next) return;
                              updateMutation.mutate({
                                resultId: r.id,
                                foot: next,
                              });
                            }}
                            className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
                          >
                            <option value="">Choose…</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            deleteMutation.mutate({ resultId: r.id })
                          }
                          className="inline-flex h-9 items-center rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-rose-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : is505 ? (
          <div className="p-4">
            {(resultsQuery.data || []).length === 0 ? (
              <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-sm text-slate-200">
                No 5-0-5 results found for these filters.
              </div>
            ) : null}

            {invalidFastIds.length > 0 ? (
              <div className="mb-3 rounded-xl border border-amber-900/40 bg-amber-950/30 p-3 text-sm text-amber-200">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    Found{" "}
                    <span className="font-semibold">
                      {invalidFastIds.length}
                    </span>{" "}
                    5-0-5 results faster than 2.00s.
                  </div>
                  <button
                    type="button"
                    disabled={cleanupMutation.isPending}
                    onClick={() =>
                      cleanupMutation.mutate({ resultIds: invalidFastIds })
                    }
                    className="inline-flex h-9 items-center rounded-xl border border-amber-900/50 bg-amber-900/20 px-3 text-xs font-semibold text-amber-100 disabled:opacity-50"
                  >
                    {cleanupMutation.isPending
                      ? "Deleting…"
                      : "Delete invalid results"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Athlete</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3 text-right">Left</th>
                    <th className="px-4 py-3 text-right">Right</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paired505.map((row) => {
                    const left = row.left;
                    const right = row.right;
                    const day =
                      row.dayKey ||
                      (left?.tested_at
                        ? toDayKey(left.tested_at)
                        : right?.tested_at
                          ? toDayKey(right.tested_at)
                          : "");
                    const leftInvalid =
                      typeof left?.time_seconds === "number" &&
                      left.time_seconds < 2;
                    const rightInvalid =
                      typeof right?.time_seconds === "number" &&
                      right.time_seconds < 2;

                    const promptAndInsert = (foot: "left" | "right") => {
                      const raw = window.prompt(
                        `Add ${foot.toUpperCase()} time (seconds)`,
                      );
                      const v = raw ? Number(raw) : NaN;
                      if (!Number.isFinite(v) || v <= 0) return;

                      const baseDayIso = day
                        ? new Date(`${day}T12:00:00`).toISOString()
                        : "";

                      const testedAtIso =
                        foot === "left"
                          ? left
                            ? new Date(
                                new Date(left.tested_at).getTime() - 10000,
                              ).toISOString()
                            : right
                              ? new Date(
                                  new Date(right.tested_at).getTime() - 5000,
                                ).toISOString()
                              : baseDayIso || new Date().toISOString()
                          : right
                            ? new Date(
                                new Date(right.tested_at).getTime() + 10000,
                              ).toISOString()
                            : left
                              ? new Date(
                                  new Date(left.tested_at).getTime() + 5000,
                                ).toISOString()
                              : baseDayIso
                                ? new Date(
                                    new Date(baseDayIso).getTime() + 10000,
                                  ).toISOString()
                                : new Date().toISOString();

                      insertMutation.mutate({
                        userId: row.user_id,
                        foot,
                        timeSeconds: v,
                        testedAtIso,
                      });
                    };

                    return (
                      <tr
                        key={row.user_id}
                        className="border-t border-slate-900"
                      >
                        <td className="px-4 py-3 text-slate-200">{row.name}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {day || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {left ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                defaultValue={Number(left.time_seconds).toFixed(
                                  2,
                                )}
                                inputMode="decimal"
                                className={`h-9 w-20 rounded-xl border px-2 text-right text-sm text-white ${
                                  leftInvalid
                                    ? "border-amber-900/60 bg-amber-950/30"
                                    : "border-slate-800 bg-slate-900"
                                }`}
                                onBlur={(e) => {
                                  const v = Number(e.target.value);
                                  if (!Number.isFinite(v) || v <= 0) return;
                                  if (Math.abs(v - left.time_seconds) < 0.0001)
                                    return;
                                  updateMutation.mutate({
                                    resultId: left.id,
                                    timeSeconds: v,
                                  });
                                }}
                              />
                              <button
                                type="button"
                                disabled={insertMutation.isPending}
                                onClick={() => promptAndInsert("left")}
                                className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() =>
                                  deleteMutation.mutate({ resultId: left.id })
                                }
                                className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-rose-200 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={insertMutation.isPending}
                              onClick={() => {
                                const raw = window.prompt(
                                  "Add LEFT time (seconds)",
                                );
                                const v = raw ? Number(raw) : NaN;
                                if (!Number.isFinite(v) || v <= 0) return;
                                const testedAtIso = right
                                  ? new Date(
                                      new Date(right.tested_at).getTime() -
                                        5000,
                                    ).toISOString()
                                  : row.dayKey
                                    ? new Date(
                                        `${row.dayKey}T12:00:00`,
                                      ).toISOString()
                                    : new Date().toISOString();
                                insertMutation.mutate({
                                  userId: row.user_id,
                                  foot: "left",
                                  timeSeconds: v,
                                  testedAtIso,
                                });
                              }}
                              className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                            >
                              + Add left
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {right ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                defaultValue={Number(
                                  right.time_seconds,
                                ).toFixed(2)}
                                inputMode="decimal"
                                className={`h-9 w-20 rounded-xl border px-2 text-right text-sm text-white ${
                                  rightInvalid
                                    ? "border-amber-900/60 bg-amber-950/30"
                                    : "border-slate-800 bg-slate-900"
                                }`}
                                onBlur={(e) => {
                                  const v = Number(e.target.value);
                                  if (!Number.isFinite(v) || v <= 0) return;
                                  if (Math.abs(v - right.time_seconds) < 0.0001)
                                    return;
                                  updateMutation.mutate({
                                    resultId: right.id,
                                    timeSeconds: v,
                                  });
                                }}
                              />
                              <button
                                type="button"
                                disabled={insertMutation.isPending}
                                onClick={() => promptAndInsert("right")}
                                className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() =>
                                  deleteMutation.mutate({ resultId: right.id })
                                }
                                className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-rose-200 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={insertMutation.isPending}
                              onClick={() => {
                                const raw = window.prompt(
                                  "Add RIGHT time (seconds)",
                                );
                                const v = raw ? Number(raw) : NaN;
                                if (!Number.isFinite(v) || v <= 0) return;
                                const testedAtIso = left
                                  ? new Date(
                                      new Date(left.tested_at).getTime() + 5000,
                                    ).toISOString()
                                  : row.dayKey
                                    ? new Date(
                                        `${row.dayKey}T12:00:05`,
                                      ).toISOString()
                                    : new Date().toISOString();
                                insertMutation.mutate({
                                  userId: row.user_id,
                                  foot: "right",
                                  timeSeconds: v,
                                  testedAtIso,
                                });
                              }}
                              className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                            >
                              + Add right
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={insertMutation.isPending}
                              onClick={() => promptAndInsert("left")}
                              className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                            >
                              Add left
                            </button>
                            <button
                              type="button"
                              disabled={insertMutation.isPending}
                              onClick={() => promptAndInsert("right")}
                              className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                            >
                              Add right
                            </button>
                            <div className="text-xs text-slate-400">
                              {updateMutation.isPending ||
                              deleteMutation.isPending ||
                              insertMutation.isPending
                                ? "Saving…"
                                : ""}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (filteredResults || []).length === 0 ? (
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
                  <th className="px-4 py-3">Foot</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r) => (
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
                    <td className="px-4 py-3 text-slate-300">
                      {r.station_id === "5-0-5-test" ? (
                        <select
                          value={normalizeFoot(r.foot) || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            const next =
                              v === "left" || v === "right" ? v : null;
                            updateMutation.mutate({
                              resultId: r.id,
                              foot: next,
                            });
                          }}
                          className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
                        >
                          <option value="">—</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          deleteMutation.mutate({ resultId: r.id })
                        }
                        className="inline-flex h-9 items-center rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-rose-200 disabled:opacity-50"
                      >
                        Delete
                      </button>
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
