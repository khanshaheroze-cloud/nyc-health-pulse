import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "signin"
            ? "Sign in to sync your nutrition log"
            : "Create an account to save your data across devices"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8ba89c"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8ba89c"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          <Text style={styles.toggle}>
            {mode === "signin"
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skip}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#1e2d2a", textAlign: "center" },
  subtitle: {
    fontSize: 14, color: "#5a7a6e", textAlign: "center",
    marginTop: 8, marginBottom: 32, maxWidth: 300, alignSelf: "center",
  },
  input: {
    backgroundColor: "#ffffff", borderRadius: 14, padding: 16,
    fontSize: 16, color: "#1e2d2a", marginBottom: 12,
    borderWidth: 1, borderColor: "#e2e8e4",
  },
  error: { color: "#f07070", fontSize: 13, textAlign: "center", marginBottom: 12 },
  submitButton: {
    backgroundColor: "#2dd4a0", padding: 16, borderRadius: 14,
    alignItems: "center", marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  toggle: { fontSize: 14, color: "#2dd4a0", textAlign: "center", marginTop: 20, fontWeight: "500" },
  skip: { fontSize: 14, color: "#8ba89c", textAlign: "center", marginTop: 16 },
});
