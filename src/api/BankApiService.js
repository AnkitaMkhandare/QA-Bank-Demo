const ApiClient = require('./ApiClient');

/**
 * BankApiService — Domain-Specific API Service
 * 
 * Encapsulates all Bank application API endpoints.
 * Provides high-level methods for:
 * - Authentication
 * - Account management (CRUD)
 * - Transaction operations
 * - User management
 * 
 * Usage:
 *   const bankApi = new BankApiService();
 *   await bankApi.init();
 *   await bankApi.login('admin', 'admin123');
 *   const accounts = await bankApi.getAccounts();
 */

class BankApiService extends ApiClient {
  /**
   * @param {string} [baseUrl] - Override API base URL
   */
  constructor(baseUrl) {
    const apiUrl = baseUrl || process.env.API_BASE_URL || 'https://qaplayground.com/api';
    super(apiUrl, { logRequests: true });
  }

  // ─── Authentication Endpoints ──────────────────────────────────────────────────

  /**
   * Login and obtain auth token
   * @param {string} username 
   * @param {string} password 
   * @returns {{ token: string, user: object }}
   */
  async login(username, password) {
    return this.authenticate(username, password);
  }

  /**
   * Logout current session
   * @returns {{ success: boolean }}
   */
  async logout() {
    const response = await this.post('/auth/logout');
    this.authToken = null;
    return response;
  }

  /**
   * Get current user profile
   * @returns {{ id: string, username: string, role: string }}
   */
  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // ─── Account Endpoints ─────────────────────────────────────────────────────────

  /**
   * Get all accounts for the authenticated user
   * @returns {Array<{ id: string, name: string, type: string, balance: number }>}
   */
  async getAccounts() {
    return this.get('/accounts');
  }

  /**
   * Get a single account by ID
   * @param {string} accountId 
   * @returns {{ id: string, name: string, type: string, balance: number }}
   */
  async getAccountById(accountId) {
    return this.get(`/accounts/${accountId}`);
  }

  /**
   * Create a new account
   * @param {{ name: string, type: string, deposit: number }} accountData 
   * @returns {{ id: string, name: string, type: string, balance: number }}
   */
  async createAccount(accountData) {
    return this.post('/accounts', {
      name: accountData.name,
      type: accountData.type,
      initialDeposit: parseFloat(accountData.deposit) || 0,
    });
  }

  /**
   * Update account details
   * @param {string} accountId 
   * @param {{ name?: string, type?: string }} updates 
   * @returns {{ id: string, name: string, type: string, balance: number }}
   */
  async updateAccount(accountId, updates) {
    return this.put(`/accounts/${accountId}`, updates);
  }

  /**
   * Delete an account
   * @param {string} accountId 
   * @returns {{ success: boolean, message: string }}
   */
  async deleteAccount(accountId) {
    return this.delete(`/accounts/${accountId}`);
  }

  // ─── Transaction Endpoints ─────────────────────────────────────────────────────

  /**
   * Get all transactions (optionally filtered)
   * @param {{ accountId?: string, fromDate?: string, toDate?: string }} [filters]
   * @returns {Array<{ id: string, type: string, amount: number, date: string, accountId: string }>}
   */
  async getTransactions(filters = {}) {
    return this.get('/transactions', filters);
  }

  /**
   * Get a single transaction by ID
   * @param {string} transactionId 
   * @returns {{ id: string, type: string, amount: number, date: string, accountId: string }}
   */
  async getTransactionById(transactionId) {
    return this.get(`/transactions/${transactionId}`);
  }

  /**
   * Create a new transaction (deposit or withdrawal)
   * @param {{ type: string, accountId: string, amount: number, description?: string }} txnData 
   * @returns {{ id: string, type: string, amount: number, date: string, newBalance: number }}
   */
  async createTransaction(txnData) {
    return this.post('/transactions', {
      type: txnData.type,
      accountId: txnData.accountId,
      amount: parseFloat(txnData.amount),
      description: txnData.description || '',
    });
  }

  // ─── Helper Methods (Test Preconditions) ───────────────────────────────────────

  /**
   * Setup: Create an account and return its details (for use as test precondition)
   * @param {{ name: string, type: string, deposit: number }} data 
   * @returns {{ id: string, name: string, type: string, balance: number }}
   */
  async setupAccount(data) {
    return this.createAccount(data);
  }

  /**
   * Setup: Create account + deposit funds (for transaction test preconditions)
   * @param {{ accountName: string, type: string, initialBalance: number }}
   * @returns {{ accountId: string, balance: number }}
   */
  async setupAccountWithBalance({ accountName, type = 'savings', initialBalance = 1000 }) {
    const account = await this.createAccount({
      name: accountName,
      type,
      deposit: initialBalance,
    });
    return { accountId: account.id, balance: account.balance };
  }

  /**
   * Cleanup: Delete account if it exists (safe cleanup for test teardown)
   * @param {string} accountId 
   */
  async cleanupAccount(accountId) {
    try {
      await this.deleteAccount(accountId);
    } catch (error) {
      // Ignore 404 errors (already deleted)
      if (error.status !== 404) {
        throw error;
      }
    }
  }

  /**
   * Get total balance across all accounts
   * @returns {number}
   */
  async getTotalBalance() {
    const accounts = await this.getAccounts();
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }
}

module.exports = BankApiService;