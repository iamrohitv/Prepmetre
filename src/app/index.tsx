import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { DayCard } from "@/components/day-card";
import { ProgressView } from "@/components/progress-view";
import { SubjectSheet } from "@/components/subject-sheet";
import {
  buildDays,
  calcTodayDay,
  getPlan,
  orderDaysForTrack,
  plans,
  startOfToday,
} from "@/lib/plan";
import { colors, fonts, neutrals, radius } from "@/theme";

type Tab = "track" | "progress";

const PLAN_KEY = "prepmetre:selected-plan";
const checksKey = (planId: string) => `prepmetre:checks:${planId}`;
const startKey = (planId: string) => `prepmetre:start:${planId}`;

export default function Index() {
  const [tab, setTab] = useState<Tab>("track");
  const [planId, setPlanId] = useState(plans[0].id);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [startISO, setStartISO] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const sheetRef = useRef<BottomSheetModal>(null);

  const plan = getPlan(planId);
  const days = useMemo(() => buildDays(plan), [plan]);
  const todayDay = useMemo(
    () => calcTodayDay(startISO, plan.totalDays),
    [startISO, plan.totalDays],
  );
  const ordered = useMemo(() => orderDaysForTrack(days, todayDay), [days, todayDay]);
  const today = days.find((d) => d.day === todayDay);
  const upcoming = ordered.filter((d) => d.day > todayDay);
  const previous = ordered.filter((d) => d.day < todayDay);
  const initials = plan.title
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        const storedPlan = await AsyncStorage.getItem(PLAN_KEY);
        const activeId = storedPlan ?? plans[0].id;
        const [storedChecks, storedStart] = await Promise.all([
          AsyncStorage.getItem(checksKey(activeId)),
          AsyncStorage.getItem(startKey(activeId)),
        ]);
        setPlanId(activeId);
        setChecked(storedChecks ? JSON.parse(storedChecks) : {});
        if (storedStart) {
          setStartISO(storedStart);
        } else {
          const today = startOfToday();
          setStartISO(today);
          await AsyncStorage.setItem(startKey(activeId), today);
        }
      } catch {
        setChecked({});
        setStartISO(startOfToday());
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const switchPlan = useCallback(async (id: string) => {
    setHydrated(false);
    try {
      const [storedChecks, storedStart] = await Promise.all([
        AsyncStorage.getItem(checksKey(id)),
        AsyncStorage.getItem(startKey(id)),
      ]);
      setPlanId(id);
      setChecked(storedChecks ? JSON.parse(storedChecks) : {});
      if (storedStart) {
        setStartISO(storedStart);
      } else {
        const today = startOfToday();
        setStartISO(today);
        await AsyncStorage.setItem(startKey(id), today);
      }
      await AsyncStorage.setItem(PLAN_KEY, id);
    } catch {
      setPlanId(id);
      setChecked({});
      setStartISO(startOfToday());
    } finally {
      setHydrated(true);
    }
    sheetRef.current?.dismiss();
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      setChecked((prev) => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = true;
        AsyncStorage.setItem(checksKey(planId), JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [planId],
  );

  const reset = useCallback(() => {
    Alert.alert(
      "Reset progress?",
      `This clears all checked chapters for ${plan.title}. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setChecked({});
            await AsyncStorage.setItem(checksKey(planId), JSON.stringify({})).catch(
              () => {},
            );
          },
        },
      ],
    );
  }, [planId, plan.title]);

  const openSheet = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Study plan: ${plan.title}. Change subject.`}
          onPress={openSheet}
          style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.planText}>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
          </View>
          <Text style={styles.planChange}>Change ›</Text>
        </Pressable>

        <View style={styles.tabs}>
          {(["track", "progress"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t === "track" ? "Track" : "Progress"}
                onPress={() => setTab(t)}
                style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
              >
                <Text style={active ? styles.tabTextActive : styles.tabTextInactive}>
                  {t === "track" ? "Track" : "Progress"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!hydrated ? (
          <View style={styles.loading}>
            <ActivityIndicator color={neutrals.muted} />
          </View>
        ) : tab === "progress" ? (
          <View style={styles.list}>
            <ProgressView
              days={days}
              checked={checked}
              todayDay={todayDay}
              totalDays={plan.totalDays}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset progress"
              onPress={reset}
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            >
              <Text style={styles.resetButtonText}>Reset progress</Text>
            </Pressable>
          </View>
        ) : days.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No days yet</Text>
            <Text style={styles.emptyText}>
              This plan has no weeks in the JSON file. Add weeks to start tracking.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {today ? (
              <View style={styles.group}>
                <DayCard
                  day={today}
                  badge="Today"
                  highlight
                  checked={checked}
                  onToggle={toggle}
                />
              </View>
            ) : null}
            {upcoming.length > 0 ? (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>Upcoming</Text>
                  <Text style={styles.groupCount}>{upcoming.length} days</Text>
                </View>
                {upcoming.map((d) => (
                  <DayCard key={d.day} day={d} checked={checked} onToggle={toggle} />
                ))}
              </View>
            ) : null}
            {previous.length > 0 ? (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>Previous</Text>
                  <Text style={styles.groupCount}>{previous.length} days</Text>
                </View>
                {previous.map((d) => (
                  <DayCard key={d.day} day={d} checked={checked} onToggle={toggle} />
                ))}
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset progress"
              onPress={reset}
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            >
              <Text style={styles.resetButtonText}>Reset progress</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <SubjectSheet
        ref={sheetRef}
        plansList={plans}
        selectedId={planId}
        onSelect={switchPlan}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: neutrals.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  pressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: neutrals.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: neutrals.text,
  },
  planSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: neutrals.muted,
    marginTop: 1,
  },
  planChange: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: neutrals.muted,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.full,
    borderCurve: "continuous",
    padding: 4,
    gap: 4,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: neutrals.ink,
  },
  tabInactive: {
    backgroundColor: "transparent",
  },
  tabTextActive: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  tabTextInactive: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: neutrals.muted,
  },
  loading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  list: {
    gap: 16,
  },
  group: {
    gap: 12,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: neutrals.text,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  groupCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: neutrals.muted,
  },
  emptyCard: {
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: neutrals.text,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: neutrals.muted,
    marginTop: 4,
  },
  resetButton: {
    alignItems: "center",
    backgroundColor: neutrals.card,
    borderColor: neutrals.border,
    borderWidth: 1,
    borderRadius: radius.full,
    borderCurve: "continuous",
    paddingVertical: 12,
  },
  resetButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.red.text,
  },
});
