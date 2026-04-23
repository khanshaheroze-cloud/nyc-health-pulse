import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {user ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.joined}>
              Joined {new Date(user.created_at).toLocaleDateString()}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Nutrition Goals</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>Connected Apps</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.signInPrompt}>
            <Text style={styles.promptIcon}>🔐</Text>
            <Text style={styles.promptTitle}>Sign in to sync your data</Text>
            <Text style={styles.promptHint}>
              Your logs sync across devices and persist when you upgrade your phone.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push("/signin")}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1e2d2a" },
  content: { paddingHorizontal: 20 },
  card: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: "#e2e8e4",
  },
  email: { fontSize: 16, fontWeight: "600", color: "#1e2d2a" },
  joined: { fontSize: 12, color: "#8ba89c", marginTop: 4 },
  menuItem: {
    backgroundColor: "#ffffff", borderRadius: 12, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: "#e2e8e4",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "500", color: "#1e2d2a" },
  menuArrow: { fontSize: 20, color: "#8ba89c" },
  signOutButton: {
    marginTop: 24, padding: 16, borderRadius: 12,
    backgroundColor: "#fee2e2", alignItems: "center",
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#991b1b" },
  signInPrompt: { alignItems: "center", paddingTop: 60 },
  promptIcon: { fontSize: 48, marginBottom: 16 },
  promptTitle: { fontSize: 18, fontWeight: "700", color: "#1e2d2a" },
  promptHint: { fontSize: 13, color: "#5a7a6e", textAlign: "center", marginTop: 8, maxWidth: 280 },
  signInButton: {
    marginTop: 24, backgroundColor: "#2dd4a0", paddingVertical: 14,
    paddingHorizontal: 48, borderRadius: 14,
  },
  signInButtonText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
});
