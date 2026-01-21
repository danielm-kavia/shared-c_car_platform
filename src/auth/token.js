"use strict";

/**
 * PUBLIC_INTERFACE
 * Extracts the Bearer token value from an Authorization header.
 * @param {string|undefined} authorizationHeader
 * @returns {string|undefined}
 */
function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== "string") return undefined;
  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token) return undefined;
  if (scheme.toLowerCase() !== "bearer") return undefined;
  return token.trim() || undefined;
}

module.exports = { extractBearerToken };
