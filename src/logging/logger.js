"use strict";

/**
 * Avoid logging huge objects / circular references.
 * @param {unknown} value
 * @param {number} depth
 * @returns {unknown}
 */
function safeCloneForLog(value, depth = 3) {
  const seen = new WeakSet();

  function inner(v, d) {
    if (d < 0) return "[MaxDepth]";
    if (v === null || v === undefined) return v;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "bigint") return v.toString();
    if (typeof v === "function") return "[Function]";
    if (typeof v !== "object") return String(v);

    if (seen.has(v)) return "[Circular]";
    seen.add(v);

    if (Array.isArray(v)) return v.slice(0, 50).map((x) => inner(x, d - 1));

    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      // Basic redaction patterns (avoid leaking secrets/tokens).
      if (/(authorization|token|secret|password|cookie)/i.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = inner(val, d - 1);
      }
    }
    return out;
  }

  return inner(value, depth);
}

const LEVELS = /** @type {const} */ ({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

/**
 * PUBLIC_INTERFACE
 * Create a structured JSON logger. This intentionally avoids external logging deps.
 * @param {{ serviceName: string, level?: "debug"|"info"|"warn"|"error" }} options
 * @returns {{ info: Function, warn: Function, error: Function, debug: Function }}
 */
function createLogger(options) {
  const serviceName = options?.serviceName || "unknown-service";
  const configuredLevel = options?.level || "info";
  const minLevel = LEVELS[configuredLevel] ?? LEVELS.info;

  /**
   * @param {"debug"|"info"|"warn"|"error"} level
   * @param {string} message
   * @param {Record<string, unknown>=} meta
   */
  function log(level, message, meta) {
    if ((LEVELS[level] ?? 99) < minLevel) return;

    const payload = {
      ts: new Date().toISOString(),
      level,
      service: serviceName,
      message,
      ...((meta && typeof meta === "object") ? safeCloneForLog(meta) : {}),
    };

    // Emit JSON line; stdout/stderr separation is common in container logging.
    const line = JSON.stringify(payload);
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }

  return {
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
    debug: (message, meta) => log("debug", message, meta),
  };
}

module.exports = { createLogger };
