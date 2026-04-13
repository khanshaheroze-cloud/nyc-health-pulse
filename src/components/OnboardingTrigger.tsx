"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingModal } from "@/components/OnboardingModal";

export function OnboardingTrigger() {
  const { user, profile, refetchProfile } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user && profile && profile.onboarding_complete === false) {
      setShow(true);
    }
  }, [user, profile]);

  if (!show || !user) return null;

  return (
    <OnboardingModal
      userId={user.id}
      currentName={
        profile?.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        null
      }
      onComplete={() => {
        setShow(false);
        refetchProfile();
      }}
    />
  );
}
