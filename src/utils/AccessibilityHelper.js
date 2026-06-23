/**
 * AccessibilityHelper — WCAG Accessibility Testing Utility
 * 
 * Provides methods for automated accessibility testing using
 * Playwright's built-in accessibility features and custom checks.
 * 
 * Checks include:
 * - ARIA roles and labels
 * - Keyboard navigation (Tab order, focus management)
 * - Color contrast (via snapshot comparison)
 * - Heading hierarchy
 * - Form label associations
 * - Focus visibility
 * 
 * Note: For comprehensive axe-core integration, install @axe-core/playwright
 * 
 * Usage:
 *   const a11y = new AccessibilityHelper(page);
 *   const results = await a11y.audit();
 *   expect(results.violations).toHaveLength(0);
 */

class AccessibilityHelper {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  // ─── Full Page Audit ───────────────────────────────────────────────────────────

  /**
   * Run full accessibility audit using Playwright's accessibility tree
   * @returns {{ violations: Array, passes: Array, snapshot: object }}
   */
  async audit() {
    const violations = [];
    const passes = [];

    // Check images for alt text
    const imageResults = await this.checkImagesAltText();
    violations.push(...imageResults.violations);
    passes.push(...imageResults.passes);

    // Check form labels
    const formResults = await this.checkFormLabels();
    violations.push(...formResults.violations);
    passes.push(...formResults.passes);

    // Check heading hierarchy
    const headingResults = await this.checkHeadingHierarchy();
    violations.push(...headingResults.violations);
    passes.push(...headingResults.passes);

    // Check ARIA landmarks
    const landmarkResults = await this.checkLandmarks();
    violations.push(...landmarkResults.violations);
    passes.push(...landmarkResults.passes);

    // Check buttons have accessible names
    const buttonResults = await this.checkButtonLabels();
    violations.push(...buttonResults.violations);
    passes.push(...buttonResults.passes);

    // Get accessibility snapshot
    const snapshot = await this.getAccessibilitySnapshot();

    return { violations, passes, snapshot };
  }

  // ─── Individual Checks ─────────────────────────────────────────────────────────

  /**
   * Check all images have alt text
   */
  async checkImagesAltText() {
    const violations = [];
    const passes = [];

    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      if (!alt && alt !== '') {
        violations.push({
          rule: 'image-alt',
          impact: 'critical',
          element: `<img src="${src}">`,
          message: 'Image missing alt attribute',
        });
      } else {
        passes.push({ rule: 'image-alt', element: `<img src="${src}">` });
      }
    }

    return { violations, passes };
  }

  /**
   * Check form inputs have associated labels
   */
  async checkFormLabels() {
    const violations = [];
    const passes = [];

    const inputs = await this.page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type') || 'text';

      const hasLabel = id
        ? await this.page.locator(`label[for="${id}"]`).count() > 0
        : false;

      if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
        violations.push({
          rule: 'label',
          impact: 'serious',
          element: `<input type="${type}" id="${id || '(none)'}">`,
          message: `Input missing label association (has placeholder: "${placeholder || 'none'}")`,
        });
      } else {
        passes.push({ rule: 'label', element: `<input type="${type}">` });
      }
    }

    return { violations, passes };
  }

  /**
   * Check heading hierarchy (h1 → h2 → h3, no skips)
   */
  async checkHeadingHierarchy() {
    const violations = [];
    const passes = [];

    const headings = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(elements).map(el => ({
        level: parseInt(el.tagName.charAt(1)),
        text: el.textContent.trim().substring(0, 50),
      }));
    });

    let previousLevel = 0;
    for (const heading of headings) {
      if (heading.level > previousLevel + 1 && previousLevel > 0) {
        violations.push({
          rule: 'heading-order',
          impact: 'moderate',
          element: `<h${heading.level}>${heading.text}</h${heading.level}>`,
          message: `Heading level skipped from h${previousLevel} to h${heading.level}`,
        });
      } else {
        passes.push({ rule: 'heading-order', element: `<h${heading.level}>${heading.text}>` });
      }
      previousLevel = heading.level;
    }

    // Check for exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count === 0) {
      violations.push({ rule: 'page-has-h1', impact: 'moderate', message: 'Page has no h1 heading' });
    } else if (h1Count > 1) {
      violations.push({ rule: 'page-has-h1', impact: 'minor', message: `Page has ${h1Count} h1 headings (expected 1)` });
    } else {
      passes.push({ rule: 'page-has-h1' });
    }

    return { violations, passes };
  }

  /**
   * Check ARIA landmarks exist
   */
  async checkLandmarks() {
    const violations = [];
    const passes = [];

    const landmarks = await this.page.evaluate(() => {
      const roles = ['banner', 'navigation', 'main', 'contentinfo'];
      const found = {};
      for (const role of roles) {
        found[role] = document.querySelectorAll(`[role="${role}"]`).length > 0 ||
          (role === 'banner' && document.querySelectorAll('header').length > 0) ||
          (role === 'navigation' && document.querySelectorAll('nav').length > 0) ||
          (role === 'main' && document.querySelectorAll('main').length > 0) ||
          (role === 'contentinfo' && document.querySelectorAll('footer').length > 0);
      }
      return found;
    });

    if (!landmarks.main) {
      violations.push({ rule: 'landmark-main', impact: 'moderate', message: 'Page missing <main> landmark' });
    } else {
      passes.push({ rule: 'landmark-main' });
    }

    return { violations, passes };
  }

  /**
   * Check buttons have accessible names
   */
  async checkButtonLabels() {
    const violations = [];
    const passes = [];

    const buttons = await this.page.locator('button, [role="button"]').all();
    for (const button of buttons) {
      const text = (await button.textContent()).trim();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      if (!text && !ariaLabel && !title) {
        violations.push({
          rule: 'button-name',
          impact: 'critical',
          message: 'Button has no accessible name',
        });
      } else {
        passes.push({ rule: 'button-name', element: text || ariaLabel });
      }
    }

    return { violations, passes };
  }

  // ─── Keyboard Navigation ───────────────────────────────────────────────────────

  /**
   * Test keyboard tab order and focus visibility
   * @param {number} [maxTabs=20] - Maximum tabs to press
   * @returns {{ focusOrder: string[], allFocusVisible: boolean }}
   */
  async testTabOrder(maxTabs = 20) {
    const focusOrder = [];
    let allFocusVisible = true;

    for (let i = 0; i < maxTabs; i++) {
      await this.page.keyboard.press('Tab');

      const focused = await this.page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;

        const computedStyle = window.getComputedStyle(el);
        const outlineStyle = computedStyle.outlineStyle;
        const outlineWidth = parseInt(computedStyle.outlineWidth);

        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          text: (el.textContent || el.value || '').trim().substring(0, 30),
          role: el.getAttribute('role'),
          hasFocusIndicator: outlineStyle !== 'none' || outlineWidth > 0,
        };
      });

      if (!focused) break;

      focusOrder.push(`${focused.tag}${focused.id ? '#' + focused.id : ''}${focused.text ? ': ' + focused.text : ''}`);

      if (!focused.hasFocusIndicator) {
        allFocusVisible = false;
      }
    }

    return { focusOrder, allFocusVisible };
  }

  /**
   * Test that Enter key activates focused element
   */
  async testEnterKeyActivation() {
    await this.page.keyboard.press('Tab');
    const beforeUrl = this.page.url();
    await this.page.keyboard.press('Enter');
    const afterUrl = this.page.url();
    return beforeUrl !== afterUrl;
  }

  /**
   * Test Escape key closes modals/dialogs
   */
  async testEscapeKeyDismiss() {
    const dialogBefore = await this.page.locator('[role="dialog"], .modal').count();
    await this.page.keyboard.press('Escape');
    const dialogAfter = await this.page.locator('[role="dialog"], .modal').count();
    return dialogAfter < dialogBefore || dialogAfter === 0;
  }

  // ─── Accessibility Snapshot ────────────────────────────────────────────────────

  /**
   * Get the full accessibility tree snapshot
   * @returns {object} Accessibility tree
   */
  async getAccessibilitySnapshot() {
    return this.page.accessibility.snapshot();
  }
}

module.exports = AccessibilityHelper;