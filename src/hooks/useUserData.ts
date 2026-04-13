"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase/client";

export interface UserProfile {
  display_name: string | null;
  height_ft: number | null;
  height_in: number | null;
  weight_lbs: number | null;
  age: number | null;
  sex: string | null;
  activity_level: string | null;
  goal: string | null;
  neighborhood: string | null;
}

/**
 * Dual-mode hook: reads from Supabase when authenticated, localStorage when not.
 */
export function useUserData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Read from localStorage for anonymous users
      try {
        const bodyRaw = localStorage.getItem("pulsenyc_body_profile");
        const body = bodyRaw ? JSON.parse(bodyRaw) : null;
        setProfile({
          display_name: localStorage.getItem("pulse-user-name"),
          height_ft: body?.heightFt ?? null,
          height_in: body?.heightIn ?? null,
          weight_lbs: body?.weightLbs ?? null,
          age: body?.age ?? null,
          sex: body?.sex ?? null,
          activity_level: body?.activityLevel ?? null,
          goal: body?.goal ?? null,
          neighborhood: localStorage.getItem("pulse-my-neighborhood"),
        });
      } catch {
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    // Fetch from Supabase for authenticated users
    let cancelled = false;
    async function fetchProfile() {
      try {
        const { data, error } = await getSupabase()!
          .from("profiles")
          .select("display_name, height_ft, height_in, weight_lbs, age, sex, activity_level, goal, neighborhood")
          .eq("id", user!.id)
          .single();

        if (!cancelled) {
          if (error) {
            // Profile might not exist yet — create a stub
            if (error.code === "PGRST116") {
              const stub: UserProfile = {
                display_name: user!.user_metadata?.display_name || user!.email?.split("@")[0] || null,
                height_ft: null, height_in: null, weight_lbs: null,
                age: null, sex: null, activity_level: null, goal: null, neighborhood: null,
              };
              await getSupabase()!.from("profiles").upsert({ id: user!.id, ...stub });
              setProfile(stub);
            } else {
              setProfile(null);
            }
          } else {
            setProfile(data as UserProfile);
          }
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) {
        // Update localStorage for anonymous users
        const bodyRaw = localStorage.getItem("pulsenyc_body_profile");
        const current = bodyRaw ? JSON.parse(bodyRaw) : {};
        const updated = {
          ...current,
          heightFt: updates.height_ft ?? current.heightFt,
          heightIn: updates.height_in ?? current.heightIn,
          weightLbs: updates.weight_lbs ?? current.weightLbs,
          age: updates.age ?? current.age,
          sex: updates.sex ?? current.sex,
          activityLevel: updates.activity_level ?? current.activityLevel,
          goal: updates.goal ?? current.goal,
        };
        localStorage.setItem("pulsenyc_body_profile", JSON.stringify(updated));
        if (updates.display_name) localStorage.setItem("pulse-user-name", updates.display_name);
        if (updates.neighborhood) localStorage.setItem("pulse-my-neighborhood", updates.neighborhood);
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        return;
      }

      // Update Supabase
      const { data, error } = await getSupabase()!
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select("display_name, height_ft, height_in, weight_lbs, age, sex, activity_level, goal, neighborhood")
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    },
    [user],
  );

  return { profile, loading, updateProfile };
}
