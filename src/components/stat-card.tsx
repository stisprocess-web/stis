import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, hint, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border/80">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
      {hint && (
        <p className={`mt-1 text-xs ${
          trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-text-muted"
        }`}>
          {hint}
        </p>
      )}
    </div>
  );
}
