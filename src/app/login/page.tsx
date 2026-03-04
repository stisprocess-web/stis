/**
 * @module app/login/page
 * Login page — full-page centered dark login with STIS branding.
 */

import { Suspense } from "react";
import { Shield } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
            <Shield className="h-7 w-7 text-accent" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              STIS
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Leaird PI Case Management
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-surface-elevated" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
