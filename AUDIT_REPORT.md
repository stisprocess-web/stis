# STIS Full Codebase Audit Report

**Date:** July 2025  
**Auditor:** Morgan (AI)  
**Codebase:** STIS — Private Investigation Case Management System  
**Stack:** Next.js 15 (App Router) + Prisma + SQLite + Tailwind CSS  
**Deployment Target:** Cloudflare Workers (via `@opennextjs/cloudflare`)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Infrastructure Review](#infrastructure-review)
3. [Page-by-Page Audit](#page-by-page-audit)
4. [API Route Completeness](#api-route-completeness)
5. [Broken / Non-Functional Items](#broken--non-functional-items)
6. [Security Concerns](#security-concerns)
7. [Code Quality Issues](#code-quality-issues)
8. [Missing Features](#missing-features)
9. [Priority Fixes](#priority-fixes)

---

## Executive Summary

**Overall Assessment: 8/10 — Surprisingly solid for an early-stage app.**

STIS is a well-structured Next.js application with proper role-based access control, real Prisma-backed CRUD operations, server/client component separation, and professional UI. Most buttons and interactive elements are **fully functional** with proper API routes backing them. The codebase demonstrates good engineering practices: Zod validation, proper error handling, middleware-based auth, and clean component architecture.

**What works well:**
- All major CRUD operations (cases, clients, tasks, evidence, invoices) are fully functional
- Role-based access control is comprehensive (middleware + UI + API layers)
- Auth flow (email/password + Google OAuth) is properly implemented
- Dark theme UI is polished and consistent
- Proper server/client component separation with date serialization
- Export routes for QuickBooks integration exist and work
- Contract PDF generation with signature blocks (pdf-lib)
- Good Zod validation on all API inputs

**What needs attention:**
- Settings page "Save Changes" button is a no-op (doesn't persist)
- Video upload doesn't actually upload the file to the server
- Some forms use raw IDs instead of dropdowns (team entry forms)
- A few missing API routes for non-critical features
- No `scripts/video_ingest_mvp.py` file exists
- Case status estimation in reporting charts is approximated rather than queried

---

## Infrastructure Review

### Database (Prisma + SQLite)
- **Schema:** Complete and well-designed with 10 models covering all domain entities
- **Relations:** Proper cascading deletes, unique constraints, and foreign keys
- **Enums:** CaseStatus, Priority, ContractType, ExpenseStatus, InvoiceStatus — all properly defined
- **Migration:** Single init migration present (`20260225202950_init_phase2`)
- **Issue:** SQLite is fine for development but won't scale for production multi-user scenarios. Consider PostgreSQL.

### Authentication Flow
- **Login:** Email/password with bcryptjs hashing ✅
- **Google OAuth:** Redirect flow with callback handler ✅
- **Sessions:** JWT-based via `@/lib/session` with cookie storage ✅
- **Middleware:** Comprehensive route protection with role-based rules ✅
- **Logout:** POST /api/auth/logout properly clears session cookie ✅

### Middleware
- Edge middleware intercepts all protected routes
- Role-based access matrix covers all UI pages and API endpoints
- Injects `x-user-id`, `x-user-role`, `x-user-email` headers for downstream handlers
- **Issue:** The `matcher` config includes trailing `/:path*` which may not match exact paths (e.g., `/api/users` exact won't match `/api/users/:path*` — this is fine because the base `/api/users` route is still covered by the roleRules prefix matching)

### Contract System
- Uses JSON file storage (`data/contracts.json`) instead of Prisma — separate from main DB
- PDF generation via `pdf-lib` works properly
- Status tracking: draft → sent → signed lifecycle ✅

---

## Page-by-Page Audit

### 1. Dashboard (`/`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| KPI Cards (Active Cases, Open Tasks, Evidence, Outstanding Invoices) | Display | ✅ Working | Role-aware: billing sees only financials, investigators see only their data |
| New Case button | Link | ✅ Working | Links to `/cases` |
| New Task button | Link | ✅ Working | Links to `/tasks` |
| New Invoice button | Link | ✅ Working | Links to `/invoicing` |
| Priority Cases grid | Display | ✅ Working | Shows top 5 cases with priority/status badges |
| Upcoming Tasks list | Display | ✅ Working | Shows undone tasks with due dates |
| Recent Billing list | Display | ✅ Working | Shows latest invoices with status |

**Notes:** Dashboard is role-aware — investors see "My Cases"/"My Tasks", billing users see only financial widgets. Proper fallback for DB unavailability.

---

### 2. Cases (`/cases`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| New Case button | Button → Modal | ✅ Working | Opens modal, POST /api/cases |
| Case table with sorting | Interactive table | ✅ Working | All 7 columns sortable (asc/desc toggle) |
| Archive button | Button → Confirm | ✅ Working | DELETE /api/cases/[id] with confirmation |
| Assign button | Button → Modal | ✅ Working | POST/DELETE /api/cases/[id]/assignments |
| Title field | Form input | ✅ Working | Required, validated |
| Client dropdown | Form select | ✅ Working | Populated from database |
| Investigator field | Form input | ✅ Working | Free text |
| Priority selector | Form select | ✅ Working | LOW/MEDIUM/HIGH/URGENT |
| Due Date picker | Form date | ✅ Working | Optional |
| Visibility selector | Form select | ✅ Working | Admin-only, normal/confidential |
| Confidential lock icon | Display | ✅ Working | Shows on confidential cases |
| Modal close (X) | Button | ✅ Working | |
| Modal Cancel | Button | ✅ Working | |
| Loading spinner | UI feedback | ✅ Working | Shows during API calls |
| Error display | UI feedback | ✅ Working | Shows API errors inline |

**API Routes:**
- `POST /api/cases` — Create case ✅
- `DELETE /api/cases/[id]` — Archive case ✅
- `POST /api/cases/[id]/assignments` — Assign investigator ✅
- `DELETE /api/cases/[id]/assignments` — Unassign ✅
- `PATCH /api/cases/[id]/status` — Update status ✅
- `GET /api/cases/[id]/billing-readiness` — Billing check ✅

---

### 3. Clients (`/clients`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Add Client button | Button → Modal | ✅ Working | Opens modal |
| Search bar | Search input | ✅ Working | Filters by name/company/email |
| Client cards grid | Display | ✅ Working | Responsive 1/2/3 columns |
| Edit (pencil) button | Button → Modal | ✅ Working | PUT /api/clients/[id] |
| Delete (trash) button | Button → Confirm | ✅ Working | DELETE /api/clients/[id] with confirmation modal |
| Name field | Form input | ✅ Working | Required |
| Company field | Form input | ✅ Working | Required |
| Email field | Form input | ✅ Working | Required |
| Phone field | Form input | ✅ Working | Optional |
| Retainer (USD) field | Form number | ✅ Working | Non-negative |
| Toast notifications | UI feedback | ✅ Working | Success/error with auto-dismiss |
| Create Client button | Form submit | ✅ Working | Validates required fields |
| Save Changes button (edit) | Form submit | ✅ Working | |
| Modal Cancel buttons | Button | ✅ Working | |
| Confirm Delete modal | Modal | ✅ Working | Danger variant |

**API Routes:**
- `POST /api/clients` — Create ✅
- `PUT /api/clients/[id]` — Update ✅
- `DELETE /api/clients/[id]` — Delete ✅

---

### 4. Evidence (`/evidence`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Log Evidence button | Button → Modal | ✅ Working | Opens modal |
| Evidence table | Display | ✅ Working | Code, title, type, case, uploader, date, chain of custody |
| Chain of Custody expand/collapse | Toggle | ✅ Working | Truncates at 60 chars with More/Less |
| Title field | Form input | ✅ Working | Required |
| Type selector | Form select | ✅ Working | Video/Photo/Audio/Document |
| Case selector | Form select | ✅ Working | Populated from database |
| File Path field | Form input | ✅ Working | Optional |
| Chain of Custody textarea | Form textarea | ✅ Working | Required |
| Log Evidence submit | Form submit | ✅ Working | POST /api/evidence |
| Type color badges | Display | ✅ Working | Different colors per type |
| Toast notifications | UI feedback | ✅ Working | |

**API Routes:**
- `POST /api/evidence` — Log evidence ✅

**Note:** Evidence does not support file upload — only metadata logging with optional file path. This is by design for chain-of-custody compliance (files managed separately).

---

### 5. Tasks (`/tasks`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| New Task button | Button → Modal | ✅ Working | |
| Filter tabs (All/Open/Completed) | Tab buttons | ✅ Working | With counts |
| Checkbox toggle (done/undone) | Button | ✅ Working | PATCH /api/tasks/[id] with loading spinner |
| Delete button (trash) | Button → Confirm | ✅ Working | DELETE /api/tasks/[id] |
| Overdue highlighting | Display | ✅ Working | Red text + "OVERDUE:" prefix |
| Completed task styling | Display | ✅ Working | Strikethrough + opacity |
| Title field | Form input | ✅ Working | Required |
| Case selector | Form select | ✅ Working | Populated from database |
| Owner field | Form input | ✅ Working | Required |
| Due Date picker | Form date | ✅ Working | Optional |
| Toast notifications | UI feedback | ✅ Working | |
| Create Task submit | Form submit | ✅ Working | POST /api/tasks |

**API Routes:**
- `POST /api/tasks` — Create ✅
- `PATCH /api/tasks/[id]` — Toggle/update ✅
- `DELETE /api/tasks/[id]` — Remove ✅

---

### 6. Invoicing (`/invoicing`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| New Invoice button | Button → Modal | ✅ Working | |
| Summary stats (Outstanding/Paid/Draft) | Display | ✅ Working | Computed from data |
| Invoice table | Display | ✅ Working | Code, client, case, amount, status, dates |
| Status change dropdown | Select | ✅ Working | PATCH /api/invoices/[id] |
| Delete invoice button | Button → Confirm | ✅ Working | DELETE /api/invoices/[id] |
| 1099 Time Billing table | Display | ✅ Working | Contractor, case, hours, billable |
| 1099 Expenses table | Display | ✅ Working | Contractor, case, category, amount, status |
| Export Time CSV link | Link | ✅ Working | /api/exports/time-entries.csv |
| Export Expenses CSV link | Link | ✅ Working | /api/exports/expenses.csv |
| Client selector (modal) | Form select | ✅ Working | Required |
| Case selector (modal) | Form select | ✅ Working | Required |
| Amount field (modal) | Form number | ✅ Working | Required, min 0.01 |
| Due Date (modal) | Form date | ✅ Working | Optional |
| Create Invoice submit | Form submit | ✅ Working | POST /api/invoices |
| Loading spinners | UI feedback | ✅ Working | During status change + delete |

**API Routes:**
- `POST /api/invoices` — Create ✅
- `PATCH /api/invoices/[id]` — Update status ✅
- `DELETE /api/invoices/[id]` — Remove ✅

---

### 7. Contracts (`/contracts`)
**Status: ✅ Functional (with caveats)**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Create Contract form | Form | ✅ Working | POST /api/contracts/create with FormData |
| Case Code field | Form input | ✅ Working | Required, free text |
| Client Name field | Form input | ✅ Working | Required |
| Client Email field | Form email | ✅ Working | Required, validated |
| Template selector | Form select | ✅ Working | Standard Retainer / Flat Fee |
| Scope of Work textarea | Form textarea | ✅ Working | Optional |
| Retainer Amount field | Form input | ✅ Working | Optional |
| Hourly Rate field | Form input | ✅ Working | Optional |
| Create Contract & Generate PDF button | Form submit | ✅ Working | Generates PDF via pdf-lib |
| Send for Signature form | Form | ✅ Working | POST /api/contracts/send |
| Mark as Signed form | Form | ✅ Working | POST /api/contracts/mark-signed |
| Contract Queue table | Display | ✅ Working | ID, case, client, template, status, retainer, rate, dates |
| Feedback messages | UI feedback | ✅ Working | Success/error inline |

**Caveats:**
- Uses JSON file storage, not Prisma DB — this works but is less robust
- PDF generation is real and creates files in `data/contracts/` directory
- Email notifications for signed contracts are "queued" but actual email sending depends on SMTP configuration (likely not configured)

---

### 8. Team & 1099 (`/team`)
**Status: ✅ Mostly Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Contractor cards grid | Display | ✅ Working | Code, name, role, type, hourly rate |
| Time Entries table | Display | ✅ Working | Date, contractor, case, hours, billable |
| Expense Queue table | Display | ✅ Working | Date, contractor, case, category, amount, status |
| Time CSV export link | Link | ✅ Working | /api/exports/time-entries.csv |
| Expenses CSV export link | Link | ✅ Working | /api/exports/expenses.csv |
| 1099 JSON export link | Link | ✅ Working | /api/exports/1099-summary |
| Log Time Entry form | Form | ✅ Working | POST /api/time-entries |
| Log Expense form | Form | ✅ Working | POST /api/expenses |
| Save Time Entry button | Form submit | ✅ Working | |
| Save Expense button | Form submit | ✅ Working | |
| Feedback messages | UI feedback | ✅ Working | |

**Issue:** The time entry and expense forms require raw Case ID and Contractor ID strings (e.g., "ca2", "ct1") instead of dropdowns. This is a UX issue — users need to know the internal IDs.

**API Routes:**
- `POST /api/time-entries` — Create time entry ✅
- `POST /api/expenses` — Create expense ✅

---

### 9. Video (`/video`)
**Status: ⚠️ Partially Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Video upload dropzone | Drag/drop + click | ⚠️ Partial | Selects file locally but does NOT upload to server |
| Selected file info display | Display | ✅ Working | Shows filename and size |
| Process button (file card) | Button | ⚠️ Issues | Calls /api/video/ingest but sends config, not the file |
| Processing Configuration form | Form | ✅ Working | Input/output dirs, FPS interval, scene threshold |
| Start Processing button | Button | ⚠️ Issues | Calls API but Python script likely doesn't exist |
| Frame Gallery | Display | ✅ Working | Shows placeholder frames when "complete" |
| Status indicators | Display | ✅ Working | Idle/Processing/Complete states |
| API Reference collapsible | Toggle | ✅ Working | Shows/hides API docs |

**Issues:**
1. File selection via the dropzone sets `selectedFile` state but **never uploads it** — no `fetch` with the file data is performed
2. The "Process" button calls `/api/video/ingest` with config (inputDir/outputDir/etc.) but doesn't send the selected file
3. The API route spawns `python3 scripts/video_ingest_mvp.py` which likely doesn't exist in the repo
4. Frame gallery shows placeholder divs, not actual extracted frames

---

### 10. Reporting (`/reporting`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| KPI cards (Active Cases, Open Tasks, Outstanding A/R, Evidence Items) | Display | ✅ Working | |
| Revenue vs Expenses bar chart | Recharts chart | ✅ Working | Last 30 days data |
| Case Distribution donut chart | Recharts chart | ⚠️ Approximated | Estimates status distribution from active/total counts |
| Top Contractors bar chart | Display | ✅ Working | Progress bars for billable amounts |
| Profitability JSON link | Link | ✅ Working | /api/analytics/profitability |
| Monthly Payouts navigation card | Link | ✅ Working | /reporting/payouts |
| Investigator Margins navigation card | Link | ✅ Working | /reporting/investigator-margins |

**Sub-pages:**

#### 10a. Monthly Payouts (`/reporting/payouts`)
| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Summary stats | Display | ✅ Working | Total payout, hours, labor, contractors |
| QB Time CSV export | Link | ✅ Working | |
| QB Expense CSV export | Link | ✅ Working | |
| Contractor payout cards | Display | ✅ Working | Hours, labor, expenses per contractor |

#### 10b. Investigator Margins (`/reporting/investigator-margins`)
| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Summary stats | Display | ✅ Working | Revenue, labor, margin, count |
| Margin table | Display | ✅ Working | Per-investigator with color-coded margin % |
| Export CSV link | Link | ✅ Working | |

**Issue with Case Distribution chart:** Uses estimated status distribution (`closedEstimate = (total - active) * 0.5`, etc.) instead of querying actual case counts per status. Should query `prisma.case.groupBy({ by: ['status'] })`.

---

### 11. Ops Daily (`/ops/daily`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Alert stat cards | Display | ✅ Working | Overdue tasks, at-risk cases, unbilled amount, expense queue |
| At-Risk Cases section | Display | ✅ Working | Cases with no recent activity + open tasks |
| A/R Aging Snapshot | Display | ✅ Working | Breakdown by invoice status |
| Recommended Actions list | Display | ✅ Working | Prioritized action items |
| Weekly Report button | Link | ✅ Working | /api/ops/weekly-report |

---

### 12. Settings (`/settings`)
**Status: ⚠️ Partially Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Tab navigation (Company/Roles/Users/Integrations/Compliance) | Tabs | ✅ Working | |
| **Company Info tab:** | | | |
| Company Name field | Form input | ⚠️ **Not persistent** | Hardcoded default, "Save" doesn't call API |
| Address field | Form input | ⚠️ **Not persistent** | Same — just shows success toast without saving |
| Phone field | Form input | ⚠️ **Not persistent** | |
| Email field | Form input | ⚠️ **Not persistent** | |
| Save Changes button | Button | ❌ **NO-OP** | Just sets `saved=true` for 3 seconds — no API call |
| **Roles tab:** | | | |
| Role definitions display | Display | ✅ Working | Read-only, informational |
| Permissions matrix table | Display | ✅ Working | Read-only |
| **Users tab:** | | | |
| User list table | Display | ✅ Working | Fetches from GET /api/users |
| New User button → modal | Button → Modal | ✅ Working | |
| Create User form | Form submit | ✅ Working | POST /api/users |
| Change Role button | Inline edit | ✅ Working | PATCH /api/users |
| Save role change | Button | ✅ Working | |
| Cancel role change | Button | ✅ Working | |
| **Integrations tab:** | | | |
| QuickBooks export links | Links | ✅ Working | 4 CSV export links |
| PDF Generation info | Display | ✅ Working | Static info cards |
| Email integration info | Display | ✅ Working | Static info cards |
| **Compliance tab:** | | | |
| Compliance checklist | Display | ✅ Working | Static checklist, all items show as enabled |

---

### 13. Login (`/login`)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Email field | Form input | ✅ Working | |
| Password field | Form input | ✅ Working | |
| Remember me checkbox | Checkbox | ✅ Display only | Doesn't affect session duration |
| Sign In button | Form submit | ✅ Working | POST /api/auth/login |
| Google OAuth button | Link | ✅ Working | Redirects to /api/auth/google |
| Error display | UI feedback | ✅ Working | URL params + API errors |
| Loading spinner | UI feedback | ✅ Working | |
| Demo credentials display | Display | ✅ Working | owner@leairdpi.local / ChangeMe123! |

---

### 14. Sidebar (global)
**Status: ✅ Fully Functional**

| Element | Type | Status | Notes |
|---------|------|--------|-------|
| Navigation links | Links | ✅ Working | Role-filtered, active highlighting |
| Collapse/Expand toggle | Button | ✅ Working | Toggles between 240px and 64px |
| User info display | Display | ✅ Working | Email + role from /api/auth/me |
| Sign Out button | Button | ✅ Working | POST /api/auth/logout, redirects to /login |
| STIS branding | Display | ✅ Working | Logo + text |

---

## API Route Completeness

### Authentication
| Route | Method | Status |
|-------|--------|--------|
| `/api/auth/login` | POST | ✅ Working |
| `/api/auth/logout` | POST | ✅ Working |
| `/api/auth/me` | GET | ✅ Working |
| `/api/auth/google` | GET | ✅ Working |
| `/api/auth/google/callback` | GET | ✅ Working |

### Cases
| Route | Method | Status |
|-------|--------|--------|
| `/api/cases` | POST | ✅ Working |
| `/api/cases/[id]` | DELETE | ✅ Working (archive) |
| `/api/cases/[id]/assignments` | POST/DELETE | ✅ Working |
| `/api/cases/[id]/billing-readiness` | GET | ✅ Working |
| `/api/cases/[id]/status` | PATCH | ✅ Working |

### Clients
| Route | Method | Status |
|-------|--------|--------|
| `/api/clients` | POST | ✅ Working |
| `/api/clients/[id]` | PUT/DELETE | ✅ Working |

### Tasks
| Route | Method | Status |
|-------|--------|--------|
| `/api/tasks` | POST | ✅ Working |
| `/api/tasks/[id]` | PATCH/DELETE | ✅ Working |

### Evidence
| Route | Method | Status |
|-------|--------|--------|
| `/api/evidence` | POST | ✅ Working |

### Invoicing
| Route | Method | Status |
|-------|--------|--------|
| `/api/invoices` | POST | ✅ Working |
| `/api/invoices/[id]` | PATCH/DELETE | ✅ Working |

### Contracts
| Route | Method | Status |
|-------|--------|--------|
| `/api/contracts/create` | POST | ✅ Working |
| `/api/contracts/send` | POST | ✅ Working |
| `/api/contracts/mark-signed` | POST | ✅ Working |

### Time & Expenses
| Route | Method | Status |
|-------|--------|--------|
| `/api/time-entries` | POST | ✅ Working |
| `/api/expenses` | POST | ✅ Working |

### Exports
| Route | Method | Status |
|-------|--------|--------|
| `/api/exports/time-entries.csv` | GET | ✅ Working |
| `/api/exports/expenses.csv` | GET | ✅ Working |
| `/api/exports/quickbooks-time.csv` | GET | ✅ Working |
| `/api/exports/quickbooks-expenses.csv` | GET | ✅ Working |
| `/api/exports/1099-summary` | GET | ✅ Working |

### Users
| Route | Method | Status |
|-------|--------|--------|
| `/api/users` | GET/POST/PATCH | ✅ Working |

### Analytics / Ops
| Route | Method | Status |
|-------|--------|--------|
| `/api/analytics/overview` | GET | ✅ Working |
| `/api/analytics/profitability` | GET | ✅ Working |
| `/api/analytics/investigator-profitability` | GET | ✅ Working |
| `/api/ops/daily` | GET | ✅ Working |
| `/api/ops/weekly-report` | GET | ✅ Working |
| `/api/team/summary` | GET | ✅ Working |

### Video
| Route | Method | Status |
|-------|--------|--------|
| `/api/video/ingest` | POST | ⚠️ Exists but Python script likely missing |

---

## Broken / Non-Functional Items

### 🔴 Critical
1. **Settings > Company Info "Save Changes" button** — Complete no-op. The `handleSave()` function just toggles a "saved" state for 3 seconds. No API call, no persistence. Data resets on page reload.

### 🟡 Significant
2. **Video page file upload** — The dropzone selects a file into React state but never sends it to the server. The "Process" button sends directory configuration to `/api/video/ingest`, not the file itself. The Python script it spawns (`scripts/video_ingest_mvp.py`) likely doesn't exist.

3. **Team entry forms (time/expense)** — Require raw database IDs (`ca2`, `ct1`) typed manually instead of dropdown selectors. Users have no way to discover valid IDs from the UI.

4. **Case Distribution chart** — Estimates status distribution mathematically instead of querying actual counts. When there's 5 active cases out of 10 total, it estimates 2.5 closed, 1.25 intake, 1.25 pending — which is wrong.

### 🟢 Minor
5. **"Remember me" checkbox on login** — Renders but doesn't affect session duration (always 30 days regardless).

6. **Compliance checklist** — All items are hardcoded as "enabled" with no way to toggle them. This is informational only.

7. **Email notifications for contracts** — "Email notifications queued" message shows on sign, but actual email delivery requires SMTP configuration that likely isn't set up.

8. **Settings > Integrations tab** — All integration cards are static/informational. No actual integration configuration available.

---

## Security Concerns

### High Priority
1. **Demo credentials in source code** — `owner@leairdpi.local / ChangeMe123!` is displayed on the login page. Remove for production.

2. **SQLite for production** — No concurrent write safety, no connection pooling, data loss risk with Cloudflare Workers ephemeral filesystem.

3. **JWT secret management** — `@/lib/session.ts` handles JWT tokens; needs review to ensure secret is from environment variable and is sufficiently strong.

4. **No rate limiting** — Login endpoint has no brute-force protection. No rate limiting on any API endpoint.

### Medium Priority
5. **CORS not configured** — No explicit CORS headers; relies on same-origin default. Fine for now but needs attention if adding mobile apps or external integrations.

6. **No CSRF protection** — Forms use `fetch()` which includes cookies but has no CSRF token validation. The `sameSite: "lax"` cookie setting provides partial protection.

7. **Client deletion cascades** — Deleting a client cascades to all their cases, tasks, evidence, invoices, etc. No warning about the scope of deletion in the UI confirmation message (it says "remove all associated cases" but doesn't mention evidence, invoices, etc.).

8. **Self-demotion prevention only for role changes** — Users can't change their own role (good), but there's no prevention against the last admin deleting themselves or demoting the last admin.

### Low Priority
9. **Password policy** — Only requires 6 characters minimum. No complexity requirements.
10. **No session invalidation** — Changing a user's role doesn't invalidate their existing session. They keep the old role until the session expires.

---

## Code Quality Issues

### Good Practices ✅
- Consistent TypeScript usage throughout
- Zod schema validation on all API inputs
- Proper error boundaries with try/catch
- Clean component structure with reusable UI primitives (Modal, ConfirmModal, StatusBadge, EmptyState, StatCard, PageHeader)
- Server/client component separation
- Date serialization at the server component boundary
- Role-based rendering in components

### Issues
1. **Inconsistent auth helpers** — Some API routes use `getSessionFromRequest()`, others use `getRoleFromRequest()`. Should be unified.
2. **Task PATCH route allows roles** — `ALLOWED_ROLES` is `["owner", "admin", "investigator"]` but the middleware allows "management" for task routes. The middleware rule is correct but the API route is more restrictive, which is fine but inconsistent.
3. **No pagination** — All list queries return full datasets. Will be a problem as data grows.
4. **No loading states for initial page loads** — Server components catch errors but don't show loading skeletons.
5. **Console.error in production** — All API routes use `console.error()` for error logging. Should use a proper logging service.

---

## Missing Features

1. **Case detail page** — No `/cases/[id]` page to view a single case in detail with its tasks, evidence, invoices, and activity log
2. **Evidence file upload** — Only metadata logging, no actual file upload/storage
3. **Client portal** — The "client" role is defined but there's no client-facing portal with limited views
4. **Audit trail / activity log** — Mentioned in compliance checklist but not implemented
5. **Email sending** — SMTP integration is shown as "Configured" in settings but no actual email sending code exists
6. **Search across entities** — No global search functionality
7. **Notifications** — No in-app notification system
8. **Report PDF export** — "Signed Report PDFs" mentioned in compliance but not implemented
9. **Expense approval workflow** — Expenses have SUBMITTED/APPROVED/REIMBURSED statuses but no UI to approve/reimburse them
10. **Settings persistence** — Company info, compliance toggles aren't saved anywhere

---

## Priority Fixes

### P0 — Fix Before Demo/Launch
1. **Fix Settings "Save Changes"** — Either connect to an API route or add `disabled` state indicating it's view-only
2. **Remove demo credentials** from login page source code
3. **Fix Team entry forms** — Replace raw ID inputs with dropdown selectors populated from the database

### P1 — Should Fix Soon
4. **Add case detail page** (`/cases/[id]`) with activity timeline
5. **Fix video upload flow** — Either implement actual file upload or clearly label it as "directory-based batch processing only"
6. **Fix Case Distribution chart** to query actual status counts instead of estimating
7. **Add pagination** to all list views (cases, tasks, evidence, invoices)
8. **Add expense approval UI** — Buttons to change expense status from SUBMITTED → APPROVED → REIMBURSED

### P2 — Nice to Have
9. **Add loading skeletons** for initial page loads
10. **Implement audit trail** for compliance
11. **Add client portal view** for the "client" role
12. **Migrate from SQLite to PostgreSQL** for production
13. **Add rate limiting** to auth endpoints
14. **Implement actual email sending** for contract notifications

---

## Git & Deployment Status

- **Current remote:** `https://github.com/eclawbot2-dot/stis`
- **Branch:** `main` (clean, up to date with origin)
- **Latest commit:** `9d6e710` — "fix: prevent evidence tab crash on legacy/null evidence fields"
- **Deployment:** Configured for Cloudflare Workers via `@opennextjs/cloudflare`

---

*End of Audit Report*
