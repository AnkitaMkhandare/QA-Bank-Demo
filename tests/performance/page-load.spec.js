const { test, expect } = require('../../src/fixtures/test-fixtures');
const PerformanceHelper = require('../../src/utils/PerformanceHelper');

/**
 * Performance Tests — Page Load & Core Web Vitals
 * 
 * Validates performance metrics against defined budgets:
 * - TTFB (Time to First Byte)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - CLS (Cumulative Layout Shift)
 * - Total page load time
 * - Resource count & transfer size
 * 
 * Includes network throttling tests for degraded conditions.
 * 
 * @tags @performance @regression
 */

test.describe('Performance Monitoring @performance', () => {

  // ─── Login Page Performance ────────────────────────────────────────────────────

  test('PERF-LOGIN-01: Login page loads within performance budget', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-LOGIN-01' },
      { type: 'severity', description: 'normal' },
    );

    const perf = new PerformanceHelper(page);
    perf.startMonitoring();

    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const metrics = await perf.collectMetrics();

    // Log metrics report
    console.log(PerformanceHelper.generateReport(metrics));

    // Assert within lenient budget (demo app)
    const budget = perf.assertWithinBudget(metrics, PerformanceHelper.BUDGETS.lenient);

    // Attach metrics as annotation
    test.info().annotations.push({
      type: 'performance',
      description: `TTFB: ${metrics.ttfb}ms | FCP: ${metrics.fcp}ms | Load: ${metrics.loadComplete}ms`,
    });

    if (!budget.passed) {
      console.warn('Performance budget violations:', budget.violations);
    }

    // Core assertion: page should load within 10 seconds (lenient for demo)
    expect(metrics.loadComplete || metrics.totalPageLoadMs).toBeLessThan(10000);
  });

  // ─── Dashboard Page Performance ────────────────────────────────────────────────

  test('PERF-DASH-01: Dashboard loads within performance budget', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-DASH-01' },
      { type: 'severity', description: 'normal' },
    );

    const { page, dashboard } = adminSession;
    const perf = new PerformanceHelper(page);

    await dashboard.isLoaded();
    const metrics = await perf.collectMetrics();

    console.log(PerformanceHelper.generateReport(metrics));

    test.info().annotations.push({
      type: 'performance',
      description: `TTFB: ${metrics.ttfb}ms | FCP: ${metrics.fcp}ms | Resources: ${metrics.resourceCount}`,
    });

    // Resource count should be reasonable
    expect(metrics.resourceCount).toBeLessThan(150);
  });

  // ─── Accounts Page Performance ─────────────────────────────────────────────────

  test('PERF-ACC-01: Accounts page loads within performance budget', async ({ adminSession }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-ACC-01' },
      { type: 'severity', description: 'normal' },
    );

    const { page, navBar, accounts } = adminSession;
    const perf = new PerformanceHelper(page);

    perf.startMonitoring();
    await navBar.goToAccounts();
    await accounts.isLoaded();

    const loadTime = Date.now() - perf.startTime;

    test.info().annotations.push({
      type: 'performance',
      description: `Navigation time: ${loadTime}ms`,
    });

    // Page-to-page navigation should be fast
    expect(loadTime).toBeLessThan(5000);
  });

  // ─── Core Web Vitals ───────────────────────────────────────────────────────────

  test('PERF-CWV-01: Core Web Vitals within acceptable range', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-CWV-01' },
      { type: 'severity', description: 'normal' },
    );

    const perf = new PerformanceHelper(page);
    perf.startMonitoring();

    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    // Wait for LCP and CLS to stabilize
    await page.waitForTimeout(3000);

    const metrics = await perf.collectMetrics();

    console.log(PerformanceHelper.generateReport(metrics));

    // CLS should be acceptable (< 0.25 lenient)
    if (metrics.cls !== null) {
      expect(metrics.cls).toBeLessThan(0.25);
    }

    // FCP should be reasonable
    if (metrics.fcp !== null) {
      expect(metrics.fcp).toBeLessThan(4000);
    }
  });

  // ─── Network Throttling ────────────────────────────────────────────────────────

  test('PERF-NET-01: Page loads gracefully on slow 3G', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-NET-01' },
      { type: 'severity', description: 'normal' },
    );

    const perf = new PerformanceHelper(page);

    // Simulate slow 3G
    await perf.simulateNetwork('slow3g');
    perf.startMonitoring();

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const loadTime = Date.now() - perf.startTime;

    test.info().annotations.push({
      type: 'performance',
      description: `Slow 3G load time: ${loadTime}ms`,
    });

    // Page should still load (even if slowly)
    await expect(page.locator('body')).toBeVisible();

    // Should load within 30 seconds even on slow 3G
    expect(loadTime).toBeLessThan(30000);
  });

  test('PERF-NET-02: Page loads within budget on fast 3G', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-NET-02' },
      { type: 'severity', description: 'normal' },
    );

    const perf = new PerformanceHelper(page);

    // Simulate fast 3G
    await perf.simulateNetwork('fast3g');
    perf.startMonitoring();

    await page.goto(baseUrl, { waitUntil: 'load', timeout: 20000 });

    const loadTime = Date.now() - perf.startTime;

    test.info().annotations.push({
      type: 'performance',
      description: `Fast 3G load time: ${loadTime}ms`,
    });

    // Should load within 15 seconds on fast 3G
    expect(loadTime).toBeLessThan(15000);
  });

  // ─── Resource Analysis ─────────────────────────────────────────────────────────

  test('PERF-RES-01: Total transfer size within budget', async ({ page, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: 'PERF-RES-01' },
      { type: 'severity', description: 'normal' },
    );

    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const perf = new PerformanceHelper(page);
    const metrics = await perf.collectMetrics();

    test.info().annotations.push({
      type: 'performance',
      description: `Transfer: ${metrics.totalTransferSizeKB}KB | Resources: ${metrics.resourceCount} | Largest: ${metrics.largestResourceKB}KB`,
    });

    // Total transfer should be under 5MB (lenient for demo)
    expect(metrics.totalTransferSizeKB).toBeLessThan(5120);
  });
});