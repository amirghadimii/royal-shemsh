import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { io } = require(path.resolve(process.cwd(), "node_modules/socket.io-client"));
const { PrismaClient } = require(
  path.resolve(process.cwd(), "backend/node_modules/@prisma/client")
);

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
  const prisma = new PrismaClient();

  const adminRes = await login("admin", "Royal@1405");
  const adminToken = adminRes.data.token;

  const parsianRes = await login("parsian", "User@1405");
  const parsianToken = parsianRes.data.token;
  const parsianId = parsianRes.data.user.id;

  const kouroshRes = await login("kourosh", "User@1405");
  const kouroshToken = kouroshRes.data.token;

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

  const adminNewOrders = [];
  const parsianPreUpdates = [];
  adminSock.on("order:new", (e) => adminNewOrders.push(e));
  parsianSock.on("preorder:updated", (e) => parsianPreUpdates.push(e));

  const parsianBoard = await api("/board/products", parsianToken);
  const prod = parsianBoard.json.products[0];
  const origBuy = Number(prod.buyPrice);
  const origSell = Number(prod.sellPrice);

  // Ensure trading is active and price is at baseline
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tradingStopped: false }),
  });

  // Cancel any leftover ACTIVE pre-orders from previous runs for clean isolation
  const existingActive = await api("/preorders/mine?status=ACTIVE", parsianToken);
  for (const oldPre of existingActive.json.preOrders ?? []) {
    await api(`/preorders/${oldPre.id}/cancel`, parsianToken, { method: "POST" });
  }

  // 1. BUY pre-order below current sellPrice -> stays ACTIVE, no order created
  const targetBuy = String(origSell - 500_000);
  const po1Res = await api("/preorders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      side: "BUY",
      targetPrice: targetBuy,
      weightGrams: "2",
    }),
  });
  assert.equal(po1Res.status, 201, `Create preorder failed: ${JSON.stringify(po1Res.json)}`);
  const po1 = po1Res.json.preOrder;
  assert.equal(po1.status, "ACTIVE");

  const ordersBefore = (await api("/orders/mine", parsianToken)).json.orders.length;

  // 2. Manual price crossing target -> EXECUTED + PENDING_APPROVAL order + notifications
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(Number(targetBuy) - 100_000),
      sellPrice: String(Number(targetBuy) - 50_000),
    }),
  });
  await new Promise((r) => setTimeout(r, 400));

  const minePre1 = await api("/preorders/mine?status=EXECUTED", parsianToken);
  assert.ok(minePre1.json.preOrders.some((p) => p.id === po1.id));
  const ordersAfter1 = (await api("/orders/mine", parsianToken)).json.orders;
  assert.equal(ordersAfter1.length, ordersBefore + 1);
  assert.equal(ordersAfter1[0].status, "PENDING_APPROVAL");
  assert.ok(parsianPreUpdates.some((u) => u.id === po1.id && u.status === "EXECUTED"));
  assert.ok(adminNewOrders.some((o) => o.id === ordersAfter1[0].id));
  console.log("PASS: Crossing tick triggers BUY pre-order -> EXECUTED + PENDING_APPROVAL order + sockets");

  // 3. Same tick again does not trigger it twice
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(Number(targetBuy) - 100_000),
      sellPrice: String(Number(targetBuy) - 50_000),
    }),
  });
  await new Promise((r) => setTimeout(r, 200));
  const ordersAfterDupTick = (await api("/orders/mine", parsianToken)).json.orders;
  assert.equal(ordersAfterDupTick.length, ordersBefore + 1);
  console.log("PASS: Pre-order triggers at most once");

  // 4. Cancel ACTIVE pre-order -> CANCELLED; crossing tick does not trigger; other user 403 & invisible
  const po2Res = await api("/preorders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      side: "SELL",
      targetPrice: String(origBuy + 5_000_000),
      weightGrams: "1",
    }),
  });
  const po2 = po2Res.json.preOrder;

  const kouroshMine = await api("/preorders/mine", kouroshToken);
  assert.equal(kouroshMine.json.preOrders.some((p) => p.id === po2.id), false);
  const kouroshCancel = await api(`/preorders/${po2.id}/cancel`, kouroshToken, {
    method: "POST",
  });
  assert.equal(kouroshCancel.status, 403);

  const cancelOwn = await api(`/preorders/${po2.id}/cancel`, parsianToken, {
    method: "POST",
  });
  assert.equal(cancelOwn.status, 200);
  assert.equal(cancelOwn.json.preOrder.status, "CANCELLED");

  // Crossing SELL tick -> must NOT trigger cancelled pre-order
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(origBuy + 6_000_000),
      sellPrice: String(origSell + 6_000_000),
    }),
  });
  await new Promise((r) => setTimeout(r, 200));
  assert.equal((await api("/orders/mine", parsianToken)).json.orders.length, ordersBefore + 1);
  console.log("PASS: Cancel -> CANCELLED (no trigger on crossing tick); other user isolated & 403");

  // 5. Expiry worker
  const po3Res = await api("/preorders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      side: "BUY",
      targetPrice: "1000000",
      weightGrams: "1",
    }),
  });
  const po3 = po3Res.json.preOrder;
  await prisma.preOrder.update({
    where: { id: po3.id },
    data: { expiresAt: new Date(Date.now() - 5000) },
  });
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (parsianPreUpdates.some((u) => u.id === po3.id && u.status === "EXPIRED")) {
      break;
    }
  }
  assert.ok(
    parsianPreUpdates.some((u) => u.id === po3.id && u.status === "EXPIRED"),
    "Expected EXPIRED socket event from worker"
  );
  console.log("PASS: Expiry worker moves overdue pre-order to EXPIRED and notifies user");

  // 6. Manual pre-order (admin only -> 403 for regular)
  const regManual = await api("/preorders/manual", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsianId,
      productId: prod.id,
      side: "BUY",
      targetPrice: String(origSell),
      weightGrams: "1",
    }),
  });
  assert.equal(regManual.status, 403);

  const manualRes = await api("/preorders/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsianId,
      productId: prod.id,
      side: "BUY",
      targetPrice: String(origSell - 200_000),
      weightGrams: "1",
    }),
  });
  assert.equal(manualRes.status, 201);
  assert.equal(manualRes.json.preOrder.isManual, true);
  assert.ok(manualRes.json.preOrder.createdByAdminId);

  // Trigger the manual pre-order by restoring original price (which is <= origSell - 200_000? wait: set origSell - 200_000 then restore origSell)
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(origBuy - 200_000),
      sellPrice: String(origSell - 200_000),
    }),
  });
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(
    parsianPreUpdates.some(
      (u) => u.id === manualRes.json.preOrder.id && u.status === "EXECUTED"
    ),
    "Expected manual pre-order to trigger on crossing tick"
  );
  console.log("PASS: Manual pre-order (admin only, 403 regular) triggers on crossing tick");

  // Restore original price
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(origBuy),
      sellPrice: String(origSell),
    }),
  });

  await prisma.$disconnect();
  adminSock.close();
  parsianSock.close();
  console.log("B10_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
