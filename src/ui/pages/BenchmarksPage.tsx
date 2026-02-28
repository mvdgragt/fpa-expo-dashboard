import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { listBenchmarkSamples } from "../../lib/api/benchmarks";
import { testStations } from "../../lib/testStations";
import { useActiveClub } from "../../lib/useActiveClub";

import { pdf } from "@react-pdf/renderer";

import {
  buildCoachReport505,
  type BenchmarkSample505,
  type Foot,
} from "../../lib/reports/coachReport505";
import { CoachReport505Pdf } from "../reports/CoachReport505Pdf";

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

const quantile = (sorted: number[], q: number) => {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const a = sorted[base];
  const b = sorted[Math.min(base + 1, sorted.length - 1)];
  return a + rest * (b - a);
};

const buildHistogram = (values: number[], binCount: number) => {
  if (values.length === 0)
    return [] as { x: string; count: number; from: number; to: number }[];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    return [
      {
        x: `${min.toFixed(2)}–${max.toFixed(2)}`,
        count: values.length,
        from: min,
        to: max,
      },
    ];
  }

  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const from = min + i * width;
    const to = i === binCount - 1 ? max : min + (i + 1) * width;
    return { from, to, count: 0 };
  });

  for (const v of values) {
    const idx = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((v - min) / width)),
    );
    bins[idx].count += 1;
  }

  return bins.map((b) => ({
    x: `${b.from.toFixed(2)}–${b.to.toFixed(2)}`,
    count: b.count,
    from: b.from,
    to: b.to,
  }));
};

export const BenchmarksPage = () => {
  const [stationId, setStationId] = useState<string>(testStations[0]?.id ?? "");
  const [sex, setSex] = useState<SexFilter>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [reportLanguage, setReportLanguage] = useState<"en" | "sv">("en");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const activeClub = useActiveClub();
  const clubId = activeClub.clubId;

  const samplesQuery = useQuery({
    enabled: !!clubId && !!stationId,
    queryKey: ["benchmarks", { clubId, stationId }],
    queryFn: () =>
      listBenchmarkSamples({
        clubId: clubId || "",
        stationId,
        limit: 5000,
      }),
  });

  const filtered = useMemo(() => {
    const raw = samplesQuery.data || [];
    const minA = minAge ? Number(minAge) : null;
    const maxA = maxAge ? Number(maxAge) : null;

    return raw.filter((s) => {
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
  }, [maxAge, minAge, samplesQuery.data, sex]);

  const times = useMemo(() => {
    const arr = filtered
      .map((s) => s.time_seconds)
      .filter((x) => Number.isFinite(x));
    arr.sort((a, b) => a - b);
    return arr;
  }, [filtered]);

  const stats = useMemo(() => {
    const n = times.length;
    const p10 = quantile(times, 0.1);
    const p50 = quantile(times, 0.5);
    const p90 = quantile(times, 0.9);
    const min = n ? times[0] : null;
    const max = n ? times[n - 1] : null;
    return { n, p10, p50, p90, min, max };
  }, [times]);

  const histogram = useMemo(() => buildHistogram(times, 18), [times]);

  const station = testStations.find((s) => s.id === stationId);

  const clubName = useMemo(() => {
    const found = activeClub.clubs.find((c) => c.id === clubId);
    return found?.name || "";
  }, [activeClub.clubs, clubId]);

  const canGenerateCoachReport =
    stationId === "5-0-5-test" && !!clubId && !activeClub.isLoading;

  const normalizeFoot = (foot: string | null): Foot | null => {
    if (!foot) return null;
    const f = foot.toLowerCase();
    if (f === "left" || f === "right") return f;
    return null;
  };

  const handleGenerateCoachReport = async () => {
    if (!canGenerateCoachReport) return;
    if (isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const samples505: BenchmarkSample505[] = (filtered || []).map((s) => ({
        user_id: s.user_id,
        time_seconds: s.time_seconds,
        tested_at: s.tested_at,
        foot: normalizeFoot(s.foot),
        user: s.user,
      }));

      const report = buildCoachReport505({
        samples: samples505,
        language: reportLanguage,
      });

      const blob = await pdf(
        <CoachReport505Pdf
          clubName={clubName || "Club"}
          report={report}
          stationName="5-0-5"
          language={reportLanguage}
          filters={{ sex, minAge, maxAge }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coach-report-505-${clubName || clubId}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Benchmarks
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Cohort comparison by age and sex for your club.
            </div>
            {clubId ? (
              <div className="mt-2 text-xs text-slate-500">
                Club ID: <span className="font-mono">{clubId}</span>
              </div>
            ) : null}

            <div className="mt-3">
              <button
                type="button"
                onClick={handleGenerateCoachReport}
                disabled={
                  !canGenerateCoachReport ||
                  isGeneratingPdf ||
                  samplesQuery.isLoading ||
                  filtered.length === 0
                }
                className="inline-flex h-10 items-center rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                {isGeneratingPdf
                  ? "Generating Coach Report…"
                  : stationId === "5-0-5-test"
                    ? "Generate Coach Report (PDF)"
                    : "Coach Report available for 5-0-5 only"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Station
              </div>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
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
                Language
              </div>
              <select
                value={reportLanguage}
                onChange={(e) =>
                  setReportLanguage(e.target.value as "en" | "sv")
                }
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="en">English</option>
                <option value="sv">Svenska</option>
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Distribution{station ? ` · ${station.shortName}` : ""}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Lower is better (seconds).
              </div>
            </div>
            <div className="text-xs text-slate-400">
              N: <span className="text-slate-200">{stats.n}</span>
            </div>
          </div>

          {activeClub.isLoading || samplesQuery.isLoading ? (
            <div className="mt-4 text-sm text-slate-300">Loading…</div>
          ) : activeClub.error ? (
            <div className="mt-4 text-sm text-rose-300">
              Could not load club context.
            </div>
          ) : !clubId ? (
            <div className="mt-4 text-sm text-rose-300">
              No club assigned to this account (missing club_staff row).
            </div>
          ) : samplesQuery.error ? (
            <div className="mt-4 text-sm text-rose-300">
              Could not load benchmark samples.
            </div>
          ) : stats.n === 0 ? (
            <div className="mt-4 text-sm text-slate-300">
              No samples match these filters.
            </div>
          ) : (
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={histogram}
                  margin={{ top: 10, right: 12, left: 0, bottom: 18 }}
                >
                  <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    interval={2}
                    angle={-20}
                    textAnchor="end"
                    height={50}
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
                  <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />

                  {stats.p10 !== null ? (
                    <ReferenceLine
                      x={(() => {
                        const p = stats.p10 as number;
                        const b = histogram.find(
                          (h) => p >= h.from && p <= h.to,
                        );
                        return b?.x;
                      })()}
                      stroke="#60a5fa"
                      strokeDasharray="4 4"
                    />
                  ) : null}
                  {stats.p50 !== null ? (
                    <ReferenceLine
                      x={(() => {
                        const p = stats.p50 as number;
                        const b = histogram.find(
                          (h) => p >= h.from && p <= h.to,
                        );
                        return b?.x;
                      })()}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                    />
                  ) : null}
                  {stats.p90 !== null ? (
                    <ReferenceLine
                      x={(() => {
                        const p = stats.p90 as number;
                        const b = histogram.find(
                          (h) => p >= h.from && p <= h.to,
                        );
                        return b?.x;
                      })()}
                      stroke="#a78bfa"
                      strokeDasharray="4 4"
                    />
                  ) : null}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm font-semibold text-slate-100">
            Cohort summary
          </div>
          <div className="mt-1 text-xs text-slate-400">
            P10/P50/P90 across all samples.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs text-slate-400">Best (min)</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {stats.min !== null ? `${stats.min.toFixed(2)}s` : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs text-slate-400">Worst (max)</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {stats.max !== null ? `${stats.max.toFixed(2)}s` : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs text-slate-400">P10</div>
              <div className="mt-1 text-lg font-semibold text-sky-300">
                {stats.p10 !== null ? `${stats.p10.toFixed(2)}s` : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs text-slate-400">P50 (median)</div>
              <div className="mt-1 text-lg font-semibold text-amber-300">
                {stats.p50 !== null ? `${stats.p50.toFixed(2)}s` : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs text-slate-400">P90</div>
              <div className="mt-1 text-lg font-semibold text-violet-300">
                {stats.p90 !== null ? `${stats.p90.toFixed(2)}s` : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs text-slate-400">Samples</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {stats.n}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
