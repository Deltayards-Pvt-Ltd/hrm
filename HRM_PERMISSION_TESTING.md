# HRM Permission User Testing Guide

**Date:** 2026-07-21  
**Scope:** Role-based access in `hrm` (single app) + `deltadb` `hrm:*` gates  
**DB safety:** Only isolated fixtures were created. No production roles/users were modified.

---

## Safety / Rollback (read this first)

### What was touched in Mongo
| Object | Name / Email | Purpose |
|--------|--------------|---------|
| Role | `hrm_test_hr` | Full HRM perms |
| Role | `hrm_test_employee` | `hrm:access` only |
| Role | `hrm_test_denied` | `leads:read` only (should be blocked) |
| User | `hrm.test.hr.fixture@deltayards.com` | HR tester |
| User | `hrm.test.employee.fixture@deltayards.com` | Employee tester |
| User | `hrm.test.denied.fixture@deltayards.com` | Deny tester |

Password for all three: `HrmTest@2026!`

### What was NOT touched
- `superadmin` role permissions (still no `hrm:*` in DB — fine, level 1 bypasses)
- Any real user accounts
- No data migrations

### Code safety fix already applied
`initSuperadmin` / `adminLogin` used to **replace** the whole permissions array (could wipe live extras). Now **append-only**.

### Rollback (deletes fixtures only)
```bash
cd deltadb
node scripts/rollbackHrmTestFixtures.js --dry-run   # preview
node scripts/rollbackHrmTestFixtures.js             # delete
```

### Re-create fixtures
```bash
cd deltadb
node scripts/upsertHrmTestFixtures.js
```

### Inspect (read-only)
```bash
cd deltadb
node scripts/inspectHrmAccess.js
node scripts/verifyHrmPermissionsCatalog.js
```

---

## Prerequisites

1. `deltadb` running → `http://localhost:5000`
2. `hrm` running → `http://localhost:3000`
3. Restart deltadb once after pulling route/permission changes if it was already up before this work

---

## Test accounts

| Persona | Email | Password | Expected portal access |
|---------|-------|----------|------------------------|
| HR | `hrm.test.hr.fixture@deltayards.com` | `HrmTest@2026!` | Full HRM nav + admin APIs |
| Employee | `hrm.test.employee.fixture@deltayards.com` | `HrmTest@2026!` | Self-service only |
| Denied | `hrm.test.denied.fixture@deltayards.com` | `HrmTest@2026!` | Blocked at login gate |
| Superadmin | your real superadmin | (yours) | Full access via level-1 bypass |

---

## Scenario A — HR full access

1. Open http://localhost:3000/login
2. Login as **HR** account
3. Expect:
   - Lands on dashboard (HR widgets)
   - Sidebar shows legacy + portal modules: Home, Employees, Attendance, Leave, Payroll, Org chart, Departments, Users, Directory, Onboarding, Offboarding, Reimbursements, Recruitment, Performance, Announcements, Documents, Profile
4. Click through:
   - `/employees` → list loads
   - `/leave` → **My leave** panel + **HR leave inbox**
   - `/attendance` → **My attendance** + admin matrix
   - `/attendance/week-off-swaps` → my swaps + HR inbox
   - `/payroll/list` → registry loads
   - `/payroll/payslip` → my slips list
   - `/org-chart`, `/announcements`, `/documents`, `/reimbursements`, `/performance` → load
   - `/departments`, `/directory`, `/users`, `/onboarding`, `/offboarding`, `/recruitment` → load (HR-gated)
5. DevTools → Network: `GET /api/auth/me` → body has `permissions.allowed` with all `hrm:*` (28 keys)

**API expect (already verified):** employees `200`, leave/hr `200`, leave/mine `200`; portal modules `200` for HR

---

## Scenario B — Employee self-service only

1. Logout
2. Login as **Employee** account
3. Expect:
   - Personal dashboard (“Hi, …”) with Leave / Attendance / Payslips cards
   - Sidebar: Home, Attendance (overview + week-off), Leave, Payslips, Org chart, Reimbursements, Performance, Announcements, Documents, Profile
   - **No** Employees, Manual entry, Rules, Payroll list, Departments, Users, Directory, Onboarding, Offboarding, Recruitment
4. Open `/employees` directly in URL → redirected to `/`
5. Open `/leave` → can see apply form + my requests (HR inbox hidden)
6. Open `/attendance` → my month summary only (no admin matrix)
7. Open `/reimbursements` / `/announcements` / `/documents` / `/performance` / `/org-chart` → self views work

**API expect (already verified):** employees `403`, leave/hr `403`, leave/mine `200`, payslips/mine `200`; departments/directory/users `403`; announcements/org-chart/documents/reimbursements/mine `200`

---

## Scenario C — Denied (no hrm perms)

1. Logout
2. Login as **Denied** account
3. Expect:
   - Error: **No HRM access for this role…**
   - Stays on / redirects to login, **no dashboard**
4. Confirm localStorage/sessionStorage has no `hrm_auth_token`

**Note:** Raw JWT can still hit self-service APIs (`auth`-only). App entry is blocked in the frontend. That matches CRM design (same JWT for multiple apps).

---

## Scenario D — Superadmin unchanged

1. Login with real superadmin
2. Expect full nav + all admin pages still work (level 1 bypass)
3. No need for `hrm:*` on the role document

---

## Scenario E — Grant access via Roles UI (real workflow)

1. In **DeltaFrontend** → Roles → Edit any non-test role (or create `hr`)
2. Enable **HRM** permission checkboxes (new category)
3. Assign a real user to that role
4. That user logs into http://localhost:3000
5. Nav/API unlock based on which `hrm:*` keys you checked

Minimum to enter app: `hrm:access`

---

## Quick API checklist (PowerShell)

```powershell
$login = Invoke-RestMethod http://localhost:5000/api/superadmin/login -Method POST -ContentType application/json -Body '{"email":"hrm.test.hr.fixture@deltayards.com","password":"HrmTest@2026!"}'
$h = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod http://localhost:5000/api/hrm/me -Headers $h
Invoke-WebRequest http://localhost:5000/api/hrm/employees?limit=1 -Headers $h -UseBasicParsing | Select StatusCode
```

Repeat with employee / denied emails.

---

## Pass / Fail matrix (fill while testing)

| # | Check | HR | Employee | Denied | Superadmin |
|---|-------|----|----------|--------|------------|
| 1 | Login to HRM UI | | | | |
| 2 | `/api/hrm/me` returns perms | | | | |
| 3 | See Employees nav | | | | |
| 4 | `/employees` works | | | | |
| 5 | Leave self-service visible | | | | |
| 6 | Leave HR inbox visible | | | | |
| 7 | Attendance admin matrix | | | | |
| 8 | Payroll list | | | | |
| 9 | Direct URL `/employees` blocked | N/A | | N/A | N/A |

---

## Cleanup when done testing

```bash
cd deltadb
node scripts/rollbackHrmTestFixtures.js --dry-run
node scripts/rollbackHrmTestFixtures.js
```

Confirm with:
```bash
node scripts/inspectHrmAccess.js
```
Fixture users/roles should be gone. `superadmin` untouched.
