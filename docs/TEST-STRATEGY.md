# 📋 Test Strategy Document

> Comprehensive test strategy for the QA Bank Demo automation framework.

---

## 1. Scope

### In-Scope

| Area | What's Tested |
|------|--------------|
| **Authentication** | Login/logout for Admin and Viewer roles |
| **Multi-Factor Auth (MFA)** | OTP verification, 2FA bypass prevention (provisioned) |
| **Session Management** | Timeout, expiration, concurrent sessions, token refresh (provisioned) |
| **Account Lockout** | Brute-force protection, cooldown period, counter reset (provisioned) |
| **Accounts** | CRUD operations (Admin), read-only (Viewer) |
| **Transactions** | Deposit, Withdrawal, Transfer (Admin), view-only (Viewer) |
| **Bill Payments** | Utility bills, scheduled/recurring, payee management (provisioned) |
| **RBAC** | Role-based access control — Admin vs Viewer permissions |
| **Negative** | Boundary values, invalid inputs, error messages |
| **Security — Auth** | XSS prevention, SQL injection prevention, auth bypass |
| **Security — Encryption** | SSL/TLS validation, HTTPS enforcement, data masking |
| **Compliance — PCI DSS** | Card data protection, secure transmission, access control |
| **Compliance — GDPR** | Consent, data portability, right to erasure, privacy by design |
| **Database Validation** | Referential integrity, ACID compliance, type validation |
| **Network Resilience** | Disconnection handling, timeout recovery, throttling |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Visual** | Screenshot-based regression |
| **Performance** | Page load times, LCP, FCP, CLS, Core Web Vitals |
| **API** | REST endpoint validation + schema validation |

### Out-of-Scope
- Load/stress testing (1000+ concurrent users)
- Mobile-native application testing
- Penetration testing (requires specialized tools like Burp Suite)

---

## 2. Test Types

### 2.1 Functional E2E Tests

**Part 1 — Admin Role (Full CRUD):**
- Login with valid/invalid credentials
- Dashboard content and navigation
- Account creation via wizard, inline editing, deletion
- Transaction creation (deposit, withdrawal, transfer)
- Negative scenarios (empty fields, insufficient funds, same-account transfer)

**Part 2 — Viewer Role (Read-Only):**
- Login and role badge verification (`Read-only` badge visible)
- Dashboard navigation (all links accessible)
- Accounts page: table visible, create/edit/delete buttons **hidden**
- Transactions page: history visible, filters/sort work, create button **hidden**
- Export and pagination still functional

**Cross-Role RBAC:**
- Side-by-side comparison: Admin sees CRUD buttons, Viewer does not
- Role badge differentiation
- Both roles can read data

### 2.2 Security Tests
- XSS payload injection in description fields
- SQL injection attempts in input fields
- Authentication bypass attempts (direct URL navigation)
- Multi-Factor Authentication (MFA) — OTP validation, expiry, bypass prevention
- Session management — timeout, fixation, concurrent sessions, cookie security
- Account lockout — brute-force protection, cooldown, counter reset
- Data encryption — SSL/TLS, HTTPS enforcement, sensitive data masking
- Security headers — HSTS, CSP, X-Frame-Options, Cache-Control

### 2.3 Compliance Tests
- **PCI DSS:** Card data masking, no storage of CVV, TLS encryption, RBAC, audit trail
- **GDPR:** Cookie consent, right of access, right to erasure, data portability, privacy by design

### 2.4 Database Validation
- Referential integrity (transactions reference valid accounts)
- Unique constraints (no duplicate IDs)
- ACID compliance (atomicity of deposits, withdrawals, transfers)
- Data type validation (numeric balances, valid dates)
- Direct DB schema validation (provisioned for future)

### 2.5 Network Resilience Tests
- Network disconnection handling
- Request timeout scenarios
- HTTP error responses (500, 503, 429)
- Intermittent connectivity (network flapping)
- Degraded network performance (2G, 3G simulation)
- CORS configuration validation

### 2.6 Accessibility Tests
- WCAG 2.1 AA compliance using axe-core
- Keyboard navigation support
- Color contrast checks
- ARIA attributes validation

### 2.7 Visual Regression Tests
- Login page screenshot comparison
- Dashboard layout consistency
- Accounts page visual stability

### 2.8 Performance Tests
- Page load time < 3 seconds
- Largest Contentful Paint (LCP) measurement
- First Contentful Paint (FCP) measurement

### 2.9 API Tests
- Account listing endpoint validation
- Transaction history endpoint validation
- Response schema validation

---

## 3. RBAC Test Matrix

| Permission | Admin | Viewer | Enforcement Method |
|-----------|:-----:|:------:|-------------------|
| Login | ✅ | ✅ | Both can authenticate |
| View Dashboard | ✅ | ✅ | Content visible |
| View Accounts | ✅ | ✅ | Table visible |
| Create Account | ✅ | ❌ | Wizard button **removed from DOM** |
| Edit Account | ✅ | ❌ | Inline edit **does not activate** |
| Delete Account | ✅ | ❌ | Delete buttons **removed from DOM** |
| View Transactions | ✅ | ✅ | Table visible |
| Create Transaction | ✅ | ❌ | Button **removed from DOM** |
| Filter/Sort | ✅ | ✅ | Read operations allowed |
| Export Data | ✅ | ✅ | Export button enabled |
| Pagination | ✅ | ✅ | Pagination controls work |
| Role Badge | None | `Read-only` | `[data-testid="viewer-badge"]` |

---

## 4. Test Environment

| Property | Value |
|----------|-------|
| **Application URL** | `https://qaplayground.com/bank` |
| **Admin Credentials** | `admin` / `admin123` |
| **Viewer Credentials** | `viewer` / `viewer123` |
| **Browsers** | Chromium, Firefox, WebKit, Edge |
| **Node.js** | 18+ |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker |

---

## 5. Test Execution Strategy

### Execution Order

1. **Smoke Tests** — Critical path validation (login + basic navigation)
2. **Part 1: Admin** — Full CRUD operations
3. **Part 2: Viewer** — Read-only validation
4. **Cross-Role RBAC** — Permission comparison
5. **Negative Tests** — Error handling and boundary values
6. **Security Tests** — XSS, SQL injection, MFA, session, encryption
7. **Compliance Tests** — PCI DSS and GDPR validation
8. **Database Validation** — Data integrity and ACID compliance
9. **Network Resilience** — Failure handling and recovery
10. **Accessibility** — WCAG compliance
11. **Visual** — Screenshot regression
12. **Performance** — Load time metrics, Core Web Vitals
13. **API** — Endpoint and schema validation

### NPM Scripts

```bash
npm run test:admin              # Part 1 only
npm run test:viewer             # Part 2 only
npm run test:rbac               # Cross-role only
npm run test:security           # All security tests
npm run test:security:mfa       # MFA + session + lockout
npm run test:security:encryption  # SSL/TLS + encryption
npm run test:compliance         # PCI DSS + GDPR
npm run test:compliance:pci     # PCI DSS only
npm run test:compliance:gdpr    # GDPR only
npm run test:database           # Database validation
npm run test:resilience         # Network failure handling
npm run test:bill-payments      # Bill payment scenarios
npm run test:all                # All E2E tests
npm run test:full-suite         # Everything (E2E + API + visual + a11y + security + compliance + perf)
npm run test:all-browsers       # All browsers (Chrome + Firefox + Safari + Edge)
```

---

## 6. Defect Severity Classification

| Severity | Definition | Example |
|----------|-----------|---------|
| **Blocker** | Core function completely broken | Login fails for all users |
| **Critical** | Major feature broken | Viewer can create accounts (RBAC bypass) |
| **High** | Feature partially broken | Transaction created but no confirmation |
| **Medium** | Minor defect with workaround | Filter resets after sort |
| **Low** | Cosmetic issue | Badge text alignment off |

---

## 7. Reporting

- **HTML Reports** — Auto-generated by Playwright
- **Screenshots** — Captured on test failure
- **Videos** — Recorded for showcase tests
- **Traces** — Playwright trace viewer for debugging
- **CI Artifacts** — Reports uploaded as GitHub Actions artifacts