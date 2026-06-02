# Bank Project — E2E Test Automation

Automated end-to-end test suite for [QA Playground Bank Demo](https://qaplayground.com/bank) using **Playwright**.

## Project Structure

```
bank-project/
├── playwright.config.js      # Playwright configuration
├── package.json
├── tests/
│   ├── helpers.js            # Shared utilities (login, navigation)
│   ├── tc-login-01.spec.js   # Successful admin login
│   ├── tc-login-02.spec.js   # Invalid credentials error
│   ├── tc-login-03.spec.js   # Login button disabled when fields empty
│   ├── tc-login-04.spec.js   # Password field masking
│   ├── tc-login-05.spec.js   # Viewer login with read-only access
│   ├── tc-dash-01.spec.js    # Dashboard summary cards
│   ├── tc-dash-02.spec.js    # Total balance validation [KNOWN BUG]
│   ├── tc-dash-04.spec.js    # Navigation links
│   ├── tc-dash-05.spec.js    # Recent transactions list
│   ├── tc-acc-01.spec.js     # Create account via wizard
│   ├── tc-acc-02.spec.js     # Edit account name inline
│   ├── tc-acc-03.spec.js     # Delete account with confirmation
│   ├── tc-acc-04.spec.js     # Filter accounts by type
│   ├── tc-acc-05.spec.js     # Sort accounts by balance
│   ├── tc-txn-01.spec.js     # Create deposit transaction
│   ├── tc-txn-02.spec.js     # Filter transactions by account
│   ├── tc-txn-03.spec.js     # Filter by date range (calendar)
│   ├── tc-txn-04.spec.js     # Export transactions as CSV
│   ├── tc-txn-05.spec.js     # Transaction detail page
│   └── tc-happy-path-flow.spec.js  # Full happy path E2E flow
└── test-results/             # Screenshots and videos (auto-generated)
```

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run a specific test
npx playwright test tests/tc-login-01.spec.js

# Run with headed browser (visible)
npx playwright test --headed

# Run happy path only
npx playwright test tests/tc-happy-path-flow.spec.js
```

## Credentials

| Role   | Username | Password  |
|--------|----------|-----------|
| Admin  | admin    | admin123  |
| Viewer | viewer   | viewer123 |

## Test Results Summary

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-LOGIN-01 | Successful admin login | ✅ PASS |
| TC-LOGIN-02 | Invalid credentials error | ✅ PASS |
| TC-LOGIN-03 | Login button disabled when empty | ✅ PASS |
| TC-LOGIN-04 | Password masking | ✅ PASS |
| TC-LOGIN-05 | Viewer login | ✅ PASS |
| TC-DASH-01 | Dashboard summary cards | ✅ PASS |
| TC-DASH-02 | Total balance validation | ❌ FAIL (known bug) |
| TC-DASH-04 | Navigation links | ✅ PASS |
| TC-DASH-05 | Recent transactions | ✅ PASS |
| TC-ACC-01 | Create account | ✅ PASS |
| TC-ACC-02 | Edit account inline | ✅ PASS |
| TC-ACC-03 | Delete account | ✅ PASS |
| TC-ACC-04 | Filter by type | ✅ PASS |
| TC-ACC-05 | Sort by balance | ✅ PASS |
| TC-TXN-01 | Create deposit | ✅ PASS |
| TC-TXN-02 | Filter by account | ✅ PASS |
| TC-TXN-03 | Filter by date range | ✅ PASS |
| TC-TXN-04 | Export CSV | ✅ PASS |
| TC-TXN-05 | Transaction detail | ✅ PASS |
| TC-HAPPY_PATH | Full E2E flow | ✅ PASS |

## Known Issues

- **TC-DASH-02**: Dashboard total balance does not match the sum of individual account balances (application bug).

## Configuration

Tests run in **headed Chromium** with screenshots and video recording enabled. Modify `playwright.config.js` to adjust settings.