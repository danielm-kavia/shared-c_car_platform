"use strict";

/**
 * Decode a base64url string into utf8.
 * @param {string} input
 * @returns {string}
 */
function base64UrlDecodeToString(input) {
  const pad = input.length % 4;
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(normalized, "base64").toString("utf8");
}

/**
 * Naively decode JWT without verifying signature.
 * NOTE: This is NOT secure and is provided only as a Phase 1 stub.
 * @param {string} token
 * @returns {{ header: any, payload: any }}
 */
function decodeJwtUnsafe(token) {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("JWT must have at least two parts");
  }
  const header = JSON.parse(base64UrlDecodeToString(parts[0]));
  const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
  return { header, payload };
}

class JwtValidator {
  /**
   * PUBLIC_INTERFACE
   * Validate a JWT token.
   *
   * Phase 1 behavior:
   * - Performs basic structural checks and decodes payload.
   * - Validates exp/nbf/iat claims if present.
   * - Validates issuer/audience if requested.
   * - Does NOT validate signature (stub).
   *
   * @param {string} token
   * @param {{ issuer?: string, audience?: string|string[], clockToleranceSeconds?: number }=} options
   * @returns {Promise<{ ok: boolean, payload?: any, errorCode?: string, errorMessage?: string }>}
   */
  async validate(token, options) {
    try {
      if (!token || typeof token !== "string") {
        return { ok: false, errorCode: "invalid_token", errorMessage: "Token must be a string" };
      }

      const { payload } = decodeJwtUnsafe(token);

      const nowSeconds = Math.floor(Date.now() / 1000);
      const tolerance = Math.max(0, Number(options?.clockToleranceSeconds ?? 0));

      // Basic time-based checks.
      if (typeof payload?.nbf === "number" && nowSeconds + tolerance < payload.nbf) {
        return { ok: false, errorCode: "token_not_active", errorMessage: "Token is not active yet (nbf)" };
      }
      if (typeof payload?.exp === "number" && nowSeconds - tolerance >= payload.exp) {
        return { ok: false, errorCode: "token_expired", errorMessage: "Token is expired (exp)" };
      }

      // Optional issuer check.
      if (options?.issuer && payload?.iss !== options.issuer) {
        return { ok: false, errorCode: "invalid_issuer", errorMessage: "Token issuer (iss) does not match" };
      }

      // Optional audience check.
      if (options?.audience) {
        const expected = Array.isArray(options.audience) ? options.audience : [options.audience];
        const audClaim = payload?.aud;
        const audList = Array.isArray(audClaim) ? audClaim : (typeof audClaim === "string" ? [audClaim] : []);
        const okAud = expected.some((e) => audList.includes(e));
        if (!okAud) {
          return { ok: false, errorCode: "invalid_audience", errorMessage: "Token audience (aud) does not match" };
        }
      }

      // IMPORTANT: signature verification is NOT implemented in Phase 1.
      return { ok: true, payload };
    } catch (e) {
      return { ok: false, errorCode: "invalid_token", errorMessage: "Token could not be decoded" };
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * Factory to create a JwtValidator.
 * @returns {JwtValidator}
 */
function createJwtValidator() {
  return new JwtValidator();
}

module.exports = { JwtValidator, createJwtValidator };
