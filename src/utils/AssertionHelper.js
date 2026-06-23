const { expect } = require('@playwright/test');

/**
 * AssertionHelper - Custom assertion wrapper with descriptive failure messages
 * Provides enhanced assertions with auto-logging, screenshots on failure,
 * and human-readable error context.
 * 
 * @class AssertionHelper
 */
class AssertionHelper {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
    this.timeout = 10000;
  }

  // ─── Visibility Assertions ─────────────────────────────────────────────────────

  /**
   * Assert that an element is visible on the page
   * @param {string} selector - Element selector
   * @param {string} description - Human-readable description of what's being verified
   */
  async expectVisible(selector, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeVisible({ timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — is visible`);
    } catch (error) {
      AssertionHelper._log('fail', `${description} — expected to be visible but was NOT`);
      throw new Error(`Assertion Failed: "${description}" was not visible.\nSelector: ${selector}\nOriginal: ${error.message}`);
    }
  }

  /**
   * Assert that an element is NOT visible on the page
   * @param {string} selector - Element selector
   * @param {string} description - Human-readable description
   */
  async expectNotVisible(selector, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).not.toBeVisible({ timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — is not visible (as expected)`);
    } catch (error) {
      AssertionHelper._log('fail', `${description} — expected to be hidden but was VISIBLE`);
      throw new Error(`Assertion Failed: "${description}" was visible when it shouldn't be.\nSelector: ${selector}\nOriginal: ${error.message}`);
    }
  }

  // ─── Text Assertions ───────────────────────────────────────────────────────────

  /**
   * Assert that an element contains specific text
   * @param {string} selector - Element selector
   * @param {string} expectedText - Expected text content
   * @param {string} description - Human-readable description
   */
  async expectContainsText(selector, expectedText, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toContainText(expectedText, { timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — contains "${expectedText}"`);
    } catch (error) {
      const actualText = await this.page.locator(selector).textContent().catch(() => 'N/A');
      AssertionHelper._log('fail', `${description} — expected to contain "${expectedText}" but got "${actualText}"`);
      throw new Error(`Assertion Failed: "${description}" does not contain expected text.\nExpected: "${expectedText}"\nActual: "${actualText}"\nSelector: ${selector}`);
    }
  }

  /**
   * Assert that an element has exact text
   * @param {string} selector - Element selector
   * @param {string} expectedText - Expected exact text
   * @param {string} description - Human-readable description
   */
  async expectExactText(selector, expectedText, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toHaveText(expectedText, { timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — has exact text "${expectedText}"`);
    } catch (error) {
      const actualText = await this.page.locator(selector).textContent().catch(() => 'N/A');
      AssertionHelper._log('fail', `${description} — expected exact text "${expectedText}" but got "${actualText}"`);
      throw new Error(`Assertion Failed: "${description}" text mismatch.\nExpected: "${expectedText}"\nActual: "${actualText}"`);
    }
  }

  // ─── Value Assertions ──────────────────────────────────────────────────────────

  /**
   * Assert input field has specific value
   * @param {string} selector - Input selector
   * @param {string} expectedValue - Expected value
   * @param {string} description - Human-readable description
   */
  async expectInputValue(selector, expectedValue, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toHaveValue(expectedValue, { timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — has value "${expectedValue}"`);
    } catch (error) {
      const actualValue = await this.page.locator(selector).inputValue().catch(() => 'N/A');
      AssertionHelper._log('fail', `${description} — expected value "${expectedValue}" but got "${actualValue}"`);
      throw new Error(`Assertion Failed: "${description}" value mismatch.\nExpected: "${expectedValue}"\nActual: "${actualValue}"`);
    }
  }

  /**
   * Assert a numeric value equals expected (with tolerance)
   * @param {number} actual - Actual value
   * @param {number} expected - Expected value
   * @param {string} description - Human-readable description
   * @param {number} [tolerance=0.01] - Acceptable difference
   */
  expectNumericEquals(actual, expected, description, tolerance = 0.01) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
      AssertionHelper._log('pass', `${description} — ${actual} ≈ ${expected} (tolerance: ${tolerance})`);
    } else {
      AssertionHelper._log('fail', `${description} — ${actual} ≠ ${expected} (diff: ${diff}, tolerance: ${tolerance})`);
      throw new Error(`Assertion Failed: "${description}"\nExpected: ${expected}\nActual: ${actual}\nDifference: ${diff} (exceeds tolerance ${tolerance})`);
    }
  }

  // ─── State Assertions ──────────────────────────────────────────────────────────

  /**
   * Assert element is enabled
   * @param {string} selector - Element selector
   * @param {string} description - Human-readable description
   */
  async expectEnabled(selector, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeEnabled({ timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — is enabled`);
    } catch (error) {
      AssertionHelper._log('fail', `${description} — expected to be enabled but was DISABLED`);
      throw new Error(`Assertion Failed: "${description}" was not enabled.\nSelector: ${selector}`);
    }
  }

  /**
   * Assert element is disabled
   * @param {string} selector - Element selector
   * @param {string} description - Human-readable description
   */
  async expectDisabled(selector, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeDisabled({ timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — is disabled`);
    } catch (error) {
      AssertionHelper._log('fail', `${description} — expected to be disabled but was ENABLED`);
      throw new Error(`Assertion Failed: "${description}" was not disabled.\nSelector: ${selector}`);
    }
  }

  /**
   * Assert element has specific attribute value
   * @param {string} selector - Element selector
   * @param {string} attribute - Attribute name
   * @param {string} expectedValue - Expected attribute value
   * @param {string} description - Human-readable description
   */
  async expectAttribute(selector, attribute, expectedValue, description) {
    try {
      const element = this.page.locator(selector);
      await expect(element).toHaveAttribute(attribute, expectedValue, { timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — has ${attribute}="${expectedValue}"`);
    } catch (error) {
      const actualValue = await this.page.locator(selector).getAttribute(attribute).catch(() => 'N/A');
      AssertionHelper._log('fail', `${description} — expected ${attribute}="${expectedValue}" but got "${actualValue}"`);
      throw new Error(`Assertion Failed: "${description}" attribute mismatch.\nAttribute: ${attribute}\nExpected: "${expectedValue}"\nActual: "${actualValue}"`);
    }
  }

  // ─── URL Assertions ────────────────────────────────────────────────────────────

  /**
   * Assert current URL contains a path segment
   * @param {string} expectedPath - Expected path segment
   * @param {string} description - Human-readable description
   */
  expectUrlContains(expectedPath, description) {
    const currentUrl = this.page.url();
    if (currentUrl.includes(expectedPath)) {
      AssertionHelper._log('pass', `${description} — URL contains "${expectedPath}"`);
    } else {
      AssertionHelper._log('fail', `${description} — URL "${currentUrl}" does not contain "${expectedPath}"`);
      throw new Error(`Assertion Failed: "${description}"\nExpected URL to contain: "${expectedPath}"\nActual URL: "${currentUrl}"`);
    }
  }

  /**
   * Assert current URL matches a pattern
   * @param {RegExp} pattern - URL pattern to match
   * @param {string} description - Human-readable description
   */
  async expectUrlMatches(pattern, description) {
    try {
      await expect(this.page).toHaveURL(pattern, { timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — URL matches pattern`);
    } catch (error) {
      const currentUrl = this.page.url();
      AssertionHelper._log('fail', `${description} — URL "${currentUrl}" does not match pattern ${pattern}`);
      throw new Error(`Assertion Failed: "${description}"\nExpected URL to match: ${pattern}\nActual URL: "${currentUrl}"`);
    }
  }

  // ─── Count Assertions ──────────────────────────────────────────────────────────

  /**
   * Assert element count equals expected
   * @param {string} selector - Element selector
   * @param {number} expectedCount - Expected number of elements
   * @param {string} description - Human-readable description
   */
  async expectCount(selector, expectedCount, description) {
    try {
      const elements = this.page.locator(selector);
      await expect(elements).toHaveCount(expectedCount, { timeout: this.timeout });
      AssertionHelper._log('pass', `${description} — count is ${expectedCount}`);
    } catch (error) {
      const actualCount = await this.page.locator(selector).count();
      AssertionHelper._log('fail', `${description} — expected ${expectedCount} elements but found ${actualCount}`);
      throw new Error(`Assertion Failed: "${description}"\nExpected count: ${expectedCount}\nActual count: ${actualCount}\nSelector: ${selector}`);
    }
  }

  // ─── Collection Assertions ─────────────────────────────────────────────────────

  /**
   * Assert array is sorted in ascending order
   * @param {number[]} array - Array to check
   * @param {string} description - Human-readable description
   */
  expectSortedAscending(array, description) {
    for (let i = 1; i < array.length; i++) {
      if (array[i] < array[i - 1]) {
        AssertionHelper._log('fail', `${description} — not sorted ascending at index ${i}: ${array[i - 1]} > ${array[i]}`);
        throw new Error(`Assertion Failed: "${description}" — Array not sorted ascending.\nValues: [${array.join(', ')}]\nViolation at index ${i}: ${array[i - 1]} > ${array[i]}`);
      }
    }
    AssertionHelper._log('pass', `${description} — array is sorted ascending`);
  }

  /**
   * Assert array is sorted in descending order
   * @param {number[]} array - Array to check
   * @param {string} description - Human-readable description
   */
  expectSortedDescending(array, description) {
    for (let i = 1; i < array.length; i++) {
      if (array[i] > array[i - 1]) {
        AssertionHelper._log('fail', `${description} — not sorted descending at index ${i}: ${array[i - 1]} < ${array[i]}`);
        throw new Error(`Assertion Failed: "${description}" — Array not sorted descending.\nValues: [${array.join(', ')}]\nViolation at index ${i}: ${array[i - 1]} < ${array[i]}`);
      }
    }
    AssertionHelper._log('pass', `${description} — array is sorted descending`);
  }

  // ─── Soft Assertions ───────────────────────────────────────────────────────────

  /**
   * Perform a soft assertion (collects errors without throwing immediately)
   * Use with `flushSoftAssertions()` to throw all collected errors at once.
   * 
   * @param {Function} assertionFn - Async assertion function
   * @param {string} description - Description of the assertion
   */
  async softAssert(assertionFn, description) {
    if (!this._softErrors) this._softErrors = [];
    try {
      await assertionFn();
    } catch (error) {
      this._softErrors.push({ description, error: error.message });
      AssertionHelper._log('warn', `SOFT FAIL: ${description} — ${error.message}`);
    }
  }

  /**
   * Flush all collected soft assertion errors
   * Throws if any soft assertions failed
   */
  flushSoftAssertions() {
    if (!this._softErrors || this._softErrors.length === 0) {
      AssertionHelper._log('pass', 'All soft assertions passed');
      return;
    }

    const errorSummary = this._softErrors
      .map((e, i) => `  ${i + 1}. ${e.description}: ${e.error}`)
      .join('\n');

    const count = this._softErrors.length;
    this._softErrors = [];

    throw new Error(`${count} soft assertion(s) failed:\n${errorSummary}`);
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────────

  static _log(level, message) {
    const timestamp = new Date().toISOString();
    const icon = level === 'pass' ? '✓' : level === 'fail' ? '✗' : '⚠';
    const formatted = `[${timestamp}] [${icon} ${level.toUpperCase()}] [Assertion] ${message}`;

    switch (level) {
      case 'fail':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }
}

module.exports = AssertionHelper;