export type JsonObject = Record<string, any>;

export interface Logger {
  info(message: string, meta?: JsonObject): void;
  warn(message: string, meta?: JsonObject): void;
  error(message: string, meta?: JsonObject): void;
  debug(message: string, meta?: JsonObject): void;
}

export const CORRELATION_ID_HEADER: string;

// PUBLIC_INTERFACE
export function createLogger(options: { serviceName: string; level?: "debug" | "info" | "warn" | "error" }): Logger;

// PUBLIC_INTERFACE
export function withCorrelationId<TReq = any, TRes = any>(
  logger: Logger,
  handler: (req: TReq, res: TRes) => any | Promise<any>
): (req: TReq, res: TRes) => Promise<any>;

// PUBLIC_INTERFACE
export function getCorrelationId(): string | undefined;

export interface ValidationResult {
  ok: boolean;
  errors: Array<{ path: string; message: string }>;
}

// PUBLIC_INTERFACE
export function validateAgainstSchema(schema: JsonObject, payload: unknown): ValidationResult;

// PUBLIC_INTERFACE
export function listSchemas(): string[];

export const schemas: {
  telematics: { v1: JsonObject };
  stateUpdate: { v1: JsonObject };
  remoteCommand: { v1: JsonObject };
  commandAck: { v1: JsonObject };
};

export interface JwtValidationOptions {
  /** Expected issuer (iss). */
  issuer?: string;
  /** Expected audience (aud). */
  audience?: string | string[];
  /** Clock tolerance in seconds. */
  clockToleranceSeconds?: number;
}

export interface JwtValidationResult {
  ok: boolean;
  /** Decoded payload if ok; otherwise undefined. */
  payload?: JsonObject;
  /** Error code string for callers to map to HTTP status, etc. */
  errorCode?: string;
  /** Safe error message (no secrets). */
  errorMessage?: string;
}

export interface JwtValidator {
  // PUBLIC_INTERFACE
  validate(token: string, options?: JwtValidationOptions): Promise<JwtValidationResult>;
}

// PUBLIC_INTERFACE
export function createJwtValidator(): JwtValidator;

// PUBLIC_INTERFACE
export function extractBearerToken(authorizationHeader: string | undefined): string | undefined;

export interface SecurityHeadersOptions {
  serviceName: string;
  enabled?: boolean;
  enableCsp?: boolean;
  csp?: string;
  enableHsts?: boolean;
  hstsMaxAgeSeconds?: number;
  hstsIncludeSubDomains?: boolean;
  hstsPreload?: boolean;
  allowCrossOriginResourcePolicy?: "same-origin" | "same-site" | "cross-origin";
}

// PUBLIC_INTERFACE
export function createSecurityHeadersMiddleware(
  options: SecurityHeadersOptions
): (req: any, res: any, next: any) => void;

export interface RateLimitOptions {
  enabled?: boolean;
  windowSeconds?: number;
  maxRequests?: number;
  logger?: any;
}

// PUBLIC_INTERFACE
export function createRateLimitMiddleware(options: RateLimitOptions): (req: any, res: any, next: any) => void;

export const models: {
  TelemetryV1: any;
  StateUpdateV1: any;
  RemoteCommandV1: any;
  CommandAckV1: any;
};
