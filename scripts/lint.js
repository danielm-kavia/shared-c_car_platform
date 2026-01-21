"use strict";

/**
 * Minimal lint to avoid adding external dependencies in Phase 1.
 * Ensures Node can require the public entrypoint and that JSON schemas parse.
 */

const fs = require("node:fs");
const path = require("node:path");

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(1);
}

function main() {
  try {
    // Ensure entrypoint loads.
    // eslint-disable-next-line global-require
    require(path.join(process.cwd(), "src", "index.js"));
  } catch (e) {
    fail(`Failed to require src/index.js: ${e?.message || e}`);
  }

  // Ensure schemas are valid JSON.
  const schemaDir = path.join(process.cwd(), "src", "schemas", "v1");
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const full = path.join(schemaDir, f);
    try {
      JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (e) {
      fail(`Invalid JSON schema ${f}: ${e?.message || e}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log("lint: ok");
}

main();
