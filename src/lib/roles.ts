/**
 * @module lib/roles
 * Centralized access-control policy definitions.
 *
 * All role-based checks throughout the app should reference these policies
 * rather than hardcoding role arrays inline.
 *
 * Role hierarchy:
 *   admin (+ owner alias) — full access
 *   management — everything except financial data
 *   investigator — assigned cases/tasks/evidence + own time/expenses
 *   billing — financial modules only, no case details
 *   client — own cases status + own invoices + own evidence
 */

import type { AppRole } from "@/lib/auth";

/** Check whether a role is included in an allowed list. */
export function roleAllowed(role: AppRole, allowed: readonly AppRole[]): boolean {
  return allowed.includes(role);
}

/**
 * Centralized access policies keyed by feature area.
 * Update here when adding new roles or features.
 */
export const accessPolicy = {
  /** Financial reporting dashboards */
  reporting: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Team management and time/expense views */
  team: ["owner", "admin", "management", "investigator", "billing"] as const satisfies readonly AppRole[],
  /** Application settings and configuration */
  settings: ["owner", "admin"] as const satisfies readonly AppRole[],
  /** Analytics API endpoints (financial analytics) */
  analyticsApi: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Time entry creation */
  writeTime: ["owner", "admin", "management", "investigator"] as const satisfies readonly AppRole[],
  /** Expense approval and reimbursement */
  expenseApproval: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Expense submission */
  expenseSubmit: ["owner", "admin", "management", "investigator"] as const satisfies readonly AppRole[],
  /** Contract lifecycle management */
  contracts: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Case creation and status transitions */
  caseManagement: ["owner", "admin", "management"] as const satisfies readonly AppRole[],
  /** Video ingestion */
  videoIngest: ["owner", "admin", "management", "investigator"] as const satisfies readonly AppRole[],
  /** View case list/details (not billing, not client unless filtered) */
  caseView: ["owner", "admin", "management", "investigator", "client"] as const satisfies readonly AppRole[],
  /** View evidence */
  evidenceView: ["owner", "admin", "management", "investigator", "client"] as const satisfies readonly AppRole[],
  /** View tasks */
  taskView: ["owner", "admin", "management", "investigator"] as const satisfies readonly AppRole[],
  /** View clients */
  clientView: ["owner", "admin", "management", "billing"] as const satisfies readonly AppRole[],
  /** Financial modules: invoicing, exports, 1099, payouts */
  financial: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** User management (admin only) */
  userManagement: ["owner", "admin"] as const satisfies readonly AppRole[],
  /** Operations dashboard */
  ops: ["owner", "admin", "management"] as const satisfies readonly AppRole[],
  /** Dashboard access (everyone except client gets full; client gets limited) */
  dashboard: ["owner", "admin", "management", "investigator", "billing", "client"] as const satisfies readonly AppRole[],
} as const;

/**
 * Sidebar navigation visibility per role.
 * Maps route paths to the access policy keys that control them.
 */
export const sidebarAccess: Record<string, readonly AppRole[]> = {
  "/": accessPolicy.dashboard,
  "/cases": accessPolicy.caseView,
  "/clients": accessPolicy.clientView,
  "/evidence": accessPolicy.evidenceView,
  "/tasks": accessPolicy.taskView,
  "/invoicing": accessPolicy.financial,
  "/contracts": accessPolicy.contracts,
  "/team": accessPolicy.team,
  "/video": accessPolicy.videoIngest,
  "/reporting": accessPolicy.reporting,
  "/ops/daily": accessPolicy.ops,
  "/settings": accessPolicy.settings,
};
