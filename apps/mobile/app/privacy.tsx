/* ── In-app privacy screen (App v1 phase 6) — plain-language, matches
 * pulsenyc.app/privacy. States exactly where each kind of data goes. */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, typography, radius } from "../theme/tokens";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Your location",
    body: "Used only to find healthy food within a walk of you. It is sent to the PulseNYC near-me endpoint to rank venues and is not stored server-side, sold, or shared with third parties. You can deny location and browse from a default Long Island City view.",
  },
  {
    title: "Your food log & goals",
    body: "Stored on this device. If you sign in, logs sync to your PulseNYC account (Supabase) so they survive reinstalls — signing in is never required to use the app.",
  },
  {
    title: "Verification photos",
    body: "When you verify a spot, your menu photo, the capture time, and your distance from the venue are uploaded for human review. Photos live in a private bucket and are used only to verify venue data. Anonymous submissions are credited as \"a local\".",
  },
  {
    title: "Analytics",
    body: "PulseNYC uses its own cookieless event counts (searches, card taps) with no personal identifiers and no third-party ad or analytics SDKs.",
  },
  {
    title: "Notifications",
    body: "Meal nudges are OFF by default and only turn on if you opt in. Quiet hours are respected.",
  },
  {
    title: "Venue data sources",
    body: "Health grades come from NYC DOHMH. Venue status, hours & locations are powered by Google. Nutrition data comes from published chain nutrition, USDA, and honest cuisine-level estimates labeled \"est.\"",
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}>
      <Text style={s.title}>Privacy</Text>
      <Text style={s.subtitle}>The short version: your data works for you, not for advertisers.</Text>
      {SECTIONS.map((sec) => (
        <View key={sec.title} style={s.card}>
          <Text style={s.cardTitle}>{sec.title}</Text>
          <Text style={s.cardBody}>{sec.body}</Text>
        </View>
      ))}
      <TouchableOpacity onPress={() => Linking.openURL("https://pulsenyc.app/privacy")} accessibilityRole="link">
        <Text style={s.link}>Full policy at pulsenyc.app/privacy →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.doneBtn} onPress={() => router.back()} accessibilityRole="button">
        <Text style={s.doneText}>Done</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20 },
  title: { ...typography.hero, color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular`, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 14, color: colors.textPrimary, fontFamily: `${fonts.body}_700Bold`, marginBottom: 4 },
  cardBody: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular`, lineHeight: 19 },
  link: { fontSize: 13, color: colors.accentSky, fontFamily: `${fonts.body}_600SemiBold`, marginTop: 6 },
  doneBtn: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSage,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { fontSize: 15, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold` },
});
