/**
 * DataTable - Reusable component for interacting with data tables
 * Provides sorting, filtering, row selection, and data extraction capabilities.
 * 
 * @class DataTable
 */
class DataTable {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} tableSelector - Root selector for the table element
   */
  constructor(page, tableSelector) {
    this.page = page;
    this.tableSelector = tableSelector;
    this.timeout = 10000;
  }

  // ─── Row Operations ────────────────────────────────────────────────────────────

  /**
   * Get total number of rows in the table body
   * @returns {Promise<number>}
   */
  async getRowCount() {
    const rows = this.page.locator(`${this.tableSelector} tbody tr`);
    const count = await rows.count();
    this._log('info', `Table row count: ${count}`);
    return count;
  }

  /**
   * Get a specific row by index (zero-based)
   * @param {number} index - Row index
   * @returns {import('@playwright/test').Locator}
   */
  getRow(index) {
    return this.page.locator(`${this.tableSelector} tbody tr`).nth(index);
  }

  /**
   * Get row containing specific text
   * @param {string} text - Text to search for in the row
   * @returns {import('@playwright/test').Locator}
   */
  getRowByText(text) {
    return this.page.locator(`${this.tableSelector} tbody tr:has-text("${text}")`);
  }

  /**
   * Get all rows
   * @returns {import('@playwright/test').Locator}
   */
  getAllRows() {
    return this.page.locator(`${this.tableSelector} tbody tr`);
  }

  // ─── Cell Operations ───────────────────────────────────────────────────────────

  /**
   * Get cell text by row index and column index
   * @param {number} rowIndex - Zero-based row index
   * @param {number} colIndex - Zero-based column index
   * @returns {Promise<string>}
   */
  async getCellText(rowIndex, colIndex) {
    const cell = this.page.locator(`${this.tableSelector} tbody tr`).nth(rowIndex).locator('td').nth(colIndex);
    const text = await cell.textContent();
    return text?.trim() || '';
  }

  /**
   * Get all text content from a specific column
   * @param {number} colIndex - Zero-based column index
   * @returns {Promise<string[]>}
   */
  async getColumnValues(colIndex) {
    const cells = this.page.locator(`${this.tableSelector} tbody tr td:nth-child(${colIndex + 1})`);
    const texts = await cells.allTextContents();
    return texts.map(t => t.trim());
  }

  /**
   * Get all text from a column by header name
   * @param {string} headerName - Column header text
   * @returns {Promise<string[]>}
   */
  async getColumnValuesByHeader(headerName) {
    // Find column index from header
    const headers = await this.getHeaders();
    const colIndex = headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
    if (colIndex === -1) {
      throw new Error(`Column header "${headerName}" not found. Available: ${headers.join(', ')}`);
    }
    return await this.getColumnValues(colIndex);
  }

  // ─── Header Operations ─────────────────────────────────────────────────────────

  /**
   * Get all table header texts
   * @returns {Promise<string[]>}
   */
  async getHeaders() {
    const headers = this.page.locator(`${this.tableSelector} thead th, ${this.tableSelector} th`);
    const texts = await headers.allTextContents();
    return texts.map(t => t.trim());
  }

  /**
   * Click on a column header (for sorting)
   * @param {string} headerName - Header text to click
   */
  async clickHeader(headerName) {
    const header = this.page.locator(`${this.tableSelector} th:has-text("${headerName}")`);
    await header.click();
    this._log('info', `Clicked header: "${headerName}"`);
  }

  // ─── Data Extraction ───────────────────────────────────────────────────────────

  /**
   * Get entire table data as array of objects
   * @returns {Promise<object[]>} Array of row objects keyed by header names
   */
  async getTableData() {
    const headers = await this.getHeaders();
    const rowCount = await this.getRowCount();
    const data = [];

    for (let i = 0; i < rowCount; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = await this.getCellText(i, j);
      }
      data.push(row);
    }

    this._log('info', `Extracted table data: ${data.length} rows`);
    return data;
  }

  /**
   * Get numeric values from a column (strips currency symbols)
   * @param {number} colIndex - Column index
   * @returns {Promise<number[]>}
   */
  async getNumericColumnValues(colIndex) {
    const texts = await this.getColumnValues(colIndex);
    return texts.map(t => parseFloat(t.replace(/[^0-9.-]/g, '')));
  }

  // ─── Sorting Verification ──────────────────────────────────────────────────────

  /**
   * Verify column is sorted in ascending order
   * @param {number} colIndex - Column index to verify
   * @param {'text' | 'number'} type - Data type for comparison
   * @returns {Promise<boolean>}
   */
  async isColumnSortedAscending(colIndex, type = 'text') {
    const values = type === 'number'
      ? await this.getNumericColumnValues(colIndex)
      : await this.getColumnValues(colIndex);

    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) return false;
    }
    this._log('info', `Column ${colIndex} is sorted ascending: true`);
    return true;
  }

  /**
   * Verify column is sorted in descending order
   * @param {number} colIndex - Column index to verify
   * @param {'text' | 'number'} type - Data type for comparison
   * @returns {Promise<boolean>}
   */
  async isColumnSortedDescending(colIndex, type = 'text') {
    const values = type === 'number'
      ? await this.getNumericColumnValues(colIndex)
      : await this.getColumnValues(colIndex);

    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) return false;
    }
    this._log('info', `Column ${colIndex} is sorted descending: true`);
    return true;
  }

  // ─── Row Actions ───────────────────────────────────────────────────────────────

  /**
   * Click a button/action within a specific row
   * @param {string} rowText - Text identifying the row
   * @param {string} actionSelector - Selector for the action element within the row
   */
  async clickRowAction(rowText, actionSelector) {
    const row = this.getRowByText(rowText);
    const action = row.locator(actionSelector);
    await action.waitFor({ state: 'visible', timeout: this.timeout });
    await action.click();
    this._log('info', `Clicked action "${actionSelector}" in row: "${rowText}"`);
  }

  /**
   * Double-click a cell for inline editing
   * @param {string} rowText - Text identifying the row
   * @param {string} cellSelector - Selector for the cell within the row
   */
  async doubleClickCell(rowText, cellSelector) {
    const row = this.getRowByText(rowText);
    const cell = row.locator(cellSelector).first();
    await cell.dblclick();
    this._log('info', `Double-clicked cell in row: "${rowText}"`);
  }

  // ─── Search/Filter ─────────────────────────────────────────────────────────────

  /**
   * Check if a row with specific text exists
   * @param {string} text - Text to search for
   * @returns {Promise<boolean>}
   */
  async hasRow(text) {
    const row = this.getRowByText(text);
    return await row.isVisible();
  }

  /**
   * Wait for table to have specific number of rows
   * @param {number} expectedCount - Expected row count
   * @param {number} [timeout] - Timeout in ms
   */
  async waitForRowCount(expectedCount, timeout = this.timeout) {
    await this.page.waitForFunction(
      ({ selector, count }) => {
        const rows = document.querySelectorAll(`${selector} tbody tr`);
        return rows.length === count;
      },
      { selector: this.tableSelector, count: expectedCount },
      { timeout }
    );
    this._log('info', `Table has ${expectedCount} rows`);
  }

  /**
   * Check if the table is empty
   * @returns {Promise<boolean>}
   */
  async isEmpty() {
    const count = await this.getRowCount();
    return count === 0;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────────

  _log(level, message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [DataTable] ${message}`;
    if (level === 'error') console.error(formatted);
    else if (level === 'debug' && process.env.DEBUG === 'true') console.log(formatted);
    else if (level !== 'debug') console.log(formatted);
  }
}

module.exports = DataTable;