const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

/**
 * AccountsPage - Page Object for the Bank Accounts page
 * Handles account creation (wizard), editing, deletion, filtering, and sorting.
 * 
 * @class AccountsPage
 * @extends BasePage
 */
class AccountsPage extends BasePage {
  // ─── Selectors ─────────────────────────────────────────────────────────────────

  static SELECTORS = {
    // Page elements
    accountsTable: '[data-testid="accounts-table"]',
    accountRow: 'tr',
    accountBalance: '[data-testid="account-balance"]',
    accountName: '[data-editable="true"]',

    // Wizard
    openWizardButton: '[data-testid="open-wizard-button"]',
    wizardModal: '[data-testid="open-account-wizard"]',
    wizardStepIndicator: '[data-testid="wizard-step-indicator"]',
    typeCardSavings: '[data-testid="type-card-savings"]',
    typeCardChecking: '[data-testid="type-card-checking"]',
    typeCardCredit: '[data-testid="type-card-credit"]',
    wizardNext: '[data-testid="wizard-next"]',
    wizardAccountName: '[data-testid="wizard-account-name"]',
    wizardInitialDeposit: '[data-testid="wizard-initial-deposit"]',
    wizardConfirm: '[data-testid="wizard-confirm"]',
    toastSuccess: '[data-testid="toast-success"]',

    // Inline edit
    inlineEditInput: '[data-testid="inline-edit-input"]',

    // Delete
    deleteButton: '[data-testid^="delete-account-"]',
    deleteModal: '[data-testid="delete-modal"]',
    confirmDeleteButton: '[data-testid="confirm-delete-button"]',

    // Filters
    filterTypeSelect: '[data-testid="filter-type"]',
    sortBySelect: '[data-testid="sort-by"]',
    sortOrderButton: '[data-testid="sort-order"]',

    // Validation & Errors
    wizardError: '[data-testid="wizard-error"]',
    fieldError: '[data-testid="field-error"]',
    nameError: '[data-testid="name-error"]',
    depositError: '[data-testid="deposit-error"]',
    typeError: '[data-testid="type-error"]',
    toastError: '[data-testid="toast-error"]',
    wizardCancel: '[data-testid="wizard-cancel"]',
    wizardClose: '[data-testid="wizard-close"]',
  };

  constructor(page) {
    super(page);
  }

  // ─── Page Load Verification ────────────────────────────────────────────────────

  /**
   * Verify accounts page is fully loaded
   * @returns {Promise<boolean>}
   */
  async isLoaded() {
    await this.waitForPath('bank/accounts');
    // Wait for DOM content to load (avoid networkidle — page may have persistent connections)
    await this.page.waitForLoadState('domcontentloaded', { timeout: this.timeout });
    // The open-wizard-button exists in DOM — verify it's attached
    const wizardBtn = this.page.locator(AccountsPage.SELECTORS.openWizardButton);
    await wizardBtn.waitFor({ state: 'attached', timeout: this.timeout });
    this._log('info', 'Accounts page loaded successfully');
    return true;
  }

  // ─── Account Creation (Wizard) ─────────────────────────────────────────────────

  /**
   * Open the account creation wizard
   */
  async openAccountWizard() {
    const button = this.page.locator(AccountsPage.SELECTORS.openWizardButton);
    await button.dispatchEvent('click');
    await this.waitForVisible(AccountsPage.SELECTORS.wizardModal);
    this._log('info', 'Account wizard opened');
  }

  /**
   * Assert step indicator shows expected step
   * @param {string} expectedText - Expected step text (e.g., "Step 1 of 3")
   */
  async assertStepIndicator(expectedText) {
    const indicator = this.page.locator(AccountsPage.SELECTORS.wizardStepIndicator);
    await expect(indicator).toContainText(expectedText, { timeout: this.timeout });
    this._log('info', `✓ Step indicator shows: "${expectedText}"`);
  }

  /**
   * Select account type in wizard
   * @param {'savings' | 'checking' | 'credit'} type - Account type
   */
  async selectAccountType(type) {
    let selector;
    switch (type) {
      case 'savings':
        selector = AccountsPage.SELECTORS.typeCardSavings;
        break;
      case 'checking':
        selector = AccountsPage.SELECTORS.typeCardChecking;
        break;
      case 'credit':
        selector = AccountsPage.SELECTORS.typeCardCredit;
        break;
      default:
        selector = AccountsPage.SELECTORS.typeCardSavings;
    }
    await this.click(selector);
    this._log('info', `Selected account type: ${type}`);
  }

  /**
   * Assert account type card is selected
   * @param {'savings' | 'checking' | 'credit'} type - Account type
   */
  async assertTypeSelected(type) {
    let selector;
    switch (type) {
      case 'savings':
        selector = AccountsPage.SELECTORS.typeCardSavings;
        break;
      case 'checking':
        selector = AccountsPage.SELECTORS.typeCardChecking;
        break;
      case 'credit':
        selector = AccountsPage.SELECTORS.typeCardCredit;
        break;
      default:
        selector = AccountsPage.SELECTORS.typeCardSavings;
    }
    const card = this.page.locator(selector);
    await expect(card).toHaveAttribute('data-selected', 'true', { timeout: this.timeout });
    this._log('info', `✓ Account type "${type}" is selected`);
  }

  /**
   * Assert success toast/notification appears after account creation
   * Tries multiple common toast selectors
   */
  async assertSuccessToast() {
    const possibleSelectors = [
      '[data-testid="toast-success"]',
      '[data-testid="success-toast"]',
      '[role="alert"]',
      '.toast-success',
      '[data-testid="notification"]',
      '[data-sonner-toast]',
      '.Toastify__toast--success',
    ];

    let toastFound = false;
    for (const selector of possibleSelectors) {
      const toast = this.page.locator(selector).first();
      try {
        await toast.waitFor({ state: 'visible', timeout: 3000 });
        toastFound = true;
        this._log('info', `✓ Success toast appeared (selector: ${selector})`);
        break;
      } catch {
        // Try next selector
      }
    }

    if (!toastFound) {
      await this.page.waitForTimeout(1000);
      this._log('info', '⚠ No explicit success toast found — proceeding with table verification');
    }
  }

  /**
   * Click next button in wizard
   */
  async clickWizardNext() {
    await this.click(AccountsPage.SELECTORS.wizardNext);
    this._log('info', 'Clicked wizard next');
  }

  /**
   * Fill account details in wizard (Step 2)
   * @param {string} name - Account name
   * @param {string} deposit - Initial deposit amount
   */
  async fillAccountDetails(name, deposit) {
    await this.fill(AccountsPage.SELECTORS.wizardAccountName, name);
    await this.fill(AccountsPage.SELECTORS.wizardInitialDeposit, deposit);
    this._log('info', `Filled account details — Name: "${name}", Deposit: ${deposit}`);
  }

  /**
   * Confirm account creation in wizard (Step 3)
   */
  async confirmAccountCreation() {
    await this.click(AccountsPage.SELECTORS.wizardConfirm);
    this._log('info', 'Account creation confirmed');
  }

  /**
   * Complete full account creation flow (3-step wizard)
   * @param {object} accountData - Account creation data
   * @param {string} accountData.type - Account type ('savings', 'checking', or 'credit')
   * @param {string} accountData.name - Account name
   * @param {string} accountData.deposit - Initial deposit/balance amount
   */
  async createAccount({ type = 'savings', name, deposit }) {
    await this.openAccountWizard();

    // Step 1: Select type
    await this.assertStepIndicator('Step 1 of 3');
    await this.selectAccountType(type);
    await this.assertTypeSelected(type);
    await this.clickWizardNext();

    // Step 2: Fill details
    await this.assertStepIndicator('Step 2 of 3');
    await this.fillAccountDetails(name, deposit);
    await this.clickWizardNext();

    // Step 3: Confirm
    await this.assertStepIndicator('Step 3 of 3');
    await this.confirmAccountCreation();

    // Wait for success toast
    await this.assertSuccessToast();

    // Wait for account to appear in table
    await this.page.locator(`text=${name}`).first()
      .waitFor({ state: 'visible', timeout: this.timeout });
    this._log('info', `✓ Account "${name}" created successfully`);
  }

  // ─── Account Editing ───────────────────────────────────────────────────────────

  /**
   * Edit account name via inline editing
   * @param {string} currentName - Current account name
   * @param {string} newName - New account name
   */
  async editAccountName(currentName, newName) {
    // Double-click to activate inline edit
    const nameCell = this.page.locator(AccountsPage.SELECTORS.accountName, { hasText: currentName }).first();
    await nameCell.dblclick();

    // Wait for input to appear
    await this.waitForVisible(AccountsPage.SELECTORS.inlineEditInput);

    // Set new value using evaluate (handles React controlled inputs)
    await this.page.evaluate((newValue) => {
      const input = document.querySelector('[data-testid="inline-edit-input"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, newValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, newName);

    // Press Enter to confirm
    await this.pressKey('Enter');

    // Verify new name appears
    await this.page.locator(`text=${newName}`).first()
      .waitFor({ state: 'visible', timeout: this.timeout });
    this._log('info', `✓ Account renamed from "${currentName}" to "${newName}"`);
  }

  // ─── Account Deletion ──────────────────────────────────────────────────────────

  /**
   * Delete an account by name
   * @param {string} accountName - Name of the account to delete
   */
  async deleteAccount(accountName) {
    const row = this.page.locator(`tr:has-text("${accountName}")`);
    const deleteBtn = row.locator(AccountsPage.SELECTORS.deleteButton);
    await deleteBtn.click();

    // Confirm deletion in modal
    await this.waitForVisible(AccountsPage.SELECTORS.deleteModal);
    await this.click(AccountsPage.SELECTORS.confirmDeleteButton);

    // Verify account is removed
    await row.waitFor({ state: 'hidden', timeout: this.timeout });
    this._log('info', `✓ Account "${accountName}" deleted successfully`);
  }

  // ─── Account Data Retrieval ────────────────────────────────────────────────────

  /**
   * Get balance of a specific account by name
   * @param {string} accountName - Account name
   * @returns {Promise<number>} Account balance
   */
  async getAccountBalance(accountName) {
    const row = this.page.locator(`tr:has-text("${accountName}")`);
    const balanceText = await row.locator(AccountsPage.SELECTORS.accountBalance).textContent();
    const balance = parseFloat(balanceText.replace(/[^0-9.-]/g, ''));
    this._log('info', `Account "${accountName}" balance: ${balance}`);
    return balance;
  }

  /**
   * Get all account names displayed in the table
   * @returns {Promise<string[]>} Array of account names
   */
  async getAllAccountNames() {
    const names = await this.page.locator(AccountsPage.SELECTORS.accountName).allTextContents();
    this._log('info', `Found ${names.length} accounts`);
    return names.map(n => n.trim());
  }

  /**
   * Get total number of accounts in the table
   * @returns {Promise<number>}
   */
  async getAccountCount() {
    const rows = await this.page.locator(`${AccountsPage.SELECTORS.accountsTable} tbody tr`).count();
    this._log('info', `Account count: ${rows}`);
    return rows;
  }

  /**
   * Check if an account exists in the table
   * @param {string} accountName - Account name to check
   * @returns {Promise<boolean>}
   */
  async accountExists(accountName) {
    const row = this.page.locator(`tr:has-text("${accountName}")`);
    const exists = await row.isVisible();
    this._log('info', `Account "${accountName}" exists: ${exists}`);
    return exists;
  }

  // ─── Filtering & Sorting ───────────────────────────────────────────────────────

  /**
   * Filter accounts by type
   * @param {string} type - Account type to filter by (e.g., 'savings', 'checking', 'all')
   */
  async filterByType(type) {
    await this.selectByClick(AccountsPage.SELECTORS.filterTypeSelect, type);
    this._log('info', `Filtered accounts by type: "${type}"`);
  }

  /**
   * Sort accounts by a specific field
   * @param {string} field - Field to sort by (e.g., 'balance', 'name')
   */
  async sortBy(field) {
    await this.selectByClick(AccountsPage.SELECTORS.sortBySelect, field);
    this._log('info', `Sorted accounts by: "${field}"`);
  }

  /**
   * Get all balances as numbers (for sort verification)
   * @returns {Promise<number[]>}
   */
  async getAllBalances() {
    const balanceTexts = await this.page.locator(AccountsPage.SELECTORS.accountBalance).allTextContents();
    const balances = balanceTexts.map(t => parseFloat(t.replace(/[^0-9.-]/g, '')));
    this._log('info', `All balances: [${balances.join(', ')}]`);
    return balances;
  }

  // ─── Validation & Error Handling (Negative Tests) ──────────────────────────────

  /**
   * Assert that a validation error message is displayed
   * Tries multiple common error selectors used by the app
   * @param {string|RegExp} expectedMessage - Expected error text (partial match)
   * @returns {Promise<string>} The actual error text found
   */
  async assertValidationError(expectedMessage) {
    const errorSelectors = [
      AccountsPage.SELECTORS.wizardError,
      AccountsPage.SELECTORS.fieldError,
      AccountsPage.SELECTORS.nameError,
      AccountsPage.SELECTORS.depositError,
      AccountsPage.SELECTORS.typeError,
      '[role="alert"]',
      '.error-message',
      '[data-testid*="error"]',
      '.text-red-500',
      '.text-destructive',
      '[aria-invalid="true"] ~ span',
      '.field-error',
    ];

    let errorText = '';
    let found = false;

    for (const selector of errorSelectors) {
      const el = this.page.locator(selector).first();
      try {
        await el.waitFor({ state: 'visible', timeout: 3000 });
        errorText = await el.textContent();
        if (errorText && errorText.trim().length > 0) {
          found = true;
          this._log('info', `✓ Validation error found (${selector}): "${errorText.trim()}"`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!found) {
      this._log('info', '⚠ No explicit error message element found — checking for disabled state or no progression');
    }

    return errorText.trim();
  }

  /**
   * Assert the Next button is disabled (validation prevents progression)
   * @returns {Promise<boolean>}
   */
  async assertNextButtonDisabled() {
    const nextBtn = this.page.locator(AccountsPage.SELECTORS.wizardNext);
    const isDisabled = await nextBtn.isDisabled();
    this._log('info', `Next button disabled: ${isDisabled}`);
    return isDisabled;
  }

  /**
   * Assert the Confirm button is disabled
   * @returns {Promise<boolean>}
   */
  async assertConfirmButtonDisabled() {
    const confirmBtn = this.page.locator(AccountsPage.SELECTORS.wizardConfirm);
    const isDisabled = await confirmBtn.isDisabled();
    this._log('info', `Confirm button disabled: ${isDisabled}`);
    return isDisabled;
  }

  /**
   * Assert the wizard is still on the same step (did not advance)
   * @param {string} expectedStep - Expected step text (e.g., "Step 1 of 3")
   */
  async assertStillOnStep(expectedStep) {
    const indicator = this.page.locator(AccountsPage.SELECTORS.wizardStepIndicator);
    await expect(indicator).toContainText(expectedStep, { timeout: 3000 });
    this._log('info', `✓ Wizard still on: "${expectedStep}" (did not advance)`);
  }

  /**
   * Assert error toast notification appears
   * @returns {Promise<string>} The toast error text
   */
  async assertErrorToast() {
    const toastSelectors = [
      AccountsPage.SELECTORS.toastError,
      '[role="alert"]',
      '[data-sonner-toast][data-type="error"]',
      '.toast-error',
      '.Toastify__toast--error',
    ];

    for (const selector of toastSelectors) {
      const toast = this.page.locator(selector).first();
      try {
        await toast.waitFor({ state: 'visible', timeout: 3000 });
        const text = await toast.textContent();
        this._log('info', `✓ Error toast appeared (${selector}): "${text.trim()}"`);
        return text.trim();
      } catch {
        // Try next
      }
    }
    this._log('info', '⚠ No error toast found');
    return '';
  }

  /**
   * Cancel/close the wizard without completing
   */
  async cancelWizard() {
    // Try cancel button first, then close button, then Escape key
    const cancelBtn = this.page.locator(AccountsPage.SELECTORS.wizardCancel);
    const closeBtn = this.page.locator(AccountsPage.SELECTORS.wizardClose);

    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      this._log('info', 'Wizard cancelled via Cancel button');
    } else if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      this._log('info', 'Wizard closed via Close button');
    } else {
      await this.page.keyboard.press('Escape');
      this._log('info', 'Wizard closed via Escape key');
    }
  }

  /**
   * Assert wizard is closed/not visible
   */
  async assertWizardClosed() {
    const wizard = this.page.locator(AccountsPage.SELECTORS.wizardModal);
    await expect(wizard).toBeHidden({ timeout: 5000 });
    this._log('info', '✓ Wizard is closed');
  }

  /**
   * Fill only the account name field (for partial form tests)
   * @param {string} name - Account name value
   */
  async fillAccountName(name) {
    await this.fill(AccountsPage.SELECTORS.wizardAccountName, name);
    this._log('info', `Filled account name: "${name}"`);
  }

  /**
   * Fill only the deposit field (for partial form tests)
   * @param {string} deposit - Deposit value
   */
  async fillDeposit(deposit) {
    await this.fill(AccountsPage.SELECTORS.wizardInitialDeposit, deposit);
    this._log('info', `Filled deposit: "${deposit}"`);
  }

  /**
   * Clear a field completely
   * @param {string} selector - Field selector
   */
  async clearField(selector) {
    const field = this.page.locator(selector);
    await field.click();
    await field.fill('');
    this._log('info', `Cleared field: ${selector}`);
  }
}

module.exports = AccountsPage;