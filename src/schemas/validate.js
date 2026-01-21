"use strict";

/**
 * This is a deliberately small validator to avoid bringing heavy dependencies in Phase 1.
 * It implements a minimal subset of JSON Schema:
 * - type: "object" | "string" | "number" | "integer" | "boolean" | "array"
 * - required: string[]
 * - properties: {...}
 * - enum: any[]
 * - additionalProperties: boolean
 * - items (for arrays)
 *
 * NOTE: This is NOT a complete JSON Schema implementation.
 */

/**
 * @param {string} path
 * @param {string} message
 * @returns {{ path: string, message: string }}
 */
function err(path, message) {
  return { path, message };
}

/**
 * @param {any} schema
 * @param {any} value
 * @param {string} path
 * @returns {Array<{path: string, message: string}>}
 */
function validate(schema, value, path) {
  const errors = [];
  if (!schema || typeof schema !== "object") return [err(path, "Schema is invalid")];

  const type = schema.type;

  // Type checks
  if (type) {
    const ok =
      (type === "object" && value && typeof value === "object" && !Array.isArray(value)) ||
      (type === "array" && Array.isArray(value)) ||
      (type === "string" && typeof value === "string") ||
      (type === "number" && typeof value === "number" && Number.isFinite(value)) ||
      (type === "integer" && typeof value === "number" && Number.isInteger(value)) ||
      (type === "boolean" && typeof value === "boolean");
    if (!ok) return [err(path, `Expected type ${type}`)];
  }

  // Enum
  if (Array.isArray(schema.enum)) {
    const match = schema.enum.some((x) => x === value);
    if (!match) return [err(path, `Expected one of: ${schema.enum.join(", ")}`)];
  }

  // Object validation
  if (schema.type === "object") {
    const obj = value || {};
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const k of required) {
      if (!(k in obj)) errors.push(err(`${path}.${k}`, "Missing required property"));
    }

    const props = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
    for (const [k, propSchema] of Object.entries(props)) {
      if (k in obj) {
        errors.push(...validate(propSchema, obj[k], `${path}.${k}`));
      }
    }

    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(props));
      for (const k of Object.keys(obj)) {
        if (!allowed.has(k)) errors.push(err(`${path}.${k}`, "Additional property not allowed"));
      }
    }
  }

  // Array validation
  if (schema.type === "array") {
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        errors.push(...validate(schema.items, value[i], `${path}[${i}]`));
      }
    }
  }

  return errors;
}

/**
 * PUBLIC_INTERFACE
 * Validate a payload against a schema from this package.
 * @param {Record<string, any>} schema
 * @param {unknown} payload
 * @returns {{ ok: boolean, errors: Array<{ path: string, message: string }> }}
 */
function validateAgainstSchema(schema, payload) {
  const errors = validate(schema, payload, "$");
  return { ok: errors.length === 0, errors };
}

module.exports = { validateAgainstSchema };
