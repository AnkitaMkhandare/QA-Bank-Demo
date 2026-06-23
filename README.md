# 🏦 Bank Automation Framework

[![E2E Tests](https://github.com/AnkitaMkhandare/QA-Bank-Demo/actions/workflows/ci.yml/badge.svg)](https://github.com/AnkitaMkhandare/QA-Bank-Demo/actions/workflows/ci.yml)
[![Playwright](https://img.shields.io/badge/Playwright-v1.60-45ba4b?logo=playwright)](https://playwright.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Professional E2E Test Automation Framework** for the [QA Playground Bank Demo](https://qaplayground.com/bank) application.  
Built with **Playwright**, following **Page Object Model (POM)**, **Data-Driven Testing**, and industry best practices.

---

## 🏗️ Architecture

```
bank-automation-framework/
├── .github/workflows/ci.yml          # CI/CD pipeline (GitHub Actions)
├── src/
│   ├── config/
│   │   ├── env.config.js             # Multi-environment configuration
│   │   └── test-data/                # External test data (JSON)
│   │       ├── login.json
│   │       ├── accounts.json
│   │       └── transactions.json
│   ├── pages/                         # Page Object Model
│   │   ├── BasePage.js               # Abstract base (smart waits, logging)
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   ├── AccountsPage.js
│   │   └── TransactionsPage.js
│   ├── components/                    # Reusable UI components
│   │   ├── NavigationBar.js
│   │   ├── Modal.js
│   │   └── DataTable.js
│   ├── fixtures/                      # Custom Playwright fixtures (DI)
│   │   └── test-fixtures.js
│   └── utils/                         # Utility classes
│       ├── RetryHelper.js            # Smart retry with backoff
│       └── AssertionHelper.js        # Enhanced assertions
├── tests/
│   └── e2e/                           # Feature-based test suites
│       ├── login/login.spec.js
│       ├── dashboard/dashboard.spec.js
│       ├── accounts/accounts.spec.js
│       ├── transactions/transactions.spec.js
│       └── flows/happy-path.spec.js
├── playwright.config.js               # Multi-browser, parallel config
├── Dockerfile                         # Containerized execution
├── docker-compose.yml                 # Multi-service orchestration
└── docs/                              # Framework documentation
    ├── ARCHITECTURE.md
    └── TEST-STRATEGY.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** 9+

### Setup
```bash
# Clone and install
git clone https://github.com/AnkitaMkhandare/QA-Bank-Demo.git
cd QA-Bank-Demo
npm run setup
```

### Run Tests
```bash
# Run all tests (Chromium)
npm test

# Run specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run by suite type
npm run test:smoke        # Critical path only
npm run test:regression   # Full regression

# Run headed (visible browser)
npm run test:headed

# Debug mode
npm run test:debug
```

### View Reports
```bash
npm run report
```

---

## 🧪 Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| **Login** | 12 scenarios (data-driven) | Valid/invalid credentials, field validation, masking |
| **Dashboard** | 5 tests | Summary cards, balance, navigation, transactions |
| **Accounts** | 10 scenarios (data-driven) | Create, edit, delete, filter, sort |
| **Transactions** | 8 scenarios (data-driven) | Deposit, withdrawal, filter, export, detail |
| **E2E Flow** | 1 comprehensive flow | Full user journey (login → CRUD → logout) |

---

## 🔑 Design Patterns

| Pattern | Implementation |
|---------|---------------|
| **Page Object Model** | `src/pages/` — Encapsulated page interactions |
| **Dependency Injection** | `src/fixtures/test-fixtures.js` — Playwright fixtures |
| **Data-Driven Testing** | `src/config/test-data/` — External JSON data |
| **Component Pattern** | `src/components/` — Reusable UI components |
| **Factory Pattern** | `adminSession` / `viewerSession` fixtures |
| **Builder Pattern** | Account creation with configurable params |
| **Retry Pattern** | `RetryHelper` — Exponential backoff |

---

## ⚙️ Configuration

### Environment Variables
```bash
# Copy example and customize
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_ENV` | `qa` | Environment (qa/staging/production) |
| `BASE_URL` | `https://qaplayground.com/bank` | Application URL |
| `HEADLESS` | `true` | Run headless in CI |
| `DEBUG` | `false` | Enable verbose logging |
| `TEST_RETRIES` | `1` | Number of retries on failure |

### Multi-Browser Support
Configured in `playwright.config.js`:
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop Firefox)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 7)
- ✅ Mobile Safari (iPhone 14)

---

## 🐳 Docker

```bash
# Build image
npm run docker:build

# Run tests in container
npm run docker:run

# Run smoke tests
npm run docker:smoke

# Full regression (all browsers)
npm run docker:full
```

---

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

| Trigger | Action |
|---------|--------|
| Push to `main`/`develop` | Full E2E suite (Chromium + Firefox + WebKit) |
| Pull Request | Smoke tests only (fast feedback) |
| Nightly (2 AM UTC) | Full regression across all browsers |
| Manual dispatch | Configurable environment + browser |

### Artifacts
- HTML Report
- JUnit XML (for CI integration)
- Screenshots on failure
- Video recordings on failure
- Execution trace files

---

## 📊 Reporting

| Reporter | Output |
|----------|--------|
| HTML | `reports/html-report/` |
| JSON | `reports/test-results.json` |
| JUnit XML | `reports/junit-results.xml` |
| Console | List format with colors |

---

## 🔐 Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | `admin` | `admin123` | Full CRUD |
| Viewer | `viewer` | `viewer123` | Read-only |

---

## 📝 Known Issues

| ID | Description | Status |
|----|-------------|--------|
| TC-DASH-02 | Dashboard total balance ≠ sum of account balances | 🐛 App Bug |

---

## 🛠️ Framework Features

- ✅ **Page Object Model** with abstract base class
- ✅ **Custom Playwright Fixtures** (dependency injection)
- ✅ **Data-Driven Testing** (external JSON)
- ✅ **Multi-Environment Config** (QA/Staging/Prod)
- ✅ **Cross-Browser Testing** (5 browser configs)
- ✅ **Parallel Execution** (configurable workers)
- ✅ **Smart Retry Logic** (exponential backoff)
- ✅ **Enhanced Assertions** (descriptive failures)
- ✅ **CI/CD Integration** (GitHub Actions)
- ✅ **Docker Support** (containerized execution)
- ✅ **Test Tagging** (@smoke, @regression, @critical)
- ✅ **Auto Screenshots/Video** on failure
- ✅ **Test Annotations** (severity, owner, JIRA links)
- ✅ **Structured Logging** (timestamped, leveled)

---

## 👩‍💻 Author

**Ankita Mkhandare** — Senior QA Automation Engineer  
[GitHub](https://github.com/AnkitaMkhandare) | [LinkedIn](#)