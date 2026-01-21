"use strict";

/**
 * Shared models are represented as JSDoc typedefs and exported as "models"
 * for discoverability. Services can use them for documentation or TS inference
 * (when paired with src/index.d.ts).
 */

/**
 * @typedef {Object} TelemetryV1
 * @property {"v1"} schemaVersion
 * @property {string} vehicleId Vehicle identifier (VIN or platform vehicle id)
 * @property {string} timestamp ISO-8601 timestamp
 * @property {number=} speedKph
 * @property {number=} latitude
 * @property {number=} longitude
 * @property {number=} batteryPct
 * @property {number=} fuelPct
 */

/**
 * @typedef {Object} StateUpdateV1
 * @property {"v1"} schemaVersion
 * @property {string} vehicleId
 * @property {string} timestamp ISO-8601 timestamp
 * @property {Object} state
 * @property {number=} state.speedKph
 * @property {number=} state.batteryPct
 * @property {number=} state.fuelPct
 * @property {number=} state.latitude
 * @property {number=} state.longitude
 */

/**
 * @typedef {Object} RemoteCommandV1
 * @property {"v1"} schemaVersion
 * @property {string} commandId Unique command identifier (UUID recommended)
 * @property {string} vehicleId
 * @property {string} commandType e.g. "unlock"
 * @property {string} requestedAt ISO-8601 timestamp
 * @property {Object=} parameters Optional command parameters (command-specific)
 */

/**
 * @typedef {Object} CommandAckV1
 * @property {"v1"} schemaVersion
 * @property {string} commandId
 * @property {string} vehicleId
 * @property {string} status One of: "accepted" | "rejected" | "completed" | "failed"
 * @property {string} timestamp ISO-8601 timestamp
 * @property {string=} reason Optional reason for failure/rejection
 */

const models = {
  /** @type {TelemetryV1} */ TelemetryV1: undefined,
  /** @type {StateUpdateV1} */ StateUpdateV1: undefined,
  /** @type {RemoteCommandV1} */ RemoteCommandV1: undefined,
  /** @type {CommandAckV1} */ CommandAckV1: undefined,
};

module.exports = { models };
