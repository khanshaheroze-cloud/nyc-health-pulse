import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { colors, fonts, radius } from "../theme/tokens";
import {
  SPLIT_PROGRAMS,
  WORKOUT_TEMPLATES,
  estimateDuration,
  totalSets,
  type WorkoutTemplate,
  type SplitProgram,
} from "../lib/workoutTemplates";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: WorkoutTemplate) => void;
}

export function WorkoutTemplatePicker({ visible, onClose, onSelect }: Props) {
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const handleProgramPress = (program: SplitProgram) => {
    setExpandedProgram(expandedProgram === program.id ? null : program.id);
  };

  const handleDaySelect = (template: WorkoutTemplate) => {
    setExpandedProgram(null);
    onSelect(template);
  };

  const handleSingleSelect = (template: WorkoutTemplate) => {
    setExpandedProgram(null);
    onSelect(template);
  };

  const handleClose = () => {
    setExpandedProgram(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={s.backdrop}>
        <TouchableOpacity
          style={s.dismissArea}
          onPress={handleClose}
          activeOpacity={1}
        />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Choose a Workout</Text>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* ── Programs (Multi-Day) ── */}
            <Text style={s.sectionLabel}>PROGRAMS (MULTI-DAY)</Text>
            {SPLIT_PROGRAMS.map((program) => (
              <View key={program.id}>
                <TouchableOpacity
                  style={[
                    s.templateCard,
                    expandedProgram === program.id && s.templateCardExpanded,
                  ]}
                  onPress={() => handleProgramPress(program)}
                  activeOpacity={0.7}
                >
                  <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.templateName}>{program.name}</Text>
                      <Text style={s.templateMeta}>{program.description}</Text>
                    </View>
                    <View style={s.chevronWrap}>
                      <Text style={s.chevron}>
                        {expandedProgram === program.id ? "▲" : "▼"}
                      </Text>
                    </View>
                  </View>
                  <View style={s.statRow}>
                    <View style={s.stat}>
                      <Text style={s.statVal}>{program.days.length}</Text>
                      <Text style={s.statLabel}>days</Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statVal}>
                        {program.days.reduce(
                          (sum, d) => sum + d.exercises.length,
                          0
                        )}
                      </Text>
                      <Text style={s.statLabel}>exercises</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded day picker */}
                {expandedProgram === program.id && (
                  <View style={s.dayList}>
                    <Text style={s.dayListTitle}>Pick today's workout:</Text>
                    {program.days.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        style={s.dayCard}
                        onPress={() => handleDaySelect(day)}
                        activeOpacity={0.7}
                      >
                        <View style={s.dayDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.dayName}>{day.name}</Text>
                          <Text style={s.dayMeta}>
                            {day.exercises.length} exercises{" "}
                            {"·"}{" "}
                            {totalSets(day.exercises)} sets{" "}
                            {"·"}{" "}
                            ~{estimateDuration(day.exercises)} min
                          </Text>
                        </View>
                        <Text style={s.dayArrow}>{"›"}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* ── Single Workouts ── */}
            <Text style={[s.sectionLabel, { marginTop: 22 }]}>
              SINGLE WORKOUTS
            </Text>
            {WORKOUT_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={s.templateCard}
                onPress={() => handleSingleSelect(template)}
                activeOpacity={0.7}
              >
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.templateName}>{template.name}</Text>
                    <Text style={s.templateMeta}>
                      {template.exercises
                        .slice(0, 3)
                        .map((e) => e.name)
                        .join(", ")}
                      {template.exercises.length > 3 ? " ..." : ""}
                    </Text>
                  </View>
                  <Text style={s.dayArrow}>{"›"}</Text>
                </View>
                <View style={s.statRow}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>
                      {template.exercises.length}
                    </Text>
                    <Text style={s.statLabel}>exercises</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>
                      {totalSets(template.exercises)}
                    </Text>
                    <Text style={s.statLabel}>sets</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>
                      ~{estimateDuration(template.exercises)}
                    </Text>
                    <Text style={s.statLabel}>min</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    marginBottom: 10,
  },

  /* Template card */
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  templateCardExpanded: {
    borderColor: colors.accentSage,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  templateName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
  templateMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 3,
    lineHeight: 17,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSage,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  chevron: {
    fontSize: 10,
    color: colors.accentSage,
  },
  statRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  stat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  statVal: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_700Bold`,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
  },

  /* Day list (expanded program) */
  dayList: {
    backgroundColor: colors.surfaceSage,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.accentSage,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  dayListTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_600SemiBold`,
    marginBottom: 10,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentSage,
    marginRight: 12,
  },
  dayName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
  dayMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 2,
  },
  dayArrow: {
    fontSize: 24,
    color: colors.textTertiary,
    marginLeft: 8,
  },
});
