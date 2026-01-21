"use strict";

const crypto = require("node:crypto");

/**
 * Parse boolean env-ish values safely.
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function parseBool(value, fallback) {
  if (value === undefined || value === null) return fallback;
  const v = String(value).toLowerCase().trim();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return fallback;
}

/**
 * Compute a conservative CSP string for API-only backends.
 * @param {{ enableCsp: boolean }} options
 * @returns {string|undefined}
 */
function buildCsp(options) {
  if (!options.enableCsp) return undefined;
  // API services usually don't serve HTML; keep CSP restrictive and harmless.
  // If a service serves UI, it can override via SECURITY_CSP env.
  return "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
}

/**
 * PUBLIC_INTERFACE
 * Create an Express middleware that sets basic security headers.
 *
 * Design goals:
 * - Non-breaking defaults for API-only services.
 * - Configurable via env-driven options.
 * - No external dependencies.
 *
 * @param {{
 *   serviceName: string,
 *   enabled?: boolean,
 *   enableCsp?: boolean,
 *   csp?: string,
 *   enableHsts?: boolean,
 *   hstsMaxAgeSeconds?: number,
 *   hstsIncludeSubDomains?: boolean,
 *   hstsPreload?: boolean,
 *   allowCrossOriginResourcePolicy?: "same-origin"|"same-site"|"cross-origin"
 * }} options
 * @returns {(req: any, res: any, next: Function) => void}
 */
function createSecurityHeadersMiddleware(options) {
  const enabled = options.enabled !== undefined ? Boolean(options.enabled) : true;

  const enableCsp = options.enableCsp !== undefined ? Boolean(options.enableCsp) : false;
  const csp = options.csp || buildCsp({ enableCsp });

  const enableHsts = options.enableHsts !== undefined ? Boolean(options.enableHsts) : false;
  const hstsMaxAgeSeconds = Math.max(0, Number(options.hstsMaxAgeSeconds ?? 15552000)); // 180d default
  const hstsIncludeSubDomains = options.hstsIncludeSubDomains !== undefined ? Boolean(options.hstsIncludeSubDomains) : true;
  const hstsPreload = options.hstsPreload !== undefined ? Boolean(options.hstsPreload) : false;

  const corp = options.allowCrossOriginResourcePolicy || "same-origin";

  return function securityHeaders(req, res, next) {
    if (!enabled) return next();

    try {
      // Baselines
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-DNS-Prefetch-Control", "off");

      // Cross-origin isolation controls; safe for APIs.
      res.setHeader("Cross-Origin-Resource-Policy", corp);

      // Permissions-Policy is a replacement for Feature-Policy; disable common powerful features.
      res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()"
      );

      if (csp) {
        res.setHeader("Content-Security-Policy", csp);
      }

      if (enableHsts) {
        const parts = [`max-age=${hstsMaxAgeSeconds}`];
        if (hstsIncludeSubDomains) parts.push("includeSubDomains");
        if (hstsPreload) parts.push("preload");
        res.setHeader("Strict-Transport-Security", parts.join("; "));
      }
    } catch (_) {
      // ignore header-setting failures
    }

    return next();
  };
}

/**
 * Create a stable client identifier for lightweight rate limiting.
 * @param {any} req
 * @returns {string}
 */
function getClientKey(req) {
  // Prefer trusted upstream headers if present; do not fully trust them by default.
  const xff = req?.headers?.["x-forwarded-for"];
  const ipFromXff = typeof xff === "string" ? xff.split(",")[0].trim() : undefined;
  const ip = ipFromXff || req?.ip || req?.socket?.remoteAddress || "unknown-ip";
  const ua = typeof req?.headers?.["user-agent"] === "string" ? req.headers["user-agent"] : "unknown-ua";

  // Hash to avoid storing raw UA/IP in memory map keys.
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

/**
 * PUBLIC_INTERFACE
 * Create an Express middleware implementing a small in-memory fixed-window rate limiter.
 *
 * Notes:
 * - This is NOT a replacement for a gateway/WAF rate limiter.
 * - Intended as a safe stub for preview/dev and for basic abuse protection.
 * - When disabled, it is a no-op.
 *
 * @param {{
 *   enabled?: boolean,
 *   windowSeconds?: number,
 *   maxRequests?: number,
 *   logger?: any
 * }} options
 * @returns {(req: any, res: any, next: Function) => void}
 */
function createRateLimitMiddleware(options) {
  const enabled = options.enabled !== undefined ? Boolean(options.enabled) : false;
  const windowSeconds = Math.max(1, Number(options.windowSeconds ?? 60));
  const maxRequests = Math.max(1, Number(options.maxRequests ?? 100));
  const logger = options.logger;

  /** @type {Map<string, { windowStart: number, count: number }>} */
  const buckets = new Map();

  // Cheap periodic cleanup to keep map bounded.
  const cleanupIntervalMs = Math.max(10_000, Math.min(60_000, windowSeconds * 1000));
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - windowSeconds * 1000 * 2;
    for (const [k, v] of buckets.entries()) {
      if (v.windowStart < cutoff) buckets.delete(k);
    }
  }, cleanupIntervalMs).unref?.();

  return function rateLimit(req, res, next) {
    if (!enabled) return next();

    try {
      const now = Date.now();
      const key = getClientKey(req);

      const existing = buckets.get(key);
      if (!existing || now - existing.windowStart >= windowSeconds * 1000) {
        buckets.set(key, { windowStart: now, count: 1 });
        return next();
      }

      existing.count += 1;
      if (existing.count > maxRequests) {
        res.setHeader("Retry-After", String(windowSeconds));
        return res.status(429).json({ ok: false, error: "rate_limited" });
      }

      return next();
    } catch (e) {
      logger?.warn?.("Rate limit middleware error (allowing request)", { error: String(e?.message || e) });
      return next();
    }
  };
}

module.exports = {
  createSecurityHeadersMiddleware,
  createRateLimitMiddleware,
  // exported for tests/debugging if needed later
  _internal: { parseBool },
};
