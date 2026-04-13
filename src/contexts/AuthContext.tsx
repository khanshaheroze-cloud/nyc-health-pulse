"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  display_name: string | null;
  neighborhood: string | null;
  onboarding_complete: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  enabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  const fetchProfileData = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, neighborhood, onboarding_complete")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setProfile(data as Profile);
      } else if (error?.code === "PGRST116") {
        // Profile doesn't exist yet — create stub
        const stub: Profile = {
          display_name: null,
          neighborhood: null,
          onboarding_complete: false,
        };
        await supabase.from("profiles").upsert({ id: userId, ...stub });
        setProfile(stub);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Get initial user
    supabase.auth.getUser().then(({ data: { user: u } }: { data: { user: User | null } }) => {
      setUser(u);
      if (u) fetchProfileData(u.id);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchProfileData(newUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Auth is not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Auth is not configured");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;

      // Create profile row
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName,
        });
      }
    },
    [],
  );

  const signOutFn = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Auth is not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user) await fetchProfileData(user.id);
  }, [user, fetchProfileData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        enabled: supabaseEnabled,
        signIn,
        signUp,
        signOut: signOutFn,
        signInWithGoogle,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
