/**
 * @module app/login/page
 * Login page — minimal layout with the login form component.
 */

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold">Secure Login</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to access reporting, team payroll, and billing workflows.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
