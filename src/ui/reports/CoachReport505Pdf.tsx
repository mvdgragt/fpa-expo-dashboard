import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Svg,
  Line,
  Circle,
  Rect,
} from "@react-pdf/renderer";

import type { CoachReport505 } from "../../lib/reports/coachReport505";

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
});

const f2 = (n: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "—";
const f1 = (n: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : "—";

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

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <Text style={styles.sectionTitle}>Quadrant: best time vs asymmetry</Text>
      <Text style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}>
        X = best 5-0-5 time (s). Y = asymmetry (%). Lower is better.
      </Text>

      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill="#ffffff" />

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
          Fast (left) → Slow (right)
        </Text>
        <Text style={{ fontSize: 9, color: "#475569" }}>
          Low asymmetry (bottom) → High (top)
        </Text>
      </View>
    </View>
  );
};

export const CoachReport505Pdf = (props: {
  clubName: string;
  report: CoachReport505;
  filters: {
    sex: string;
    minAge: string;
    maxAge: string;
  };
}) => {
  const { report } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Coach Report · 5-0-5</Text>
            <Text style={styles.subtitle}>{props.clubName}</Text>
          </View>
          <View>
            <Text style={styles.metaRight}>
              Generated: {new Date(report.generated_at).toLocaleString()}
            </Text>
            <Text style={styles.metaRight}>
              Filters: sex={props.filters.sex}, age=
              {props.filters.minAge || "—"}–{props.filters.maxAge || "—"}
            </Text>
          </View>
        </View>

        <View style={styles.grid2}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Athletes</Text>
            <Text style={styles.cardValue}>{report.team.athletes_n}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Avg best</Text>
            <Text style={styles.cardValue}>{f2(report.team.avg_best)}s</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Avg asymmetry</Text>
            <Text style={styles.cardValue}>
              {f1(report.team.avg_asymmetry_pct)}%
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.grid2]}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Fastest best</Text>
            <Text style={styles.cardValue}>
              {f2(report.team.fastest_best)}s
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Slowest best</Text>
            <Text style={styles.cardValue}>
              {f2(report.team.slowest_best)}s
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Asymmetry distribution</Text>
            <Text style={{ marginTop: 6, fontSize: 9, color: "#0f172a" }}>
              &lt;5%: {report.team.asymmetry_lt_5_n} · 5–10%:{" "}
              {report.team.asymmetry_5_10_n} · &gt;10%:{" "}
              {report.team.asymmetry_gt_10_n}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 9, color: "#0f172a" }}>
              Slower left: {report.team.slower_left_n} · Slower right:{" "}
              {report.team.slower_right_n}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Athlete summary (best)</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.rowHeader]}>
              <Text style={[styles.cell, styles.cellName]}>Athlete</Text>
              <Text style={[styles.cell, styles.cellSmall]}>Left</Text>
              <Text style={[styles.cell, styles.cellSmall]}>Right</Text>
              <Text style={[styles.cell, styles.cellSmall]}>Best</Text>
              <Text style={[styles.cell, styles.cellSmall]}>Asym%</Text>
            </View>

            {report.athletes.slice(0, 12).map((a) => (
              <View key={a.user_id} style={styles.row}>
                <Text style={[styles.cell, styles.cellName]}>{a.name}</Text>
                <Text style={[styles.cell, styles.cellSmall]}>
                  {f2(a.left_best)}
                </Text>
                <Text style={[styles.cell, styles.cellSmall]}>
                  {f2(a.right_best)}
                </Text>
                <Text style={[styles.cell, styles.cellSmall]}>
                  {f2(a.best)}
                </Text>
                <Text style={[styles.cell, styles.cellSmall]}>
                  {f1(a.asymmetry_pct)}
                </Text>
              </View>
            ))}
          </View>

          {report.athletes.length > 12 ? (
            <Text style={{ marginTop: 6, fontSize: 9, color: "#475569" }}>
              Note: Only top 12 athletes shown on page 1.
            </Text>
          ) : null}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Coach Report · 5-0-5</Text>
            <Text style={styles.subtitle}>{props.clubName}</Text>
          </View>
          <View>
            <Text style={styles.metaRight}>Page 2</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Scatter report={report} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action plan (rule-based)</Text>
          {report.actions.map((a) => (
            <View key={a.title} style={styles.actionBlock}>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionRule}>
                Triggers:{" "}
                {a.rules_triggered.length
                  ? a.rules_triggered.join("; ")
                  : "None"}
              </Text>
              {a.items.map((it, idx) => (
                <Text key={idx} style={styles.actionItem}>
                  - {it}
                </Text>
              ))}
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
    </Document>
  );
};
