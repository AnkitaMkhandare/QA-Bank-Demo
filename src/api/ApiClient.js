const { request } = require('@playwright/test');

/**
 * ApiClient — Base HTTP Client
 * 
 * Provides a reusable HTTP client using Playwright's built-in request API.
 * Supports authentication, request/response logging, and error handling.
 * 
 * Features:
 * - Token-based authentication
 * - Automatic JSON parsing
 * - Request/response logging
 * - Configurable timeouts
 * - Response validation
 * 
 * Usage:
 *   const client = new ApiClient(baseUrl);
 *   await client.authenticate('admin', 'admin123');
 *   const response = await client.get('/accounts');
 */

class ApiClient {
  /**
   * @param {string} baseUrl - API base URL
   * @param {object} [options] - Configuration options
   * @param {number} [options.timeout=30000] - Request timeout in ms
   * @param {boolean} [options.logRequests=true] - Enable request logging
   */
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 30000;
    this.logRequests = options.logRequests !== false;
    this.authToken = null;
    this.context = null;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────────

  /**
   * Initialize the API context (must be called before making requests)
   */
  async init() {
    this.context = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: this.defaultHeaders,
      timeout: this.timeout,
    });
    return this;
  }

  /**
   * Dispose the API context
   */
  async dispose() {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }

  // ─── Authentication ────────────────────────────────────────────────────────────

  /**
   * Authenticate and store token for subsequent requests
   * @param {string} username 
   * @param {string} password 
   * @returns {string} Auth token
   */
  async authenticate(username, password) {
    const response = await this.post('/auth/login', {
      username,
      password,
    });

    if (response.token) {
      this.authToken = response.token;
      this._log('AUTH', `Authenticated as ${username}`);
    }

    return response;
  }

  /**
   * Set authorization token manually
   * @param {string} token 
   */
  setToken(token) {
    this.authToken = token;
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────────────────

  /**
   * GET request
   * @param {string} endpoint - API endpoint path
   * @param {object} [params] - Query parameters
   * @returns {object} Parsed JSON response
   */
  async get(endpoint, params = {}) {
    return this._request('GET', endpoint, { params });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint path
   * @param {object} [body] - Request body
   * @returns {object} Parsed JSON response
   */
  async post(endpoint, body = {}) {
    return this._request('POST', endpoint, { body });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint path
   * @param {object} [body] - Request body
   * @returns {object} Parsed JSON response
   */
  async put(endpoint, body = {}) {
    return this._request('PUT', endpoint, { body });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint path
   * @param {object} [body] - Request body
   * @returns {object} Parsed JSON response
   */
  async patch(endpoint, body = {}) {
    return this._request('PATCH', endpoint, { body });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint path
   * @returns {object} Parsed JSON response
   */
  async delete(endpoint) {
    return this._request('DELETE', endpoint);
  }

  // ─── Raw Response (for status code validation) ─────────────────────────────────

  /**
   * Make request and return full response (status, headers, body)
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} [options] - Request options
   * @returns {{ status: number, headers: object, body: object }}
   */
  async rawRequest(method, endpoint, options = {}) {
    const response = await this._executeRequest(method, endpoint, options);
    const status = response.status();
    const headers = response.headers();
    let body = null;

    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    return { status, headers, body };
  }

  // ─── Private Methods ───────────────────────────────────────────────────────────

  async _request(method, endpoint, options = {}) {
    const response = await this._executeRequest(method, endpoint, options);
    const status = response.status();

    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    if (status >= 400) {
      const error = new Error(`API Error: ${method} ${endpoint} returned ${status}`);
      error.status = status;
      error.body = responseBody;
      this._log('ERROR', `${method} ${endpoint} → ${status}`, responseBody);
      throw error;
    }

    this._log('RESPONSE', `${method} ${endpoint} → ${status}`);
    return responseBody;
  }

  async _executeRequest(method, endpoint, options = {}) {
    if (!this.context) {
      await this.init();
    }

    const headers = { ...this.defaultHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const requestOptions = {
      headers,
      timeout: this.timeout,
    };

    if (options.body) {
      requestOptions.data = options.body;
    }

    if (options.params) {
      requestOptions.params = options.params;
    }

    this._log('REQUEST', `${method} ${this.baseUrl}${endpoint}`);

    switch (method.toUpperCase()) {
      case 'GET':
        return this.context.get(endpoint, requestOptions);
      case 'POST':
        return this.context.post(endpoint, requestOptions);
      case 'PUT':
        return this.context.put(endpoint, requestOptions);
      case 'PATCH':
        return this.context.patch(endpoint, requestOptions);
      case 'DELETE':
        return this.context.delete(endpoint, requestOptions);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  _log(level, message, data = null) {
    if (!this.logRequests) return;
    const timestamp = new Date().toISOString();
    const prefix = `[API][${level}][${timestamp}]`;
    if (data) {
      console.log(`${prefix} ${message}`, JSON.stringify(data).substring(0, 200));
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

module.exports = ApiClient;