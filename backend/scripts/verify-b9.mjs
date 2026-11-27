import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { io } = require(path.resolve(process.cwd(), "node_modules/socket.io-client"));

const BASE = "http://127.0.0.1:4001";

async function login(identifier, password) {
  const res = await fetch(`${BASE}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  return { status: res.status, data: await res.json() };
}

async function api(urlPath, token, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${urlPath}`, { ...opts, headers });
  return { status: res.status, json: await res.json() };
}

async function main() {
  const adminRes = await login("admin", "Royal@1405");
  const adminToken = adminRes.data.token;

  const parsianRes = await login("parsian", "User@1405");
  const parsianToken = parsianRes.data.token;

  const adminSock = io(BASE, {
    auth: { token: adminToken },
    transports: ["websocket"],
    reconnection: false,
  });
  const parsianSock = io(BASE, {
    auth: { token: parsianToken },
    transports: ["websocket"],
    reconnection: false,
  });

  await Promise.all([
    new Promise((res) => adminSock.once("connected", res)),
    new Promise((res) => parsianSock.once("connected", res)),
  ]);

  const adminUpdates = [];
  const parsianUpdates = [];
  adminSock.on("order:updated", (e) => adminUpdates.push(e));
  parsianSock.on("order:updated", (e) => parsianUpdates.push(e));

  const parsianBoard = await api("/board/products", parsianToken);
  const prod = parsianBoard.json.products[0];

  // Ensure fresh tick
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: prod.buyPrice,
      sellPrice: prod.sellPrice,
    }),
  });

  // 1. Submit order & verify regular user gets 403 on approve/reject
  const ord1Res = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "2" }),
  });
  assert.equal(ord1Res.status, 201);
  const ord1 = ord1Res.json.order;

  const regApp = await api(`/orders/${ord1.id}/approve`, parsianToken, { method: "POST" });
  assert.equal(regApp.status, 403);
  const regRej = await api(`/orders/${ord1.id}/reject`, parsianToken, { method: "POST" });
  assert.equal(regRej.status, 403);
  console.log("PASS: Regular user receives 403 on approve/reject");

  // 2. Concurrent approvals -> 1 success, 1 conflict, 1 trade
  const [c1, c2] = await Promise.all([
    api(`/orders/${ord1.id}/approve`, adminToken, { method: "POST" }),
    api(`/orders/${ord1.id}/approve`, adminToken, { method: "POST" }),
  ]);
  const statuses = [c1.status, c2.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 409], `Expected [200, 409], got ${JSON.stringify(statuses)}`);
  const okApprove = c1.status === 200 ? c1.json : c2.json;
  assert.equal(okApprove.order.status, "APPROVED");
  assert.equal(okApprove.trade.status, "APPROVED");
  assert.equal(okApprove.trade.orderId, ord1.id);

  await new Promise((r) => setTimeout(r, 300));
  assert.ok(
    parsianUpdates.some((u) => u.id === ord1.id && u.status === "APPROVED"),
    "User socket did not receive order:updated APPROVED"
  );

  const smsApprove = await api(`/orders/sms-stubs?orderId=${ord1.id}`, adminToken);
  assert.ok(
    smsApprove.json.logs.some(
      (l) => l.status === "STUB" && l.ruleTitle.includes("پس از تایید معامله")
    ),
    "Expected STUB SMS log for approve"
  );
  console.log("PASS: Concurrent approve -> 1 success + 1 conflict + 1 trade + socket + SMS stub");

  // 3. Reject -> REJECTED + user notified + SMS stub; subsequent approve -> 409
  const ord2Res = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "SELL", quantity: "1" }),
  });
  assert.equal(ord2Res.status, 201);
  const ord2 = ord2Res.json.order;

  const rejRes = await api(`/orders/${ord2.id}/reject`, adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "سقف اعتبار" }),
  });
  assert.equal(rejRes.status, 200);
  assert.equal(rejRes.json.order.status, "REJECTED");

  await new Promise((r) => setTimeout(r, 300));
  assert.ok(
    parsianUpdates.some((u) => u.id === ord2.id && u.status === "REJECTED"),
    "User socket did not receive order:updated REJECTED"
  );

  const smsReject = await api(`/orders/sms-stubs?orderId=${ord2.id}`, adminToken);
  assert.ok(
    smsReject.json.logs.some(
      (l) => l.status === "STUB" && l.ruleTitle.includes("پس از رد معامله")
    ),
    "Expected STUB SMS log for reject"
  );

  const approveRejected = await api(`/orders/${ord2.id}/approve`, adminToken, {
    method: "POST",
  });
  assert.equal(approveRejected.status, 409);
  console.log("PASS: Reject -> REJECTED + socket + SMS stub; approve on rejected -> 409");

  // 4. Expiry worker with short timeout (3s) -> EXPIRED automatically + both sides notified + approve after expiry -> 409
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responseTimeoutSeconds: 5 }),
  });
  const ord3Res = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "1" }),
  });
  assert.equal(ord3Res.status, 201);
  const ord3 = ord3Res.json.order;

  // Wait up to 7s for expiry worker
  for (let i = 0; i < 28; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (parsianUpdates.some((u) => u.id === ord3.id && u.status === "EXPIRED")) {
      break;
    }
  }

  assert.ok(
    parsianUpdates.some((u) => u.id === ord3.id && u.status === "EXPIRED"),
    "User socket did not receive EXPIRED from worker"
  );
  assert.ok(
    adminUpdates.some((u) => u.id === ord3.id && u.status === "EXPIRED"),
    "Admin socket did not receive EXPIRED from worker"
  );

  const mineAfterExp = await api("/orders/mine", parsianToken);
  const ord3Row = mineAfterExp.json.orders.find((o) => o.id === ord3.id);
  assert.equal(ord3Row.status, "EXPIRED");

  const approveExpired = await api(`/orders/${ord3.id}/approve`, adminToken, {
    method: "POST",
  });
  assert.equal(approveExpired.status, 409);

  // Restore timeout
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responseTimeoutSeconds: 60 }),
  });
  console.log("PASS: Expiry worker expires overdue order + notifies both sides + approve after expiry -> 409");

  adminSock.close();
  parsianSock.close();
  console.log("B9_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
