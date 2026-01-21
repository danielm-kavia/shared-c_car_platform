"use strict";

const assert = require("node:assert");

function main() {
  const shared = require("../src/index.js");

  // Logger existence
  const logger = shared.createLogger({ serviceName: "shared-test", level: "debug" });
  assert.equal(typeof logger.info, "function");

  // Correlation wrapper existence
  assert.equal(typeof shared.withCorrelationId, "function");

  // Schema validation basic check
  const okPayload = { schemaVersion: "v1", vehicleId: "VIN123", timestamp: new Date().toISOString(), speedKph: 10 };
  const resOk = shared.validateAgainstSchema(shared.schemas.telematics.v1, okPayload);
  assert.equal(resOk.ok, true);

  const badPayload = { schemaVersion: "v1", timestamp: new Date().toISOString() };
  const resBad = shared.validateAgainstSchema(shared.schemas.telematics.v1, badPayload);
  assert.equal(resBad.ok, false);
  assert.ok(resBad.errors.length > 0);

  // Auth token extractor
  assert.equal(shared.extractBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(shared.extractBearerToken("Basic abc"), undefined);

  // JwtValidator stub should decode structurally valid token (signature not verified)
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "user1", exp: Math.floor(Date.now() / 1000) + 60 })).toString("base64url");
  const token = `${header}.${payload}.`;
  return shared.createJwtValidator().validate(token).then((r) => {
    assert.equal(r.ok, true);
    assert.equal(r.payload.sub, "user1");
    // eslint-disable-next-line no-console
    console.log("test: ok");
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
