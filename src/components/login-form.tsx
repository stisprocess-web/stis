/**
 * @module components/login-form
 * Client-side login form with error feedback.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Login form with email/password fields and inline error display. */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid credentials.");
        return;
      }

      router.push("/reporting");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-black/10 px-3 py-2 dark:border-white/15 dark:bg-zinc-950"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-black/10 px-3 py-2 dark:border-white/15 dark:bg-zinc-950"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-zinc-500">Demo: owner@leairdpi.local / ChangeMe123!</p>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
