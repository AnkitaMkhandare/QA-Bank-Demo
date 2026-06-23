/**
 * SchemaValidator — JSON Schema Validation Utility
 * 
 * Validates API responses against predefined JSON schemas.
 * Lightweight implementation without external dependencies.
 * 
 * Supports:
 * - Type checking (string, number, boolean, array, object, null)
 * - Required fields validation
 * - Nested object validation
 * - Array item type validation
 * - Enum validation
 * - Min/Max constraints
 * - Pattern matching (regex)
 * 
 * Usage:
 *   const validator = new SchemaValidator();
 *   const result = validator.validate(responseData, accountSchema);
 *   expect(result.valid).toBeTruthy();
 */

class SchemaValidator {
  constructor() {
    this.errors = [];
  }

  /**
   * Validate data against a JSON schema
   * @param {*} data - Data to validate
   * @param {object} schema - JSON Schema definition
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(data, schema) {
    this.errors = [];
    this._validateNode(data, schema, 'root');
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
    };
  }

  /**
   * Assert data matches schema (throws on failure)
   * @param {*} data - Data to validate
   * @param {object} schema - JSON Schema definition
   * @param {string} [context] - Context for error messages
   * @throws {Error} If validation fails
   */
  assertValid(data, schema, context = 'Response') {
    const result = this.validate(data, schema);
    if (!result.valid) {
      const errorList = result.errors.map(e => `  • ${e}`).join('\n');
      throw new Error(
        `${context} schema validation failed:\n${errorList}\n\nReceived: ${JSON.stringify(data, null, 2).substring(0, 500)}`
      );
    }
  }

  // ─── Private Validation Logic ──────────────────────────────────────────────────

  _validateNode(data, schema, path) {
    if (!schema) return;

    // Type validation
    if (schema.type) {
      this._validateType(data, schema.type, path);
    }

    // Null check
    if (data === null || data === undefined) {
      if (schema.nullable || schema.type === 'null') return;
      if (schema.required !== false) {
        this.errors.push(`${path}: Expected value but got ${data}`);
      }
      return;
    }

    // Enum validation
    if (schema.enum) {
      if (!schema.enum.includes(data)) {
        this.errors.push(`${path}: Value "${data}" not in enum [${schema.enum.join(', ')}]`);
      }
    }

    // String constraints
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        this.errors.push(`${path}: String length ${data.length} < minLength ${schema.minLength}`);
      }
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        this.errors.push(`${path}: String length ${data.length} > maxLength ${schema.maxLength}`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        this.errors.push(`${path}: String "${data}" does not match pattern "${schema.pattern}"`);
      }
    }

    // Number constraints
    if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        this.errors.push(`${path}: Value ${data} < minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        this.errors.push(`${path}: Value ${data} > maximum ${schema.maximum}`);
      }
      if (schema.type === 'integer' && !Number.isInteger(data)) {
        this.errors.push(`${path}: Expected integer but got ${data}`);
      }
    }

    // Object validation
    if (schema.type === 'object' && typeof data === 'object' && !Array.isArray(data)) {
      // Required fields
      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
          if (!(field in data)) {
            this.errors.push(`${path}: Missing required field "${field}"`);
          }
        }
      }

      // Property validation
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data) {
            this._validateNode(data[key], propSchema, `${path}.${key}`);
          }
        }
      }
    }

    // Array validation
    if (schema.type === 'array' && Array.isArray(data)) {
      if (schema.minItems !== undefined && data.length < schema.minItems) {
        this.errors.push(`${path}: Array length ${data.length} < minItems ${schema.minItems}`);
      }
      if (schema.maxItems !== undefined && data.length > schema.maxItems) {
        this.errors.push(`${path}: Array length ${data.length} > maxItems ${schema.maxItems}`);
      }
      if (schema.items) {
        data.forEach((item, index) => {
          this._validateNode(item, schema.items, `${path}[${index}]`);
        });
      }
    }
  }

  _validateType(data, expectedType, path) {
    if (data === null || data === undefined) return; // Handled by nullable/required

    const actualType = Array.isArray(data) ? 'array' : typeof data;
    const typeMap = {
      string: 'string',
      number: 'number',
      integer: 'number',
      boolean: 'boolean',
      object: 'object',
      array: 'array',
    };

    const expected = typeMap[expectedType];
    if (expected && actualType !== expected) {
      this.errors.push(`${path}: Expected type "${expectedType}" but got "${actualType}"`);
    }
  }
}

// ─── Pre-defined Schemas ─────────────────────────────────────────────────────────

SchemaValidator.schemas = {
  // Account response schema
  account: {
    type: 'object',
    required: ['id', 'name', 'type', 'balance'],
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      type: { type: 'string', enum: ['savings', 'checking', 'Savings', 'Checking'] },
      balance: { type: 'number', minimum: 0 },
    },
  },

  // Account list response schema
  accountList: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'name', 'type', 'balance'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        balance: { type: 'number' },
      },
    },
  },

  // Transaction response schema
  transaction: {
    type: 'object',
    required: ['id', 'type', 'amount', 'date'],
    properties: {
      id: { type: 'string', minLength: 1 },
      type: { type: 'string', enum: ['Deposit', 'Withdrawal', 'deposit', 'withdrawal'] },
      amount: { type: 'number', minimum: 0 },
      date: { type: 'string' },
      accountId: { type: 'string' },
      description: { type: 'string' },
    },
  },

  // Transaction list response schema
  transactionList: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'type', 'amount', 'date'],
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string' },
      },
    },
  },

  // Auth response schema
  authResponse: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', minLength: 1 },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          role: { type: 'string' },
        },
      },
    },
  },

  // Error response schema
  errorResponse: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string' },
      code: { type: 'string' },
      status: { type: 'integer' },
    },
  },
};

module.exports = SchemaValidator;