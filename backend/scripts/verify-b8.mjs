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

  const kouroshRes = await login("kourosh", "User@1405");
  const kouroshToken = kouroshRes.data.token;

  // Connect admin socket to catch order:new
  const adminSock = io(BASE, {
    auth: { token: adminToken },
    transports: ["websocket"],
    reconnection: false,
  });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("socket connect timeout")), 5000);
    adminSock.once("connected", () => {
      clearTimeout(t);
      res();
    });
  });

  const orderEvents = [];
  adminSock.on("order:new", (ev) => orderEvents.push(ev));

  const [adminBoard, parsianBoard] = await Promise.all([
    api("/board/products", adminToken),
    api("/board/products", parsianToken),
  ]);
  const parsianIds = new Set(parsianBoard.json.products.map((p) => p.id));
  const inGroupProd = parsianBoard.json.products[0]; // نقد فردا (min 1, max 1000)
  const outGroupProd = adminBoard.json.products.find((p) => !parsianIds.has(p.id));

  // Ensure fresh tick
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: inGroupProd.id,
      buyPrice: inGroupProd.buyPrice,
      sellPrice: inGroupProd.sellPrice,
    }),
  });

  // 1. Valid buy submission -> PENDING_APPROVAL, exact total, expiresAt ≈ +60s, order:new emitted
  const reqId = `b8-req-${Date.now()}`;
  const qty = "2.5";
  const createRes = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: inGroupProd.id,
      side: "BUY",
      quantity: qty,
      clientRequestId: reqId,
      totalAmount: "1", // adversarial client total -> must be ignored!
    }),
  });
  assert.equal(createRes.status, 201, `Create failed: ${JSON.stringify(createRes.json)}`);
  const order = createRes.json.order;
  assert.equal(order.status, "PENDING_APPROVAL");
  const expectedTotal = String(Math.round(2.5 * Number(inGroupProd.buyPrice)));
  assert.equal(order.totalAmount, expectedTotal);

  const deltaSec = (new Date(order.expiresAt).getTime() - Date.now()) / 1000;
  assert.ok(deltaSec > 50 && deltaSec <= 65, `Unexpected expiresAt delta: ${deltaSec}s`);

  await new Promise((r) => setTimeout(r, 300));
  assert.ok(
    orderEvents.some((e) => e.id === order.id && e.status === "PENDING_APPROVAL"),
    "Admin socket did not receive order:new"
  );
  console.log("PASS: Valid buy submission -> PENDING_APPROVAL, exact total, +60s expiry, order:new");

  // 2. Duplicate clientRequestId -> same order, no second row
  const dupRes = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: inGroupProd.id,
      side: "BUY",
      quantity: qty,
      clientRequestId: reqId,
    }),
  });
  assert.equal(dupRes.status, 201);
  assert.equal(dupRes.json.order.id, order.id);
  assert.equal(dupRes.json.idempotent, true);
  console.log("PASS: Duplicate clientRequestId returns same order idempotently");

  // 3. Below min and above max -> rejected 400
  const belowMin = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: inGroupProd.id, side: "BUY", quantity: "0.1" }),
  });
  assert.equal(belowMin.status, 400);

  const aboveMax = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: inGroupProd.id, side: "BUY", quantity: "99999" }),
  });
  assert.equal(aboveMax.status, 400);
  console.log("PASS: Below min and above max rejected with 400");

  // 4. Out-of-group product -> 403
  const outGroup = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: outGroupProd.id, side: "BUY", quantity: "1" }),
  });
  assert.equal(outGroup.status, 403);
  console.log("PASS: Out-of-group product rejected with 403");

  // 5. Trading stopped -> rejected 400
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tradingStopped: true }),
  });
  const stoppedOrder = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: inGroupProd.id, side: "BUY", quantity: "1" }),
  });
  assert.equal(stoppedOrder.status, 400);
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tradingStopped: false }),
  });
  console.log("PASS: Stopped trading rejects order with 400");

  // 6. enforceWorkingHours on + outside hours -> rejected 400
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      enforceWorkingHours: true,
      workingHours: "00:01 تا 00:02",
    }),
  });
  const offHours = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: inGroupProd.id, side: "BUY", quantity: "1" }),
  });
  assert.equal(offHours.status, 400);
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      enforceWorkingHours: false,
      workingHours: "۱۰:۳۰ تا ۲۱:۰۰",
    }),
  });
  console.log("PASS: enforceWorkingHours outside hours rejected with 400");

  // 7. Stale price -> rejected 400
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceStaleThresholdSeconds: 1 }),
  });
  await new Promise((r) => setTimeout(r, 2100));
  const staleOrder = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: inGroupProd.id, side: "BUY", quantity: "1" }),
  });
  assert.equal(staleOrder.status, 400);
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceStaleThresholdSeconds: 120 }),
  });
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: inGroupProd.id,
      buyPrice: inGroupProd.buyPrice,
      sellPrice: inGroupProd.sellPrice,
    }),
  });
  console.log("PASS: Stale price rejects order with 400");

  // 8. GET /orders/mine + cancel isolation + cancel own
  const mineParsian = await api("/orders/mine", parsianToken);
  assert.ok(mineParsian.json.orders.some((o) => o.id === order.id));
  const mineKourosh = await api("/orders/mine", kouroshToken);
  assert.equal(mineKourosh.json.orders.some((o) => o.id === order.id), false);

  const cancelOther = await api(`/orders/${order.id}/cancel`, kouroshToken, {
    method: "POST",
  });
  assert.equal(cancelOther.status, 403);

  const cancelOwn = await api(`/orders/${order.id}/cancel`, parsianToken, {
    method: "POST",
  });
  assert.equal(cancelOwn.status, 200);
  assert.equal(cancelOwn.json.order.status, "CANCELLED");
  console.log("PASS: /orders/mine isolated; other user cancel 403; own cancel -> CANCELLED");

  adminSock.close();
  console.log("B8_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
