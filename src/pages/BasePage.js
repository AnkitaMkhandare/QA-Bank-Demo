const { expect } = require('@playwright/test');

/**
 * BasePage - Abstract base class for all Page Objects
 * Provides common actions, smart waits, and auto-logging capabilities.
 * 
 * @abstract
 * @class BasePage
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    if (new.target === BasePage) {
      throw new Error('BasePage is abstract and cannot be instantiated directly');
    }
    this.page = page;
    this.timeout = 10000;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────────

  /**
   * Navigate to a specific URL
   * @param {string} url - The URL to navigate to
   * @param {object} [options] - Navigation options
   */
  async navigate(url, options = {}) {
    const defaultOptions = { waitUntil: 'domcontentloaded', timeout: this.timeout };
    await this.page.goto(url, { ...defaultOptions, ...options });
    this._log('info', `Navigated to: ${url}`);
  }

  /**
   * Wait for the page URL to contain a specific path
   * @param {string} path - The path segment to wait for
   */
  async waitForPath(path) {
    await this.page.waitForURL(`**/${path}`, { timeout: this.timeout });
    this._log('info', `URL contains path: ${path}`);
  }

  /**
   * Get the current page URL
   * @returns {string}
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Get page title
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.page.title();
  }

  // ─── Element Interactions ──────────────────────────────────────────────────────

  /**
   * Click on an element with smart wait
   * @param {string} selector - Element selector
   * @param {object} [options] - Click options
   */
  async click(selector, options = {}) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    await element.highlight();
    await element.click(options);
    this._log('info', `Clicked: ${selector}`);
  }

  /**
   * Double-click on an element
   * @param {string} selector - Element selector
   */
  async doubleClick(selector) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    await element.dblclick();
    this._log('info', `Double-clicked: ${selector}`);
  }

  /**
   * Fill input field with value (clears existing content first)
   * @param {string} selector - Input selector
   * @param {string} value - Value to fill
   */
  async fill(selector, value) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    await element.highlight();
    await element.fill(value);
    this._log('info', `Filled "${selector}" with value: "${value}"`);
  }

  /**
   * Type text character by character (simulates real typing)
   * @param {string} selector - Input selector
   * @param {string} text - Text to type
   * @param {number} [delay=50] - Delay between keystrokes in ms
   */
  async type(selector, text, delay = 50) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    await element.pressSequentially(text, { delay });
    this._log('info', `Typed into "${selector}": "${text}"`);
  }

  /**
   * Double-click on an element
   * @param {string} selector - Element selector
   */
  async doubleClick(selector) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    await element.highlight();
    await element.dblclick();
    this._log('info', `Double-clicked: ${selector}`);
  }

  /**
   * Select an option from a dropdown by value
   * @param {string} selector - Select element selector
   * @param {string} value - Option value to select
   */
  async selectOption(selector, value) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    await element.selectOption(value);
    this._log('info', `Selected option "${value}" in: ${selector}`);
  }

  /**
   * Select a dropdown option by clicking (for custom dropdowns)
   * @param {string} triggerSelector - Dropdown trigger selector
   * @param {string} optionText - Text of the option to select
   */
  async selectByClick(triggerSelector, optionText) {
    await this.click(triggerSelector);
    const option = this.page.getByRole('option', { name: optionText });
    await option.waitFor({ state: 'visible', timeout: this.timeout });
    await option.click();
    this._log('info', `Selected "${optionText}" from dropdown: ${triggerSelector}`);
  }

  // ─── Element State ─────────────────────────────────────────────────────────────

  /**
   * Get text content of an element
   * @param {string} selector - Element selector
   * @returns {Promise<string>}
   */
  async getText(selector) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    const text = await element.textContent();
    this._log('debug', `Got text from "${selector}": "${text}"`);
    return text?.trim() || '';
  }

  /**
   * Get input value
   * @param {string} selector - Input selector
   * @returns {Promise<string>}
   */
  async getInputValue(selector) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    return await element.inputValue();
  }

  /**
   * Get attribute value of an element
   * @param {string} selector - Element selector
   * @param {string} attribute - Attribute name
   * @returns {Promise<string|null>}
   */
  async getAttribute(selector, attribute) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'attached', timeout: this.timeout });
    return await element.getAttribute(attribute);
  }

  /**
   * Check if an element is visible
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>}
   */
  async isVisible(selector) {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if an element is enabled
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>}
   */
  async isEnabled(selector) {
    const element = this.page.locator(selector);
    return await element.isEnabled();
  }

  /**
   * Get count of elements matching selector
   * @param {string} selector - Element selector
   * @returns {Promise<number>}
   */
  async getElementCount(selector) {
    return await this.page.locator(selector).count();
  }

  // ─── Waits ─────────────────────────────────────────────────────────────────────

  /**
   * Wait for an element to be visible
   * @param {string} selector - Element selector
   * @param {number} [timeout] - Custom timeout
   */
  async waitForVisible(selector, timeout = this.timeout) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
    this._log('debug', `Element visible: ${selector}`);
  }

  /**
   * Wait for an element to be hidden
   * @param {string} selector - Element selector
   * @param {number} [timeout] - Custom timeout
   */
  async waitForHidden(selector, timeout = this.timeout) {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
    this._log('debug', `Element hidden: ${selector}`);
  }

  /**
   * Wait for network to be idle (no pending requests)
   * @param {number} [timeout] - Custom timeout
   */
  async waitForNetworkIdle(timeout = this.timeout) {
    await this.page.waitForLoadState('networkidle', { timeout });
    this._log('debug', 'Network idle');
  }

  /**
   * Wait for a specific response from the network
   * @param {string} urlPattern - URL pattern to match
   * @param {number} [timeout] - Custom timeout
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async waitForResponse(urlPattern, timeout = this.timeout) {
    return await this.page.waitForResponse(
      (response) => response.url().includes(urlPattern),
      { timeout }
    );
  }

  // ─── Assertions ────────────────────────────────────────────────────────────────

  /**
   * Assert element is visible with descriptive message
   * @param {string} selector - Element selector
   * @param {string} [description] - Human-readable description
   */
  async assertVisible(selector, description = selector) {
    const element = this.page.locator(selector);
    await expect(element, `Expected "${description}" to be visible`).toBeVisible({ timeout: this.timeout });
    this._log('info', `✓ Assertion passed: "${description}" is visible`);
  }

  /**
   * Assert element is not visible
   * @param {string} selector - Element selector
   * @param {string} [description] - Human-readable description
   */
  async assertNotVisible(selector, description = selector) {
    const element = this.page.locator(selector);
    await expect(element, `Expected "${description}" to NOT be visible`).not.toBeVisible({ timeout: this.timeout });
    this._log('info', `✓ Assertion passed: "${description}" is not visible`);
  }

  /**
   * Assert element contains text
   * @param {string} selector - Element selector
   * @param {string} text - Expected text
   * @param {string} [description] - Human-readable description
   */
  async assertContainsText(selector, text, description = selector) {
    const element = this.page.locator(selector);
    await expect(element, `Expected "${description}" to contain text "${text}"`)
      .toContainText(text, { timeout: this.timeout });
    this._log('info', `✓ Assertion passed: "${description}" contains text "${text}"`);
  }

  /**
   * Assert URL contains path
   * @param {string} path - Expected path segment
   */
  async assertUrlContains(path) {
    expect(this.page.url(), `Expected URL to contain "${path}"`).toContain(path);
    this._log('info', `✓ Assertion passed: URL contains "${path}"`);
  }

  // ─── Keyboard ──────────────────────────────────────────────────────────────────

  /**
   * Press a keyboard key
   * @param {string} key - Key to press (e.g., 'Enter', 'Tab', 'Escape')
   */
  async pressKey(key) {
    await this.page.keyboard.press(key);
    this._log('debug', `Pressed key: ${key}`);
  }

  // ─── Screenshots ───────────────────────────────────────────────────────────────

  /**
   * Take a screenshot of the page
   * @param {string} name - Screenshot name
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot(name) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this._log('info', `Screenshot captured: ${name}`);
    return screenshot;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────────

  /**
   * Internal logging method
   * @param {string} level - Log level (info, debug, warn, error)
   * @param {string} message - Log message
   * @private
   */
  _log(level, message) {
    const timestamp = new Date().toISOString();
    const pageName = this.constructor.name;
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [${pageName}] ${message}`;

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (process.env.DEBUG === 'true') {
          console.log(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }
}

module.exports = BasePage;