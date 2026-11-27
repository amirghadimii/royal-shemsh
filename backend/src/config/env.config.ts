export type AppEnvironment = "development" | "staging" | "production";

export interface AppEnvConfig {
  env: AppEnvironment;
  port: number;
  frontendOrigin: string;
  databaseUrl: string;
  redisUrl: string;
  redisKeyPrefix: string;
  allowSampleSeed: boolean;
  allowTradeTests: boolean;
}

const VALID_ENVS: readonly AppEnvironment[] = [
  "development",
  "staging",
  "production",
];

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === "true";
}

export function loadEnvConfig(
  source: Record<string, string | undefined> = process.env
): AppEnvConfig {
  const rawEnv = (
    source.APP_ENV ??
    (source.NODE_ENV === "production" ? "production" : "staging")
  ) as AppEnvironment;
  if (!VALID_ENVS.includes(rawEnv)) {
    throw new Error(
      `Invalid APP_ENV="${rawEnv}". Expected one of: ${VALID_ENVS.join(", ")}.`
    );
  }

  const databaseUrl =
    source.DATABASE_URL ??
    "postgresql://royalshemsh:royalshemsh_staging@localhost:5433/royalshemsh_staging?schema=public";
  const redisUrl = source.REDIS_URL ?? "redis://localhost:6379/1";
  const defaultPrefix =
    rawEnv === "production" ? "prod:" : rawEnv === "development" ? "dev:" : "staging:";
  const redisKeyPrefix = source.REDIS_KEY_PREFIX ?? defaultPrefix;

  const isProd = rawEnv === "production" || source.NODE_ENV === "production";
  const allowSampleSeed = parseBool(source.ALLOW_SAMPLE_SEED, !isProd);
  const allowTradeTests = parseBool(
    source.ALLOW_TRADE_TESTS,
    !isProd && rawEnv === "staging"
  );

  // Strict isolation guards: staging/sample data & trade tests can never reach production
  if (isProd) {
    if (allowSampleSeed) {
      throw new Error(
        "Isolation violation: ALLOW_SAMPLE_SEED must be false in production."
      );
    }
    if (allowTradeTests) {
      throw new Error(
        "Isolation violation: ALLOW_TRADE_TESTS is permitted only in staging."
      );
    }
    if (/staging|_dev\b/i.test(databaseUrl)) {
      throw new Error(
        "Isolation violation: production DATABASE_URL must not reference staging or dev databases."
      );
    }
    if (redisKeyPrefix.startsWith("staging:") || redisKeyPrefix.startsWith("dev:")) {
      throw new Error(
        "Isolation violation: production REDIS_KEY_PREFIX must not use staging or dev prefixes."
      );
    }
  }

  if (rawEnv !== "staging" && allowTradeTests) {
    throw new Error(
      `Isolation violation: ALLOW_TRADE_TESTS is only allowed in staging (current APP_ENV=${rawEnv}).`
    );
  }

  return {
    env: rawEnv,
    port: Number(source.BACKEND_PORT ?? 4001),
    frontendOrigin: source.FRONTEND_ORIGIN ?? "http://localhost:3000",
    databaseUrl,
    redisUrl,
    redisKeyPrefix,
    allowSampleSeed,
    allowTradeTests,
  };
}
