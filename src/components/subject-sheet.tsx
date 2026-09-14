import { forwardRef, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { colors, fonts, neutrals, radius } from "@/theme";
import type { StudyPlan } from "@/lib/plan";

type Props = {
  plansList: StudyPlan[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export const SubjectSheet = forwardRef<BottomSheetModal, Props>(function SubjectSheet(
  { plansList, selectedId, onSelect },
  ref,
) {
  const snapPoints = useMemo(() => ["45%"], []);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Choose subject</Text>
        <Text style={styles.subtitle}>Switch the study plan used on this device.</Text>
        {plansList.map((p) => {
          const active = p.id === selectedId;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={p.title}
              onPress={() => onSelect(p.id)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{p.title}</Text>
                <Text style={styles.optionSubtitle}>{p.subtitle}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.dot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: neutrals.card,
    borderRadius: 20,
  },
  indicator: {
    backgroundColor: neutrals.border,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: neutrals.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: neutrals.muted,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: neutrals.border,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: neutrals.text,
  },
  optionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: neutrals.muted,
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: neutrals.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.green.text,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green.text,
  },
});
