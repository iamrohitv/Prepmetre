import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, neutrals, radius } from "@/theme";
import { dayStatus, type StudyDay } from "@/lib/plan";

type Props = {
  day: StudyDay;
  badge?: string;
  highlight?: boolean;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
};

function statusStyle(status: ReturnType<typeof dayStatus>) {
  if (status === "done") return { label: "Done", ...colors.green };
  if (status === "partial") return { label: "In progress", ...colors.orange };
  if (status === "empty") return { label: "Rest", ...colors.green };
  return { label: "To do", ...colors.red };
}

export function DayCard({ day, badge, highlight, checked, onToggle }: Props) {
  const status = dayStatus(day, checked);
  const pill = statusStyle(status);
  const done = day.chapters.filter((c) => checked[c.id]).length;

  const grouped = new Map<string, typeof day.chapters>();
  for (const c of day.chapters) {
    const list = grouped.get(c.subjectLabel) ?? [];
    list.push(c);
    grouped.set(c.subjectLabel, list);
  }

  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <View style={styles.topRow}>
        <View>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          <Text style={styles.title}>
            Day {day.day} <Text style={styles.week}>W{day.week}D{day.dayInWeek}</Text>
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillText, { color: pill.text }]}>
            {day.chapters.length > 0 ? `${done}/${day.chapters.length} ${pill.label}` : pill.label}
          </Text>
        </View>
      </View>

      {day.chapters.length === 0 ? (
        <Text style={styles.empty}>No new chapter. Revise and practice previous topics.</Text>
      ) : (
        [...grouped.entries()].map(([subjectLabel, chapters]) => (
          <View key={subjectLabel} style={styles.block}>
            <Text style={styles.subject}>{subjectLabel}</Text>
            {chapters.map((c) => {
              const isChecked = !!checked[c.id];
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={c.name}
                  onPress={() => onToggle(c.id)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={[styles.box, isChecked && styles.boxChecked]}>
                    {isChecked ? <Text style={styles.tick}>✓</Text> : null}
                  </View>
                  <Text style={[styles.chapter, isChecked && styles.chapterChecked]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: 14,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  cardHighlight: {
    borderColor: neutrals.ink,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.10)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: neutrals.border,
  },
  badge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: neutrals.card,
    backgroundColor: neutrals.ink,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: neutrals.text,
    marginTop: 2,
  },
  week: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: neutrals.muted,
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  block: {
    marginTop: 12,
  },
  subject: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: neutrals.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  rowPressed: {
    backgroundColor: neutrals.background,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: neutrals.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    backgroundColor: neutrals.card,
  },
  boxChecked: {
    backgroundColor: colors.green.bg,
    borderColor: colors.green.text,
  },
  tick: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.green.text,
    lineHeight: 16,
  },
  chapter: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: neutrals.text,
    flex: 1,
  },
  chapterChecked: {
    color: neutrals.muted,
    textDecorationLine: "line-through",
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: neutrals.muted,
    fontStyle: "italic",
    marginTop: 10,
  },
});
