"use strict";

const { listSchemas } = require("../src/schemas");

describe("shared baseline", () => {
  test("listSchemas returns stable schema keys", () => {
    const keys = listSchemas();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys).toEqual(expect.arrayContaining(["telematics.v1", "stateUpdate.v1"]));
  });
});
