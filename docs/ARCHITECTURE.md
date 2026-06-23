# 🏗️ Architecture Documentation

> Technical architecture of the QA Bank Demo automation framework.

---

## Framework Architecture Overview

This framework follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST SPECS LAYER                          │
│                                                             │
│  Part 1: Admin (CRUD)  │  Part 2: Viewer (Read-Only)      │
│  Cross-Role: RBAC      │  Non-E2E: API, Visual, A11y, etc │
├─────────────────────────────────────────────────────────────┤
│                  FIXTURES LAYER                             │
│  test-fixtures.js — Dependency Injection                   │
│  Provides: Page Objects, Test Data, Config                 │
├─────────────────────────────────────────────────────────────┤
│                 PAGE OBJECTS LAYER                          │
│  BasePage (Abstract) ← LoginPage, DashboardPage,          │
│                         AccountsPage, TransactionsPage     │
├─────────────────────────────────────────────────────────────┤
│                 COMPONENTS LAYER                           │
│  NavigationBar │ Modal │ DataTable                         │
├─────────────────────────────────────────────────────────────┤
│                 UTILITIES LAYER                            │
│  RetryHelper │ AssertionHelper │ A11yHelper │ PerfHelper   │
├─────────────────────────────────────────────────────────────┤
│                    API LAYER                               │
│  ApiClient │ BankApiService │ SchemaValidator              │
├─────────────────────────────────────────────────────────────┤
│                  CONFIG LAYER                              │
│  env.config.js │ test-data/*.json │ .env                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Role-Based Test Architecture

The E2E tests are organized into three distinct sections based on user roles:

### Part 1: Admin Role Tests (`tests/e2e/part1-admin/`)

Tests full CRUD operations available to the admin user:

| Module | File | Responsibilities |
|--------|------|-----------------|
| Login | `admin-login.spec.js` | Valid/invalid login, session management |
| Dashboard | `admin-dashboard.spec.js` | Content verification, navigation |
| Accounts | `admin-accounts.spec.js` | Create, read, edit, delete accounts |
| Accounts | `admin-accounts-negative.spec.js` | Boundary values, error handling |
| Transactions | `admin-transactions.spec.js` | Deposit, withdrawal, transfer |
| Transactions | `admin-transactions-new.spec.js` | New transaction creation flows |
| Transactions | `admin-transactions-negative.spec.js` | Invalid amounts, same-account transfer |
| Flows | `admin-happy-path.spec.js` | End-to-end happy path |
| Flows | `admin-showcase.spec.js` | 7-stage complete demo flow |

### Part 2: Viewer Role Tests (`tests/e2e/part2-viewer/`)

Tests read-only access — verifies write actions are hidden or blocked:

| Module | File | Responsibilities |
|--------|------|-----------------|
| Login | `viewer-login.spec.js` | Login, role badge, invalid credentials |
| Dashboard | `viewer-dashboard.spec.js` | Navigation, logout, badge display |
| Accounts | `viewer-accounts-readonly.spec.js` | View-only: no create/edit/delete |
| Transactions | `viewer-transactions-readonly.spec.js` | View, filter, sort, export — no create |
| Flows | `viewer-showcase.spec.js` | 6-stage read-only demo flow |

### Cross-Role RBAC Tests (`tests/e2e/cross-role/`)

Side-by-side comparison tests that validate both roles in the same test:

| Test ID | What's Compared |
|---------|----------------|
| TC-RBAC-01 | Admin has "Open Account" button — Viewer does NOT |
| TC-RBAC-02 | Admin has "New Transaction" button — Viewer does NOT |
| TC-RBAC-03 | Admin has Delete buttons — Viewer does NOT |
| TC-RBAC-04 | Both roles can view transaction history |
| TC-RBAC-05 | Role badge differs (Admin: none, Viewer: "Read-only") |

---

## Page Object Model (POM)

All page interactions are encapsulated in Page Object classes:

```
BasePage (Abstract)
├── LoginPage        — Authentication flows
├── DashboardPage    — Dashboard content & navigation
├── AccountsPage     — Account CRUD operations
└── TransactionsPage — Transaction operations & history
```

**Key principles:**
- `BasePage` provides shared methods: `click()`, `fill()`, `getText()`, `assertVisible()`
- Each page class defines its own selectors as constants
- All selectors use `[data-testid]` attributes for stability
- Structured logging: `[timestamp] [LEVEL] [PageName] message`

---

## Custom Fixtures

The `test-fixtures.js` file extends Playwright's `test` object with:

| Fixture | Type | Description |
|---------|------|-------------|
| `loginPage` | Page Object | Pre-initialized `LoginPage` instance |
| `dashboardPage` | Page Object | Pre-initialized `DashboardPage` instance |
| `baseUrl` | String | Base URL from environment config |
| `credentials` | Object | Admin and Viewer credential objects |

---

## Data-Driven Testing

Test data is externalized in JSON files under `src/config/test-data/`:

- **`login.json`** — Valid/invalid credentials for data-driven login tests
- **`accounts.json`** — Account creation parameters (type, name, deposit)
- **`transactions.json`** — Transaction parameters (type, account, amount)

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. Checkout → Install Node.js → Install deps → Install browsers
2. Run smoke tests (`npm run test:smoke`)
3. Run full E2E suite (`npm run test:all`)
4. Upload HTML report artifact

---

## Docker Architecture

```
┌─────────────────────────┐
│    docker-compose.yml   │
│  ┌───────────────────┐  │
│  │  bank-tests        │  │
│  │  (Playwright +     │  │
│  │   Node.js 18)      │  │
│  └───────────────────┘  │
│  Volumes:               │
│  - ./reports → /reports │
└─────────────────────────┘