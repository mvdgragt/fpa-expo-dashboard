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
  performance_index: number | null;
  balance_score: number | null;
  overall_cod_score: number | null;
  category: string | null;
  advice?: {
    key: string;
    title: string;
    why: string[];
    actions: string[];
  };
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
  tested_at_latest: string | null;
  language: "en" | "sv";
  athletes: Athlete505Metrics[];
  team: Team505Stats;
  scatter: {
    points: ScatterPoint[];
    x_threshold: number;
    y_threshold: number;
  };
  sessions: {
    title: string;
    duration_min: number;
    goal: string;
    equipment: string;
    blocks: {
      title: string;
      work: string;
      coaching: string[];
    }[];
  }[];
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

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const compute505Scores = (args: {
  leftBest: number | null;
  rightBest: number | null;
  best: number | null;
}) => {
  const hasLeft =
    typeof args.leftBest === "number" && Number.isFinite(args.leftBest);
  const hasRight =
    typeof args.rightBest === "number" && Number.isFinite(args.rightBest);

  const asymmetryIndex =
    hasLeft && hasRight
      ? (Math.abs(args.leftBest! - args.rightBest!) /
          Math.max(args.leftBest!, args.rightBest!)) *
        100
      : null;

  const performanceIndex =
    args.best !== null
      ? clamp(((2.4 - args.best) / (2.4 - 2.0)) * 100, 0, 100)
      : null;

  const balanceScore = (() => {
    if (asymmetryIndex === null || !Number.isFinite(asymmetryIndex))
      return null;
    const a = Math.max(0, asymmetryIndex);

    if (a <= 5) {
      // 0–5% → 80–100
      return 100 - (a / 5) * 20;
    }
    if (a <= 10) {
      // 5–10% → 70–80
      return 80 - ((a - 5) / 5) * 10;
    }
    if (a <= 15) {
      // 10–15% → 60–70
      return 70 - ((a - 10) / 5) * 10;
    }
    if (a <= 20) {
      // 15–20% → 50–60
      return 60 - ((a - 15) / 5) * 10;
    }
    if (a <= 30) {
      // 20–30% → 30–50
      return 50 - ((a - 20) / 10) * 20;
    }

    // >30% → 0–30
    return Math.max(0, 30 - (a - 30) * 1.5);
  })();

  const overallCodScore =
    performanceIndex !== null && balanceScore !== null
      ? performanceIndex * 0.7 + balanceScore * 0.3
      : null;

  const category =
    overallCodScore !== null
      ? overallCodScore >= 85
        ? "Elite"
        : overallCodScore >= 70
          ? "Strong"
          : overallCodScore >= 55
            ? "Moderate"
            : "Needs Development"
      : null;

  return {
    performanceIndex,
    balanceScore,
    overallCodScore,
    category,
  };
};

const buildAthleteAdvice = (args: {
  lang: "en" | "sv";
  category: string | null;
  performanceIndex: number | null;
  balanceScore: number | null;
  asymmetryPct: number | null;
  weakerDir: Foot | null;
}) => {
  const why: string[] = [];
  const actions: string[] = [];

  const cat = args.category;
  const perf = args.performanceIndex;
  const bal = args.balanceScore;
  const asym = args.asymmetryPct;

  const perfLow =
    typeof perf === "number" && Number.isFinite(perf) && perf < 70;
  const balLow = typeof bal === "number" && Number.isFinite(bal) && bal < 70;
  const asymHigh =
    typeof asym === "number" && Number.isFinite(asym) && asym >= 10;

  const key = [
    perfLow ? "perf" : "",
    balLow ? "bal" : "",
    asymHigh ? "asym" : "",
  ]
    .filter(Boolean)
    .join("+");

  const text = {
    en: {
      titlePerf: "Faster turn speed",
      titleBal: "Stronger plant + symmetry",
      titlePerfBal: "Faster turn + stronger plant",
      titlePerfBalAsym: "Faster turn + symmetry",
      whyPerf: (v: number) => `Turn speed is below target (${v}/100).`,
      whyBal: (v: number) => `Left/right balance is below target (${v}/100).`,
      whyAsym: (v: number) => `Left/right gap is high (${v.toFixed(1)}%).`,
      actBraking:
        "Coach braking: low hips, chest over toes, strong last 2 steps.",
      actReaccel: "Explode out: push the ground away (first 2 steps).",
      actPlant:
        "Plant foot: stable ankle/knee, no knee collapse, hit the same spot.",
      actWeakSide: "Start reps on the weaker turn direction (extra 2–3 reps).",
      actTrack: "Re-test in 2–4 weeks; aim for <10% left/right gap.",
    },
    sv: {
      titlePerf: "Snabbare vändning",
      titleBal: "Starkare fotisättning + symmetri",
      titlePerfBal: "Snabbare vändning + starkare fotisättning",
      titlePerfBalAsym: "Snabbare vändning + symmetri",
      whyPerf: (v: number) => `Vändningshastighet är under målet (${v}/100).`,
      whyBal: (v: number) => `Vänster/höger-balans är under målet (${v}/100).`,
      whyAsym: (v: number) => `Stor skillnad vänster/höger (${v.toFixed(1)}%).`,
      actBraking:
        "Coacha inbromsning: låga höfter, bröst över tår, starka sista 2 stegen.",
      actReaccel: "Explodera ut: tryck ifrån (första 2 stegen).",
      actPlant:
        "Fotisättning: stabil fotled/knä, inget knäfall, träffa samma punkt.",
      actWeakSide: "Börja rep på den svagare riktningen (extra 2–3 rep).",
      actTrack: "Testa om 2–4 veckor; mål <10% skillnad vänster/höger.",
    },
  }[args.lang];

  const title = (() => {
    if (perfLow && balLow)
      return asymHigh ? text.titlePerfBalAsym : text.titlePerfBal;
    if (perfLow) return text.titlePerf;
    if (balLow || asymHigh) return text.titleBal;
    return "";
  })();

  if (cat === "Moderate" || cat === "Needs Development") {
    if (perfLow) {
      why.push(text.whyPerf(Math.round(perf!)));
      actions.push(text.actBraking);
      actions.push(text.actReaccel);
    }

    if (balLow || asymHigh) {
      if (balLow) why.push(text.whyBal(Math.round(bal!)));
      if (asymHigh) why.push(text.whyAsym(asym!));
      actions.push(text.actPlant);
      actions.push(text.actWeakSide);
    }

    if ((perfLow || balLow || asymHigh) && actions.length < 5)
      actions.push(text.actTrack);
  }

  if (why.length === 0 && actions.length === 0) return undefined;

  return {
    key,
    title,
    why: why.slice(0, 2),
    actions: actions.slice(0, 4),
  };
};

export const buildCoachReport505 = (args: {
  samples: BenchmarkSample505[];
  yThresholdPct?: number;
  language?: "en" | "sv";
}): CoachReport505 => {
  const language = args.language ?? "en";
  const yThreshold = args.yThresholdPct ?? 10;

  const testedAtLatest = (() => {
    const vals = args.samples
      .map((s) => s.tested_at)
      .filter((x): x is string => typeof x === "string" && !!x);
    if (vals.length === 0) return null;
    let bestIso = vals[0];
    for (const v of vals) {
      if (new Date(v).getTime() > new Date(bestIso).getTime()) bestIso = v;
    }
    return bestIso;
  })();

  const byAthlete = new Map<string, BenchmarkSample505[]>();
  for (const s of args.samples) {
    const arr = byAthlete.get(s.user_id) || [];
    arr.push(s);
    byAthlete.set(s.user_id, arr);
  }

  const athletes: Athlete505Metrics[] = [];

  for (const [userId, arr] of byAthlete.entries()) {
    const name = fmtName(
      arr[0]?.user.first_name ?? null,
      arr[0]?.user.last_name ?? null,
    );

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

    const scores = compute505Scores({ leftBest, rightBest, best });

    athletes.push({
      user_id: userId,
      name,
      left_best: leftBest,
      right_best: rightBest,
      best,
      asymmetry_pct: asym,
      slower_side: slower,
      performance_index: scores.performanceIndex,
      balance_score: scores.balanceScore,
      overall_cod_score: scores.overallCodScore,
      category: scores.category,
      advice: buildAthleteAdvice({
        lang: language,
        category: scores.category,
        performanceIndex: scores.performanceIndex,
        balanceScore: scores.balanceScore,
        asymmetryPct: asym,
        weakerDir: slower,
      }),
    });
  }

  athletes.sort((a, b) => {
    const as = a.overall_cod_score ?? Number.NEGATIVE_INFINITY;
    const bs = b.overall_cod_score ?? Number.NEGATIVE_INFINITY;
    if (as !== bs) return bs - as;

    const at = a.best ?? Number.POSITIVE_INFINITY;
    const bt = b.best ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });

  const bests = athletes
    .map((a) => a.best)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const asyms = athletes
    .map((a) => a.asymmetry_pct)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const asymLt5 = athletes.filter(
    (a) => (a.asymmetry_pct ?? -1) >= 0 && (a.asymmetry_pct ?? 0) < 5,
  ).length;
  const asym5to10 = athletes.filter(
    (a) => (a.asymmetry_pct ?? -1) >= 5 && (a.asymmetry_pct ?? 0) <= 10,
  ).length;
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
      if (typeof a.best !== "number" || typeof a.asymmetry_pct !== "number")
        return null;
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

  const reportText = {
    en: {
      trigTeamAsym: (t: number) => `Team avg asymmetry > ${t}%`,
      trig30: "≥30% of athletes > 10% asymmetry",
      titleAsym: "Change-of-direction symmetry",
      asymItems: [
        "Include left/right COD reps every session (balanced volume).",
        "Track asymmetry weekly; target <10% for most athletes.",
        "Prioritize deceleration + plant mechanics on the slower side.",
      ],
      trigSlowerMedian: "Team average slower than median best threshold",
      titlePerf: "5-0-5 performance (time)",
      perfItems: [
        "Add 1–2 short COD exposures/week (quality reps, full recovery).",
        "Coach trunk stiffness + shin angle on entry and exit.",
        "Use timed sets to maintain intent (1–3 reps per set).",
      ],
      trigMoreLeft: "More athletes slower on left turns",
      trigMoreRight: "More athletes slower on right turns",
      titleBias: "Directional bias",
      biasItems: [
        "If a bias exists, start COD blocks with the weaker turn direction.",
        "Keep total left/right turn volume equal across the week.",
        "Re-test after 2–4 weeks to confirm change.",
      ],
      sessions: {
        equipment: "Cones + stopwatch (or timing gates)",
        s1Title: "Session 1: Braking + plant",
        s1Goal: "Better braking + a cleaner plant foot.",
        s2Title: "Session 2: Turn speed + symmetry",
        s2Goal: "Faster turns + smaller left/right gap.",
        warmup: {
          title: "Warm-up (10 min)",
          work: "Mobility + 2×10m build-up + 2×decel & stick.",
          coaching: ["Hips down before the turn.", "Stable trunk."],
        },
        braking: {
          title: "Brake → plant (10–12 min)",
          work: "4×3 reps: 5m sprint → hard brake → plant → 2 steps out. Full rest.",
          coaching: ["Chest over toes, hips low.", "Strong last 2 steps."],
        },
        cod505: {
          title: "Timed turns (10 min)",
          work: "2×3 reps each direction. Full rest. Time it.",
          coaching: [
            "Attack in. Clean plant. Explode out.",
            "Same plant spot.",
          ],
        },
        weakside: {
          title: "Weak-side top-up (6–8 min)",
          work: "+2 reps each athlete on weaker turn (quality only).",
          coaching: ["Start on weak side.", "Stop when quality drops."],
        },
      },
    },
    sv: {
      trigTeamAsym: (t: number) => `Lagets genomsnittliga asymmetri > ${t}%`,
      trig30: "≥30% av spelarna > 10% asymmetri",
      titleAsym: "Symmetri vid riktningsförändring",
      asymItems: [
        "Om en bias finns: starta COD-block med den svagare riktningen.",
        "Håll total vänster/höger-volym lika över veckan.",
        "Testa om efter 2–4 veckor för att bekräfta förändring.",
      ],
      trigSlowerMedian: "Lagets snitt är långsammare än median-tröskeln",
      titlePerf: "5-0-5 prestation (tid)",
      perfItems: [
        "Lägg till 1–2 korta COD-exponeringar/vecka (kvalitet, full vila).",
        "Coacha bålstabilitet + skenvinkel vid in- och utgång.",
        "Använd tidtagna set för att behålla intention (1–3 rep per set).",
      ],
      trigMoreLeft: "Fler spelare är långsammare vid vänstersväng",
      trigMoreRight: "Fler spelare är långsammare vid högersväng",
      titleBias: "Riktningsbias",
      biasItems: [
        "Om en bias finns: starta COD-block med den svagare riktningen.",
        "Håll total vänster/höger-volym lika över veckan.",
        "Testa om efter 2–4 veckor för att bekräfta förändring.",
      ],
      sessions: {
        equipment: "Konor + tidtagning (klocka eller gates)",
        s1Title: "Pass 1: Inbromsning + fotisättning",
        s1Goal: "Bättre broms + renare fotisättning.",
        s2Title: "Pass 2: Vändningshastighet + symmetri",
        s2Goal: "Snabbare vändningar + mindre skillnad vänster/höger.",
        warmup: {
          title: "Uppvärmning (10 min)",
          work: "Rörlighet + 2×10m stegring + 2×bromsa & håll.",
          coaching: ["Sänk höfterna innan vändning.", "Stabil bål."],
        },
        braking: {
          title: "Inbromsning till fotisättning (10–12 min)",
          work: "4×3 rep: 5m sprint → hård broms → fotisättning → 2 steg ut. Full vila.",
          coaching: ["Bröst över tår, låga höfter.", "Starka sista 2 stegen."],
        },
        cod505: {
          title: "Tidtagna vändningar (10 min)",
          work: "2×3 rep per riktning. Full vila. Ta tid.",
          coaching: [
            "Attackera in. Ren fotisättning. Explodera ut.",
            "Samma fotisättningspunkt.",
          ],
        },
        weakside: {
          title: "Extra svag sida (6–8 min)",
          work: "+2 rep per spelare på svagare vändning (endast kvalitet).",
          coaching: ["Börja på svag sida.", "Avbryt när kvaliteten faller."],
        },
      },
    },
  }[language];

  const sessions: CoachReport505["sessions"] = (() => {
    const s = reportText.sessions;
    const out: CoachReport505["sessions"] = [];

    const baseBlocks = [s.warmup, s.braking, s.cod505];

    const needsSymmetryFocus =
      (team.avg_asymmetry_pct ?? 0) > yThreshold || team.asymmetry_gt_10_n > 0;

    out.push({
      title: s.s1Title,
      duration_min: 30,
      goal: s.s1Goal,
      equipment: s.equipment,
      blocks: baseBlocks,
    });

    out.push({
      title: s.s2Title,
      duration_min: 30,
      goal: s.s2Goal,
      equipment: s.equipment,
      blocks: needsSymmetryFocus ? [...baseBlocks, s.weakside] : baseBlocks,
    });

    return out;
  })();

  // Action block 1: Asymmetry
  {
    const triggered: string[] = [];
    if ((team.avg_asymmetry_pct ?? 0) > yThreshold)
      triggered.push(reportText.trigTeamAsym(yThreshold));
    if (team.asymmetry_gt_10_n >= Math.max(1, Math.ceil(team.athletes_n * 0.3)))
      triggered.push(reportText.trig30);

    actions.push({
      title: reportText.titleAsym,
      rules_triggered: triggered,
      items: reportText.asymItems,
    });
  }

  // Action block 2: Speed (overall)
  {
    const triggered: string[] = [];
    if ((team.avg_best ?? 0) > xThreshold)
      triggered.push(reportText.trigSlowerMedian);

    actions.push({
      title: reportText.titlePerf,
      rules_triggered: triggered,
      items: reportText.perfItems,
    });
  }

  // Action block 3: Directional bias
  {
    const triggered: string[] = [];
    if (team.slower_left_n > team.slower_right_n)
      triggered.push(reportText.trigMoreLeft);
    if (team.slower_right_n > team.slower_left_n)
      triggered.push(reportText.trigMoreRight);

    actions.push({
      title: reportText.titleBias,
      rules_triggered: triggered,
      items: reportText.biasItems,
    });
  }

  return {
    generated_at: new Date().toISOString(),
    tested_at_latest: testedAtLatest,
    language,
    athletes,
    team,
    scatter: {
      points,
      x_threshold: xThreshold,
      y_threshold: yThreshold,
    },
    sessions,
    actions,
  };
};
