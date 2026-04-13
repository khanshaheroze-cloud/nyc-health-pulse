"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signUp(email, password, displayName);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
    setSubmitting(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign up failed");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-hp-green/30 border-t-hp-green rounded-full animate-spin" />
      </div>
    );
  }

  // Confirmation screen
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hp-green/10 mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="font-display text-2xl text-text mb-2">Check your email</h1>
          <p className="text-[14px] text-dim mb-6">
            We sent a confirmation link to <strong className="text-text">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex px-6 py-2.5 rounded-xl bg-hp-green text-white text-[14px] font-bold hover:bg-hp-green/90 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, var(--color-hp-green) 0%, var(--color-hp-green-light) 100%)" }}
          >
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-text mb-1">Create your account</h1>
          <p className="text-[13px] text-dim">Track nutrition, workouts, and health data across devices</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 bg-hp-red/10 border border-hp-red/20 rounded-xl">
            <p className="text-[13px] text-hp-red font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-3.5 mb-5">
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40 transition"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40 transition"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-hp-green text-white text-[14px] font-bold hover:bg-hp-green/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light" />
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="px-3 bg-bg text-muted">or</span>
          </div>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] font-semibold text-text hover:bg-bg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {submitting ? "Connecting..." : "Sign up with Google"}
        </button>

        {/* Sign in link */}
        <p className="text-center mt-6 text-[13px] text-dim">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-hp-green font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
