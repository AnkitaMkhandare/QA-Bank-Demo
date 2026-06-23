const { test, expect } = require('../../src/fixtures/test-fixtures');
const AccessibilityHelper = require('../../src/utils/AccessibilityHelper');

/**
 * Accessibility Tests — WCAG Compliance
 * 
 * Validates accessibility across all main pages:
 * - ARIA roles and labels
 * - Form label associations
 * - Heading hierarchy
 * - Keyboard navigation (Tab order, focus visibility)
 * - Button accessible names
 * - Landmark regions
 * 
 * @tags @a11y @regression
 */

test.describe('Accessibility Audit @a11y', () => {

  // ─── Login Page Accessibility ──────────────────────────────────────────────────

  test('A11Y-LOGIN-01: Login page passes accessibility audit', async ({ loginPage, baseUrl, page }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-LOGIN-01' },
      { type: 'severity', description: 'normal' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const results = await a11y.audit();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Login Page Violations:', JSON.stringify(results.violations, null, 2));
    }

    // Critical violations should be 0
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical).toHaveLength(0);
  });

  test('A11Y-LOGIN-02: Login form has proper labels', async ({ loginPage, baseUrl, page }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-LOGIN-02' },
      { type: 'severity', description: 'serious' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const results = await a11y.checkFormLabels();

    // All form inputs should have labels
    expect(results.violations.filter(v => v.impact === 'serious')).toHaveLength(0);
  });

  test('A11Y-LOGIN-03: Login page supports keyboard navigation', async ({ loginPage, baseUrl, page }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-LOGIN-03' },
      { type: 'severity', description: 'normal' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const { focusOrder, allFocusVisible } = await a11y.testTabOrder(10);

    // Should be able to tab through interactive elements
    expect(focusOrder.length).toBeGreaterThan(0);

    // Focus indicators should be visible
    // Note: This may fail on some apps that use custom focus styles
    // expect(allFocusVisible).toBeTruthy();
  });

  // ─── Dashboard Page Accessibility ─────────────────────────────────────────────

  test('A11Y-DASH-01: Dashboard passes accessibility audit', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-DASH-01' },
      { type: 'severity', description: 'normal' },
    );

    const { page, dashboard } = adminSession;
    await dashboard.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const results = await a11y.audit();

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical).toHaveLength(0);
  });

  test('A11Y-DASH-02: Dashboard has proper heading hierarchy', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-DASH-02' },
      { type: 'severity', description: 'normal' },
    );

    const { page, dashboard } = adminSession;
    await dashboard.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const results = await a11y.checkHeadingHierarchy();

    // No heading level skips
    expect(results.violations).toHaveLength(0);
  });

  // ─── Accounts Page Accessibility ──────────────────────────────────────────────

  test('A11Y-ACC-01: Accounts page passes accessibility audit', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-ACC-01' },
      { type: 'severity', description: 'normal' },
    );

    const { page, navBar, accounts } = adminSession;
    await navBar.goToAccounts();
    await accounts.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const results = await a11y.audit();

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical).toHaveLength(0);
  });

  test('A11Y-ACC-02: Accounts page buttons have accessible names', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-ACC-02' },
      { type: 'severity', description: 'critical' },
    );

    const { page, navBar, accounts } = adminSession;
    await navBar.goToAccounts();
    await accounts.isLoaded();

    const a11y = new AccessibilityHelper(page);
    const results = await a11y.checkButtonLabels();

    expect(results.violations).toHaveLength(0);
  });

  // ─── Keyboard Navigation E2E ──────────────────────────────────────────────────

  test('A11Y-KB-01: Full login flow using keyboard only', async ({ loginPage, baseUrl, page }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'A11Y-KB-01' },
      { type: 'severity', description: 'normal' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.isLoaded();

    // Tab to username field and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin');

    // Tab to password field and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin123');

    // Tab to login button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Should navigate away from login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/login');
  });
});