"use strict";

const { X509Certificate } = require("node:crypto");

/**
 * PUBLIC_INTERFACE
 * Parse an X.509 PEM certificate and return basic metadata.
 *
 * This is useful for future phases where vehicles authenticate via mTLS and
 * services need to inspect subject/issuer/validity without external deps.
 *
 * @param {string} pem
 * @returns {{ subject: string, issuer: string, validFrom: string, validTo: string, fingerprint256: string }}
 */
function parseX509Certificate(pem) {
  const cert = new X509Certificate(pem);
  return {
    subject: cert.subject,
    issuer: cert.issuer,
    validFrom: cert.validFrom,
    validTo: cert.validTo,
    fingerprint256: cert.fingerprint256,
  };
}

module.exports = { parseX509Certificate };
