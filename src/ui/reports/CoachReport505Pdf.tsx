import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
  Svg,
  Line,
  Circle,
  Rect,
} from "@react-pdf/renderer";

import type { CoachReport505 } from "../../lib/reports/coachReport505";
import fpaLogo from "../../assets/fpa.png";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBlock: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#0f172a",
    color: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff",
  },
  brandName: {
    fontSize: 12,
    fontWeight: 700,
  },
  brandSub: {
    fontSize: 9,
    color: "#334155",
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 10,
    color: "#334155",
    marginTop: 2,
  },
  metaRight: {
    fontSize: 9,
    color: "#334155",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  grid2: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
  },
  cardLabel: {
    fontSize: 9,
    color: "#475569",
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowHeader: {
    backgroundColor: "#f8fafc",
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  cellName: {
    width: "36%",
  },
  cellNum: {
    width: "16%",
    textAlign: "right",
  },
  cellSmall: {
    width: "16%",
    textAlign: "right",
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    fontSize: 8,
    color: "#0f172a",
  },
  actionBlock: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  actionRule: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 6,
  },
  actionItem: {
    fontSize: 9,
    color: "#0f172a",
    marginBottom: 3,
  },
  planCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  planHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
  },
  planTag: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
  },
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  athletePill: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
  },
  miniLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#334155",
    marginBottom: 2,
  },
  miniText: {
    fontSize: 9,
    color: "#0f172a",
    marginBottom: 4,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  sessionAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#2563eb",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  sessionGoal: {
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.35,
    marginBottom: 8,
  },
  equipmentLine: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.35,
    marginBottom: 10,
  },
  blockWrap: {
    borderLeftWidth: 3,
    borderLeftColor: "#cbd5e1",
    paddingLeft: 8,
    marginBottom: 10,
  },
  blockBadge: {
    fontSize: 8,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
    marginLeft: 6,
  },
  blockTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 2,
  },
  blockWork: {
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.35,
    marginBottom: 4,
  },
  cue: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.35,
    marginBottom: 2,
  },
});

const f2 = (n: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "—";
const f0 = (n: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? String(Math.round(n)) : "—";

const rowBgForCategory = (cat: string | null) => {
  const c = String(cat || "").toLowerCase();
  if (c === "elite") return "#dcfce7";
  if (c === "strong") return "#dcfce7";
  if (c === "moderate") return "#fef9c3";
  if (c === "needs development") return "#fee2e2";
  return "#ffffff";
};

const BarListChart = (props: {
  title: string;
  subtitle: string;
  rows: { label: string; value: number }[];
  valueLabel: (v: number) => string;
  maxValue?: number;
  barColor: string;
  maxRows?: number;
}) => {
  const max =
    props.maxValue ??
    (props.rows.length ? Math.max(...props.rows.map((r) => r.value)) : 1);
  const barMaxW = 320;
  const maxRows = props.maxRows ?? 18;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
      }}
    >
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <Text style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}>
        {props.subtitle}
      </Text>

      {props.rows.slice(0, maxRows).map((r) => {
        const bw = max > 0 ? (r.value / max) * barMaxW : 0;
        return (
          <View
            key={r.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text style={{ width: 160, fontSize: 8, color: "#0f172a" }}>
              {r.label}
            </Text>
            <View
              style={{
                width: barMaxW,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#f1f5f9",
                overflow: "hidden",
                marginRight: 6,
              }}
            >
              <View
                style={{
                  width: bw,
                  height: 8,
                  backgroundColor: props.barColor,
                }}
              />
            </View>
            <Text style={{ width: 42, fontSize: 8, color: "#334155" }}>
              {props.valueLabel(r.value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const FootTimeBarsChart = (props: {
  title: string;
  subtitle: string;
  athletes: {
    name: string;
    left: number | null;
    right: number | null;
  }[];
  avgTime: number | null;
  legendLeft: string;
  legendRight: string;
}) => {
  const w = 520;
  const h = 200;
  const padX = 26;
  const padTop = 16;
  const padBottom = 20;

  const leftColor = "#60a5fa";
  const rightColor = "#f97316";

  const vals = props.athletes
    .flatMap((a) => [a.left, a.right])
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const min = vals.length ? Math.min(...vals) : 2.0;
  const max = vals.length ? Math.max(...vals) : 3.0;
  const yMin = Math.max(0, Math.min(min, props.avgTime ?? min) - 0.25);
  const yMax = Math.max(max, props.avgTime ?? max);

  const innerH = h - padTop - padBottom;
  const innerW = w - padX * 2;

  const sy = (v: number) => {
    if (yMax === yMin) return padTop + innerH;
    // y-axis increases upward (higher time higher)
    const t = (v - yMin) / (yMax - yMin);
    return padTop + innerH - t * innerH;
  };

  const baselineY = padTop + innerH;
  const n = Math.max(1, props.athletes.length);
  const slot = innerW / n;
  const barW = Math.max(4, Math.min(10, slot * 0.22));

  const avgY =
    typeof props.avgTime === "number" && Number.isFinite(props.avgTime)
      ? sy(props.avgTime)
      : null;

  const labelName = (name: string) => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "—";
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ${last.slice(0, 1).toUpperCase()}`;
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
      }}
    >
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <Text style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}>
        {props.subtitle}
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 10,
              backgroundColor: leftColor,
              borderRadius: 2,
            }}
          />
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {props.legendLeft}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 10,
              backgroundColor: rightColor,
              borderRadius: 2,
            }}
          />
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {props.legendRight}
          </Text>
        </View>
        {typeof props.avgTime === "number" && Number.isFinite(props.avgTime) ? (
          <Text style={{ fontSize: 9, color: "#475569" }}>
            Avg: {props.avgTime.toFixed(2)}s
          </Text>
        ) : null}
      </View>

      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill="#ffffff" />

        <Line
          x1={padX}
          y1={baselineY}
          x2={w - padX}
          y2={baselineY}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        <Line
          x1={padX}
          y1={padTop}
          x2={padX}
          y2={baselineY}
          stroke="#cbd5e1"
          strokeWidth={1}
        />

        {avgY !== null ? (
          <Line
            x1={padX}
            y1={avgY}
            x2={w - padX}
            y2={avgY}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}

        {props.athletes.map((a, i) => {
          const cx = padX + i * slot;
          const leftX = cx + slot * 0.22;
          const rightX = cx + slot * 0.55;

          const bars: unknown[] = [];
          if (typeof a.left === "number" && Number.isFinite(a.left)) {
            const y = sy(a.left);
            bars.push(
              <Rect
                key={`${a.name}-l`}
                x={leftX}
                y={y}
                width={barW}
                height={baselineY - y}
                fill={leftColor}
                rx={2}
              />,
            );
          }
          if (typeof a.right === "number" && Number.isFinite(a.right)) {
            const y = sy(a.right);
            bars.push(
              <Rect
                key={`${a.name}-r`}
                x={rightX}
                y={y}
                width={barW}
                height={baselineY - y}
                fill={rightColor}
                rx={2}
              />,
            );
          }
          return bars;
        })}
      </Svg>

      <View
        style={{
          flexDirection: "row",
          paddingLeft: padX,
          paddingRight: padX,
          marginTop: 2,
        }}
      >
        {props.athletes.map((a) => {
          const fontSize = n > 40 ? 4 : n > 28 ? 5 : 6;
          return (
            <View
              key={a.name}
              style={{
                width: slot,
                height: 52,
                alignItems: "center",
                justifyContent: "flex-start",
                overflow: "hidden",
              }}
            >
              <Text
                style={{
                  fontSize,
                  color: "#334155",
                  transform: "rotate(-90deg)",
                  width: 52,
                  textAlign: "left",
                }}
              >
                {labelName(a.name)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const Scatter = (props: { report: CoachReport505 }) => {
  const w = 520;
  const h = 240;
  const pad = 18;

  const pts = props.report.scatter.points;
  const xs = pts.map((p) => p.x_best);
  const ys = pts.map((p) => p.y_asymmetry);

  const xMin = xs.length ? Math.min(...xs) : 1.5;
  const xMax = xs.length ? Math.max(...xs) : 2.5;
  const yMin = 0;
  const yMax = Math.max(
    props.report.scatter.y_threshold * 2,
    ys.length ? Math.max(...ys) : 20,
  );

  const sx = (x: number) => {
    if (xMax === xMin) return pad;
    return pad + ((x - xMin) / (xMax - xMin)) * (w - pad * 2);
  };
  const sy = (y: number) => {
    if (yMax === yMin) return h - pad;
    return h - pad - ((y - yMin) / (yMax - yMin)) * (h - pad * 2);
  };

  const xT = props.report.scatter.x_threshold;
  const yT = props.report.scatter.y_threshold;

  const q = {
    good: "#dcfce7",
    ok: "#fffbeb",
    risk: "#fee2e2",
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <Text style={styles.sectionTitle}>
        {props.report.language === "sv"
          ? "Kvadrant: bästa tid vs asymmetri"
          : "Quadrant: best time vs asymmetry"}
      </Text>
      <Text style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}>
        {props.report.language === "sv"
          ? "X = bästa 5-0-5-tid (s). Y = asymmetri (%). Lägre är bättre."
          : "X = best 5-0-5 time (s). Y = asymmetry (%). Lower is better."}
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 10,
              backgroundColor: q.good,
              borderWidth: 1,
              borderColor: "#86efac",
            }}
          />
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {props.report.language === "sv"
              ? "Snabb + balanserad"
              : "Fast + balanced"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 10,
              backgroundColor: q.ok,
              borderWidth: 1,
              borderColor: "#facc15",
            }}
          />
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {props.report.language === "sv" ? "OK (1 område)" : "OK (1 area)"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 10,
              backgroundColor: q.risk,
              borderWidth: 1,
              borderColor: "#fca5a5",
            }}
          />
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {props.report.language === "sv" ? "Behöver fokus" : "Needs focus"}
          </Text>
        </View>
      </View>

      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill="#ffffff" />

        <Rect
          x={pad}
          y={pad}
          width={sx(xT) - pad}
          height={sy(yT) - pad}
          fill={q.good}
        />
        <Rect
          x={sx(xT)}
          y={pad}
          width={w - pad - sx(xT)}
          height={sy(yT) - pad}
          fill={q.ok}
        />
        <Rect
          x={pad}
          y={sy(yT)}
          width={sx(xT) - pad}
          height={h - pad - sy(yT)}
          fill={q.ok}
        />
        <Rect
          x={sx(xT)}
          y={sy(yT)}
          width={w - pad - sx(xT)}
          height={h - pad - sy(yT)}
          fill={q.risk}
        />

        <Line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        <Line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="#cbd5e1"
          strokeWidth={1}
        />

        <Line
          x1={sx(xT)}
          y1={pad}
          x2={sx(xT)}
          y2={h - pad}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        <Line
          x1={pad}
          y1={sy(yT)}
          x2={w - pad}
          y2={sy(yT)}
          stroke="#94a3b8"
          strokeWidth={1}
        />

        {pts.map((p) => (
          <Circle
            key={p.user_id}
            cx={sx(p.x_best)}
            cy={sy(p.y_asymmetry)}
            r={3}
            fill="#2563eb"
          />
        ))}
      </Svg>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <Text style={{ fontSize: 9, color: "#475569" }}>
          {props.report.language === "sv"
            ? "Snabb (vänster) → Långsam (höger)"
            : "Fast (left) → Slow (right)"}
        </Text>
        <Text style={{ fontSize: 9, color: "#475569" }}>
          {props.report.language === "sv"
            ? "Låg asymmetri (nere) → Hög (uppe)"
            : "Low asymmetry (bottom) → High (top)"}
        </Text>
      </View>

      <View style={{ marginTop: 6 }}>
        <Text style={{ fontSize: 9, color: "#334155" }}>
          {props.report.language === "sv" ? "Trösklar:" : "Thresholds:"} X≈
          {xT.toFixed(2)}s · Y={yT.toFixed(0)}%
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {xMin.toFixed(2)}s
          </Text>
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {xT.toFixed(2)}s
          </Text>
          <Text style={{ fontSize: 9, color: "#475569" }}>
            {xMax.toFixed(2)}s
          </Text>
        </View>
      </View>
    </View>
  );
};

export const CoachReport505Pdf = (props: {
  clubName: string;
  report: CoachReport505;
  stationName?: string;
  language?: "en" | "sv";
  filters: {
    sex: string;
    minAge: string;
    maxAge: string;
  };
}) => {
  const { report } = props;
  const lang = props.language || report.language || "en";
  const testedDateLabel = report.tested_at_latest
    ? new Date(report.tested_at_latest).toLocaleDateString()
    : "—";
  const stationLabel = props.stationName || "5-0-5";

  const t = (key: string) => {
    const dict: Record<"en" | "sv", Record<string, string>> = {
      en: {
        athleteSummary: "Athlete summary",
        athlete: "Athlete",
        left: "Left",
        right: "Right",
        weakerDir: "Weaker Dir.",
        category: "Cat",
        perf: "Perf",
        bal: "Bal",
        overall: "Overall",
        page: "Page",
        actionPlan: "Action plan (rule-based)",
        athleteFocus: "Athlete focus (rule-based)",
        triggers: "Triggers",
        why: "Why",
        scatterTitle: "Quadrant: best time vs asymmetry",
        scatterSub:
          "X = best 5-0-5 time (s). Y = asymmetry (%). Lower is better.",
        lowAsym: "Low asymmetry (bottom) → High (top)",
        fast: "Fast (left) → Slow (right)",
      },
      sv: {
        athleteSummary: "Spelarsammanfattning",
        athlete: "Spelare",
        left: "Vänster",
        right: "Höger",
        weakerDir: "Svagare riktning",
        category: "Kategori",
        perf: "Prestation",
        bal: "Balans",
        overall: "Total",
        page: "Sida",
        actionPlan: "Åtgärdsplan (regelbaserad)",
        athleteFocus: "Spelarfokus (regelbaserat)",
        triggers: "Utlösare",
        why: "Varför",
        scatterTitle: "Kvadrant: bästa tid vs asymmetri",
        scatterSub:
          "X = bästa 5-0-5-tid (s). Y = asymmetri (%). Lägre är bättre.",
        lowAsym: "Låg asymmetri (nere) → Hög (uppe)",
        fast: "Snabb (vänster) → Långsam (höger)",
      },
    };
    return dict[lang][key] || key;
  };

  const formatCategory = (cat: string | null) => {
    if (!cat) return "—";
    if (lang === "en") return cat;
    const map: Record<string, string> = {
      Elite: "Elit",
      Strong: "Stark",
      Moderate: "Måttlig",
      "Needs Development": "Behöver förbättras",
    };
    return map[cat] || cat;
  };

  const formatDir = (dir: "left" | "right" | null) => {
    if (!dir) return "—";
    if (lang === "sv") return dir === "left" ? "Vänster" : "Höger";
    return dir === "left" ? "Left" : "Right";
  };

  const athleteFocusGroups = (() => {
    const focus = report.athletes
      .filter(
        (a) => a.category === "Moderate" || a.category === "Needs Development",
      )
      .filter((a) => !!a.advice && !!a.advice.key);

    const groups = new Map<
      string,
      {
        key: string;
        title: string;
        why: string[];
        actions: string[];
        athleteNames: string[];
        severity: "needs" | "moderate";
      }
    >();

    for (const a of focus) {
      const key = a.advice!.key;
      const existing = groups.get(key);
      const severity =
        a.category === "Needs Development" ? "needs" : "moderate";

      if (!existing) {
        groups.set(key, {
          key,
          title: a.advice!.title || t("athleteFocus"),
          why: a.advice!.why || [],
          actions: a.advice!.actions || [],
          athleteNames: [a.name],
          severity,
        });
      } else {
        existing.athleteNames.push(a.name);
        if (severity === "needs") existing.severity = "needs";
      }
    }

    return Array.from(groups.values())
      .sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "needs" ? -1 : 1;
        return b.athleteNames.length - a.athleteNames.length;
      })
      .slice(0, 4);
  })();

  const athletesForFootTimes = report.athletes
    .slice()
    .filter(
      (a) =>
        (typeof a.left_best === "number" && Number.isFinite(a.left_best)) ||
        (typeof a.right_best === "number" && Number.isFinite(a.right_best)),
    )
    .sort((a, b) => {
      const as = a.asymmetry_pct ?? Number.NEGATIVE_INFINITY;
      const bs = b.asymmetry_pct ?? Number.NEGATIVE_INFINITY;
      return bs - as;
    })
    .map((a) => ({
      name: a.name,
      left: a.left_best,
      right: a.right_best,
    }));

  const avgFootTime = (() => {
    const vals = athletesForFootTimes
      .flatMap((a) => [a.left, a.right])
      .filter((x): x is number => typeof x === "number" && Number.isFinite(x));
    if (vals.length === 0) return null;
    return vals.reduce((sum, v) => sum + v, 0) / vals.length;
  })();

  const athletesBySpeed = report.athletes
    .filter((a) => typeof a.best === "number" && Number.isFinite(a.best))
    .slice()
    .sort((a, b) => (a.best || 0) - (b.best || 0));

  const whatToDoNextSessions = (report.sessions || []).slice(0, 2);

  const blockTheme = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("warm") || t.includes("uppvärm"))
      return { color: "#38bdf8", label: lang === "sv" ? "Uppvärm" : "Warm-up" };
    if (t.includes("brake") || t.includes("inbrom"))
      return { color: "#fb923c", label: lang === "sv" ? "Broms" : "Braking" };
    if (t.includes("timed") || t.includes("tidtag"))
      return { color: "#a78bfa", label: lang === "sv" ? "Tid" : "Timed" };
    if (t.includes("weak") || t.includes("svag"))
      return {
        color: "#22c55e",
        label: lang === "sv" ? "Svag sida" : "Weak side",
      };
    return { color: "#cbd5e1", label: lang === "sv" ? "Block" : "Block" };
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={fpaLogo} style={styles.logoImg} />
            <View>
              <Text style={styles.brandName}>Future Pro Athletes</Text>
              <Text style={styles.brandSub}>Club: {props.clubName}</Text>
              <Text style={styles.brandSub}>Station: {stationLabel}</Text>
              <Text style={styles.brandSub}>
                Testing date: {testedDateLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("athleteSummary")}</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.rowHeader]}>
              <Text style={[styles.cell, styles.cellName]}>{t("athlete")}</Text>
              <Text style={[styles.cell, styles.cellNum]}>{t("left")}</Text>
              <Text style={[styles.cell, styles.cellNum]}>{t("right")}</Text>
              <Text style={[styles.cell, styles.cellNum]}>
                {t("weakerDir")}
              </Text>
              <Text style={[styles.cell, styles.cellNum]}>{t("category")}</Text>
              <Text style={[styles.cell, styles.cellNum]}>{t("perf")}</Text>
              <Text style={[styles.cell, styles.cellNum]}>{t("bal")}</Text>
              <Text style={[styles.cell, styles.cellNum]}>{t("overall")}</Text>
            </View>

            {report.athletes.map((a) => (
              <View
                key={a.user_id}
                style={[
                  styles.row,
                  {
                    backgroundColor: rowBgForCategory(a.category),
                  },
                ]}
              >
                <Text style={[styles.cell, styles.cellName]}>{a.name}</Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {f2(a.left_best)}
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {f2(a.right_best)}
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {formatDir(a.slower_side)}
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {formatCategory(a.category)}
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {f0(a.performance_index)}
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {f0(a.balance_score)}
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {f0(a.overall_cod_score)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={fpaLogo} style={styles.logoImg} />
            <View>
              <Text style={styles.brandName}>Future Pro Athletes</Text>
              <Text style={styles.brandSub}>
                Club: {props.clubName} · Station: {stationLabel} · Testing date:{" "}
                {testedDateLabel}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.metaRight}>{t("page")} 2</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Scatter report={report} />

          <FootTimeBarsChart
            title={
              lang === "sv"
                ? "Vänster/Höger tid per spelare"
                : "Left/Right time per athlete"
            }
            subtitle={
              lang === "sv"
                ? "Y-axel = tid (s). Två staplar per spelare. Prickad linje = snitt."
                : "Y-axis = time (s). Two bars per athlete. Dotted line = average."
            }
            athletes={athletesForFootTimes}
            avgTime={avgFootTime}
            legendLeft={lang === "sv" ? "Vänster" : "Left"}
            legendRight={lang === "sv" ? "Höger" : "Right"}
          />

          <BarListChart
            title={
              lang === "sv" ? "Hastighet per spelare" : "Speed per athlete"
            }
            subtitle={
              lang === "sv"
                ? "Lägre tid = snabbare 5-0-5."
                : "Lower time = faster 5-0-5."
            }
            rows={athletesBySpeed.map((a) => ({
              label: a.name,
              value: a.best as number,
            }))}
            valueLabel={(v) => `${v.toFixed(2)}s`}
            maxValue={Math.max(
              2.4,
              ...athletesBySpeed.map((a) => a.best as number),
            )}
            barColor="#60a5fa"
            maxRows={14}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("athleteFocus")}</Text>
          {athleteFocusGroups.map((g) => (
            <View
              key={g.key}
              style={[
                styles.planCard,
                {
                  borderColor: g.severity === "needs" ? "#fecaca" : "#fde68a",
                  backgroundColor:
                    g.severity === "needs" ? "#fff1f2" : "#fffbeb",
                },
              ]}
            >
              <View style={styles.planHeaderRow}>
                <Text style={styles.planTitle}>{g.title}</Text>
                <Text style={styles.planTag}>
                  {g.athleteNames.length}{" "}
                  {lang === "sv" ? "spelare" : "players"}
                </Text>
              </View>

              <View style={styles.pillWrap}>
                {g.athleteNames.map((n) => (
                  <Text key={n} style={styles.athletePill}>
                    {n}
                  </Text>
                ))}
              </View>

              {g.why.length ? (
                <>
                  <Text style={styles.miniLabel}>{t("why")}</Text>
                  <Text style={styles.miniText}>{g.why.join(" ")}</Text>
                </>
              ) : null}

              {g.actions.length ? (
                <>
                  <Text style={styles.miniLabel}>
                    {lang === "sv" ? "Gör detta" : "Do this"}
                  </Text>
                  {g.actions.map((it, idx) => (
                    <Text key={idx} style={styles.actionItem}>
                      - {it}
                    </Text>
                  ))}
                </>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 9, color: "#475569" }}>
            Data source: club test results (5-0-5 left/right). Use consistent
            testing protocol when comparing over time.
          </Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={fpaLogo} style={styles.logoImg} />
            <View>
              <Text style={styles.brandName}>Future Pro Athletes</Text>
              <Text style={styles.brandSub}>
                Club: {props.clubName} · Station: {stationLabel} · Testing date:{" "}
                {testedDateLabel}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.metaRight}>{t("page")} 3</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "sv" ? "Vad du gör härnäst" : "What to do next"}
          </Text>

          {whatToDoNextSessions.map((s, idx) => (
            <View key={s.title} style={styles.sessionCard}>
              <View
                style={[
                  styles.sessionAccent,
                  { backgroundColor: idx === 0 ? "#2563eb" : "#0ea5e9" },
                ]}
              />

              <View style={{ paddingLeft: 6 }}>
                <View style={styles.planHeaderRow}>
                  <Text style={styles.planTitle}>{s.title}</Text>
                  <Text style={styles.planTag}>
                    {s.duration_min} {lang === "sv" ? "min" : "min"}
                  </Text>
                </View>

                <Text style={styles.sessionGoal}>{s.goal}</Text>

                <Text style={styles.equipmentLine}>
                  {lang === "sv" ? "Utrustning: " : "Equipment: "}
                  {s.equipment}
                </Text>

                {s.blocks.slice(0, 5).map((b, bIdx) => (
                  <View
                    key={bIdx}
                    style={[
                      styles.blockWrap,
                      { borderLeftColor: blockTheme(b.title).color },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.blockTitle}>
                        {bIdx + 1}. {b.title}
                      </Text>
                      <Text
                        style={[
                          styles.blockBadge,
                          { backgroundColor: blockTheme(b.title).color + "33" },
                        ]}
                      >
                        {blockTheme(b.title).label}
                      </Text>
                    </View>
                    <Text style={styles.blockWork}>{b.work}</Text>
                    {(b.coaching || []).map((c, j) => (
                      <Text key={j} style={styles.cue}>
                        - {c}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
