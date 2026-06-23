const BasePage = require('./BasePage');

/**
 * LoginPage - Page Object for the Bank Login page
 * Handles all login-related interactions and validations.
 * 
 * @class LoginPage
 * @extends BasePage
 */
class LoginPage {
  // ─── Selectors ─────────────────────────────────────────────────────────────────

  static SELECTORS = {
    usernameInput: '[data-testid="username-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    errorMessage: '[data-testid="error-message"]',
    rememberMeCheckbox: '[data-testid="remember-me"]',
    forgotPasswordLink: '[data-testid="forgot-password"]',
  };

  constructor(page) {
    this.page = page;
    this.basePage = new (class extends BasePage {
      constructor(page) { super(page); }
    })(page);
    this.timeout = 10000;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────────

  /**
   * Navigate to the login page
   * @param {string} baseUrl - Base URL of the application
   */
  async goto(baseUrl) {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: this.timeout });
    this._log('info', `Navigated to login page: ${baseUrl}`);
  }

  /**
   * Verify login page is loaded
   */
  async isLoaded() {
    await this.page.locator(LoginPage.SELECTORS.usernameInput)
      .waitFor({ state: 'visible', timeout: this.timeout });
    await this.page.locator(LoginPage.SELECTORS.passwordInput)
      .waitFor({ state: 'visible', timeout: this.timeout });
    this._log('info', 'Login page loaded successfully');
    return true;
  }

  // ─── Actions ───────────────────────────────────────────────────────────────────

  /**
   * Enter username
   * @param {string} username - Username to enter
   */
  async enterUsername(username) {
    const input = this.page.locator(LoginPage.SELECTORS.usernameInput);
    await input.waitFor({ state: 'visible', timeout: this.timeout });
    await input.fill(username);
    this._log('info', `Entered username: "${username}"`);
  }

  /**
   * Enter password
   * @param {string} password - Password to enter
   */
  async enterPassword(password) {
    const input = this.page.locator(LoginPage.SELECTORS.passwordInput);
    await input.waitFor({ state: 'visible', timeout: this.timeout });
    await input.fill(password);
    this._log('info', 'Entered password: "***"');
  }

  /**
   * Click the login button
   */
  async clickLoginButton() {
    const button = this.page.locator(LoginPage.SELECTORS.loginButton);
    await button.waitFor({ state: 'visible', timeout: this.timeout });
    await button.click();
    this._log('info', 'Clicked login button');
  }

  /**
   * Perform complete login with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
    this._log('info', `Login attempted with user: "${username}"`);
  }

  /**
   * Login and wait for dashboard redirect
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async loginAndWaitForDashboard(username, password) {
    await this.login(username, password);
    await this.page.waitForURL('**/bank/dashboard', { timeout: this.timeout });
    this._log('info', 'Successfully logged in and redirected to dashboard');
  }

  // ─── Getters ───────────────────────────────────────────────────────────────────

  /**
   * Get error message text
   * @returns {Promise<string>} Error message text
   */
  async getErrorMessage() {
    const errorEl = this.page.locator(LoginPage.SELECTORS.errorMessage);
    await errorEl.waitFor({ state: 'visible', timeout: this.timeout });
    const text = await errorEl.textContent();
    this._log('info', `Error message displayed: "${text}"`);
    return text?.trim() || '';
  }

  /**
   * Get username input value
   * @returns {Promise<string>}
   */
  async getUsernameValue() {
    return await this.page.locator(LoginPage.SELECTORS.usernameInput).inputValue();
  }

  /**
   * Get password input type (for masking verification)
   * @returns {Promise<string>} Input type attribute value
   */
  async getPasswordInputType() {
    return await this.page.locator(LoginPage.SELECTORS.passwordInput).getAttribute('type');
  }

  // ─── State Checks ──────────────────────────────────────────────────────────────

  /**
   * Check if login button is enabled
   * @returns {Promise<boolean>}
   */
  async isLoginButtonEnabled() {
    const button = this.page.locator(LoginPage.SELECTORS.loginButton);
    return await button.isEnabled();
  }

  /**
   * Check if error message is visible
   * @returns {Promise<boolean>}
   */
  async isErrorMessageVisible() {
    const errorEl = this.page.locator(LoginPage.SELECTORS.errorMessage);
    return await errorEl.isVisible();
  }

  /**
   * Check if username field is visible
   * @returns {Promise<boolean>}
   */
  async isUsernameFieldVisible() {
    return await this.page.locator(LoginPage.SELECTORS.usernameInput).isVisible();
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────────

  /**
   * Internal logging method
   * @private
   */
  _log(level, message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [LoginPage] ${message}`;
    if (level === 'error') console.error(formatted);
    else if (level === 'debug' && process.env.DEBUG === 'true') console.log(formatted);
    else if (level !== 'debug') console.log(formatted);
  }
}

module.exports = LoginPage;