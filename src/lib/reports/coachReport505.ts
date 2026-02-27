export type Foot = "left" | "right";

export type BenchmarkSample505 = {
  user_id: string;
  time_seconds: number;
  tested_at: string;
  foot: Foot | null;
  user: {
    sex: string | null;
    dob: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

export type Athlete505Metrics = {
  user_id: string;
  name: string;
  left_best: number | null;
  right_best: number | null;
  best: number | null;
  asymmetry_pct: number | null;
  slower_side: Foot | null;
};

export type Team505Stats = {
  athletes_n: number;
  attempts_n: number;
  avg_best: number | null;
  fastest_best: number | null;
  slowest_best: number | null;
  avg_asymmetry_pct: number | null;
  asymmetry_lt_5_n: number;
  asymmetry_5_10_n: number;
  asymmetry_gt_10_n: number;
  slower_left_n: number;
  slower_right_n: number;
};

export type ScatterPoint = {
  user_id: string;
  label: string;
  x_best: number;
  y_asymmetry: number;
};

export type CoachReport505 = {
  generated_at: string;
  athletes: Athlete505Metrics[];
  team: Team505Stats;
  scatter: {
    points: ScatterPoint[];
    x_threshold: number;
    y_threshold: number;
  };
  actions: {
    title: string;
    rules_triggered: string[];
    items: string[];
  }[];
};

const fmtName = (first: string | null, last: string | null) => {
  const f = (first || "").trim();
  const l = (last || "").trim();
  const name = `${f} ${l}`.trim();
  return name || "Unknown";
};

const safeMean = (vals: number[]) => {
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
};

const safeMin = (vals: number[]) => {
  if (vals.length === 0) return null;
  return Math.min(...vals);
};

const safeMax = (vals: number[]) => {
  if (vals.length === 0) return null;
  return Math.max(...vals);
};

const median = (sorted: number[]) => {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
};

export const buildCoachReport505 = (args: {
  samples: BenchmarkSample505[];
  yThresholdPct?: number;
}): CoachReport505 => {
  const yThreshold = args.yThresholdPct ?? 10;

  const byAthlete = new Map<string, BenchmarkSample505[]>();
  for (const s of args.samples) {
    const arr = byAthlete.get(s.user_id) || [];
    arr.push(s);
    byAthlete.set(s.user_id, arr);
  }

  const athletes: Athlete505Metrics[] = [];

  for (const [userId, arr] of byAthlete.entries()) {
    const name = fmtName(arr[0]?.user.first_name ?? null, arr[0]?.user.last_name ?? null);

    const left = arr
      .filter((x) => x.foot === "left")
      .map((x) => x.time_seconds)
      .filter((x) => Number.isFinite(x));
    const right = arr
      .filter((x) => x.foot === "right")
      .map((x) => x.time_seconds)
      .filter((x) => Number.isFinite(x));

    const leftBest = safeMin(left);
    const rightBest = safeMin(right);

    const best = safeMin([
      ...(typeof leftBest === "number" ? [leftBest] : []),
      ...(typeof rightBest === "number" ? [rightBest] : []),
    ]);

    let asym: number | null = null;
    let slower: Foot | null = null;
    if (typeof leftBest === "number" && typeof rightBest === "number") {
      const fast = Math.min(leftBest, rightBest);
      const slow = Math.max(leftBest, rightBest);
      asym = fast > 0 ? ((slow - fast) / fast) * 100 : null;
      slower = leftBest > rightBest ? "left" : "right";
    }

    athletes.push({
      user_id: userId,
      name,
      left_best: leftBest,
      right_best: rightBest,
      best,
      asymmetry_pct: asym,
      slower_side: slower,
    });
  }

  athletes.sort((a, b) => {
    const av = a.best ?? Number.POSITIVE_INFINITY;
    const bv = b.best ?? Number.POSITIVE_INFINITY;
    return av - bv;
  });

  const bests = athletes
    .map((a) => a.best)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const asyms = athletes
    .map((a) => a.asymmetry_pct)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const asymLt5 = athletes.filter((a) => (a.asymmetry_pct ?? -1) >= 0 && (a.asymmetry_pct ?? 0) < 5).length;
  const asym5to10 = athletes.filter((a) => (a.asymmetry_pct ?? -1) >= 5 && (a.asymmetry_pct ?? 0) <= 10).length;
  const asymGt10 = athletes.filter((a) => (a.asymmetry_pct ?? -1) > 10).length;

  const slowerLeft = athletes.filter((a) => a.slower_side === "left").length;
  const slowerRight = athletes.filter((a) => a.slower_side === "right").length;

  const team: Team505Stats = {
    athletes_n: athletes.length,
    attempts_n: args.samples.length,
    avg_best: safeMean(bests),
    fastest_best: safeMin(bests),
    slowest_best: safeMax(bests),
    avg_asymmetry_pct: safeMean(asyms),
    asymmetry_lt_5_n: asymLt5,
    asymmetry_5_10_n: asym5to10,
    asymmetry_gt_10_n: asymGt10,
    slower_left_n: slowerLeft,
    slower_right_n: slowerRight,
  };

  const points: ScatterPoint[] = athletes
    .map((a) => {
      if (typeof a.best !== "number" || typeof a.asymmetry_pct !== "number") return null;
      return {
        user_id: a.user_id,
        label: a.name,
        x_best: a.best,
        y_asymmetry: a.asymmetry_pct,
      };
    })
    .filter((x): x is ScatterPoint => !!x);

  const bestsSorted = [...bests].sort((a, b) => a - b);
  const xThreshold = median(bestsSorted) ?? 2.0;

  const actions: CoachReport505["actions"] = [];

  // Action block 1: Asymmetry
  {
    const triggered: string[] = [];
    if ((team.avg_asymmetry_pct ?? 0) > yThreshold) triggered.push(`Team avg asymmetry > ${yThreshold}%`);
    if (team.asymmetry_gt_10_n >= Math.max(1, Math.ceil(team.athletes_n * 0.3))) triggered.push("≥30% of athletes > 10% asymmetry");

    actions.push({
      title: "Change-of-direction symmetry",
      rules_triggered: triggered,
      items: [
        "Include left/right COD reps every session (balanced volume).",
        "Track asymmetry weekly; target <10% for most athletes.",
        "Prioritize deceleration + plant mechanics on the slower side.",
      ],
    });
  }

  // Action block 2: Speed (overall)
  {
    const triggered: string[] = [];
    if ((team.avg_best ?? 0) > xThreshold) triggered.push("Team average slower than median best threshold");

    actions.push({
      title: "5-0-5 performance (time)",
      rules_triggered: triggered,
      items: [
        "Add 1–2 short COD exposures/week (quality reps, full recovery).",
        "Coach trunk stiffness + shin angle on entry and exit.",
        "Use timed sets to maintain intent (1–3 reps per set).",
      ],
    });
  }

  // Action block 3: Directional bias
  {
    const triggered: string[] = [];
    if (team.slower_left_n > team.slower_right_n) triggered.push("More athletes slower on left turns");
    if (team.slower_right_n > team.slower_left_n) triggered.push("More athletes slower on right turns");

    actions.push({
      title: "Directional bias",
      rules_triggered: triggered,
      items: [
        "If a bias exists, start COD blocks with the weaker turn direction.",
        "Keep total left/right turn volume equal across the week.",
        "Re-test after 2–4 weeks to confirm change.",
      ],
    });
  }

  return {
    generated_at: new Date().toISOString(),
    athletes,
    team,
    scatter: {
      points,
      x_threshold: xThreshold,
      y_threshold: yThreshold,
    },
    actions,
  };
};
