const BasePage = require('../pages/BasePage');

/**
 * NavigationBar - Reusable component for the application's navigation sidebar/header
 * Encapsulates all navigation actions and state checks.
 * 
 * @class NavigationBar
 */
class NavigationBar {
  // ─── Selectors ─────────────────────────────────────────────────────────────────

  static SELECTORS = {
    navContainer: '[data-testid="nav-container"], nav',
    navDashboard: '[data-testid="nav-dashboard"]',
    navAccounts: '[data-testid="nav-accounts"]',
    navTransactions: '[data-testid="nav-transactions"]',
    activeLink: '[data-testid^="nav-"].active, [aria-current="page"]',
    userInfo: '[data-testid="user-info"]',
    logoutButton: '[data-testid="logout-button"]',
  };

  // Route mapping for navigation
  static ROUTES = {
    dashboard: 'bank/dashboard',
    accounts: 'bank/accounts',
    transactions: 'bank/transactions',
  };

  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
    this.timeout = 10000;
  }

  // ─── Navigation Actions ────────────────────────────────────────────────────────

  /**
   * Navigate to a specific section
   * @param {'dashboard' | 'accounts' | 'transactions'} section - Target section
   */
  async navigateTo(section) {
    const selector = NavigationBar.SELECTORS[`nav${section.charAt(0).toUpperCase() + section.slice(1)}`];
    if (!selector) {
      throw new Error(`Unknown navigation section: "${section}"`);
    }

    const link = this.page.locator(selector);
    await link.waitFor({ state: 'visible', timeout: this.timeout });
    await link.click();
    await this.page.waitForURL(`**/${NavigationBar.ROUTES[section]}`, { timeout: this.timeout });
    this._log('info', `Navigated to: ${section}`);
  }

  /**
   * Navigate to Dashboard
   */
  async goToDashboard() {
    await this.navigateTo('dashboard');
  }

  /**
   * Navigate to Accounts
   */
  async goToAccounts() {
    await this.navigateTo('accounts');
  }

  /**
   * Navigate to Transactions
   */
  async goToTransactions() {
    await this.navigateTo('transactions');
  }

  // ─── State Checks ──────────────────────────────────────────────────────────────

  /**
   * Check if navigation bar is visible
   * @returns {Promise<boolean>}
   */
  async isVisible() {
    const nav = this.page.locator(NavigationBar.SELECTORS.navContainer);
    return await nav.isVisible();
  }

  /**
   * Get all visible navigation link texts
   * @returns {Promise<string[]>}
   */
  async getNavLinkTexts() {
    const links = this.page.locator('[data-testid^="nav-"]');
    return await links.allTextContents();
  }

  /**
   * Get current active section from URL
   * @returns {string} Current section name
   */
  getCurrentSection() {
    const url = this.page.url();
    for (const [section, route] of Object.entries(NavigationBar.ROUTES)) {
      if (url.includes(route)) return section;
    }
    return 'unknown';
  }

  /**
   * Verify a specific nav link is highlighted/active
   * @param {string} section - Expected active section
   * @returns {Promise<boolean>}
   */
  async isActive(section) {
    const selector = NavigationBar.SELECTORS[`nav${section.charAt(0).toUpperCase() + section.slice(1)}`];
    const link = this.page.locator(selector);
    const className = await link.getAttribute('class') || '';
    return className.includes('active');
  }

  // ─── User Actions ──────────────────────────────────────────────────────────────

  /**
   * Get logged-in user display text
   * @returns {Promise<string>}
   */
  async getUserDisplayName() {
    const userInfo = this.page.locator(NavigationBar.SELECTORS.userInfo);
    await userInfo.waitFor({ state: 'visible', timeout: this.timeout });
    const text = await userInfo.textContent();
    return text?.trim() || '';
  }

  /**
   * Click logout button
   */
  async logout() {
    const button = this.page.locator(NavigationBar.SELECTORS.logoutButton);
    await button.dispatchEvent('click');
    this._log('info', 'Logout clicked');
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────────

  _log(level, message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [NavigationBar] ${message}`;
    if (level === 'error') console.error(formatted);
    else if (level === 'debug' && process.env.DEBUG === 'true') console.log(formatted);
    else if (level !== 'debug') console.log(formatted);
  }
}

module.exports = NavigationBar;