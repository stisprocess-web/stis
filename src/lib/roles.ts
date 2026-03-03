/**
 * @module lib/roles
 * Centralized access-control policy definitions.
 *
 * All role-based checks throughout the app should reference these policies
 * rather than hardcoding role arrays inline.
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
  team: ["owner", "admin", "investigator", "billing"] as const satisfies readonly AppRole[],
  /** Application settings and configuration */
  settings: ["owner", "admin"] as const satisfies readonly AppRole[],
  /** Analytics API endpoints */
  analyticsApi: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Time entry creation */
  writeTime: ["owner", "admin", "investigator"] as const satisfies readonly AppRole[],
  /** Expense approval and reimbursement */
  expenseApproval: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Expense submission */
  expenseSubmit: ["owner", "admin", "investigator"] as const satisfies readonly AppRole[],
  /** Contract lifecycle management */
  contracts: ["owner", "admin", "billing"] as const satisfies readonly AppRole[],
  /** Case status transitions */
  caseManagement: ["owner", "admin"] as const satisfies readonly AppRole[],
  /** Video ingestion */
  videoIngest: ["owner", "admin", "investigator"] as const satisfies readonly AppRole[],
} as const;
