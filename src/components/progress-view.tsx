import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, neutrals, radius } from "@/theme";
import { allChapters, dayStatus, type StudyDay } from "@/lib/plan";

type Props = {
  days: StudyDay[];
  checked: Record<string, boolean>;
  todayDay: number;
  totalDays: number;
};

const HEAT_LEVELS = [
  { bg: neutrals.soft, text: neutrals.muted },
  { bg: "rgba(34,197,94,0.30)", text: neutrals.text },
  { bg: "rgba(34,197,94,0.60)", text: "#FFFFFF" },
  { bg: colors.green.text, text: "#FFFFFF" },
];

function heatLevel(day: StudyDay, checked: Record<string, boolean>): number {
  if (day.chapters.length === 0) return -1;
  const done = day.chapters.filter((c) => checked[c.id]).length;
  if (done === 0) return 0;
  const f = done / day.chapters.length;
  if (f < 0.5) return 1;
  if (f < 1) return 2;
  return 3;
}

export function ProgressView({ days, checked, todayDay, totalDays }: Props) {
  const chapters = allChapters(days);
  const total = chapters.length;
  const done = chapters.filter((c) => checked[c.id]).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const daysDone = days.filter(
    (d) => d.chapters.length > 0 && dayStatus(d, checked) === "done",
  ).length;

  const subjects = new Map<string, { label: string; total: number; done: number }>();
  for (const c of chapters) {
    const entry = subjects.get(c.subject) ?? { label: c.subjectLabel, total: 0, done: 0 };
    entry.total += 1;
    if (checked[c.id]) entry.done += 1;
    subjects.set(c.subject, entry);
  }

  const weeks = new Map<number, { total: number; done: number }>();
  for (const c of chapters) {
    const entry = weeks.get(c.week) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (checked[c.id]) entry.done += 1;
    weeks.set(c.week, entry);
  }

  const weekNumbers = [...new Set(days.map((d) => d.week))].sort((a, b) => a - b);
  const byKey = new Map(days.map((d) => [`${d.week}-${d.dayInWeek}`, d]));

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.overall}>
            Overall: {done} / {total}
          </Text>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
        <Text style={styles.caption}>
          Day {todayDay} of {totalDays} • {daysDone}/{days.length} days complete
        </Text>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.heatTitle}>Consistency</Text>
          <Text style={styles.pct}>
            {daysDone}/{days.length} days
          </Text>
        </View>
        {weekNumbers.length === 0 ? (
          <Text style={styles.empty}>No days in this plan yet.</Text>
        ) : (
          <>
            <View style={styles.heatLabels}>
              {weekNumbers.map((w) => (
                <Text key={w} style={styles.heatLabel}>
                  W{w}
                </Text>
              ))}
            </View>
            <View style={styles.heatGrid}>
              {weekNumbers.map((w) => (
                <View key={w} style={styles.heatCol}>
                  {[1, 2, 3, 4, 5, 6, 7].map((diw) => {
                    const d = byKey.get(`${w}-${diw}`);
                    if (!d) return <View key={diw} style={styles.heatSpacer} />;
                    const level = heatLevel(d, checked);
                    const cell =
                      level === -1
                        ? { bg: neutrals.background, text: neutrals.border }
                        : HEAT_LEVELS[level];
                    return (
                      <View
                        key={diw}
                        accessibilityRole="text"
                        accessibilityLabel={`Day ${d.day}, ${d.chapters.filter((c) => checked[c.id]).length} of ${d.chapters.length} chapters done`}
                        style={[styles.heatCell, { backgroundColor: cell.bg }]}
                      >
                        <Text style={[styles.heatNum, { color: cell.text }]}>{d.day}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <Text style={styles.legendText}>Less</Text>
              {[HEAT_LEVELS[0], HEAT_LEVELS[1], HEAT_LEVELS[2], HEAT_LEVELS[3]].map(
                (l, i) => (
                  <View
                    key={i}
                    style={[styles.legendSwatch, { backgroundColor: l.bg }]}
                  />
                ),
              )}
              <Text style={styles.legendText}>More</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.grid}>
        {[...subjects.entries()].map(([id, s]) => {
          const p = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
          const pill = p === 100 ? colors.green : p > 0 ? colors.orange : colors.red;
          return (
            <View key={id} style={styles.subCard}>
              <Text style={styles.subLabel}>{s.label}</Text>
              <Text style={styles.subCount}>
                {s.done} / {s.total}
              </Text>
              <View style={styles.barThin}>
                <View style={[styles.fill, { width: `${p}%` }]} />
              </View>
              <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                <Text style={[styles.pillText, { color: pill.text }]}>{p}%</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.weekTitle}>Weeks</Text>
        {[...weeks.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([week, w]) => {
            const p = w.total === 0 ? 0 : Math.round((w.done / w.total) * 100);
            return (
              <View key={week} style={styles.weekRow}>
                <Text style={styles.weekLabel}>
                  Week {week} • {w.done}/{w.total}
                </Text>
                <Text style={styles.weekPct}>{p}%</Text>
                <View style={styles.barThin}>
                  <View style={[styles.fill, { width: `${p}%` }]} />
                </View>
              </View>
            );
          })}
        {weeks.size === 0 ? (
          <Text style={styles.empty}>No weeks in this plan yet.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  card: {
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: 14,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overall: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: neutrals.text,
  },
  pct: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: neutrals.muted,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: neutrals.muted,
    marginTop: 2,
  },
  bar: {
    height: 10,
    backgroundColor: neutrals.border,
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: 10,
  },
  barThin: {
    height: 6,
    backgroundColor: neutrals.border,
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: 6,
  },
  fill: {
    height: "100%",
    backgroundColor: neutrals.ink,
    borderRadius: radius.full,
  },
  heatTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: neutrals.text,
  },
  heatLabels: {
    flexDirection: "row",
    gap: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  heatLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 10,
    color: neutrals.muted,
  },
  heatGrid: {
    flexDirection: "row",
    gap: 4,
  },
  heatCol: {
    flex: 1,
    gap: 4,
  },
  heatCell: {
    aspectRatio: 1,
    borderRadius: 7,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  heatSpacer: {
    aspectRatio: 1,
  },
  heatNum: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginTop: 10,
  },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: neutrals.muted,
    marginHorizontal: 2,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  subCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: 12,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  subLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: neutrals.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subCount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: neutrals.text,
    marginTop: 2,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  weekTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: neutrals.text,
    marginBottom: 4,
  },
  weekRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: neutrals.border,
  },
  weekLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: neutrals.text,
  },
  weekPct: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: neutrals.muted,
    marginTop: 2,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: neutrals.muted,
    fontStyle: "italic",
    marginTop: 8,
  },
});
