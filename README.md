# 🏦 QA Bank Demo — Enterprise Test Automation Framework

> **Professional-grade E2E test automation framework** for a banking web application, built with **Playwright** and structured using **Page Object Model (POM)**, **Data-Driven Testing**, and **Role-Based Access Control (RBAC)** validation.

[![CI Pipeline](https://github.com/AnkitaMkhandare/QA-Bank-Demo/actions/workflows/ci.yml/badge.svg)](https://github.com/AnkitaMkhandare/QA-Bank-Demo/actions)
[![Playwright](https://img.shields.io/badge/Playwright-1.60+-45ba4b.svg)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Test Execution](#-test-execution)
- [Part 1 vs Part 2 — Role-Based Testing](#-part-1-vs-part-2--role-based-testing)
- [RBAC Permission Matrix](#-rbac-permission-matrix)
- [Test Coverage](#-test-coverage)
- [Reporting](#-reporting)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Docker Support](#-docker-support)
- [Framework Design Patterns](#-framework-design-patterns)
- [Configuration](#-configuration)
- [Test Results](#-test-results)
- [Contributing](#-contributing)

---

## 🎯 Project Overview

This framework automates end-to-end testing for a **banking web application** ([QA Playground Bank](https://qaplayground.com/bank)) covering:

- **Multi-role authentication** (Admin + Viewer)
- **Account management** (CRUD operations)
- **Financial transactions** (Deposit, Withdrawal, Transfer)
- **Role-Based Access Control (RBAC)** — verifying what each role can and cannot do
- **Security validation** (XSS, SQL Injection prevention)
- **Cross-browser compatibility** (Chromium, Firefox, WebKit)
- **Accessibility compliance** (WCAG 2.1 AA)
- **Visual regression** testing
- **Performance metrics** (page load, LCP, FCP)
- **Banking security** (MFA, session management, encryption, account lockout)
- **Compliance validation** (PCI DSS, GDPR)
- **Bill payments** (utility, scheduled, recurring)
- **Database validation** (integrity, ACID compliance)
- **Network resilience** (disconnection, timeout, throttling)

### Application Under Test

| Feature | Description |
|---------|-------------|
| **URL** | `https://qaplayground.com/bank` |
| **Admin Login** | `admin` / `admin123` — Full CRUD access |
| **Viewer Login** | `viewer` / `viewer123` — Read-only access |
| **Pages** | Login, Dashboard, Accounts, Transactions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Test Specs Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Part 1:     │  │  Part 2:     │  │  Cross-Role:         │  │
│  │  Admin Tests │  │  Viewer Tests│  │  RBAC Comparison     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
├─────────┼──────────────────┼────────────────────┼──────────────┤
│         │       Fixtures & Test Data            │              │
│         │  ┌────────────────────────────────┐   │              │
│         └──┤  test-fixtures.js (DI Layer)   ├───┘              │
│            └──────────────┬─────────────────┘                  │
├───────────────────────────┼────────────────────────────────────┤
│                    Page Object Layer                           │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │LoginPage │ │DashboardPg │ │AccountsPg  │ │TransactionPg │  │
│  └────┬─────┘ └─────┬──────┘ └─────┬──────┘ └──────┬───────┘  │
│       └──────────────┼──────────────┼───────────────┘          │
│              ┌───────┴──────────┐                              │
│              │    BasePage      │  (Abstract — shared methods) │
│              └──────────────────┘                              │
├────────────────────────────────────────────────────────────────┤
│                   Components Layer                             │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────────────┐    │
│  │NavigationBar │  │   Modal   │  │     DataTable         │    │
│  └──────────────┘  └───────────┘  └──────────────────────┘    │
├────────────────────────────────────────────────────────────────┤
│                    Utilities Layer                              │
│  ┌────────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────┐   │
│  │RetryHelper │ │AssertHelper  │ │A11yHelper│ │PerfHelper │   │
│  └────────────┘ └──────────────┘ └──────────┘ └───────────┘   │
├────────────────────────────────────────────────────────────────┤
│                      API Layer                                 │
│  ┌──────────┐  ┌───────────────┐  ┌─────────────────┐         │
│  │ApiClient │  │BankApiService │  │SchemaValidator  │         │
│  └──────────┘  └───────────────┘  └─────────────────┘         │
├────────────────────────────────────────────────────────────────┤
│                   Config Layer                                 │
│  ┌──────────────┐  ┌──────────────────────────────────────┐   │
│  │env.config.js │  │test-data/ (JSON: login, accounts,   │   │
│  │              │  │           transactions)              │   │
│  └──────────────┘  └──────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Playwright** | Browser automation & E2E testing |
| **Node.js 18+** | Runtime environment |
| **Page Object Model** | UI abstraction pattern |
| **Custom Fixtures** | Dependency injection for test setup |
| **JSON Test Data** | Data-driven test inputs |
| **GitHub Actions** | CI/CD pipeline |
| **Docker** | Containerized test execution |
| **axe-core** | Accessibility (a11y) testing |

---

## 📁 Folder Structure

```
bank-project/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── docs/
│   ├── ARCHITECTURE.md               # Detailed architecture documentation
│   └── TEST-STRATEGY.md              # Test strategy & coverage plan
├── src/                              # Framework source code
│   ├── pages/                        # Page Objects (POM)
│   │   ├── BasePage.js               #   Abstract base class
│   │   ├── LoginPage.js              #   Login page interactions
│   │   ├── DashboardPage.js          #   Dashboard page interactions
│   │   ├── AccountsPage.js           #   Accounts CRUD operations
│   │   └── TransactionsPage.js       #   Transaction operations
│   ├── components/                   # Reusable UI components
│   │   ├── NavigationBar.js          #   Main nav bar
│   │   ├── Modal.js                  #   Dialog/modal wrapper
│   │   └── DataTable.js              #   Table interactions
│   ├── utils/                        # Utility helpers
│   │   ├── RetryHelper.js            #   Retry mechanism
│   │   ├── AssertionHelper.js        #   Custom assertions
│   │   ├── AccessibilityHelper.js    #   WCAG compliance
│   │   └── PerformanceHelper.js      #   Performance metrics
│   ├── api/                          # API testing layer
│   │   ├── ApiClient.js              #   HTTP client wrapper
│   │   ├── BankApiService.js         #   Bank API methods
│   │   └── SchemaValidator.js        #   JSON schema validation
│   ├── config/                       # Configuration
│   │   ├── env.config.js             #   Environment settings
│   │   └── test-data/                #   Test data (JSON)
│   │       ├── login.json            #     Login credentials
│   │       ├── accounts.json         #     Account test data
│   │       └── transactions.json     #     Transaction test data
│   └── fixtures/
│       └── test-fixtures.js          # Custom Playwright fixtures
├── tests/                            # All test specifications
│   ├── e2e/                          # End-to-End tests
│   │   ├── part1-admin/              #   PART 1: Admin role (Full CRUD)
│   │   │   ├── login/                #     Admin login tests
│   │   │   ├── dashboard/            #     Admin dashboard tests
│   │   │   ├── accounts/             #     Account CRUD + negative tests
│   │   │   ├── transactions/         #     Transaction CRUD + negative tests
│   │   │   └── flows/                #     Admin showcase & happy path
│   │   ├── part2-viewer/             #   PART 2: Viewer role (Read-Only)
│   │   │   ├── login/                #     Viewer login + role badge
│   │   │   ├── dashboard/            #     Dashboard read-only view
│   │   │   ├── accounts/             #     Accounts read-only (no CRUD)
│   │   │   ├── transactions/         #     Transactions read-only
│   │   │   └── flows/                #     Viewer showcase flow
│   │   └── cross-role/               #   RBAC comparison tests
│   │       └── rbac-permissions.js   #     Admin vs Viewer permissions
│   ├── api/                          # API test specs
│   ├── visual/                       # Visual regression tests
│   ├── accessibility/                # WCAG compliance tests
│   ├── security/                     # Security tests (XSS, SQLi, MFA, SSL)
│   ├── compliance/                   # PCI DSS & GDPR compliance tests
│   ├── database/                     # Database validation tests
│   ├── resilience/                   # Network failure & resilience tests
│   └── performance/                  # Page load performance tests
├── playwright.config.js              # Playwright configuration
├── package.json                      # Dependencies & npm scripts
├── Dockerfile                        # Docker container setup
├── docker-compose.yml                # Docker Compose orchestration
├── .env.example                      # Environment variable template
└── .gitignore                        # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/AnkitaMkhandare/QA-Bank-Demo.git
cd QA-Bank-Demo

# Install dependencies + Playwright browsers
npm run setup

# (Optional) Create .env file from template
cp .env.example .env
```

### Quick Verify

```bash
# Run the admin showcase (7 stages — full demo)
npm run test:admin:showcase

# Run the viewer showcase (6 stages — read-only demo)
npm run test:viewer:showcase
```

---

## 🧪 Test Execution

### Run by Role

```bash
# Part 1: All Admin tests (Full CRUD)
npm run test:admin

# Part 2: All Viewer tests (Read-Only)
npm run test:viewer

# Cross-Role: RBAC comparison tests
npm run test:rbac
```

### Run by Feature

```bash
# Login tests (both roles)
npm run test:login

# Account tests (both roles)
npm run test:accounts

# Transaction tests (both roles)
npm run test:transactions
```

### Run by Category

```bash
# Smoke tests (critical path)
npm run test:smoke

# Full regression suite
npm run test:all

# Complete suite (E2E + API + Visual + A11y + Security + Performance)
npm run test:full-suite
```

### Run by Browser

```bash
npm run test:chromium    # Google Chrome
npm run test:firefox     # Mozilla Firefox
npm run test:webkit      # Apple Safari
npm run test:edge        # Microsoft Edge
npm run test:all-browsers  # All browsers (Chrome + Firefox + Safari + Edge)
```

### Run by Security & Compliance

```bash
npm run test:security              # All security tests
npm run test:security:mfa          # MFA, session management, account lockout
npm run test:security:encryption   # SSL/TLS, data encryption, HTTPS

npm run test:compliance            # All compliance tests
npm run test:compliance:pci        # PCI DSS compliance
npm run test:compliance:gdpr       # GDPR compliance

npm run test:database              # Database validation
npm run test:resilience            # Network failure handling
npm run test:bill-payments         # Bill payment scenarios
```

### Debugging

```bash
npm run test:headed      # Watch tests run in browser
npm run test:debug       # Step-through debugger
```

---

## 👥 Part 1 vs Part 2 — Role-Based Testing

### Part 1: Admin Role (Full CRUD Access)

The **Admin** user has complete control over the banking application:

| Test Suite | Tests | What's Covered |
|-----------|-------|----------------|
| `admin-login` | 5 | Valid/invalid login, session, form validation |
| `admin-dashboard` | 4 | Dashboard content, navigation, user session |
| `admin-accounts` | 5+5 | CRUD operations + negative/boundary tests |
| `admin-transactions` | 5+5+5 | Deposit/Withdrawal/Transfer + negative tests |
| `admin-showcase` | 7 stages | Complete sequential demo flow |

### Part 2: Viewer Role (Read-Only Access)

The **Viewer** user can only view data — all write operations are blocked:

| Test Suite | Tests | What's Covered |
|-----------|-------|----------------|
| `viewer-login` | 3 | Login, role badge verification, wrong password |
| `viewer-dashboard` | 4 | Navigation, badge display, logout |
| `viewer-accounts` | 5 | View list, no create/edit/delete buttons |
| `viewer-transactions` | 7 | View, filter, sort, paginate, export — no create |
| `viewer-showcase` | 6 stages | Complete sequential read-only demo flow |

---

## 🔒 RBAC Permission Matrix

| Feature | Admin | Viewer | Test ID |
|---------|:-----:|:------:|---------|
| Login | ✅ | ✅ | TC-RBAC-05 |
| View Dashboard | ✅ | ✅ | TC-V-DASH-01 |
| View Accounts | ✅ | ✅ | TC-V-ACC-01 |
| **Create Account** | ✅ | ❌ Hidden | TC-RBAC-01 |
| **Edit Account** | ✅ | ❌ Blocked | TC-V-ACC-04 |
| **Delete Account** | ✅ | ❌ Absent | TC-RBAC-03 |
| View Transactions | ✅ | ✅ | TC-RBAC-04 |
| **Create Transaction** | ✅ | ❌ Hidden | TC-RBAC-02 |
| Filter/Sort | ✅ | ✅ | TC-V-TXN-03/04 |
| Export Data | ✅ | ✅ | TC-V-TXN-06 |
| Pagination | ✅ | ✅ | TC-V-TXN-05 |
| **Role Badge** | None | `Read-only` | TC-RBAC-05 |
| Logout | ✅ | ✅ | TC-V-DASH-04 |

---

## 📊 Test Coverage

| Category | Tests | Description |
|----------|:-----:|-------------|
| **E2E — Admin** | 30+ | Full CRUD operations across all pages |
| **E2E — Viewer** | 20+ | Read-only validation on all pages |
| **RBAC** | 5 | Admin vs Viewer permission comparison |
| **Negative** | 10+ | Boundary values, error handling |
| **Security — Auth** | 5+ | XSS prevention, SQL injection, auth bypass |
| **Security — MFA & Sessions** | 16 | Multi-factor auth, session management, account lockout |
| **Security — Encryption** | 16 | SSL/TLS validation, data masking, HTTPS enforcement |
| **Compliance — PCI DSS** | 14 | Card data protection, encryption, access control, audit |
| **Compliance — GDPR** | 15 | Consent, right to erasure, data portability, privacy |
| **Bill Payments** | 15 | Utility payments, scheduling, payee management |
| **Database Validation** | 14 | Referential integrity, ACID compliance, type validation |
| **Network Resilience** | 12 | Disconnection, timeouts, throttling, error recovery |
| **Accessibility** | 5+ | WCAG 2.1 AA compliance (axe-core) |
| **Visual** | 3+ | Screenshot-based regression testing |
| **Performance** | 7+ | Page load, LCP, FCP, CLS, network throttling |
| **API** | 15+ | REST endpoint & schema validation |
| **Total** | **185+** | Enterprise full-stack coverage |

---

## 📊 Test Results

For the complete, enterprise-grade test case results document with **85 test cases**, detailed steps, expected vs actual results, and sign-off section, see:

👉 **[docs/TEST-RESULTS.md](docs/TEST-RESULTS.md)**

Highlights:
- **96.5% pass rate** (82 passed, 0 failed, 3 skipped)
- Covers **10 test categories** (E2E Admin, E2E Viewer, RBAC, Security, A11y, Visual, Performance, API)
- Professional format with TC-IDs, priorities, preconditions, and defect tracking

---

## 📈 Reporting

### HTML Reports

```bash
# Generate report after test run
npm run report

# Tests auto-generate reports in reports/html-report/
```

### Report Features
- Step-by-step execution trace
- Screenshots on failure
- Video recordings (showcase tests)
- Performance annotations
- Error context with stack traces

---

## ⚙️ CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push and PR:

```yaml
Triggers: push to master, pull requests
Steps:
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies
  4. Install Playwright browsers
  5. Run smoke tests
  6. Run full E2E suite
  7. Upload HTML report as artifact
```

---

## 🐳 Docker Support

```bash
# Build test container
npm run docker:build

# Run full suite in Docker
npm run docker:run

# Run smoke tests via Docker Compose
npm run docker:smoke
```

---

## 🎨 Framework Design Patterns

| Pattern | Usage |
|---------|-------|
| **Page Object Model (POM)** | All UI pages encapsulated as classes with `BasePage` inheritance |
| **Abstract Factory** | `BasePage` cannot be instantiated directly — enforces proper subclassing |
| **Dependency Injection** | Custom fixtures inject Page Objects, test data, and config into tests |
| **Data-Driven Testing** | JSON test data files drive parameterized test execution |
| **Component Pattern** | Reusable `NavigationBar`, `Modal`, `DataTable` shared across page objects |
| **Builder Pattern** | Account creation wizard uses step-by-step builder approach |
| **Structured Logging** | `[timestamp] [LEVEL] [PageName] message` format in all page objects |

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```env
BASE_URL=https://qaplayground.com/bank
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
VIEWER_USERNAME=viewer
VIEWER_PASSWORD=viewer123
HEADLESS=true
SLOW_MO=0
```

### Playwright Config

Key settings in `playwright.config.js`:
- **Retries:** 1 in CI, 0 locally
- **Workers:** 4 parallel (configurable)
- **Browsers:** Chromium, Firefox, WebKit, Edge
- **Timeouts:** 30s per test, 10s per action
- **Artifacts:** Screenshots, videos, traces on failure

---

## 🏦 Banking Security & Compliance Specification

This framework addresses the following **enterprise banking test specifications**:

### Key Testing Areas

| Area | Status | Test File | Tests |
|------|:------:|-----------|:-----:|
| **Authentication Security** | ✅ Implemented | `tests/security/auth-security.spec.js` | 20+ |
| **Multi-Factor Authentication** | 🔮 Provisioned | `tests/security/mfa-session.spec.js` | 5 |
| **Session Management** | 🔮 Provisioned | `tests/security/mfa-session.spec.js` | 6 |
| **Account Lockout** | 🔮 Provisioned | `tests/security/mfa-session.spec.js` | 5 |
| **Transaction Processing** | ✅ Implemented | `tests/e2e/part1-admin/transactions/` | 30+ |
| **Bill Payments** | 🔮 Provisioned | `tests/e2e/part1-admin/transactions/admin-bill-payments.spec.js` | 15 |
| **Data Encryption & SSL** | ✅ Partial | `tests/security/data-encryption.spec.js` | 16 |
| **PCI DSS Compliance** | ✅ Partial | `tests/compliance/pci-dss.spec.js` | 14 |
| **GDPR Compliance** | ✅ Partial | `tests/compliance/gdpr.spec.js` | 15 |
| **Error Handling** | ✅ Implemented | `tests/e2e/part1-admin/transactions/admin-transactions-negative.spec.js` | 12 |
| **Network Failures** | ✅ Implemented | `tests/resilience/network-failures.spec.js` | 12 |
| **Database Validation** | ✅ Partial | `tests/database/db-validation.spec.js` | 14 |

### Advanced Features

| Feature | Status | Implementation |
|---------|:------:|---------------|
| **Cross-browser** (Chrome, Firefox, Safari, Edge) | ✅ | `playwright.config.js` — 6 browser projects |
| **API Testing for Backend Services** | ✅ | `tests/api/` — Full REST validation + schema |
| **Database Validation** | ✅ | `tests/database/` — ACID, integrity, types |
| **Performance Testing Integration** | ✅ | `tests/performance/` — TTFB, FCP, LCP, CLS |

### Legend
- ✅ **Implemented** — Active tests that run against the application
- 🔮 **Provisioned** — Tests structured and ready for when the AUT supports the feature (uses `test.skip()`)

---

## 👩‍💻 Author

**Ankita Mkhandare**
- GitHub: [@AnkitaMkhandare](https://github.com/AnkitaMkhandare)
- Role: Senior QA Engineer | 10+ Years in Test Automation

---

## 📄 License

This project is licensed under the MIT License.