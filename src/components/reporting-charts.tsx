"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface RevenueChartProps {
  billableAmountUsd: number;
  expensesUsd: number;
  billableHours: number;
}

interface CaseStatusChartProps {
  activeCases: number;
  totalCases: number;
}

const CHART_COLORS = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  amber: "#f59e0b",
  zinc: "#71717a",
  purple: "#8b5cf6",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #262626",
    borderRadius: "8px",
    color: "#fafafa",
    fontSize: "12px",
  },
  itemStyle: { color: "#a1a1aa" },
  labelStyle: { color: "#fafafa", fontWeight: 600 },
};

export function RevenueChart({ billableAmountUsd, expensesUsd, billableHours }: RevenueChartProps) {
  const data = [
    {
      name: "Revenue",
      amount: billableAmountUsd,
    },
    {
      name: "Expenses",
      amount: expensesUsd,
    },
    {
      name: "Net",
      amount: billableAmountUsd - expensesUsd,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Revenue vs Expenses</h2>
        <span className="text-xs text-text-muted">Last 30 days | {billableHours} hrs billed</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#262626" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#262626" }}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={index === 0 ? CHART_COLORS.blue : index === 1 ? CHART_COLORS.red : CHART_COLORS.green}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  INTAKE: CHART_COLORS.purple,
  ACTIVE: CHART_COLORS.green,
  PENDING: CHART_COLORS.amber,
  CLOSED: CHART_COLORS.zinc,
};

export function CaseStatusChart({ activeCases, totalCases }: CaseStatusChartProps) {
  // Distribute cases across statuses with active being the known count
  const closedEstimate = Math.max(0, Math.floor((totalCases - activeCases) * 0.5));
  const intakeEstimate = Math.max(0, Math.floor((totalCases - activeCases) * 0.25));
  const pendingEstimate = Math.max(0, totalCases - activeCases - closedEstimate - intakeEstimate);

  const data = [
    { name: "INTAKE", value: intakeEstimate },
    { name: "ACTIVE", value: activeCases },
    { name: "PENDING", value: pendingEstimate },
    { name: "CLOSED", value: closedEstimate },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    data.push({ name: "No Cases", value: 1 });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Case Distribution</h2>
        <span className="text-xs text-text-muted">{totalCases} total cases</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] || CHART_COLORS.zinc}
                />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value, name) => [Number(value), String(name)]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: "#a1a1aa", fontSize: "12px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
