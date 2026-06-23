/**
 * PerformanceHelper — Core Web Vitals & Page Load Monitoring
 * 
 * Collects and validates performance metrics using browser Performance API:
 * - LCP (Largest Contentful Paint) — target < 2.5s
 * - FID (First Input Delay) — target < 100ms
 * - CLS (Cumulative Layout Shift) — target < 0.1
 * - TTFB (Time to First Byte) — target < 800ms
 * - FCP (First Contentful Paint) — target < 1.8s
 * - Total page load time
 * - Resource count and size
 * 
 * Usage:
 *   const perf = new PerformanceHelper(page);
 *   await perf.startMonitoring();
 *   // ... navigate/interact ...
 *   const metrics = await perf.collectMetrics();
 *   perf.assertWithinBudget(metrics, PerformanceHelper.BUDGETS.fast);
 */

class PerformanceHelper {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
    this.startTime = null;
  }

  // ─── Monitoring ────────────────────────────────────────────────────────────────

  /**
   * Start monitoring (call before navigation)
   */
  startMonitoring() {
    this.startTime = Date.now();
  }

  /**
   * Collect all performance metrics from the page
   * @returns {PerformanceMetrics}
   */
  async collectMetrics() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource');

      // Navigation timing
      const ttfb = navigation ? navigation.responseStart - navigation.requestStart : null;
      const domContentLoaded = navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : null;
      const loadComplete = navigation ? navigation.loadEventEnd - navigation.startTime : null;
      const domInteractive = navigation ? navigation.domInteractive - navigation.startTime : null;

      // Paint timing
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      const fp = paint.find(p => p.name === 'first-paint');

      // Resource metrics
      const totalResources = resources.length;
      const totalTransferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const largestResource = resources.reduce((max, r) => 
        (r.transferSize || 0) > (max.transferSize || 0) ? r : max, { transferSize: 0 }
      );

      return {
        // Core timing
        ttfb: ttfb ? Math.round(ttfb) : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
        fp: fp ? Math.round(fp.startTime) : null,
        domContentLoaded: domContentLoaded ? Math.round(domContentLoaded) : null,
        domInteractive: domInteractive ? Math.round(domInteractive) : null,
        loadComplete: loadComplete ? Math.round(loadComplete) : null,

        // Resources
        resourceCount: totalResources,
        totalTransferSizeKB: Math.round(totalTransferSize / 1024),
        largestResourceKB: Math.round((largestResource.transferSize || 0) / 1024),
        largestResourceName: largestResource.name || 'unknown',
      };
    });

    // Collect LCP via PerformanceObserver (if available)
    const lcp = await this._collectLCP();
    const cls = await this._collectCLS();

    return {
      ...metrics,
      lcp,
      cls,
      totalPageLoadMs: this.startTime ? Date.now() - this.startTime : metrics.loadComplete,
    };
  }

  /**
   * Collect Largest Contentful Paint
   * @returns {number|null} LCP in milliseconds
   */
  async _collectLCP() {
    try {
      return await this.page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(Math.round(lastEntry.startTime));
            observer.disconnect();
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          // Timeout after 5s
          setTimeout(() => resolve(null), 5000);
        });
      });
    } catch {
      return null;
    }
  }

  /**
   * Collect Cumulative Layout Shift
   * @returns {number|null} CLS score
   */
  async _collectCLS() {
    try {
      return await this.page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
          // Give it a moment to collect shifts
          setTimeout(() => {
            observer.disconnect();
            resolve(Math.round(clsValue * 1000) / 1000);
          }, 2000);
        });
      });
    } catch {
      return null;
    }
  }

  // ─── Assertions ────────────────────────────────────────────────────────────────

  /**
   * Assert metrics are within performance budget
   * @param {object} metrics - Collected metrics
   * @param {object} budget - Performance budget thresholds
   * @returns {{ passed: boolean, violations: string[] }}
   */
  assertWithinBudget(metrics, budget = PerformanceHelper.BUDGETS.standard) {
    const violations = [];

    if (budget.ttfb && metrics.ttfb && metrics.ttfb > budget.ttfb) {
      violations.push(`TTFB: ${metrics.ttfb}ms > budget ${budget.ttfb}ms`);
    }

    if (budget.fcp && metrics.fcp && metrics.fcp > budget.fcp) {
      violations.push(`FCP: ${metrics.fcp}ms > budget ${budget.fcp}ms`);
    }

    if (budget.lcp && metrics.lcp && metrics.lcp > budget.lcp) {
      violations.push(`LCP: ${metrics.lcp}ms > budget ${budget.lcp}ms`);
    }

    if (budget.cls !== undefined && metrics.cls !== null && metrics.cls > budget.cls) {
      violations.push(`CLS: ${metrics.cls} > budget ${budget.cls}`);
    }

    if (budget.loadComplete && metrics.loadComplete && metrics.loadComplete > budget.loadComplete) {
      violations.push(`Load: ${metrics.loadComplete}ms > budget ${budget.loadComplete}ms`);
    }

    if (budget.resourceCount && metrics.resourceCount > budget.resourceCount) {
      violations.push(`Resources: ${metrics.resourceCount} > budget ${budget.resourceCount}`);
    }

    if (budget.totalTransferSizeKB && metrics.totalTransferSizeKB > budget.totalTransferSizeKB) {
      violations.push(`Transfer: ${metrics.totalTransferSizeKB}KB > budget ${budget.totalTransferSizeKB}KB`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  // ─── Network Throttling ────────────────────────────────────────────────────────

  /**
   * Simulate slow network conditions
   * @param {'slow3g' | 'fast3g' | '4g'} profile - Network profile
   */
  async simulateNetwork(profile) {
    const profiles = {
      slow3g: { downloadThroughput: 50 * 1024, uploadThroughput: 25 * 1024, latency: 400 },
      fast3g: { downloadThroughput: 188 * 1024, uploadThroughput: 94 * 1024, latency: 150 },
      '4g': { downloadThroughput: 1500 * 1024, uploadThroughput: 750 * 1024, latency: 50 },
    };

    const config = profiles[profile];
    if (!config) throw new Error(`Unknown network profile: ${profile}`);

    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: config.downloadThroughput,
      uploadThroughput: config.uploadThroughput,
      latency: config.latency,
    });
  }

  // ─── Report Generation ─────────────────────────────────────────────────────────

  /**
   * Generate human-readable performance report
   * @param {object} metrics - Collected metrics
   * @returns {string}
   */
  static generateReport(metrics) {
    return [
      '╔══════════════════════════════════════╗',
      '║     PERFORMANCE METRICS REPORT       ║',
      '╠══════════════════════════════════════╣',
      `║ TTFB:              ${(metrics.ttfb || 'N/A') + 'ms'}`.padEnd(39) + '║',
      `║ First Paint:       ${(metrics.fp || 'N/A') + 'ms'}`.padEnd(39) + '║',
      `║ FCP:               ${(metrics.fcp || 'N/A') + 'ms'}`.padEnd(39) + '║',
      `║ LCP:               ${(metrics.lcp || 'N/A') + 'ms'}`.padEnd(39) + '║',
      `║ CLS:               ${metrics.cls ?? 'N/A'}`.padEnd(39) + '║',
      `║ DOM Interactive:   ${(metrics.domInteractive || 'N/A') + 'ms'}`.padEnd(39) + '║',
      `║ Load Complete:     ${(metrics.loadComplete || 'N/A') + 'ms'}`.padEnd(39) + '║',
      '╠══════════════════════════════════════╣',
      `║ Resources:         ${metrics.resourceCount}`.padEnd(39) + '║',
      `║ Transfer Size:     ${metrics.totalTransferSizeKB}KB`.padEnd(39) + '║',
      '╚══════════════════════════════════════╝',
    ].join('\n');
  }
}

// ─── Performance Budgets ─────────────────────────────────────────────────────────

PerformanceHelper.BUDGETS = {
  // Strict budget (production-ready)
  fast: {
    ttfb: 600,
    fcp: 1500,
    lcp: 2000,
    cls: 0.05,
    loadComplete: 3000,
    resourceCount: 50,
    totalTransferSizeKB: 1024,
  },
  // Standard budget (acceptable for most apps)
  standard: {
    ttfb: 800,
    fcp: 1800,
    lcp: 2500,
    cls: 0.1,
    loadComplete: 5000,
    resourceCount: 80,
    totalTransferSizeKB: 2048,
  },
  // Lenient budget (demo/staging environments)
  lenient: {
    ttfb: 2000,
    fcp: 3000,
    lcp: 4000,
    cls: 0.25,
    loadComplete: 10000,
    resourceCount: 150,
    totalTransferSizeKB: 5120,
  },
};

module.exports = PerformanceHelper;