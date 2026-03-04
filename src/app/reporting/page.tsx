/**
 * @module app/reporting/page
 * Reporting & analytics dashboard — case load, financials, charts, and top contractors.
 */

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { RevenueChart, CaseStatusChart } from "@/components/reporting-charts";
import { getAnalyticsOverview, type AnalyticsOverview } from "@/lib/analytics";
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  FileBox,
  ArrowRight,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

/** Default empty analytics data for error fallback. */
const emptyData: AnalyticsOverview = {
  activeCases: 0,
  totalCases: 0,
  openTasks: 0,
  totalEvidence: 0,
  unpaidInvoicesUsd: 0,
  last30Days: { billableHours: 0, billableAmountUsd: 0, expensesUsd: 0 },
  topByBillables: [],
};

export default async function ReportingPage() {
  const data = await getAnalyticsOverview().catch(() => emptyData);

  return (
    <div>
      <PageHeader
        title="Reporting & Analytics"
        description="Operational and financial visibility across cases and investigators."
        actions={
          <div className="flex gap-2">
            <a
              href="/api/analytics/profitability"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Profitability JSON
            </a>
          </div>
        }
      />

      {/* KPI Row */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Cases"
          value={`${data.activeCases} / ${data.totalCases}`}
          hint="Active / Total"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          label="Open Tasks"
          value={String(data.openTasks)}
          hint="Pending operational actions"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding A/R"
          value={`$${data.unpaidInvoicesUsd.toLocaleString()}`}
          hint="Draft + sent + overdue invoices"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Evidence Items"
          value={String(data.totalEvidence)}
          hint="Chain-of-custody tracked"
          icon={<FileBox className="h-5 w-5" />}
        />
      </section>

      {/* Charts Section */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <RevenueChart
          billableAmountUsd={data.last30Days.billableAmountUsd}
          expensesUsd={data.last30Days.expensesUsd}
          billableHours={data.last30Days.billableHours}
        />
        <CaseStatusChart
          activeCases={data.activeCases}
          totalCases={data.totalCases}
        />
      </section>

      {/* Top Contractors */}
      <section className="mt-6">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Top 1099 Contractors by Billables
          </h2>
          {data.topByBillables.length === 0 ? (
            <EmptyState
              title="No contractor data"
              description="Add contractors and time entries to see top performers."
            />
          ) : (
            <div className="space-y-3">
              {data.topByBillables.map((c) => {
                const maxBillable = data.topByBillables[0]?.totalBillable || 1;
                const widthPct = Math.max(5, (c.totalBillable / maxBillable) * 100);
                return (
                  <div key={c.contractorCode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {c.name}{" "}
                        <span className="text-text-muted">({c.contractorCode})</span>
                      </span>
                      <span className="text-text-secondary">
                        {c.totalHours} hrs | ${c.totalBillable.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-elevated">
                      <div
                        className="h-2 rounded-full bg-accent transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href="/reporting/payouts"
          className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-elevated"
        >
          <div>
            <h3 className="font-semibold text-text-primary">Monthly Payouts</h3>
            <p className="mt-1 text-sm text-text-muted">
              Review 1099 contractor payable amounts before accounting export
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
        </a>
        <a
          href="/reporting/investigator-margins"
          className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-elevated"
        >
          <div>
            <h3 className="font-semibold text-text-primary">Investigator Margins</h3>
            <p className="mt-1 text-sm text-text-muted">
              Margin analysis by investigator — revenue minus labor and expenses
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
        </a>
      </section>
    </div>
  );
}
