import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("../dist/config/env.config.js");

const devCfg = loadEnvConfig({
  APP_ENV: "development",
  DATABASE_URL: "postgresql://u:p@localhost:5432/royalshemsh_dev",
  REDIS_KEY_PREFIX: "dev:",
  ALLOW_SAMPLE_SEED: "true",
  ALLOW_TRADE_TESTS: "false",
});
assert.equal(devCfg.env, "development");
assert.equal(devCfg.allowSampleSeed, true);
assert.equal(devCfg.allowTradeTests, false);

const stgCfg = loadEnvConfig({
  APP_ENV: "staging",
  DATABASE_URL: "postgresql://u:p@localhost:5432/royalshemsh_staging",
  REDIS_KEY_PREFIX: "staging:",
  ALLOW_SAMPLE_SEED: "true",
  ALLOW_TRADE_TESTS: "true",
});
assert.equal(stgCfg.env, "staging");
assert.equal(stgCfg.allowSampleSeed, true);
assert.equal(stgCfg.allowTradeTests, true);

const prodCfg = loadEnvConfig({
  APP_ENV: "production",
  DATABASE_URL: "postgresql://u:p@prod-db:5432/royalshemsh_prod",
  REDIS_KEY_PREFIX: "prod:",
  ALLOW_SAMPLE_SEED: "false",
  ALLOW_TRADE_TESTS: "false",
});
assert.equal(prodCfg.env, "production");
assert.equal(prodCfg.allowSampleSeed, false);
assert.equal(prodCfg.allowTradeTests, false);

// Isolation failure checks
assert.throws(() =>
  loadEnvConfig({
    APP_ENV: "production",
    DATABASE_URL: "postgresql://u:p@localhost:5432/royalshemsh_staging",
    REDIS_KEY_PREFIX: "prod:",
    ALLOW_SAMPLE_SEED: "false",
    ALLOW_TRADE_TESTS: "false",
  })
);
assert.throws(() =>
  loadEnvConfig({
    APP_ENV: "production",
    DATABASE_URL: "postgresql://u:p@prod:5432/royalshemsh_prod",
    REDIS_KEY_PREFIX: "prod:",
    ALLOW_SAMPLE_SEED: "true",
    ALLOW_TRADE_TESTS: "false",
  })
);
assert.throws(() =>
  loadEnvConfig({
    APP_ENV: "production",
    DATABASE_URL: "postgresql://u:p@prod:5432/royalshemsh_prod",
    REDIS_KEY_PREFIX: "prod:",
    ALLOW_SAMPLE_SEED: "false",
    ALLOW_TRADE_TESTS: "true",
  })
);

console.log("ENV_ISOLATION_QA: PASS (dev, staging, production + 3 isolation guards)");
