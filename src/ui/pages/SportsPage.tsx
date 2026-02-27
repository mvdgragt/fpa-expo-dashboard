import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSport,
  createSportPosition,
  listSportPositions,
  listSports,
  type Sport,
} from "../../lib/api/sports";
import { useActiveClub } from "../../lib/useActiveClub";

const getErrorMessage = (err: unknown) => {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const maybe = err as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    if (typeof maybe.message === "string" && maybe.message.trim())
      return maybe.message;
    if (typeof maybe.details === "string" && maybe.details.trim())
      return maybe.details;
    if (typeof maybe.hint === "string" && maybe.hint.trim()) return maybe.hint;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
};

export const SportsPage = () => {
  const qc = useQueryClient();
  const activeClub = useActiveClub();
  const clubId = activeClub.clubId;

  const [sportName, setSportName] = useState("");
  const [selectedSportId, setSelectedSportId] = useState<string>("");
  const [positionName, setPositionName] = useState("");

  const sportsQuery = useQuery({
    enabled: !!clubId,
    queryKey: ["sports", { clubId }],
    queryFn: () => listSports({ clubId: clubId || "" }),
  });

  const effectiveSelectedSportId = useMemo(() => {
    const rows = sportsQuery.data || [];
    if (selectedSportId && rows.some((s) => s.id === selectedSportId))
      return selectedSportId;
    return rows[0]?.id || "";
  }, [selectedSportId, sportsQuery.data]);

  const positionsQuery = useQuery({
    enabled: !!clubId && !!effectiveSelectedSportId,
    queryKey: [
      "sport_positions",
      { clubId, sportId: effectiveSelectedSportId },
    ],
    queryFn: () =>
      listSportPositions({
        clubId: clubId || "",
        sportId: effectiveSelectedSportId,
      }),
  });

  const createSportMutation = useMutation({
    mutationFn: async () => {
      if (!clubId) throw new Error("Missing club");
      const name = sportName.trim();
      if (!name) throw new Error("Sport name is required");
      return createSport({ clubId, name });
    },
    onSuccess: async (sport: Sport) => {
      setSportName("");
      setSelectedSportId(sport.id);
      await qc.invalidateQueries({ queryKey: ["sports"] });
    },
  });

  const createPositionMutation = useMutation({
    mutationFn: async () => {
      if (!clubId) throw new Error("Missing club");
      if (!effectiveSelectedSportId) throw new Error("Select a sport first");
      const name = positionName.trim();
      if (!name) throw new Error("Position name is required");
      return createSportPosition({
        clubId,
        sportId: effectiveSelectedSportId,
        name,
      });
    },
    onSuccess: async () => {
      setPositionName("");
      await qc.invalidateQueries({ queryKey: ["sport_positions"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="text-sm font-semibold text-slate-100">Sports</div>
        <div className="mt-1 text-sm text-slate-400">
          Create sports and positions per club. Nothing is deleted by this
          screen.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm font-semibold text-slate-100">
            Create sport
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={sportName}
              onChange={(e) => setSportName(e.target.value)}
              placeholder="e.g. Football"
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
            />
            <button
              type="button"
              disabled={
                !clubId || createSportMutation.isPending || !sportName.trim()
              }
              onClick={() => createSportMutation.mutate()}
              className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-100 disabled:opacity-50"
            >
              {createSportMutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>

          {createSportMutation.error ? (
            <div className="mt-3 text-xs text-rose-300">
              {getErrorMessage(createSportMutation.error)}
            </div>
          ) : null}

          <div className="mt-6">
            <div className="text-xs font-medium text-slate-300">
              Sports list
            </div>
            {activeClub.isLoading || sportsQuery.isLoading ? (
              <div className="mt-3 text-sm text-slate-300">Loading…</div>
            ) : activeClub.error ? (
              <div className="mt-3 text-sm text-rose-300">
                {getErrorMessage(activeClub.error)}
              </div>
            ) : !clubId ? (
              <div className="mt-3 text-sm text-rose-300">
                No club selected.
              </div>
            ) : sportsQuery.error ? (
              <div className="mt-3 text-sm text-rose-300">
                Could not load sports.
              </div>
            ) : (sportsQuery.data || []).length === 0 ? (
              <div className="mt-3 text-sm text-slate-300">No sports yet.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {(sportsQuery.data || []).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSportId(s.id)}
                    className={
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm " +
                      (s.id === effectiveSelectedSportId
                        ? "border-slate-700 bg-slate-900 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-900")
                    }
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-slate-500">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm font-semibold text-slate-100">Positions</div>
          <div className="mt-1 text-xs text-slate-400">
            Positions are optional. Only add them for sports where they apply.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Sport
              </div>
              <select
                value={effectiveSelectedSportId}
                onChange={(e) => setSelectedSportId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                {(sportsQuery.data || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <input
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                placeholder="e.g. Defender"
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
              <button
                type="button"
                disabled={
                  !clubId ||
                  !effectiveSelectedSportId ||
                  createPositionMutation.isPending ||
                  !positionName.trim()
                }
                onClick={() => createPositionMutation.mutate()}
                className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-100 disabled:opacity-50"
              >
                {createPositionMutation.isPending ? "Creating…" : "Add"}
              </button>
            </div>

            {createPositionMutation.error ? (
              <div className="text-xs text-rose-300">
                {getErrorMessage(createPositionMutation.error)}
              </div>
            ) : null}

            <div className="mt-4">
              <div className="text-xs font-medium text-slate-300">
                Positions list
              </div>
              {positionsQuery.isLoading ? (
                <div className="mt-3 text-sm text-slate-300">Loading…</div>
              ) : positionsQuery.error ? (
                <div className="mt-3 text-sm text-rose-300">
                  Could not load positions.
                </div>
              ) : (positionsQuery.data || []).length === 0 ? (
                <div className="mt-3 text-sm text-slate-300">
                  No positions yet.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {(positionsQuery.data || []).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200"
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-slate-500">
                        {p.id.slice(0, 8)}…
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
