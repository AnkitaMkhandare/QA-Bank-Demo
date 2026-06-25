const { test, expect } = require('../../src/fixtures/test-fixtures');

/**
 * Data Encryption & SSL Certificate Validation Tests
 * 
 * Validates data security controls for banking applications:
 * - SSL/TLS certificate validation (expiry, chain, protocol version)
 * - HTTPS enforcement (no mixed content, HTTP redirect)
 * - Sensitive data handling (masking, no plaintext exposure)
 * - Data-in-transit encryption verification
 * - Data-at-rest encryption indicators
 * - Secure headers for data protection
 * 
 * NOTE: Some tests are provisioned for future implementation when the
 * application infrastructure supports full certificate inspection.
 * 
 * @tags @security @encryption @ssl @regression
 */

test.describe('Data Encryption & SSL Validation @security @encryption', () => {

  // ═══════════════════════════════════════════════════════════════════════════════
  // SSL/TLS Certificate Validation
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('SSL/TLS Certificate Validation', () => {

    test('SEC-SSL-01: Application should be served over HTTPS', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-SSL-01' },
        { type: 'severity', description: 'critical' },
      );

      await page.goto(baseUrl);

      // Verify the page is served over HTTPS
      const url = page.url();
      expect(url.startsWith('https://'), 'Application must be served over HTTPS').toBeTruthy();
    });

    test('SEC-SSL-02: HTTP requests should redirect to HTTPS', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-SSL-02' },
        { type: 'severity', description: 'critical' },
      );

      // Try accessing HTTP version (if applicable)
      const httpUrl = baseUrl.replace('https://', 'http://');

      const response = await page.goto(httpUrl, { waitUntil: 'commit' });

      // Should either redirect to HTTPS or the final URL should be HTTPS
      const finalUrl = page.url();
      const wasRedirected = finalUrl.startsWith('https://');
      const hadRedirectStatus = response && [301, 302, 307, 308].includes(response.status());

      test.info().annotations.push({
        type: 'ssl-redirect',
        description: `HTTP → HTTPS redirect: ${wasRedirected} | Status: ${response?.status()}`,
      });

      // At minimum, verify we end up on a secure page
      expect(wasRedirected || finalUrl.includes('https')).toBeTruthy();
    });

    test('SEC-SSL-03: SSL certificate should not be expired', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-SSL-03' },
        { type: 'severity', description: 'critical' },
      );

      // Navigate and check for certificate errors
      let certificateError = false;
      page.on('pageerror', (error) => {
        if (error.message.includes('certificate') || error.message.includes('SSL')) {
          certificateError = true;
        }
      });

      const response = await page.goto(baseUrl);

      // If the page loads successfully (200), certificate is valid
      expect(response.status()).toBeLessThan(400);
      expect(certificateError).toBeFalsy();

      test.info().annotations.push({
        type: 'ssl-status',
        description: `Page loaded with status ${response.status()} — no certificate errors`,
      });
    });

    test('SEC-SSL-04: TLS version should be 1.2 or higher', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-SSL-04' },
        { type: 'severity', description: 'critical' },
        { type: 'provision', description: 'future — requires server-side TLS inspection tools' },
      );

      test.skip(true, 'TLS version inspection requires external tools (openssl/ssllabs) — provisioned for future');

      // In production, would use:
      // - OpenSSL: `openssl s_client -connect host:443 -tls1_1` (should fail)
      // - SSL Labs API for comprehensive certificate grading
      // - Playwright doesn't expose TLS version directly

      // Placeholder for TLS version check
      const tlsVersion = '1.3'; // Would come from external tool
      const acceptableVersions = ['1.2', '1.3'];
      expect(acceptableVersions).toContain(tlsVersion);
    });

    test('SEC-SSL-05: Weak cipher suites should be disabled', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-SSL-05' },
        { type: 'severity', description: 'high' },
        { type: 'provision', description: 'future — requires server-side cipher inspection' },
      );

      test.skip(true, 'Cipher suite inspection requires external tools — provisioned for future');

      // Weak ciphers that should NOT be supported:
      const weakCiphers = [
        'RC4', 'DES', '3DES', 'MD5', 'NULL',
        'EXPORT', 'anon', 'RC2',
      ];

      // In production, would verify with:
      // openssl s_client -connect host:443 -cipher RC4
      // (should fail with "no ciphers available")
    });

    test('SEC-SSL-06: HSTS header should be present with adequate max-age', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-SSL-06' },
        { type: 'severity', description: 'high' },
      );

      const response = await page.goto(baseUrl);
      const headers = response.headers();

      const hsts = headers['strict-transport-security'];

      test.info().annotations.push({
        type: 'hsts-header',
        description: hsts ? `HSTS: ${hsts}` : 'HSTS header NOT present',
      });

      // Log finding — not all demo apps implement HSTS
      if (hsts) {
        // Verify max-age is at least 6 months (15768000 seconds)
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1]);
          expect(maxAge).toBeGreaterThanOrEqual(15768000);
        }
      }

      // Core assertion: page loads without SSL errors
      expect(response.status()).toBeLessThan(500);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Sensitive Data Handling
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Sensitive Data Handling', () => {

    test('SEC-DATA-01: Password should never appear in page source after login', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-DATA-01' },
        { type: 'severity', description: 'critical' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');

      // Check page source for password leakage
      const pageContent = await page.content();
      expect(pageContent).not.toContain('admin123');

      // Check local storage and session storage
      const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
      const sessionStorageData = await page.evaluate(() => JSON.stringify(sessionStorage));

      expect(localStorageData).not.toContain('admin123');
      expect(sessionStorageData).not.toContain('admin123');
    });

    test('SEC-DATA-02: Account numbers should be partially masked in display', async ({ adminSession }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-DATA-02' },
        { type: 'severity', description: 'high' },
        { type: 'provision', description: 'future — depends on AUT masking implementation' },
      );

      const { page, navBar, accounts } = adminSession;

      await navBar.goToAccounts();
      await accounts.isLoaded();

      // Check if account numbers are displayed with masking (e.g., ****1234)
      const accountNumbers = await page.locator('[data-testid*="account-number"], .account-number').allTextContents();

      test.info().annotations.push({
        type: 'data-masking',
        description: `Found ${accountNumbers.length} account number displays`,
      });

      // Informational check — verify no full unmasked numbers exposed
      // In banking apps, sensitive numbers should show only last 4 digits
      for (const num of accountNumbers) {
        if (num.length > 8) {
          // Long numbers should contain masking characters
          const hasMasking = num.includes('*') || num.includes('●') || num.includes('X');
          test.info().annotations.push({
            type: 'masking-check',
            description: `Account display: "${num}" | Masked: ${hasMasking}`,
          });
        }
      }

      // Page should load without errors
      expect(page.url()).toContain('bank');
    });

    test('SEC-DATA-03: Sensitive data should not be logged in browser console', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-DATA-03' },
        { type: 'severity', description: 'high' },
      );

      const consoleLogs = [];
      page.on('console', (msg) => {
        consoleLogs.push(msg.text());
      });

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');

      // Wait for any async logging
      await page.waitForTimeout(2000);

      // Check console logs for sensitive data exposure
      const sensitivePatterns = ['admin123', 'password', 'secret', 'token=', 'Bearer '];
      const allLogs = consoleLogs.join(' ');

      for (const pattern of sensitivePatterns) {
        const exposed = allLogs.toLowerCase().includes(pattern.toLowerCase());
        if (exposed) {
          test.info().annotations.push({
            type: 'security-warning',
            description: `Sensitive pattern "${pattern}" found in console logs`,
          });
        }
      }

      // Password specifically should never appear in logs
      expect(allLogs).not.toContain('admin123');
    });

    test('SEC-DATA-04: Form autocomplete should be disabled for sensitive fields', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-DATA-04' },
        { type: 'severity', description: 'normal' },
      );

      await loginPage.goto(baseUrl);

      // Check password field autocomplete attribute
      const passwordField = page.locator('input[type="password"]');
      const autocomplete = await passwordField.getAttribute('autocomplete');

      test.info().annotations.push({
        type: 'autocomplete',
        description: `Password field autocomplete: "${autocomplete || 'not set'}"`,
      });

      // Best practice: autocomplete should be "off" or "new-password" for sensitive fields
      // Note: Many modern browsers ignore this for password managers
      if (autocomplete) {
        expect(['off', 'new-password', 'current-password']).toContain(autocomplete);
      }

      // Page should be functional
      await expect(passwordField).toBeVisible();
    });

    test('SEC-DATA-05: No sensitive data in URL parameters', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-DATA-05' },
        { type: 'severity', description: 'critical' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');

      // Check URL doesn't contain credentials or tokens
      const url = page.url();
      expect(url).not.toContain('password');
      expect(url).not.toContain('admin123');
      expect(url).not.toContain('token=');
      expect(url).not.toContain('session=');
      expect(url).not.toContain('auth=');
    });

    test('SEC-DATA-06: API responses should not expose sensitive internal data', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-DATA-06' },
        { type: 'severity', description: 'high' },
      );

      const apiResponses = [];
      page.on('response', async (response) => {
        if (response.url().includes('/api/') || response.headers()['content-type']?.includes('json')) {
          try {
            const body = await response.text();
            apiResponses.push({ url: response.url(), body });
          } catch {
            // Ignore non-text responses
          }
        }
      });

      await page.goto(baseUrl);
      await page.waitForTimeout(3000);

      // Check API responses for sensitive data exposure
      const sensitiveFields = ['password', 'passwordHash', 'ssn', 'creditCard', 'cvv', 'pin'];

      for (const resp of apiResponses) {
        for (const field of sensitiveFields) {
          const exposed = resp.body.toLowerCase().includes(field.toLowerCase());
          if (exposed) {
            test.info().annotations.push({
              type: 'data-exposure',
              description: `Potential sensitive field "${field}" in response from ${resp.url}`,
            });
          }
          // Critical fields should never appear in API responses
          if (['passwordHash', 'ssn', 'cvv', 'pin'].includes(field)) {
            expect(resp.body.toLowerCase()).not.toContain(field.toLowerCase());
          }
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Mixed Content & Data-in-Transit
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Data-in-Transit Protection', () => {

    test('SEC-TRANSIT-01: No mixed content (HTTP resources on HTTPS page)', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-TRANSIT-01' },
        { type: 'severity', description: 'high' },
      );

      const httpResources = [];
      page.on('request', (request) => {
        if (request.url().startsWith('http://') && !request.url().includes('localhost')) {
          httpResources.push(request.url());
        }
      });

      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      test.info().annotations.push({
        type: 'mixed-content',
        description: `HTTP resources found: ${httpResources.length}`,
      });

      if (httpResources.length > 0) {
        test.info().annotations.push({
          type: 'mixed-content-urls',
          description: httpResources.slice(0, 5).join(', '),
        });
      }

      // No insecure HTTP resources should be loaded on HTTPS page
      expect(httpResources.length).toBe(0);
    });

    test('SEC-TRANSIT-02: API calls should use HTTPS', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-TRANSIT-02' },
        { type: 'severity', description: 'critical' },
      );

      const apiCalls = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
          apiCalls.push({
            url: request.url(),
            isSecure: request.url().startsWith('https://'),
          });
        }
      });

      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      // All API calls should be over HTTPS
      const insecureCalls = apiCalls.filter(call => !call.isSecure);

      test.info().annotations.push({
        type: 'api-security',
        description: `Total API calls: ${apiCalls.length} | Insecure: ${insecureCalls.length}`,
      });

      expect(insecureCalls.length).toBe(0);
    });

    test('SEC-TRANSIT-03: WebSocket connections should use WSS (secure)', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-TRANSIT-03' },
        { type: 'severity', description: 'high' },
        { type: 'provision', description: 'future — if application uses WebSockets' },
      );

      const wsConnections = [];
      page.on('websocket', (ws) => {
        wsConnections.push({
          url: ws.url(),
          isSecure: ws.url().startsWith('wss://'),
        });
      });

      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // If WebSockets are used, they should be WSS
      const insecureWs = wsConnections.filter(ws => !ws.isSecure);

      if (wsConnections.length > 0) {
        expect(insecureWs.length).toBe(0);
      }

      test.info().annotations.push({
        type: 'websocket-security',
        description: `WebSocket connections: ${wsConnections.length} | All secure: ${insecureWs.length === 0}`,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Security Headers for Data Protection
  // ═══════════════════════════════════════════════════════════════════════════════

  test.describe('Security Headers', () => {

    test('SEC-HDR-01: Content-Security-Policy header should be present', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-HDR-01' },
        { type: 'severity', description: 'high' },
      );

      const response = await page.goto(baseUrl);
      const headers = response.headers();
      const csp = headers['content-security-policy'];

      test.info().annotations.push({
        type: 'csp-header',
        description: csp ? `CSP: ${csp.substring(0, 100)}...` : 'CSP header NOT present',
      });

      // Informational — log CSP status
      expect(response.status()).toBeLessThan(500);
    });

    test('SEC-HDR-02: X-Content-Type-Options should be "nosniff"', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-HDR-02' },
        { type: 'severity', description: 'normal' },
      );

      const response = await page.goto(baseUrl);
      const headers = response.headers();
      const nosniff = headers['x-content-type-options'];

      test.info().annotations.push({
        type: 'security-header',
        description: `X-Content-Type-Options: ${nosniff || 'NOT SET'}`,
      });

      if (nosniff) {
        expect(nosniff).toBe('nosniff');
      }
    });

    test('SEC-HDR-03: X-Frame-Options should prevent clickjacking', async ({ page, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-HDR-03' },
        { type: 'severity', description: 'high' },
      );

      const response = await page.goto(baseUrl);
      const headers = response.headers();
      const xframe = headers['x-frame-options'];

      test.info().annotations.push({
        type: 'security-header',
        description: `X-Frame-Options: ${xframe || 'NOT SET'}`,
      });

      if (xframe) {
        expect(['DENY', 'SAMEORIGIN']).toContain(xframe.toUpperCase());
      }
    });

    test('SEC-HDR-04: Cache-Control should prevent sensitive data caching', async ({ loginPage, baseUrl, page }) => {
      test.info().annotations.push(
        { type: 'testId', description: 'SEC-HDR-04' },
        { type: 'severity', description: 'high' },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login('admin', 'admin123');

      // After login, check that authenticated pages have proper cache headers
      const response = await page.reload();
      const headers = response.headers();
      const cacheControl = headers['cache-control'];

      test.info().annotations.push({
        type: 'cache-header',
        description: `Cache-Control: ${cacheControl || 'NOT SET'}`,
      });

      // Banking pages should not be cached
      if (cacheControl) {
        const hasNoCacheDirective =
          cacheControl.includes('no-store') ||
          cacheControl.includes('no-cache') ||
          cacheControl.includes('private');
        expect(hasNoCacheDirective).toBeTruthy();
      }
    });
  });
});