# 🏗️ Framework Architecture

## Overview

This document describes the architectural decisions, design patterns, and structural organization of the Bank Automation Framework.

---

## Design Principles

| Principle | Application |
|-----------|-------------|
| **Separation of Concerns** | Pages, components, data, and tests are fully isolated |
| **DRY (Don't Repeat Yourself)** | Common actions in BasePage, shared fixtures |
| **Single Responsibility** | Each class/file has one clear purpose |
| **Open/Closed** | Easy to extend (add pages/tests) without modifying existing code |
| **Dependency Injection** | Page objects injected via Playwright fixtures |

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TEST LAYER                            │
│  tests/e2e/login/ | dashboard/ | accounts/ | flows/     │
│  (Test scenarios, assertions, business logic)           │
├─────────────────────────────────────────────────────────┤
│                  FIXTURE LAYER                           │
│  src/fixtures/test-fixtures.js                          │
│  (Dependency injection, session management)             │
├─────────────────────────────────────────────────────────┤
│                PAGE OBJECT LAYER                         │
│  src/pages/LoginPage.js | DashboardPage.js | etc.       │
│  (Page-specific actions, selectors, validations)        │
├─────────────────────────────────────────────────────────┤
│               COMPONENT LAYER                           │
│  src/components/NavigationBar.js | Modal.js | DataTable │
│  (Reusable UI patterns across pages)                   │
├─────────────────────────────────────────────────────────┤
│                 BASE LAYER                              │
│  src/pages/BasePage.js                                  │
│  (Common actions, smart waits, logging, assertions)     │
├─────────────────────────────────────────────────────────┤
│               UTILITY LAYER                             │
│  src/utils/RetryHelper.js | AssertionHelper.js          │
│  (Cross-cutting concerns, helpers)                      │
├─────────────────────────────────────────────────────────┤
│             CONFIGURATION LAYER                         │
│  src/config/env.config.js | test-data/*.json            │
│  (Environment settings, test data)                      │
└─────────────────────────────────────────────────────────┘
```

---

## Design Patterns

### 1. Page Object Model (POM)

Each page in the application has a corresponding Page Object class:

```javascript
// BasePage provides common actions
class LoginPage {
  static SELECTORS = { ... };    // Centralized selectors
  async login(user, pass) { }    // Page-specific actions
  async isLoaded() { }           // Load verification
}
```

**Benefits:**
- Selectors are maintained in one place
- Test code reads like business requirements
- Changes to UI only require updating one file

### 2. Custom Fixtures (Dependency Injection)

```javascript
const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminSession: async ({ page }, use) => {
    // Pre-authenticated session
    await login(page);
    await use({ page, dashboard, accounts, ... });
  },
});
```

**Benefits:**
- No manual instantiation in tests
- Consistent setup/teardown
- Easy to create pre-conditions (authenticated sessions)

### 3. Data-Driven Testing

```javascript
for (const data of loginData.validCredentials) {
  test(`${data.testId}: ${data.description}`, async ({ loginPage }) => {
    await loginPage.login(data.username, data.password);
  });
}
```

**Benefits:**
- Add test scenarios by adding JSON data (no code changes)
- Clear separation of test logic and test data
- Easy to scale coverage

### 4. Component Pattern

Reusable UI components that appear across multiple pages:

```javascript
class Modal {
  constructor(page, modalSelector) { }
  async confirm() { }
  async cancel() { }
  async close() { }
}
```

### 5. Retry Pattern (Resilience)

```javascript
await RetryHelper.retry(
  () => page.click('.flaky-element'),
  { maxRetries: 3, operationName: 'Click flaky element' }
);
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Page Objects | `PascalCase` + `Page.js` | `LoginPage.js` |
| Components | `PascalCase` + `.js` | `NavigationBar.js` |
| Test Files | `kebab-case` + `.spec.js` | `login.spec.js` |
| Test Data | `kebab-case` + `.json` | `login.json` |
| Config | `kebab-case` + `.config.js` | `env.config.js` |
| Utilities | `PascalCase` + `.js` | `RetryHelper.js` |

---

## Test Organization

```
tests/
├── e2e/                    # End-to-end functional tests
│   ├── login/             # Feature: Authentication
│   ├── dashboard/         # Feature: Dashboard
│   ├── accounts/          # Feature: Account Management
│   ├── transactions/      # Feature: Transactions
│   └── flows/             # Cross-feature workflows
├── smoke/                  # Smoke test subset (future)
└── regression/             # Full regression (future)
```

---

## Configuration Strategy

```
Priority (highest to lowest):
1. Environment variables (CI/CD overrides)
2. .env file (local developer settings)
3. env.config.js defaults (fallback values)
```

---

## Selector Strategy

In order of preference:
1. `data-testid` attributes (most reliable)
2. ARIA roles (`getByRole`)
3. Text content (`getByText`)
4. CSS selectors (last resort)

---

## Error Handling Strategy

1. **Smart waits** — Never use `waitForTimeout()`, always condition-based
2. **Descriptive assertions** — Every assertion has a human-readable description
3. **Auto-logging** — All actions are logged with timestamp and context
4. **Screenshots on failure** — Automatic in CI
5. **Retry logic** — Configurable retries for known flaky scenarios