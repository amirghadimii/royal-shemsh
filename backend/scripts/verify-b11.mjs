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
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, text, headers: res.headers };
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

  // 1. Regular user -> 403 on admin accounting & trades
  for (const [m, p] of [
    ["GET", "/admin/accounting"],
    ["GET", "/admin/accounting/export"],
    ["GET", "/trades"],
  ]) {
    const r = await api(p, parsianToken, { method: m });
    assert.equal(r.status, 403, `Expected 403 for REGULAR ${m} ${p}, got ${r.status}`);
  }
  console.log("PASS: Regular user receives 403 on /admin/accounting and /trades");

  const parsianBoard = await api("/board/products", parsianToken);
  const prod = parsianBoard.json.products[0];

  // Ensure fresh price tick
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: prod.buyPrice,
      sellPrice: prod.sellPrice,
    }),
  });

  // Snapshot before balances
  const beforeMine = await api("/accounting/mine", parsianToken);
  const beforeCash = BigInt(beforeMine.json.summary.cashBalanceToman);
  const beforeGold = Number(beforeMine.json.summary.totalGoldGrams);

  // 2. Approve BUY (3g) + Approve SELL (1g)
  const buyOrd = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "3" }),
  });
  const buyApp = await api(`/orders/${buyOrd.json.order.id}/approve`, adminToken, {
    method: "POST",
  });
  assert.equal(buyApp.status, 200);
  const buyTrade = buyApp.json.trade;

  const sellOrd = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "SELL", quantity: "1" }),
  });
  const sellApp = await api(`/orders/${sellOrd.json.order.id}/approve`, adminToken, {
    method: "POST",
  });
  assert.equal(sellApp.status, 200);
  const sellTrade = sellApp.json.trade;

  // Hand-compute expected deltas
  const expectedCashDelta =
    BigInt(sellTrade.totalAmount) - BigInt(buyTrade.totalAmount);
  const expectedGoldDelta = 3 - 1;

  const afterMine = await api("/accounting/mine", parsianToken);
  const afterCash = BigInt(afterMine.json.summary.cashBalanceToman);
  const afterGold = Number(afterMine.json.summary.totalGoldGrams);

  assert.equal(afterCash - beforeCash, expectedCashDelta, "Derived cash balance mismatch");
  assert.equal(afterGold - beforeGold, expectedGoldDelta, "Derived gold balance mismatch");

  // Assert every posting document balances (debits == credits, gold_in == gold_out)
  for (const t of [buyTrade, sellTrade]) {
    const legs = await prisma.ledgerEntry.findMany({ where: { tradeId: t.id } });
    assert.equal(legs.length, 4, `Expected 4 ledger legs for trade ${t.id}`);
    const debits = legs
      .filter((l) => l.entryType === "DEBIT")
      .reduce((s, l) => s + BigInt(l.rialAmount.toFixed(0)), 0n);
    const credits = legs
      .filter((l) => l.entryType === "CREDIT")
      .reduce((s, l) => s + BigInt(l.rialAmount.toFixed(0)), 0n);
    const goldIn = legs
      .filter((l) => l.entryType === "GOLD_IN")
      .reduce((s, l) => s + Number(l.goldGrams), 0);
    const goldOut = legs
      .filter((l) => l.entryType === "GOLD_OUT")
      .reduce((s, l) => s + Number(l.goldGrams), 0);
    assert.equal(debits, credits, "Cash debits must equal credits");
    assert.equal(goldIn, goldOut, "Gold in must equal gold out");
  }
  console.log("PASS: Approved BUY + SELL post balanced double-entry legs & derived balances match exactly");

  // 3. Rejected order posts NOTHING
  const rejOrd = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "1" }),
  });
  await api(`/orders/${rejOrd.json.order.id}/reject`, adminToken, { method: "POST" });
  const afterRejectMine = await api("/accounting/mine", parsianToken);
  assert.equal(afterRejectMine.json.entries.length, afterMine.json.entries.length);
  console.log("PASS: Rejected order posts nothing to ledger");

  // 4. /accounting/mine isolation
  const kouroshMine = await api("/accounting/mine", kouroshToken);
  assert.equal(
    kouroshMine.json.entries.some((e) => e.userId === parsianId),
    false,
    "Another user's ledger entries must never appear"
  );
  console.log("PASS: /accounting/mine isolates entries per user");

  // 5. Creditor / debtor filter
  const expectedDebtor = afterCash < 0n;
  const debtorList = await api("/admin/accounting?filter=debtor", adminToken);
  const creditorList = await api("/admin/accounting?filter=creditor", adminToken);
  if (expectedDebtor) {
    assert.ok(debtorList.json.rows.some((r) => r.id === parsianId));
    assert.equal(creditorList.json.rows.some((r) => r.id === parsianId), false);
  } else if (afterCash > 0n) {
    assert.ok(creditorList.json.rows.some((r) => r.id === parsianId));
    assert.equal(debtorList.json.rows.some((r) => r.id === parsianId), false);
  }
  console.log("PASS: Creditor/debtor filter classifies users accurately");

  // 6. CSV export
  const csvMine = await api("/accounting/mine/export", parsianToken);
  assert.equal(csvMine.status, 200);
  assert.ok(csvMine.headers.get("content-type")?.includes("text/csv"));
  assert.ok(csvMine.text.includes(buyTrade.tradeCode));

  const csvAdmin = await api("/admin/accounting/export", adminToken);
  assert.equal(csvAdmin.status, 200);
  assert.ok(csvAdmin.text.includes(sellTrade.tradeCode));
  console.log("PASS: CSV export downloads and contains posted entries");

  // 7. Audit toggle & filter
  const regAudit = await api(`/trades/${buyTrade.id}/audit`, parsianToken, {
    method: "PATCH",
  });
  assert.equal(regAudit.status, 403);

  const tog = await api(`/trades/${buyTrade.id}/audit`, adminToken, {
    method: "PATCH",
  });
  assert.equal(tog.status, 200);
  assert.equal(tog.json.trade.audited, true);

  const auditedTrades = await api("/trades?audit=audited", adminToken);
  assert.ok(auditedTrades.json.trades.some((t) => t.id === buyTrade.id));
  const unauditedTrades = await api("/trades?audit=unaudited", adminToken);
  assert.equal(unauditedTrades.json.trades.some((t) => t.id === buyTrade.id), false);
  console.log("PASS: Audit toggle flips flag and audit filter works");

  // 8. Ledger entry delete still fails (B1 protection)
  let deleteBlocked = false;
  try {
    await prisma.ledgerEntry.delete({ where: { id: afterMine.json.entries[0].id } });
  } catch {
    deleteBlocked = true;
  }
  assert.equal(deleteBlocked, true, "Deleting a ledger entry MUST fail");
  console.log("PASS: Ledger entry deletion blocked (B1 immutability intact)");

  await prisma.$disconnect();
  console.log("B11_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
