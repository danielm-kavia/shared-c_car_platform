"use strict";

const { AsyncLocalStorage } = require("node:async_hooks");
const { randomUUID } = require("node:crypto");

const storage = new AsyncLocalStorage();

const CORRELATION_ID_HEADER = "x-correlation-id";

/**
 * PUBLIC_INTERFACE
 * Returns current correlation id (if present) from async context.
 * @returns {string|undefined}
 */
function getCorrelationId() {
  return storage.getStore()?.correlationId;
}

/**
 * PUBLIC_INTERFACE
 * Wrap a handler so it runs within a correlation-id async context.
 *
 * This is framework-agnostic: it works with Node HTTP, Express-style handlers,
 * or any function receiving (req,res).
 *
 * @template TReq
 * @template TRes
 * @param {{ info: Function, warn: Function, error: Function, debug: Function }} logger
 * @param {(req: TReq, res: TRes) => any|Promise<any>} handler
 * @returns {(req: TReq, res: TRes) => Promise<any>}
 */
function withCorrelationId(logger, handler) {
  return async (req, res) => {
    const headerValue =
      (req && typeof req === "object" && req.headers && (req.headers[CORRELATION_ID_HEADER] || req.headers[CORRELATION_ID_HEADER.toLowerCase()])) ||
      undefined;

    const correlationId =
      (typeof headerValue === "string" && headerValue.trim().length > 0) ? headerValue.trim() : randomUUID();

    return await storage.run({ correlationId }, async () => {
      try {
        // Attach to response headers if possible.
        if (res && typeof res.setHeader === "function") {
          res.setHeader(CORRELATION_ID_HEADER, correlationId);
        }
      } catch (e) {
        // ignore header setting failures
      }

      // Provide correlationId to logs automatically if callers include getCorrelationId().
      logger.debug("Correlation context established", { correlationId });

      return await handler(req, res);
    });
  };
}

module.exports = { withCorrelationId, getCorrelationId, CORRELATION_ID_HEADER };
