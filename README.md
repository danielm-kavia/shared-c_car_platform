# shared-c_car_platform

Shared models/schemas/utilities package for the Connected Car Platform.

Phase 1 provides:
- **Schemas**: versioned JSON-schema contracts (telemetry, state updates, remote commands, acknowledgements)
- **Models**: shared DTO/type definitions (JSDoc + TS-friendly structure)
- **Auth utilities (stubs)**: JWT validation interfaces + X.509 certificate parsing helpers (no secrets, no external dependencies)
- **Logging**: structured JSON logger with correlation IDs

This library is intentionally lightweight and avoids introducing external service dependencies or secrets.

## Install / Use (local dev)

From a service repo, you can depend on this shared folder in two common ways:

### Option A: Workspace / monorepo install (recommended when available)
If your service uses workspaces, add `"shared-c_car_platform"` as a workspace dependency.

### Option B: Local file dependency (works everywhere)
In a service `package.json`:
```json
{
  "dependencies": {
    "@connected-car/shared": "file:../shared-c_car_platform"
  }
}
```

Then in code:
```js
const { createLogger, withCorrelationId } = require("@connected-car/shared");
```

## Library layout

- `src/index.js` exports all public APIs.
- `src/schemas/**` JSON schemas and a small schema registry.
- `src/models/**` shared model/type definitions.
- `src/auth/**` auth helpers (stubs / interfaces).
- `src/logging/**` structured logger + correlation IDs.

## Minimal examples

### Logging with correlation ID
```js
const { createLogger, withCorrelationId } = require("@connected-car/shared");

const logger = createLogger({ serviceName: "telematics-ingestion" });

const handler = withCorrelationId(logger, async (req, res) => {
  logger.info("Request received", { path: req.url });
  res.end("ok");
});
```

### Validate a payload with JSON Schema
```js
const { validateAgainstSchema, schemas } = require("@connected-car/shared");

const payload = { schemaVersion: "v1", vehicleId: "VIN123", timestamp: new Date().toISOString(), speedKph: 10 };

const result = validateAgainstSchema(schemas.telematics.v1, payload);
if (!result.ok) {
  // result.errors contains validation details
  console.error(result.errors);
}
```

## Local development (shared library)
```bash
npm install
npm run lint
npm test
```

## Environment
This repo includes a `.env.example` for consistency with other containers, but **the shared library itself does not require environment variables**.
- `.env.example` -> `.env` is optional and not used by library code in Phase 1.
