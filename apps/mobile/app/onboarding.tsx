import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, radius, fonts } from "../theme/tokens";
import {
  IconActivity,
  IconSmartphone,
  IconGlobe,
  IconMail,
  IconArrowRight,
} from "../components/ui/Icons";

const SUGGESTED_HOODS = [
  { name: "Long Island City", borough: "Queens" },
  { name: "Astoria", borough: "Queens" },
  { name: "Williamsburg", borough: "Brooklyn" },
  { name: "East Village", borough: "Manhattan" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"welcome" | "setup">("welcome");
  const [name, setName] = useState("");
  const [selectedHood, setSelectedHood] = useState<
    (typeof SUGGESTED_HOODS)[0] | null
  >(null);

  const handleSkipAuth = () => setStep("setup");

  const handleComplete = async () => {
    if (name.trim()) {
      await AsyncStorage.setItem("pulse-user-name", name.trim());
    }
    if (selectedHood) {
      await AsyncStorage.setItem(
        "pulse-neighborhood",
        JSON.stringify(selectedHood),
      );
    }
    await AsyncStorage.setItem("pulse-onboarded", "true");
    router.replace("/(tabs)");
  };

  if (step === "welcome") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <IconActivity size={32} color="#FFFFFF" />
        </View>

        <Text style={styles.appName}>Pulse NYC</Text>
        <Text style={styles.tagline}>
          Your pocket health companion{"\n"}for New York City
        </Text>

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.authBtn}
            onPress={handleSkipAuth}
            activeOpacity={0.7}
          >
            <IconSmartphone size={18} color={colors.textPrimary} />
            <Text style={styles.authBtnLabel}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authBtn}
            onPress={handleSkipAuth}
            activeOpacity={0.7}
          >
            <IconGlobe size={18} color={colors.textPrimary} />
            <Text style={styles.authBtnLabel}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authBtn}
            onPress={handleSkipAuth}
            activeOpacity={0.7}
          >
            <IconMail size={18} color={colors.textPrimary} />
            <Text style={styles.authBtnLabel}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSkipAuth} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.setupInner, { paddingTop: insets.top + 40 }]}>
        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressDotDone]} />
          <View style={[styles.progressBar, styles.progressBarDone]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>

        <Text style={styles.setupTitle}>Let's set you up</Text>
        <Text style={styles.setupSub}>
          We'll personalize your dashboard with this info.
        </Text>

        {/* Name input */}
        <Text style={styles.inputLabel}>What should we call you?</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Your first name"
          placeholderTextColor={colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Neighborhood */}
        <Text style={[styles.inputLabel, { marginTop: 24 }]}>
          Pick your neighborhood
        </Text>
        <View style={styles.hoodGrid}>
          {SUGGESTED_HOODS.map((hood) => {
            const selected = selectedHood?.name === hood.name;
            return (
              <TouchableOpacity
                key={hood.name}
                style={[styles.hoodChip, selected && styles.hoodChipSelected]}
                onPress={() => setSelectedHood(selected ? null : hood)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.hoodChipText,
                    selected && styles.hoodChipTextSelected,
                  ]}
                >
                  {hood.name}
                </Text>
                <Text
                  style={[
                    styles.hoodBorough,
                    selected && { color: "rgba(255,255,255,0.7)" },
                  ]}
                >
                  {hood.borough}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.continueBtnLabel}>Continue</Text>
          <IconArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  setupInner: {
    flex: 1,
    paddingHorizontal: 24,
  },

  /* Welcome */
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accentSage,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  appName: {
    fontFamily: `${fonts.display}_400Regular`,
    fontSize: 36,
    color: colors.textPrimary,
    textAlign: "center",
  },
  tagline: {
    fontFamily: `${fonts.body}_400Regular`,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  authButtons: {
    marginTop: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  authBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingVertical: 14,
  },
  authBtnLabel: {
    fontFamily: `${fonts.body}_600SemiBold`,
    fontSize: 15,
    color: colors.textPrimary,
  },
  skipBtn: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: `${fonts.body}_500Medium`,
    fontSize: 14,
    color: colors.textTertiary,
  },

  /* Progress */
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 0,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderLight,
  },
  progressDotDone: {
    backgroundColor: colors.accentSage,
  },
  progressDotActive: {
    backgroundColor: colors.accentSage,
    borderWidth: 2,
    borderColor: "#E8F0EA",
  },
  progressBar: {
    width: 40,
    height: 3,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
  },
  progressBarDone: {
    backgroundColor: colors.accentSage,
  },

  /* Setup */
  setupTitle: {
    fontFamily: `${fonts.display}_400Regular`,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  setupSub: {
    fontFamily: `${fonts.body}_400Regular`,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: `${fonts.body}_600SemiBold`,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: `${fonts.body}_400Regular`,
    color: colors.textPrimary,
  },

  /* Neighborhoods */
  hoodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  hoodChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "47%" as any,
  },
  hoodChipSelected: {
    backgroundColor: colors.accentSage,
    borderColor: colors.accentSage,
  },
  hoodChipText: {
    fontFamily: `${fonts.body}_600SemiBold`,
    fontSize: 13,
    color: colors.textPrimary,
  },
  hoodChipTextSelected: {
    color: "#FFFFFF",
  },
  hoodBorough: {
    fontFamily: `${fonts.body}_400Regular`,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },

  /* Continue */
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 16,
    marginTop: 40,
  },
  continueBtnLabel: {
    fontFamily: `${fonts.body}_700Bold`,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
