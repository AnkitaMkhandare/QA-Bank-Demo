const { test, expect } = require('../../../../src/fixtures/test-fixtures');
const loginData = require('../../../../src/config/test-data/login.json');

/**
 * Login Feature — Data-Driven Test Suite
 * 
 * Covers:
 * - Valid login scenarios (admin, viewer)
 * - Invalid credential handling
 * - Field validation (button state)
 * - Password masking (security)
 * 
 * @tags @smoke @regression @security
 */

test.describe('Login Feature @smoke', () => {

  // ─── Valid Login Tests (Data-Driven) ─────────────────────────────────────────

  for (const data of loginData.validCredentials) {
    test(`${data.testId}: ${data.description}`, async ({ loginPage, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: data.testId },
        { type: 'severity', description: 'critical' },
        { type: 'tags', description: data.tags.join(', ') },
      );

      await loginPage.goto(baseUrl);
      await loginPage.loginAndWaitForDashboard(data.username, data.password);

      // Verify redirect
      expect(loginPage.page.url()).toContain(data.expectedRedirect);

      // Verify user display
      const userInfo = loginPage.page.locator('[data-testid="user-info"]');
      await expect(userInfo).toContainText(data.expectedUserDisplay);
    });
  }

  // ─── Invalid Login Tests (Data-Driven) ───────────────────────────────────────

  for (const data of loginData.invalidCredentials) {
    test(`${data.testId}: ${data.description} @regression`, async ({ loginPage, baseUrl }) => {
      test.info().annotations.push(
        { type: 'testId', description: data.testId },
        { type: 'severity', description: 'normal' },
        { type: 'tags', description: data.tags.join(', ') },
      );

      await loginPage.goto(baseUrl);
      await loginPage.login(data.username, data.password);

      // Verify error message is displayed
      const isVisible = await loginPage.isErrorMessageVisible();
      expect(isVisible).toBeTruthy();
    });
  }

  // ─── Field Validation (Button State) ─────────────────────────────────────────

  test.describe('TC-LOGIN-03: Field Validation @regression', () => {
    const { scenarios } = loginData.fieldValidation;

    for (const scenario of scenarios) {
      const desc = `Button ${scenario.buttonEnabled ? 'enabled' : 'disabled'} when username="${scenario.username || '(empty)'}" password="${scenario.password ? '***' : '(empty)'}"`;

      test(desc, async ({ loginPage, baseUrl }) => {
        test.info().annotations.push(
          { type: 'testId', description: 'TC-LOGIN-03' },
          { type: 'severity', description: 'normal' },
        );

        await loginPage.goto(baseUrl);

        if (scenario.username) await loginPage.enterUsername(scenario.username);
        if (scenario.password) await loginPage.enterPassword(scenario.password);

        const isEnabled = await loginPage.isLoginButtonEnabled();
        expect(isEnabled).toBe(scenario.buttonEnabled);
      });
    }
  });

  // ─── Password Masking ────────────────────────────────────────────────────────

  test(`${loginData.passwordMasking.testId}: ${loginData.passwordMasking.description} @regression @security`, async ({ loginPage, baseUrl }) => {
    test.info().annotations.push(
      { type: 'testId', description: loginData.passwordMasking.testId },
      { type: 'severity', description: 'normal' },
    );

    await loginPage.goto(baseUrl);
    await loginPage.enterPassword('testpassword');

    const inputType = await loginPage.getPasswordInputType();
    expect(inputType).toBe(loginData.passwordMasking.expectedInputType);
  });
});
