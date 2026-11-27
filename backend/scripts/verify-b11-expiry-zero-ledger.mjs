import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
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

  const beforeMine = await api("/accounting/mine", parsianToken);
  const beforeCount = beforeMine.json.entries.length;

  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responseTimeoutSeconds: 5 }),
  });

  const ordRes = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "1" }),
  });
  assert.equal(ordRes.status, 201);
  const ordId = ordRes.json.order.id;

  // Wait for expiry worker
  for (let i = 0; i < 28; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const mine = await api("/orders/mine", parsianToken);
    const row = mine.json.orders.find((o) => o.id === ordId);
    if (row?.status === "EXPIRED") break;
  }

  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responseTimeoutSeconds: 60 }),
  });

  const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: ordId } });
  assert.equal(finalOrder.status, "EXPIRED");

  const tradesForOrder = await prisma.trade.count({ where: { orderId: ordId } });
  assert.equal(tradesForOrder, 0, "Expired order must have 0 trades");

  const afterMine = await api("/accounting/mine", parsianToken);
  assert.equal(
    afterMine.json.entries.length,
    beforeCount,
    "Expired order must post ZERO ledger entries"
  );

  await prisma.$disconnect();
  console.log("B11_EXPIRED_ORDER_ZERO_LEDGER_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
