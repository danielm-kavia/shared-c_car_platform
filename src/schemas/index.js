"use strict";

const telematicsV1 = require("./v1/telematics.v1.schema.json");
const stateUpdateV1 = require("./v1/state-update.v1.schema.json");
const remoteCommandV1 = require("./v1/remote-command.v1.schema.json");
const commandAckV1 = require("./v1/command-ack.v1.schema.json");

const { validateAgainstSchema } = require("./validate");

const schemas = {
  telematics: { v1: telematicsV1 },
  stateUpdate: { v1: stateUpdateV1 },
  remoteCommand: { v1: remoteCommandV1 },
  commandAck: { v1: commandAckV1 },
};

/**
 * PUBLIC_INTERFACE
 * List schema keys available in this package (stable strings for debugging/docs).
 * @returns {string[]}
 */
function listSchemas() {
  return [
    "telematics.v1",
    "stateUpdate.v1",
    "remoteCommand.v1",
    "commandAck.v1",
  ];
}

module.exports = { schemas, listSchemas, validateAgainstSchema };
