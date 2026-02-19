import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAthlete } from "../../lib/api/athletes";
import { getAthletePhotoSignedUrl } from "../../lib/api/athletes";
import { updateAthlete } from "../../lib/api/athletes";
import { listAthleteResults } from "../../lib/api/athleteResults";
import { testStations } from "../../lib/testStations";
import { useActiveClub } from "../../lib/useActiveClub";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString();
};

export const AthleteProfilePage = () => {
  const qc = useQueryClient();
  const params = useParams();
  const userId = String(params.userId || "");

  const [stationId, setStationId] = useState<string>("");

  const activeClub = useActiveClub();
  const clubId = activeClub.clubId;

  const athleteQuery = useQuery({
    enabled: !!clubId && !!userId,
    queryKey: ["athlete", { clubId, userId }],
    queryFn: () =>
      getAthlete({
        clubId: clubId || "",
        userId,
      }),
  });

  const resultsQuery = useQuery({
    enabled: !!clubId && !!userId,
    queryKey: ["athleteResults", { clubId, userId, stationId }],
    queryFn: () =>
      listAthleteResults({
        clubId: clubId || "",
        userId,
        stationId: stationId || undefined,
        limit: 2000,
      }),
  });

  const bestByStation = useMemo(() => {
    const rows = resultsQuery.data || [];
    const best = new Map<
      string,
      { time_seconds: number; tested_at: string; station_short_name: string }
    >();

    for (const r of rows) {
      const prev = best.get(r.station_id);
      if (!prev || r.time_seconds < prev.time_seconds) {
        best.set(r.station_id, {
          time_seconds: r.time_seconds,
          tested_at: r.tested_at,
          station_short_name: r.station_short_name,
        });
      }
    }

    return Array.from(best.entries())
      .map(([sid, v]) => ({ station_id: sid, ...v }))
      .sort((a, b) => a.station_short_name.localeCompare(b.station_short_name));
  }, [resultsQuery.data]);

  const chartData = useMemo(() => {
    return (resultsQuery.data || []).map((r) => ({
      tested_at: r.tested_at,
      date: formatDate(r.tested_at),
      time_seconds: Number(r.time_seconds),
    }));
  }, [resultsQuery.data]);

  const athleteName = useMemo(() => {
    const a = athleteQuery.data;
    if (!a) return userId;
    return `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.id;
  }, [athleteQuery.data, userId]);

  const [photoUrl, setPhotoUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const path = athleteQuery.data?.image_url;
      if (!path) {
        setPhotoUrl("");
        return;
      }

      try {
        const url = await getAthletePhotoSignedUrl({ objectPath: path });
        if (!cancelled) setPhotoUrl(url);
      } catch {
        if (!cancelled) setPhotoUrl("");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [athleteQuery.data?.image_url]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Athlete profile
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={athleteName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                    {athleteName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-300">{athleteName}</div>
            </div>
            {athleteQuery.data ? (
              <div className="mt-2 text-xs text-slate-500">
                Sex: {athleteQuery.data.sex || "—"} · DOB:{" "}
                {athleteQuery.data.dob || "—"}
              </div>
            ) : null}
          </div>

          <Link
            to="/athletes"
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
          >
            Back to athletes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 lg:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                History
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Lower is better (seconds).
              </div>
            </div>

            <div className="w-full md:w-64">
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
            </div>
          </div>

          {activeClub.isLoading ||
          athleteQuery.isLoading ||
          resultsQuery.isLoading ? (
            <div className="mt-4 text-sm text-slate-300">Loading…</div>
          ) : activeClub.error ? (
            <div className="mt-4 text-sm text-rose-300">
              Could not load club context.
            </div>
          ) : !clubId ? (
            <div className="mt-4 text-sm text-rose-300">
              No club assigned to this account (missing club_staff row).
            </div>
          ) : athleteQuery.error || resultsQuery.error ? (
            <div className="mt-4 text-sm text-rose-300">
              Could not load athlete profile.
            </div>
          ) : !athleteQuery.data ? (
            <div className="mt-4 text-sm text-rose-300">Athlete not found.</div>
          ) : chartData.length === 0 ? (
            <div className="mt-4 text-sm text-slate-300">No results yet.</div>
          ) : (
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 10 }}
                >
                  <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: 12,
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="time_seconds"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm font-semibold text-slate-100">
            Best results
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Best time per station.
          </div>

          {bestByStation.length === 0 ? (
            <div className="mt-4 text-sm text-slate-300">—</div>
          ) : (
            <div className="mt-4 space-y-2">
              {bestByStation.map((b) => (
                <div
                  key={b.station_id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
                >
                  <div className="text-sm text-slate-200">
                    {b.station_short_name}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-emerald-300">
                      {b.time_seconds.toFixed(2)}s
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(b.tested_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm font-semibold text-slate-100">
            Edit athlete
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Update info and optionally replace photo.
          </div>

          {athleteQuery.data ? (
            <EditAthleteForm
              key={athleteQuery.data.id}
              clubId={clubId}
              userId={userId}
              athlete={athleteQuery.data}
              onSaved={async () => {
                await qc.invalidateQueries({ queryKey: ["athlete"] });
                await qc.invalidateQueries({ queryKey: ["athletes"] });
              }}
            />
          ) : (
            <div className="mt-4 text-sm text-slate-300">—</div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditAthleteForm = ({
  clubId,
  userId,
  athlete,
  onSaved,
}: {
  clubId: string;
  userId: string;
  athlete: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    dob: string | null;
    sex: string | null;
  };
  onSaved: () => Promise<void>;
}) => {
  const [firstName, setFirstName] = useState(athlete.first_name || "");
  const [lastName, setLastName] = useState(athlete.last_name || "");
  const [dob, setDob] = useState(athlete.dob || "");
  const [sex, setSex] = useState<"" | "M" | "F">(
    ((athlete.sex || "").toUpperCase() as "" | "M" | "F") || "",
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!clubId) throw new Error("Missing club");
      if (!userId) throw new Error("Missing athlete");
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error("First name and last name are required");
      }

      return updateAthlete({
        clubId,
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob || undefined,
        sex: sex || undefined,
        photoFile: photoFile || undefined,
      });
    },
    onSuccess: async () => {
      setPhotoFile(null);
      await onSaved();
    },
  });

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <label className="block">
        <div className="mb-1 text-xs font-medium text-slate-300">
          First name
        </div>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
        />
      </label>

      <label className="block">
        <div className="mb-1 text-xs font-medium text-slate-300">Last name</div>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-slate-300">Sex</div>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as "" | "M" | "F")}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
          >
            <option value="">—</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-slate-300">DOB</div>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
          />
        </label>
      </div>

      <label className="block">
        <div className="mb-1 text-xs font-medium text-slate-300">
          Replace photo (optional)
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border file:border-slate-700 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-100 hover:file:bg-slate-800"
        />
      </label>

      <button
        type="button"
        disabled={
          !clubId ||
          updateMutation.isPending ||
          !firstName.trim() ||
          !lastName.trim()
        }
        onClick={() => updateMutation.mutate()}
        className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-100 disabled:opacity-50"
      >
        {updateMutation.isPending ? "Saving…" : "Save changes"}
      </button>

      {updateMutation.error ? (
        <div className="text-xs text-rose-300">
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : String(updateMutation.error)}
        </div>
      ) : null}
    </div>
  );
};
