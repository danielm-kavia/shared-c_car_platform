"use strict";

const { createLogger, withCorrelationId, getCorrelationId, CORRELATION_ID_HEADER } = require("./logging");
const { validateAgainstSchema, schemas, listSchemas } = require("./schemas");
const { JwtValidator, createJwtValidator, extractBearerToken } = require("./auth");
const { createSecurityHeadersMiddleware, createRateLimitMiddleware } = require("./security");
const { models } = require("./models");

module.exports = {
  // Logging
  createLogger,
  withCorrelationId,
  getCorrelationId,
  CORRELATION_ID_HEADER,

  // Schemas
  validateAgainstSchema,
  schemas,
  listSchemas,

  // Auth
  JwtValidator,
  createJwtValidator,
  extractBearerToken,

  // Security (Express middleware)
  createSecurityHeadersMiddleware,
  createRateLimitMiddleware,

  // Models (DTOs/types as JSDoc/TS-friendly)
  models,
};
