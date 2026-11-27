import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { io } = require(path.resolve(__dirname, "../../node_modules/socket.io-client"));

const BASE = "http://127.0.0.1:4001";

async function login(identifier, password, extraHeaders = {}) {
  const res = await fetch(`${BASE}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify({ identifier, password }),
  });
  return { status: res.status, data: await res.json() };
}

async function api(urlPath, token, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${urlPath}`, { ...opts, headers });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, headers: res.headers, json };
}

async function main() {
  // 1. Production guards
  let seedBlocked = false;
  try {
    execFileSync("node", [path.resolve(__dirname, "../prisma/seed.mjs")], {
      env: { ...process.env, NODE_ENV: "production", APP_ENV: "staging", ALLOW_SAMPLE_SEED: "true" },
      stdio: "pipe",
    });
  } catch (err) {
    const stderr = err.stderr?.toString() || "";
    if (stderr.includes("Refusing to run sample seed")) {
      seedBlocked = true;
    }
  }
  assert.ok(seedBlocked, "Sample seed must be blocked when NODE_ENV=production");

  // Prove env.config rejects production + ALLOW_SAMPLE_SEED=true and AuthService suppresses OTP log when NODE_ENV=production
  const { loadEnvConfig } = await import(
    pathToFileURL(path.resolve(__dirname, "../dist/config/env.config.js")).href
  );
  assert.throws(
    () => loadEnvConfig({ NODE_ENV: "production", ALLOW_SAMPLE_SEED: "true" }),
    /Isolation violation/
  );
  const { AuthService } = await import(
    pathToFileURL(path.resolve(__dirname, "../dist/auth/auth.service.js")).href
  );
  const origEnv = { ...process.env };
  process.env.NODE_ENV = "production";
  process.env.APP_ENV = "production";
  process.env.ALLOW_SAMPLE_SEED = "false";
  process.env.ALLOW_TRADE_TESTS = "false";
  process.env.DATABASE_URL = "postgresql://prod:prod@localhost:5433/royalshemsh_prod";
  process.env.REDIS_KEY_PREFIX = "prod:";
  const loggedMessages = [];
  const fakePrisma = {
    user: {
      findFirst: async () => ({ id: "u1", mobile: "09120000001", isActive: true }),
      findUnique: async () => ({ id: "u1", mobile: "09120000001", isActive: true }),
    },
  };
  const fakeRedis = { get: async () => null, set: async () => {} };
  const fakeAuth = new AuthService(fakePrisma, fakeRedis);
  fakeAuth.logger = { log: (m) => loggedMessages.push(m), warn: () => {}, error: () => {} };
  await fakeAuth.requestOtp("09120000001");
  process.env = origEnv;
  assert.equal(
    loggedMessages.some((m) => String(m).includes("[STAGING OTP]")),
    false,
    "OTP code must NEVER be logged when NODE_ENV=production"
  );
  console.log("PASS: Production guards block sample seed and OTP logging when NODE_ENV=production");

  // 2. Security headers & CORS
  const okCors = await fetch(`${BASE}/board/status`, {
    headers: { Origin: "https://amirghadimii.github.io" },
  });
  assert.equal(okCors.status, 200);
  assert.equal(
    okCors.headers.get("access-control-allow-origin"),
    "https://amirghadimii.github.io"
  );
  assert.equal(okCors.headers.get("x-content-type-options"), "nosniff");
  assert.equal(okCors.headers.get("x-frame-options"), "DENY");
  assert.equal(okCors.headers.get("x-powered-by"), null);

  const badCors = await fetch(`${BASE}/board/status`, {
    headers: { Origin: "https://evil-untrusted.example.com" },
  });
  assert.equal(badCors.headers.get("access-control-allow-origin"), null);
  console.log("PASS: Security headers present & CORS restricted to app origins");

  // 3. Rate limit on /auth/* (use isolated x-forwarded-for IP so other tests aren't affected)
  let hit429 = false;
  for (let i = 0; i < 105; i++) {
    const r = await fetch(`${BASE}/auth/me`, {
      headers: { "x-forwarded-for": `198.51.100.${Math.floor(Date.now() / 60000) % 200}` },
    });
    if (r.status === 429) {
      hit429 = true;
      break;
    }
  }
  assert.ok(hit429, "General /auth/* rate limit must return 429 after exceeding threshold");
  console.log("PASS: /auth/* rate limit enforced (429 returned)");

  // Login admin & parsian
  const adminRes = await login("admin", "Royal@1405");
  const adminToken = adminRes.data.token;
  const parsianRes = await login("parsian", "User@1405");
  const parsianToken = parsianRes.data.token;

  // 4. Request-body validation on write endpoints -> 400
  const invalidPayloads = [
    ["/auth/login-password", null, {}],
    ["/orders", parsianToken, []],
    ["/orders", parsianToken, {}],
    ["/preorders", parsianToken, {}],
    ["/admin/products", adminToken, {}],
    ["/admin/messages", adminToken, {}],
    ["/admin/users", adminToken, {}],
  ];
  for (const [ep, tok, body] of invalidPayloads) {
    const res = await api(ep, tok, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(
      res.status,
      400,
      `Expected 400 for invalid body on ${ep}, got ${res.status}`
    );
  }
  console.log("PASS: Invalid request bodies rejected with 400 across write endpoints");

  // 5. Shadow Mode proof (true -> no trade/ledger; false -> normal posting)
  const board = await api("/board/products", parsianToken);
  const prod = board.json.products.find((p) => p.isActive);
  assert.ok(prod, "Active product required");
  const qty = String(Math.max(1, Number(prod.minOrder ?? 1)));

  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: prod.buyPrice,
      sellPrice: prod.sellPrice,
    }),
  });

  // Enable shadow mode
  await api("/admin/settings", adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shadowMode: true }),
  });

  const accBefore = await api("/accounting/mine", parsianToken);
  const tradesBefore = await api("/trades", adminToken);

  const shadowOrder = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: qty }),
  });
  assert.equal(shadowOrder.status, 201);
  const shadowApprove = await api(
    `/orders/${shadowOrder.json.order.id}/approve`,
    adminToken,
    { method: "POST" }
  );
  assert.equal(shadowApprove.status, 200);
  assert.equal(shadowApprove.json.shadowMode, true);
  assert.equal(shadowApprove.json.trade, null);

  const accAfterShadow = await api("/accounting/mine", parsianToken);
  const tradesAfterShadow = await api("/trades", adminToken);
  assert.equal(accAfterShadow.json.rialBalance, accBefore.json.rialBalance);
  assert.equal(accAfterShadow.json.goldGramsBalance, accBefore.json.goldGramsBalance);
  assert.equal(tradesAfterShadow.json.trades.length, tradesBefore.json.trades.length);

  const shadowLogs = await api("/admin/shadow-logs", adminToken);
  assert.ok(
    shadowLogs.json.logs.some(
      (l) => l.orderId === shadowOrder.json.order.id && l.action === "ORDER_SUBMIT"
    )
  );
  assert.ok(
    shadowLogs.json.logs.some(
      (l) => l.orderId === shadowOrder.json.order.id && l.action === "ORDER_APPROVE"
    )
  );
  console.log("PASS: SHADOW_MODE=true recorded shadow logs with 0 trades & 0 balance change");

  // Disable shadow mode -> normal posting resumes
  await api("/admin/settings", adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shadowMode: false }),
  });

  const realOrder = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: qty }),
  });
  assert.equal(realOrder.status, 201);
  const realApprove = await api(
    `/orders/${realOrder.json.order.id}/approve`,
    adminToken,
    { method: "POST" }
  );
  assert.equal(realApprove.status, 200);
  assert.ok(realApprove.json.trade?.id, "Normal trade must be created when SHADOW_MODE=false");
  const tradesAfterReal = await api("/trades", adminToken);
  assert.equal(tradesAfterReal.json.trades.length, tradesBefore.json.trades.length + 1);
  console.log("PASS: SHADOW_MODE=false resumed normal trade + ledger posting");

  // 6. Load sanity: 50 concurrent sockets + 100 order submissions
  const sockets = [];
  const socketStart = Date.now();
  await Promise.all(
    Array.from({ length: 50 }, () => {
      return new Promise((resolve, reject) => {
        const s = io(BASE, {
          auth: { token: parsianToken },
          transports: ["websocket"],
        });
        sockets.push(s);
        const timer = setTimeout(() => reject(new Error("Socket timeout")), 8000);
        s.on("connect", () => {
          clearTimeout(timer);
          resolve();
        });
        s.on("connect_error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    })
  );
  const socketConnectMs = Date.now() - socketStart;
  for (const s of sockets) s.disconnect();
  console.log(`LOAD_SOCKETS: 50/50 connected in ${socketConnectMs}ms (0 errors)`);

  // Refresh price tick before 100 orders
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: prod.buyPrice,
      sellPrice: prod.sellPrice,
    }),
  });

  const latencies = [];
  let orderErrors = 0;
  const loadStart = Date.now();
  // Run 100 order submissions in 10 batches of 10 concurrent requests
  for (let b = 0; b < 10; b++) {
    await Promise.all(
      Array.from({ length: 10 }, async () => {
        const t0 = Date.now();
        const r = await api("/orders", parsianToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: qty }),
        });
        latencies.push(Date.now() - t0);
        if (r.status !== 201) orderErrors++;
      })
    );
  }
  const loadTotalMs = Date.now() - loadStart;
  latencies.sort((a, b) => a - b);
  const avgMs = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length);
  const p95Ms = latencies[Math.floor(latencies.length * 0.95)];
  const maxMs = latencies[latencies.length - 1];
  console.log(
    `LOAD_ORDERS: 100 orders in ${loadTotalMs}ms | errors=${orderErrors} | avg=${avgMs}ms p95=${p95Ms}ms max=${maxMs}ms`
  );
  assert.equal(orderErrors, 0, "Expected 0 errors across 100 staging order submissions");

  console.log("B13_HARDENING_AND_LOAD_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
