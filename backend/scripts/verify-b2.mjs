import assert from "node:assert/strict";
import { execSync, spawn } from "node:child_process";
import Redis from "ioredis";

const API = "http://127.0.0.1:4001";
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379/1");
const prefix = process.env.REDIS_KEY_PREFIX ?? "staging:";

async function clearAuthKeys() {
  const keys = await redis.keys(`${prefix}auth:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

await clearAuthKeys();

const server = spawn(
  process.execPath,
  ["--env-file=.env.staging", "dist/main.js"],
  {
    env: { ...process.env, OTP_TTL_SECONDS: "2" },
    stdio: ["ignore", "pipe", "pipe"],
  }
);

const logs = [];
server.stdout.on("data", (d) => logs.push(d.toString()));
server.stderr.on("data", (d) => logs.push(d.toString()));

try {
  // Wait for NestApplication started log
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Backend start timeout")), 15000);
    const onData = (d) => {
      if (d.toString().includes("Nest application successfully started")) {
        clearTimeout(t);
        resolve();
      }
    };
    server.stdout.on("data", onData);
  });

  // 1. Protected endpoint without session -> 401
  const unauthRes = await fetch(`${API}/auth/me`);
  assert.equal(unauthRes.status, 401, "Expected 401 without session");

  // 2. OTP request -> logged code in staging stdout
  const otpReqRes = await fetch(`${API}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "۰۹۱۲۰۰۰۰۰۰۱" }),
  });
  assert.equal(otpReqRes.status, 200);
  await new Promise((r) => setTimeout(r, 150));

  const logText = logs.join("");
  const match = logText.match(/\[STAGING OTP\] mobile=09120000001 code=(\d{6})/);
  assert.ok(match, "Expected [STAGING OTP] code in backend log");
  const otpCode = match[1];

  // 3. Wrong OTP rejected -> 401
  const wrongOtpRes = await fetch(`${API}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "09120000001", code: "000000" }),
  });
  assert.equal(wrongOtpRes.status, 401, "Expected 401 for wrong OTP");

  // 4. Valid OTP -> 200, session works on /auth/me
  const verifyRes = await fetch(`${API}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "09120000001", code: otpCode }),
  });
  assert.equal(verifyRes.status, 200);
  const verifyBody = await verifyRes.json();
  assert.ok(verifyBody.token);
  assert.equal(verifyBody.user.fullName, "امیر قدیمی");
  assert.equal(verifyBody.user.role.code, "ADMIN");

  const meRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${verifyBody.token}` },
  });
  assert.equal(meRes.status, 200);
  const meBody = await meRes.json();
  assert.equal(meBody.user.username, "admin");

  // 5. Logout invalidates session -> subsequent /auth/me returns 401
  const logoutRes = await fetch(`${API}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${verifyBody.token}` },
  });
  assert.equal(logoutRes.status, 200);

  const afterLogoutRes = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${verifyBody.token}` },
  });
  assert.equal(afterLogoutRes.status, 401, "Expected 401 after logout");

  // 6. Expired OTP rejected -> 401 (OTP_TTL_SECONDS=2)
  const expReq = await fetch(`${API}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "09120000001" }),
  });
  assert.equal(expReq.status, 200);
  await new Promise((r) => setTimeout(r, 2500));
  const allLogs = logs.join("");
  const expMatches = [...allLogs.matchAll(/\[STAGING OTP\] mobile=09120000001 code=(\d{6})/g)];
  const expCode = expMatches[expMatches.length - 1][1];
  const expVerifyRes = await fetch(`${API}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "09120000001", code: expCode }),
  });
  assert.equal(expVerifyRes.status, 401, "Expected 401 for expired OTP");

  // 7. Admin password login works
  const pwRes = await fetch(`${API}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin", password: "Royal@1405" }),
  });
  assert.equal(pwRes.status, 200);
  const pwBody = await pwRes.json();
  assert.equal(pwBody.user.role.code, "ADMIN");

  // 8. Wrong password rejected (401) + rate limit / lockout after 5 failures -> 429
  let got401 = false;
  let got429 = false;
  for (let i = 0; i < 6; i++) {
    const failRes = await fetch(`${API}/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "admin", password: "WrongPassword!" }),
    });
    if (failRes.status === 401) got401 = true;
    if (failRes.status === 429) got429 = true;
  }
  assert.ok(got401, "Expected 401 for wrong password");
  assert.ok(got429, "Expected 429 lockout after repeated failed attempts");

  await clearAuthKeys();

  console.log(
    JSON.stringify(
      {
        status: "B2_API_QA_PASS",
        checks: {
          unauthReturns401: true,
          otpLoggedAndVerified: true,
          wrongOtpRejected401: true,
          expiredOtpRejected401: true,
          meReturnsUserAndRole: true,
          logoutInvalidatesSession401: true,
          adminPasswordLoginWorks: true,
          wrongPassword401AndLockout429: true,
        },
      },
      null,
      2
    )
  );
} catch (err) {
  console.error("B2_API_QA_FAIL:", err);
  process.exitCode = 1;
} finally {
  await redis.quit();
  if (server.pid) {
    try {
      execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: "ignore" });
    } catch {}
  }
}
