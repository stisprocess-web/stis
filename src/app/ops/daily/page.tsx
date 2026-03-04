/**
 * @module app/ops/daily/page
 * Daily operations dashboard — overdue tasks, at-risk cases, unbilled time, A/R aging.
 */

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getDailyOpsSnapshot } from "@/lib/ops";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Receipt,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DailyOpsPage() {
  const data = await getDailyOpsSnapshot();

  /** Build action items from ops data. */
  function getActionItems(): Array<{ label: string; priority: "high" | "medium" | "low" }> {
    const items: Array<{ label: string; priority: "high" | "medium" | "low" }> = [];

    if (data.overdueTasks.length > 0) {
      items.push({
        label: `Resolve ${data.overdueTasks.length} overdue task${data.overdueTasks.length > 1 ? "s" : ""} immediately`,
        priority: "high",
      });
    }
    if (data.atRiskCases.length > 0) {
      items.push({
        label: `Review ${data.atRiskCases.length} at-risk case${data.atRiskCases.length > 1 ? "s" : ""} with no recent activity`,
        priority: "high",
      });
    }
    if (data.unbilled.amountUsd > 0) {
      items.push({
        label: `Invoice $${data.unbilled.amountUsd.toLocaleString()} in unbilled time (${data.unbilled.hours} hours)`,
        priority: "medium",
      });
    }
    if ((data.arByStatus["OVERDUE"] ?? 0) > 0) {
      items.push({
        label: `Follow up on $${Number(data.arByStatus["OVERDUE"]).toLocaleString()} in overdue invoices`,
        priority: "high",
      });
    }
    if ((data.arByStatus["DRAFT"] ?? 0) > 0) {
      items.push({
        label: `Send $${Number(data.arByStatus["DRAFT"]).toLocaleString()} in draft invoices`,
        priority: "medium",
      });
    }
    if (data.expenseQueueUsd > 0) {
      items.push({
        label: `Process $${data.expenseQueueUsd.toLocaleString()} in pending expenses`,
        priority: "low",
      });
    }

    return items;
  }

  const actionItems = getActionItems();

  const priorityColors = {
    high: "text-error",
    medium: "text-warning",
    low: "text-accent",
  };

  const priorityBg = {
    high: "bg-error/10 border-error/20",
    medium: "bg-warning/10 border-warning/20",
    low: "bg-accent/10 border-accent/20",
  };

  return (
    <div>
      <PageHeader
        title="Operations Command Center"
        description="Daily action queue for owner/admin operations."
        actions={
          <a
            href="/api/ops/weekly-report"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <FileText className="h-3.5 w-3.5" />
            Weekly Report
          </a>
        }
      />

      {/* Alert StatCards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Overdue Tasks"
          value={String(data.overdueTasks.length)}
          hint={data.overdueTasks.length > 0 ? "Need immediate attention" : "All clear"}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={data.overdueTasks.length > 0 ? "down" : "up"}
        />
        <StatCard
          label="At-Risk Cases"
          value={String(data.atRiskCases.length)}
          hint="No recent activity + open tasks"
          icon={<ShieldAlert className="h-5 w-5" />}
          trend={data.atRiskCases.length > 0 ? "down" : "neutral"}
        />
        <StatCard
          label="Unbilled Amount"
          value={`$${data.unbilled.amountUsd.toLocaleString()}`}
          hint={`${data.unbilled.hours} hours`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Expense Queue"
          value={`$${data.expenseQueueUsd.toLocaleString()}`}
          hint="Pending approval/reimbursement"
          icon={<Receipt className="h-5 w-5" />}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* At-Risk Cases */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <ShieldAlert className="h-5 w-5 text-warning" />
            At-Risk Cases
          </h2>
          {data.atRiskCases.length === 0 ? (
            <EmptyState
              title="No at-risk cases"
              description="All cases have recent activity."
              icon={<CheckCircle className="h-10 w-10 text-success" />}
            />
          ) : (
            <div className="space-y-3">
              {data.atRiskCases.map((c) => (
                <div
                  key={c.caseId}
                  className="rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-warning/30"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{c.caseCode}</p>
                      <p className="text-sm text-text-secondary">{c.title}</p>
                    </div>
                    <StatusBadge status="ACTIVE" />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Last work:{" "}
                      {c.lastWorkDate
                        ? new Date(c.lastWorkDate).toISOString().slice(0, 10)
                        : "none"}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {c.openTaskCount} open task{c.openTaskCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* A/R Aging */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <DollarSign className="h-5 w-5 text-accent" />
            A/R Aging Snapshot
          </h2>
          {Object.keys(data.arByStatus).length === 0 ? (
            <EmptyState
              title="No outstanding invoices"
              description="All invoices are paid."
              icon={<CheckCircle className="h-10 w-10 text-success" />}
            />
          ) : (
            <div className="space-y-3">
              {Object.entries(data.arByStatus).map(([status, amount]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated p-4"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <span className="text-sm text-text-secondary">
                      {status === "OVERDUE"
                        ? "Past due invoices"
                        : status === "SENT"
                          ? "Awaiting payment"
                          : "Pending send"}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    ${Number(amount).toLocaleString()}
                  </span>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg border-2 border-border bg-surface-elevated p-4">
                <span className="font-medium text-text-primary">Total Outstanding</span>
                <span className="text-xl font-bold text-accent">
                  $
                  {Object.values(data.arByStatus)
                    .reduce((s, v) => s + Number(v), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <section className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <CheckCircle className="h-5 w-5 text-accent" />
            Recommended Actions
          </h2>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border p-3 ${priorityBg[item.priority]}`}
              >
                <ArrowRight className={`h-4 w-4 shrink-0 ${priorityColors[item.priority]}`} />
                <span className="text-sm text-text-primary">{item.label}</span>
                <span
                  className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${priorityColors[item.priority]}`}
                >
                  {item.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
