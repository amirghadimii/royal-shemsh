import assert from "node:assert/strict";

const BASE = "http://127.0.0.1:4001";

async function req(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: username, password }),
  });
  const data = await res.json();
  assert.equal(res.status, 200, `Expected 200 on login for ${username}, got ${res.status}: ${JSON.stringify(data)}`);
  assert.ok(data.token, `Missing token for ${username}`);
  return data;
}

async function main() {
  // 1. Unauthenticated -> 401
  for (const path of ["/admin/users", "/admin/settings", "/admin/sms-rules", "/commission/report", "/prices/history", "/board/products"]) {
    const r = await req(path);
    assert.equal(r.status, 401, `Expected 401 for unauthenticated ${path}, got ${r.status}`);
  }
  console.log("PASS: Unauthenticated endpoints return 401");

  // 2. ADMIN login + endpoints -> 200
  const adminLogin = await login("admin", "Royal@1405");
  assert.equal(adminLogin.user.role.code, "ADMIN");
  for (const path of ["/admin/users", "/admin/settings", "/admin/sms-rules", "/commission/report", "/prices/history", "/board/products"]) {
    const r = await req(path, adminLogin.token);
    assert.equal(r.status, 200, `Expected 200 for ADMIN ${path}, got ${r.status}`);
  }
  const adminBoard = await req("/board/products", adminLogin.token);
  assert.ok(Array.isArray(adminBoard.json.products), "Expected products array for ADMIN");
  assert.ok(adminBoard.json.products.length >= 7, `Expected >= 7 products for ADMIN, got ${adminBoard.json.products.length}`);
  console.log(`PASS: ADMIN accesses all admin/report/board endpoints (board count=${adminBoard.json.products.length})`);

  // 3. SYSTEM_MANAGER login + endpoints -> 200
  const mgrLogin = await login("shahin", "Manager@1405");
  assert.equal(mgrLogin.user.role.code, "SYSTEM_MANAGER");
  for (const path of ["/admin/users", "/admin/settings", "/admin/sms-rules", "/commission/report", "/prices/history", "/board/products"]) {
    const r = await req(path, mgrLogin.token);
    assert.equal(r.status, 200, `Expected 200 for SYSTEM_MANAGER ${path}, got ${r.status}`);
  }
  console.log("PASS: SYSTEM_MANAGER accesses all admin/report/board endpoints");

  // 4. Grouped REGULAR user -> 403 on admin/report, 200 with 7 products on board
  const parsianLogin = await login("parsian", "User@1405");
  assert.equal(parsianLogin.user.role.code, "REGULAR");
  for (const path of ["/admin/users", "/admin/settings", "/admin/sms-rules", "/commission/report", "/prices/history"]) {
    const r = await req(path, parsianLogin.token);
    assert.equal(r.status, 403, `Expected 403 for REGULAR ${path}, got ${r.status}`);
    assert.equal(r.json.message, "شما به این سرویس دسترسی ندارید");
  }
  const parsianBoard = await req("/board/products", parsianLogin.token);
  assert.equal(parsianBoard.status, 200);
  assert.equal(parsianBoard.json.products.length, 7, `Expected 7 group products for parsian, got ${parsianBoard.json.products.length}`);
  console.log("PASS: Grouped REGULAR (parsian) gets 403 on admin/report and 7 products on /board/products");

  // 5. Ungrouped REGULAR user -> 403 on admin/report, 200 with 0 products on board
  const kouroshLogin = await login("kourosh", "User@1405");
  assert.equal(kouroshLogin.user.role.code, "REGULAR");
  const kouroshUsers = await req("/admin/users", kouroshLogin.token);
  assert.equal(kouroshUsers.status, 403);
  const kouroshBoard = await req("/board/products", kouroshLogin.token);
  assert.equal(kouroshBoard.status, 200);
  assert.equal(kouroshBoard.json.products.length, 0, `Expected 0 products for ungrouped kourosh, got ${kouroshBoard.json.products.length}`);
  assert.deepEqual(kouroshBoard.json.products, []);
  console.log("PASS: Ungrouped REGULAR (kourosh) gets 403 on admin and 0 products on /board/products");

  console.log("B3_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
