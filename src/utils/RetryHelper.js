/**
 * RetryHelper - Smart retry logic with configurable backoff strategies
 * Provides resilient test execution for flaky scenarios (network delays, animations, etc.)
 * 
 * @class RetryHelper
 */
class RetryHelper {
  /**
   * Default retry configuration
   */
  static DEFAULTS = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['TimeoutError', 'Error'],
  };

  /**
   * Retry an async operation with exponential backoff
   * 
   * @param {Function} operation - Async function to retry
   * @param {object} [options] - Retry configuration
   * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
   * @param {number} [options.initialDelay=1000] - Initial delay in ms
   * @param {number} [options.maxDelay=10000] - Maximum delay between retries
   * @param {number} [options.backoffMultiplier=2] - Delay multiplier for each retry
   * @param {string} [options.operationName='operation'] - Name for logging
   * @param {Function} [options.onRetry] - Callback executed on each retry
   * @returns {Promise<*>} Result of the operation
   * @throws {Error} Last error if all retries fail
   * 
   * @example
   * const result = await RetryHelper.retry(
   *   async () => await page.locator('.dynamic-element').click(),
   *   { maxRetries: 3, operationName: 'Click dynamic element' }
   * );
   */
  static async retry(operation, options = {}) {
    const config = { ...RetryHelper.DEFAULTS, ...options };
    const { maxRetries, initialDelay, maxDelay, backoffMultiplier, operationName = 'operation' } = config;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          RetryHelper._log('info', `✓ "${operationName}" succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error;

        if (attempt > maxRetries) {
          RetryHelper._log('error', `✗ "${operationName}" failed after ${maxRetries + 1} attempts: ${error.message}`);
          throw error;
        }

        RetryHelper._log('warn', `⟳ "${operationName}" attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);

        // Execute onRetry callback if provided
        if (config.onRetry) {
          await config.onRetry(error, attempt);
        }

        // Wait with exponential backoff
        await RetryHelper.sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Retry with linear backoff (constant delay between retries)
   * 
   * @param {Function} operation - Async function to retry
   * @param {object} [options] - Configuration
   * @param {number} [options.maxRetries=3] - Maximum retries
   * @param {number} [options.delay=1000] - Constant delay between retries
   * @param {string} [options.operationName='operation'] - Name for logging
   * @returns {Promise<*>}
   */
  static async retryLinear(operation, options = {}) {
    const { maxRetries = 3, delay = 1000, operationName = 'operation' } = options;
    return RetryHelper.retry(operation, {
      maxRetries,
      initialDelay: delay,
      backoffMultiplier: 1,
      maxDelay: delay,
      operationName,
    });
  }

  /**
   * Poll until a condition is met
   * 
   * @param {Function} conditionFn - Function that returns true when condition is met
   * @param {object} [options] - Poll configuration
   * @param {number} [options.timeout=30000] - Maximum time to wait in ms
   * @param {number} [options.interval=500] - Polling interval in ms
   * @param {string} [options.description='condition'] - Description for logging
   * @returns {Promise<boolean>} True if condition was met
   * @throws {Error} If timeout is exceeded
   * 
   * @example
   * await RetryHelper.pollUntil(
   *   async () => await page.locator('.status').textContent() === 'Complete',
   *   { timeout: 10000, description: 'Status becomes Complete' }
   * );
   */
  static async pollUntil(conditionFn, options = {}) {
    const { timeout = 30000, interval = 500, description = 'condition' } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await conditionFn();
        if (result) {
          RetryHelper._log('info', `✓ Condition met: "${description}"`);
          return true;
        }
      } catch {
        // Condition threw an error, continue polling
      }

      await RetryHelper.sleep(interval);
    }

    throw new Error(`Timeout: "${description}" not met after ${timeout}ms`);
  }

  /**
   * Wait for an element to stabilize (stop changing)
   * Useful for waiting for animations to complete
   * 
   * @param {import('@playwright/test').Page} page - Playwright page
   * @param {string} selector - Element selector
   * @param {object} [options] - Configuration
   * @param {number} [options.stabilityTime=500] - Time element must remain stable (ms)
   * @param {number} [options.timeout=10000] - Maximum wait time (ms)
   * @returns {Promise<void>}
   */
  static async waitForStability(page, selector, options = {}) {
    const { stabilityTime = 500, timeout = 10000 } = options;
    const startTime = Date.now();
    let lastBoundingBox = null;
    let stableStart = null;

    while (Date.now() - startTime < timeout) {
      try {
        const element = page.locator(selector);
        const box = await element.boundingBox();

        if (box && lastBoundingBox &&
          box.x === lastBoundingBox.x &&
          box.y === lastBoundingBox.y &&
          box.width === lastBoundingBox.width &&
          box.height === lastBoundingBox.height) {
          if (!stableStart) stableStart = Date.now();
          if (Date.now() - stableStart >= stabilityTime) {
            RetryHelper._log('debug', `Element "${selector}" stabilized`);
            return;
          }
        } else {
          stableStart = null;
        }

        lastBoundingBox = box;
      } catch {
        stableStart = null;
      }

      await RetryHelper.sleep(100);
    }

    RetryHelper._log('warn', `Element "${selector}" did not stabilize within ${timeout}ms`);
  }

  /**
   * Execute with timeout - wraps an operation with a timeout guard
   * 
   * @param {Function} operation - Async operation to execute
   * @param {number} timeout - Timeout in ms
   * @param {string} [operationName='operation'] - Name for error message
   * @returns {Promise<*>}
   */
  static async withTimeout(operation, timeout, operationName = 'operation') {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`"${operationName}" timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Sleep utility
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Private ───────────────────────────────────────────────────────────────────

  static _log(level, message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [RetryHelper] ${message}`;
    switch (level) {
      case 'error': console.error(formatted); break;
      case 'warn': console.warn(formatted); break;
      case 'debug':
        if (process.env.DEBUG === 'true') console.log(formatted);
        break;
      default: console.log(formatted);
    }
  }
}

module.exports = RetryHelper;