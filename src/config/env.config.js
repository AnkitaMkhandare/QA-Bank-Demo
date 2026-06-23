/**
 * Environment Configuration
 * 
 * Centralized configuration management for multi-environment support.
 * Loads settings from environment variables with sensible defaults.
 * 
 * Supports: QA, Staging, Production environments
 * 
 * Usage:
 *   const { config } = require('../src/config/env.config');
 *   await page.goto(config.baseUrl);
 */

const path = require('path');

// ─── Environment Detection ───────────────────────────────────────────────────────

const ENVIRONMENT = process.env.TEST_ENV || 'qa';

// ─── Environment-Specific Configurations ─────────────────────────────────────────

const environments = {
  qa: {
    name: 'QA',
    baseUrl: 'https://qaplayground.com/bank',
    apiBaseUrl: 'https://qaplayground.com/api',
    timeout: 30000,
    retries: 1,
    credentials: {
      admin: { username: 'admin', password: 'admin123' },
      viewer: { username: 'viewer', password: 'viewer123' },
    },
  },
  staging: {
    name: 'Staging',
    baseUrl: process.env.STAGING_URL || 'https://staging.qaplayground.com/bank',
    apiBaseUrl: process.env.STAGING_API_URL || 'https://staging.qaplayground.com/api',
    timeout: 45000,
    retries: 2,
    credentials: {
      admin: { username: process.env.STAGING_ADMIN_USER || 'admin', password: process.env.STAGING_ADMIN_PASS || 'admin123' },
      viewer: { username: process.env.STAGING_VIEWER_USER || 'viewer', password: process.env.STAGING_VIEWER_PASS || 'viewer123' },
    },
  },
  production: {
    name: 'Production',
    baseUrl: process.env.PROD_URL || 'https://qaplayground.com/bank',
    apiBaseUrl: process.env.PROD_API_URL || 'https://qaplayground.com/api',
    timeout: 60000,
    retries: 3,
    credentials: {
      admin: { username: process.env.PROD_ADMIN_USER || 'admin', password: process.env.PROD_ADMIN_PASS || 'admin123' },
      viewer: { username: process.env.PROD_VIEWER_USER || 'viewer', password: process.env.PROD_VIEWER_PASS || 'viewer123' },
    },
  },
};

// ─── Resolved Configuration ──────────────────────────────────────────────────────

const envConfig = environments[ENVIRONMENT];

if (!envConfig) {
  throw new Error(`Unknown environment: "${ENVIRONMENT}". Available: ${Object.keys(environments).join(', ')}`);
}

// Override with environment variables if set
const config = {
  ...envConfig,
  environment: ENVIRONMENT,
  baseUrl: process.env.BASE_URL || envConfig.baseUrl,
  apiBaseUrl: process.env.API_BASE_URL || envConfig.apiBaseUrl,
  timeout: parseInt(process.env.TEST_TIMEOUT) || envConfig.timeout,
  retries: parseInt(process.env.TEST_RETRIES) || envConfig.retries,

  // Browser settings
  browser: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO) || 0,
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH) || 1920,
      height: parseInt(process.env.VIEWPORT_HEIGHT) || 1080,
    },
  },

  // Paths
  paths: {
    testData: path.resolve(__dirname, '../config/test-data'),
    reports: path.resolve(__dirname, '../../reports'),
    screenshots: path.resolve(__dirname, '../../test-results/screenshots'),
  },

  // Feature flags
  features: {
    enableScreenshots: process.env.ENABLE_SCREENSHOTS !== 'false',
    enableVideo: process.env.ENABLE_VIDEO !== 'false',
    enableTrace: process.env.ENABLE_TRACE !== 'false',
    debugMode: process.env.DEBUG === 'true',
  },
};

// ─── Helper Methods ──────────────────────────────────────────────────────────────

/**
 * Get credentials for a specific role
 * @param {'admin' | 'viewer'} role - User role
 * @returns {{ username: string, password: string }}
 */
function getCredentials(role = 'admin') {
  const creds = config.credentials[role];
  if (!creds) {
    throw new Error(`Unknown role: "${role}". Available: ${Object.keys(config.credentials).join(', ')}`);
  }
  return creds;
}

/**
 * Check if running in CI environment
 * @returns {boolean}
 */
function isCI() {
  return !!process.env.CI;
}

/**
 * Get full URL for a given path
 * @param {string} relativePath - Relative path (e.g., '/dashboard')
 * @returns {string}
 */
function getUrl(relativePath = '') {
  return `${config.baseUrl}${relativePath}`;
}

module.exports = {
  config,
  getCredentials,
  isCI,
  getUrl,
  ENVIRONMENT,
};