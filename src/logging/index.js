"use strict";

const { createLogger } = require("./logger");
const { withCorrelationId, getCorrelationId, CORRELATION_ID_HEADER } = require("./correlation");

module.exports = {
  createLogger,
  withCorrelationId,
  getCorrelationId,
  CORRELATION_ID_HEADER,
};
