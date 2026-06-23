/**
 * Modal - Reusable component for handling modal dialogs
 * Provides common modal interaction patterns (open, close, confirm, cancel).
 * 
 * @class Modal
 */
class Modal {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} modalSelector - The root selector for the modal
   */
  constructor(page, modalSelector) {
    this.page = page;
    this.modalSelector = modalSelector;
    this.timeout = 10000;
  }

  // ─── Selectors (Configurable) ──────────────────────────────────────────────────

  static DEFAULT_SELECTORS = {
    closeButton: '[data-testid="modal-close"], button[aria-label="Close"]',
    confirmButton: '[data-testid="confirm-button"], button:has-text("Confirm")',
    cancelButton: '[data-testid="cancel-button"], button:has-text("Cancel")',
    title: '[data-testid="modal-title"], .modal-title, h2',
    overlay: '[data-testid="modal-overlay"], .modal-overlay',
  };

  // ─── Visibility ────────────────────────────────────────────────────────────────

  /**
   * Wait for modal to be visible
   * @param {number} [timeout] - Custom timeout
   */
  async waitForVisible(timeout = this.timeout) {
    const modal = this.page.locator(this.modalSelector);
    await modal.waitFor({ state: 'visible', timeout });
    this._log('info', 'Modal is visible');
  }

  /**
   * Wait for modal to be hidden
   * @param {number} [timeout] - Custom timeout
   */
  async waitForHidden(timeout = this.timeout) {
    const modal = this.page.locator(this.modalSelector);
    await modal.waitFor({ state: 'hidden', timeout });
    this._log('info', 'Modal is hidden');
  }

  /**
   * Check if modal is currently visible
   * @returns {Promise<boolean>}
   */
  async isVisible() {
    return await this.page.locator(this.modalSelector).isVisible();
  }

  // ─── Interactions ──────────────────────────────────────────────────────────────

  /**
   * Click the confirm/submit button within the modal
   * @param {string} [selector] - Custom confirm button selector
   */
  async confirm(selector) {
    const modal = this.page.locator(this.modalSelector);
    const confirmBtn = modal.locator(selector || Modal.DEFAULT_SELECTORS.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: this.timeout });
    await confirmBtn.click();
    this._log('info', 'Modal confirmed');
  }

  /**
   * Click the cancel button within the modal
   * @param {string} [selector] - Custom cancel button selector
   */
  async cancel(selector) {
    const modal = this.page.locator(this.modalSelector);
    const cancelBtn = modal.locator(selector || Modal.DEFAULT_SELECTORS.cancelButton).first();
    await cancelBtn.waitFor({ state: 'visible', timeout: this.timeout });
    await cancelBtn.click();
    this._log('info', 'Modal cancelled');
  }

  /**
   * Close the modal via close button
   * @param {string} [selector] - Custom close button selector
   */
  async close(selector) {
    const modal = this.page.locator(this.modalSelector);
    const closeBtn = modal.locator(selector || Modal.DEFAULT_SELECTORS.closeButton).first();
    await closeBtn.click();
    await this.waitForHidden();
    this._log('info', 'Modal closed');
  }

  /**
   * Close modal by pressing Escape key
   */
  async closeWithEscape() {
    await this.page.keyboard.press('Escape');
    await this.waitForHidden();
    this._log('info', 'Modal closed with Escape key');
  }

  /**
   * Close modal by clicking outside (on overlay)
   */
  async closeByClickingOutside() {
    const overlay = this.page.locator(Modal.DEFAULT_SELECTORS.overlay);
    if (await overlay.count() > 0) {
      await overlay.click({ position: { x: 10, y: 10 } });
      await this.waitForHidden();
      this._log('info', 'Modal closed by clicking overlay');
    }
  }

  // ─── Content ───────────────────────────────────────────────────────────────────

  /**
   * Get modal title text
   * @returns {Promise<string>}
   */
  async getTitle() {
    const modal = this.page.locator(this.modalSelector);
    const titleEl = modal.locator(Modal.DEFAULT_SELECTORS.title).first();
    const text = await titleEl.textContent();
    return text?.trim() || '';
  }

  /**
   * Fill an input field within the modal
   * @param {string} selector - Input selector (relative to modal)
   * @param {string} value - Value to fill
   */
  async fillInput(selector, value) {
    const modal = this.page.locator(this.modalSelector);
    const input = modal.locator(selector);
    await input.waitFor({ state: 'visible', timeout: this.timeout });
    await input.fill(value);
    this._log('info', `Filled modal input "${selector}" with: "${value}"`);
  }

  /**
   * Click a button within the modal by text
   * @param {string} buttonText - Button text to click
   */
  async clickButton(buttonText) {
    const modal = this.page.locator(this.modalSelector);
    const button = modal.locator(`button:has-text("${buttonText}")`);
    await button.waitFor({ state: 'visible', timeout: this.timeout });
    await button.click();
    this._log('info', `Clicked modal button: "${buttonText}"`);
  }

  /**
   * Get text content of an element within the modal
   * @param {string} selector - Element selector
   * @returns {Promise<string>}
   */
  async getText(selector) {
    const modal = this.page.locator(this.modalSelector);
    const element = modal.locator(selector);
    const text = await element.textContent();
    return text?.trim() || '';
  }

  /**
   * Check if a specific element exists within the modal
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>}
   */
  async hasElement(selector) {
    const modal = this.page.locator(this.modalSelector);
    return (await modal.locator(selector).count()) > 0;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────────

  _log(level, message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [Modal] ${message}`;
    if (level === 'error') console.error(formatted);
    else if (level === 'debug' && process.env.DEBUG === 'true') console.log(formatted);
    else if (level !== 'debug') console.log(formatted);
  }
}

module.exports = Modal;