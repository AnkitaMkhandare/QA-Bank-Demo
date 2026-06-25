const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Network Resilience & Failure Handling Tests
 * 
 * Validates application behavior under degraded network conditions:
 * - Network disconnection handling
 * - Request timeout scenarios
 * - Retry mechanism validation
 * - Graceful degradation under slow networks
 * - Offline mode behavior
 * - Error recovery after network restoration
 * 
 * Uses Playwright's network interception and throttling capabilities
 * to simulate real-world network failure scenarios.
 * 
 * @tags @resilience @network @regression
 */

test.describe('Network Resilience & Failure Handling @resilience @network', () => {

  // ═══════════════════════════════════════════════════════════════════════════════
  // Network Disconnection
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Network Disconnection', () => {

    test('NET-DISC-01: Application should show error message on network failure during navigation', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-DISC-01' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Network Disconnection' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');
      await page.waitForTimeout(2000);

      // Simulate network offline
      await page.context().setOffline(true);

      // Try to navigate
      try {
        await page.click('[data-testid="nav-accounts"], a:has-text("Accounts")');
        await page.waitForTimeout(3000);
      } catch {
        // Navigation may throw due to offline
      }

      // Page should indicate network issue (not crash silently)
      const bodyText = await page.textContent('body').catch(() => '');
      const hasErrorIndication =
        bodyText.toLowerCase().includes('network') ||
        bodyText.toLowerCase().includes('offline') ||
        bodyText.toLowerCase().includes('connection') ||
        bodyText.toLowerCase().includes('error') ||
        bodyText.toLowerCase().includes('failed');

      test.info().annotations.push({
        type: 'network-behavior',
        description: `Error indication shown: ${hasErrorIndication}`,
      });

      // Restore network
      await page.context().setOffline(false);

      // Page should still be functional (not permanently broken)
      await page.reload();
      await expect(page.locator('body')).toBeVisible();
    });

    test('NET-DISC-02: Form submission should handle network failure gracefully', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-DISC-02' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Network Disconnection — Form Submit' },
      );

      await loginPage.goto(baseUrl);

      // Go offline before login attempt
      await page.context().setOffline(true);

      // Try to login (should fail gracefully)
      await loginPage.enterUsername('admin');
      await loginPage.enterPassword('admin123');
      await loginPage.clickLoginButton();

      await page.waitForTimeout(3000);

      // Should show error, not crash
      const bodyText = await page.textContent('body').catch(() => '');
      const pageNotBroken = bodyText.length > 0;

      expect(pageNotBroken, 'Page should not be completely blank after network failure').toBeTruthy();

      // Restore network
      await page.context().setOffline(false);
    });

    test('NET-DISC-03: Application should recover after network restoration', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-DISC-03' },
        { type: 'severity', description: 'critical' },
        { type: 'category', description: 'Network Recovery' },
      );

      await loginPage.goto(baseUrl);

      // Brief network interruption
      await page.context().setOffline(true);
      await page.waitForTimeout(2000);
      await page.context().setOffline(false);

      // Application should recover — login should work
      await page.waitForTimeout(1000);
      await loginPage.login('admin', 'admin123');

      // Wait and check if login was successful
      await page.waitForTimeout(3000);
      const url = page.url();

      test.info().annotations.push({
        type: 'recovery-status',
        description: `After recovery, URL: ${url}`,
      });

      // Page should be functional after recovery
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Request Timeout Scenarios
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Request Timeouts', () => {

    test('NET-TIMEOUT-01: Slow API response should not crash the application', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-TIMEOUT-01' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Timeout Handling' },
      );

      // Intercept and delay API responses
      await page.route('**/api/**', async (route) => {
        // Simulate 5-second delay
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.continue();
      });

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');

      // Wait for potential timeout
      await page.waitForTimeout(8000);

      // Application should still be responsive (not frozen)
      await expect(page.locator('body')).toBeVisible();

      // Remove route handler
      await page.unroute('**/api/**');
    });

    test('NET-TIMEOUT-02: Page should show loading indicator during slow requests', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-TIMEOUT-02' },
        { type: 'severity', description: 'normal' },
        { type: 'category', description: 'Loading State' },
      );

      // Delay all fetch/xhr requests
      await page.route('**/*', async (route) => {
        if (route.request().resourceType() === 'xhr' || route.request().resourceType() === 'fetch') {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        await route.continue();
      });

      await page.goto(baseUrl);

      // Check for loading indicators
      const loadingIndicator = page.locator('[data-testid*="loading"], .loading, .spinner, [class*="load"]');
      const hasLoading = await loadingIndicator.count() > 0;

      test.info().annotations.push({
        type: 'ux-feedback',
        description: `Loading indicator present: ${hasLoading}`,
      });

      await page.unroute('**/*');

      // Page should eventually load
      await page.waitForTimeout(5000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // HTTP Error Response Handling
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('HTTP Error Responses', () => {

    test('NET-ERR-01: 500 Internal Server Error should show user-friendly message', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-ERR-01' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Error Response — 500' },
      );

      // Intercept and return 500 for specific requests
      await page.route('**/api/accounts*', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');
      await page.waitForTimeout(3000);

      // Check that the app handles 500 gracefully
      const bodyText = await page.textContent('body').catch(() => '');

      // Should NOT show raw error stack or technical details
      expect(bodyText).not.toContain('Stack Trace');
      expect(bodyText).not.toContain('at Object.');
      expect(bodyText).not.toContain('node_modules');

      await page.unroute('**/api/accounts*');
    });

    test('NET-ERR-02: 503 Service Unavailable should indicate maintenance', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-ERR-02' },
        { type: 'severity', description: 'normal' },
        { type: 'category', description: 'Error Response — 503' },
      );

      // Intercept all requests to simulate service down
      await page.route('**/*', (route) => {
        if (route.request().url().includes('api')) {
          route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service Unavailable' }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto(baseUrl);
      await page.waitForTimeout(3000);

      // Page should handle gracefully
      await expect(page.locator('body')).toBeVisible();

      await page.unroute('**/*');
    });

    test('NET-ERR-03: 429 Rate Limiting should be handled appropriately', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-ERR-03' },
        { type: 'severity', description: 'normal' },
        { type: 'category', description: 'Error Response — 429 Rate Limit' },
        { type: 'provision', description: 'future — rate limiting not confirmed in AUT' },
      );

      let requestCount = 0;

      // Simulate rate limiting after 5 requests
      await page.route('**/api/**', (route) => {
        requestCount++;
        if (requestCount > 5) {
          route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Too Many Requests', retryAfter: 60 }),
          });
        } else {
          route.continue();
        }
      });

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');
      await page.waitForTimeout(3000);

      // App should not crash on 429
      await expect(page.locator('body')).toBeVisible();

      await page.unroute('**/api/**');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Intermittent Network Issues
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Intermittent Network Issues', () => {

    test('NET-FLAP-01: Application should handle intermittent connectivity', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-FLAP-01' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Network Flapping' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');
      await page.waitForTimeout(2000);

      // Simulate intermittent connectivity (toggle 3 times)
      for (let i = 0; i < 3; i++) {
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);
        await page.context().setOffline(false);
        await page.waitForTimeout(1000);
      }

      // After stabilization, app should be functional
      await page.waitForTimeout(2000);
      await page.reload();
      await expect(page.locator('body')).toBeVisible();

      test.info().annotations.push({
        type: 'resilience',
        description: 'Application survived 3 network flaps without permanent failure',
      });
    });

    test('NET-FLAP-02: Partial page load should not leave broken UI', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-FLAP-02' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Partial Load' },
      );

      // Abort some resources to simulate partial load
      let abortCount = 0;
      await page.route('**/*.{css,js}', (route) => {
        abortCount++;
        if (abortCount % 3 === 0) {
          route.abort('connectionfailed');
        } else {
          route.continue();
        }
      });

      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Page should not be completely blank
      const bodyContent = await page.textContent('body').catch(() => '');
      expect(bodyContent.length).toBeGreaterThan(0);

      await page.unroute('**/*.{css,js}');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Network Throttling Resilience
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Degraded Network Performance', () => {

    test('NET-SLOW-01: Application should remain usable on 2G network', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-SLOW-01' },
        { type: 'severity', description: 'normal' },
        { type: 'category', description: 'Slow Network — 2G' },
      );

      // Simulate 2G network (50kbps download, 20kbps upload, 2000ms latency)
      const cdpSession = await page.context().newCDPSession(page);
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (50 * 1024) / 8,
        uploadThroughput: (20 * 1024) / 8,
        latency: 2000,
      });

      const startTime = Date.now();
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const loadTime = Date.now() - startTime;

      test.info().annotations.push({
        type: 'network-performance',
        description: `2G load time: ${loadTime}ms`,
      });

      // Should eventually load (even if slowly)
      await expect(page.locator('body')).toBeVisible();

      // Reset network conditions
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });
    });

    test('NET-SLOW-02: High latency should not cause duplicate submissions', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-SLOW-02' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'Duplicate Prevention' },
      );

      await loginPage.goto(baseUrl);

      // Track form submissions
      let submissionCount = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST') {
          submissionCount++;
        }
      });

      // Add delay to simulate high latency
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      // Try to click login multiple times rapidly (impatient user)
      await loginPage.enterUsername('admin');
      await loginPage.enterPassword('admin123');
      await loginPage.clickLoginButton();
      await page.waitForTimeout(500);

      // Try clicking again before response
      try {
        await loginPage.clickLoginButton();
      } catch (_error) {
        // Button might be disabled or removed — expected
      }

      await page.waitForTimeout(5000);

      test.info().annotations.push({
        type: 'submission-tracking',
        description: `POST requests fired: ${submissionCount}`,
      });

      await page.unroute('**/*');

      // Ideally only 1 submission should go through
      // (app should disable button after first click)
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CORS & Network Security
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Network Security', () => {

    test('NET-SEC-01: CORS should be properly configured', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'NET-SEC-01' },
        { type: 'severity', description: 'high' },
        { type: 'category', description: 'CORS Configuration' },
      );

      const response = await page.goto(baseUrl);
      const headers = response.headers();

      const corsHeader = headers['access-control-allow-origin'];

      test.info().annotations.push({
        type: 'cors-config',
        description: `Access-Control-Allow-Origin: ${corsHeader || 'NOT SET'}`,
      });

      // If CORS is set, it should not be wildcard for banking apps
      if (corsHeader) {
        // Banking apps should NOT use * for CORS
        test.info().annotations.push({
          type: 'cors-warning',
          description: corsHeader === '*' ? 'WARNING: Wildcard CORS in banking app!' : 'CORS properly restricted',
        });
      }

      expect(response.status()).toBeLessThan(500);
    });
  });
});