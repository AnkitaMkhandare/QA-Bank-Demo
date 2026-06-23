const BasePage = require('./BasePage');

/**
 * DashboardPage - Page Object for the Bank Dashboard
 * Handles dashboard summary cards, recent transactions, and navigation.
 * 
 * @class DashboardPage
 * @extends BasePage
 */
class DashboardPage extends BasePage {
  // ─── Selectors ─────────────────────────────────────────────────────────────────

  static SELECTORS = {
    // User info
    userInfo: '[data-testid="user-info"]',
    logoutButton: '[data-testid="logout-button"]',

    // Summary cards
    summaryCards: '[data-testid="summary-cards"]',
    totalBalanceCard: '[data-testid="total-balance-card"]',
    totalAccountsCard: '[data-testid="total-accounts-card"]',
    recentActivityCard: '[data-testid="recent-activity-card"]',

    // Balance
    totalBalanceValue: '[data-testid="total-balance-value"]',

    // Recent transactions
    recentTransactions: '[data-testid="recent-transactions"]',
    transactionRow: '[data-testid="recent-transactions"] tr',
    transactionList: '[data-testid="transaction-list"]',

    // Navigation
    navAccounts: '[data-testid="nav-accounts"]',
    navTransactions: '[data-testid="nav-transactions"]',
    navDashboard: '[data-testid="nav-dashboard"]',
  };

  constructor(page) {
    super(page);
  }

  // ─── Page Load Verification ────────────────────────────────────────────────────

  /**
   * Verify dashboard page is fully loaded
   * @returns {Promise<boolean>}
   */
  async isLoaded() {
    await this.waitForPath('bank/dashboard');
    await this.waitForVisible(DashboardPage.SELECTORS.userInfo);
    this._log('info', 'Dashboard page loaded successfully');
    return true;
  }

  // ─── User Info ─────────────────────────────────────────────────────────────────

  /**
   * Get logged-in user display name
   * @returns {Promise<string>}
   */
  async getLoggedInUser() {
    const text = await this.getText(DashboardPage.SELECTORS.userInfo);
    this._log('info', `Logged in user: "${text}"`);
    return text;
  }

  /**
   * Verify the logged-in user matches expected
   * @param {string} expectedUser - Expected username
   */
  async verifyLoggedInUser(expectedUser) {
    await this.assertContainsText(
      DashboardPage.SELECTORS.userInfo,
      expectedUser,
      'User info display'
    );
  }

  // ─── Summary Cards ─────────────────────────────────────────────────────────────

  /**
   * Get total balance displayed on dashboard
   * @returns {Promise<number>} Balance as a number
   */
  async getTotalBalance() {
    const text = await this.getText(DashboardPage.SELECTORS.totalBalanceValue);
    const balance = parseFloat(text.replace(/[^0-9.-]/g, ''));
    this._log('info', `Dashboard total balance: ${balance}`);
    return balance;
  }

  /**
   * Get count of summary cards displayed
   * @returns {Promise<number>}
   */
  async getSummaryCardCount() {
    const count = await this.getElementCount(`${DashboardPage.SELECTORS.summaryCards} > *`);
    this._log('info', `Summary cards count: ${count}`);
    return count;
  }

  /**
   * Verify all summary cards are visible
   */
  async verifySummaryCardsVisible() {
    await this.assertVisible(DashboardPage.SELECTORS.summaryCards, 'Summary cards section');
    this._log('info', '✓ All summary cards are visible');
  }

  // ─── Recent Transactions ───────────────────────────────────────────────────────

  /**
   * Get recent transactions count
   * @returns {Promise<number>}
   */
  async getRecentTransactionCount() {
    const count = await this.getElementCount(DashboardPage.SELECTORS.transactionRow);
    this._log('info', `Recent transactions count: ${count}`);
    return count;
  }

  /**
   * Verify recent transactions section is visible
   */
  async verifyRecentTransactionsVisible() {
    await this.assertVisible(
      DashboardPage.SELECTORS.recentTransactions,
      'Recent transactions section'
    );
  }

  // ─── Navigation ────────────────────────────────────────────────────────────────

  /**
   * Navigate to Accounts page via nav link
   */
  async navigateToAccounts() {
    await this.click(DashboardPage.SELECTORS.navAccounts);
    await this.waitForPath('bank/accounts');
    this._log('info', 'Navigated to Accounts page');
  }

  /**
   * Navigate to Transactions page via nav link
   */
  async navigateToTransactions() {
    await this.click(DashboardPage.SELECTORS.navTransactions);
    await this.waitForPath('bank/transactions');
    this._log('info', 'Navigated to Transactions page');
  }

  /**
   * Verify all navigation links are present
   */
  async verifyNavigationLinksVisible() {
    await this.assertVisible(DashboardPage.SELECTORS.navAccounts, 'Accounts nav link');
    await this.assertVisible(DashboardPage.SELECTORS.navTransactions, 'Transactions nav link');
    this._log('info', '✓ All navigation links are visible');
  }

  // ─── Logout ────────────────────────────────────────────────────────────────────

  /**
   * Click logout button
   */
  async logout() {
    const button = this.page.locator(DashboardPage.SELECTORS.logoutButton);
    await button.dispatchEvent('click');
    this._log('info', 'Logout button clicked');
  }

  /**
   * Logout and verify redirect to login page
   * @param {string} baseUrl - Base URL to verify login page
   */
  async logoutAndVerify(baseUrl) {
    await this.logout();
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForVisible('[data-testid="username-input"]');
    this._log('info', '✓ Logout successful — redirected to login page');
  }
}

module.exports = DashboardPage;