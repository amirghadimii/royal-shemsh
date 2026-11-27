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
  const parsianId = parsianRes.data.user.id;
  const kouroshRes = await login("kourosh", "User@1405");
  const kouroshToken = kouroshRes.data.token;

  // 1. Regular user -> 403 on all /admin/reports/* and /admin/remittances
  for (const [m, p] of [
    ["GET", "/admin/reports/profit-loss"],
    ["GET", "/admin/reports/asset-dashboard"],
    ["GET", "/admin/reports/customer-pl"],
    ["GET", "/admin/reports/commission"],
    ["GET", "/admin/reports/discrepancy"],
    ["GET", "/admin/reports/order-balance"],
    ["GET", "/admin/remittances"],
    ["POST", "/admin/remittances"],
  ]) {
    const r = await api(p, parsianToken, {
      method: m,
      headers: m === "POST" ? { "Content-Type": "application/json" } : {},
      body: m === "POST" ? JSON.stringify({}) : undefined,
    });
    assert.equal(r.status, 403, `Expected 403 for REGULAR ${m} ${p}, got ${r.status}`);
  }
  console.log("PASS: Regular user receives 403 on all /admin/reports and /admin/remittances");

  const parsianBoard = await api("/board/products", parsianToken);
  const prod = parsianBoard.json.products[0];
  const origBuy = Number(prod.buyPrice);
  const origSell = Number(prod.sellPrice);

  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(origBuy),
      sellPrice: String(origSell),
    }),
  });

  // Snapshot before P&L and dashboard
  const plBefore = await api("/admin/reports/profit-loss?days=30", adminToken);
  const prodPlBefore = plBefore.json.rows.find((r) => r.productId === prod.id);
  const dashBefore = await api("/admin/reports/asset-dashboard", adminToken);
  const prodDashBefore = dashBefore.json.rows.find((r) => r.productId === prod.id);

  // 2. Scripted BUY (4g) + SELL (1g)
  const buyOrd = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "4" }),
  });
  const buyApp = await api(`/orders/${buyOrd.json.order.id}/approve`, adminToken, {
    method: "POST",
  });
  const sellOrd = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "SELL", quantity: "1" }),
  });
  const sellApp = await api(`/orders/${sellOrd.json.order.id}/approve`, adminToken, {
    method: "POST",
  });

  const plAfter = await api("/admin/reports/profit-loss?days=30", adminToken);
  const prodPlAfter = plAfter.json.rows.find((r) => r.productId === prod.id);
  assert.equal(
    BigInt(prodPlAfter.buyTotalToman) - BigInt(prodPlBefore.buyTotalToman),
    BigInt(buyApp.json.trade.totalAmount)
  );
  assert.equal(
    BigInt(prodPlAfter.sellTotalToman) - BigInt(prodPlBefore.sellTotalToman),
    BigInt(sellApp.json.trade.totalAmount)
  );
  assert.equal(
    Number(prodPlAfter.netWeight) - Number(prodPlBefore.netWeight),
    3
  );
  console.log("PASS: profit-loss matches scripted trades exactly");

  // 3. Asset dashboard floating P&L moves with valuation price
  const dashAfter = await api("/admin/reports/asset-dashboard", adminToken);
  const prodDashAfter = dashAfter.json.rows.find((r) => r.productId === prod.id);
  const netPos = Number(prodDashAfter.netPosition);
  assert.equal(netPos - Number(prodDashBefore.netPosition), 3);

  const newValPrice = origBuy + 1_000_000;
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(newValPrice),
      sellPrice: String(origSell + 1_000_000),
    }),
  });
  const dashReval = await api("/admin/reports/asset-dashboard", adminToken);
  const prodDashReval = dashReval.json.rows.find((r) => r.productId === prod.id);
  assert.equal(
    BigInt(prodDashReval.floatingPlToman) - BigInt(prodDashAfter.floatingPlToman),
    BigInt(Math.round(netPos * 1_000_000))
  );
  // Restore valuation price
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: String(origBuy),
      sellPrice: String(origSell),
    }),
  });
  console.log("PASS: asset-dashboard floating P&L moves accurately with valuation price");

  // 4. customer-pl matches ledger
  const custPl = await api("/admin/reports/customer-pl", adminToken);
  assert.equal(custPl.json.sourceName, "LOCAL_LEDGER_STAGING");
  const parsianCust = custPl.json.rows.find((r) => r.userId === parsianId);
  const parsianAcc = await api("/accounting/mine", parsianToken);
  assert.equal(parsianCust.cashBalanceToman, parsianAcc.json.summary.cashBalanceToman);
  assert.equal(parsianCust.goldGrams, parsianAcc.json.summary.totalGoldGrams);
  console.log("PASS: customer-pl matches ledger balances via CustomerPlSource");

  // 5. Commission report: weight * 65000 per group + grandTotal
  const commRes = await api("/admin/reports/commission", adminToken);
  assert.equal(commRes.status, 200);
  let checkGrand = 0n;
  for (const g of commRes.json.groups) {
    let gSum = 0n;
    for (const m of g.members) {
      const expected = BigInt(
        Math.round(Number(m.tradedWeight) * Number(m.ratePerGramToman))
      );
      assert.equal(BigInt(m.commissionToman), expected);
      gSum += expected;
    }
    assert.equal(BigInt(g.groupTotalToman), gSum);
    checkGrand += gSum;
  }
  assert.equal(BigInt(commRes.json.grandTotalToman), checkGrand);
  console.log("PASS: commission report matches weight * rate per group and جمع کل");

  // 6. Discrepancy report: empty on consistent data; flags corrupted throwaway user, then cleaned up
  const cleanDisc = await api("/admin/reports/discrepancy", adminToken);
  assert.equal(cleanDisc.json.isConsistent, true);
  assert.equal(cleanDisc.json.discrepancies.length, 0);

  const regularRole = await prisma.role.findUniqueOrThrow({ where: { code: "REGULAR" } });
  const throwawayUser = await prisma.user.create({
    data: {
      code: 9999,
      username: `disc_test_${Date.now()}`,
      fullName: "کاربر تست مغایرت",
      mobile: `0999${Date.now().toString().slice(-7)}`,
      roleId: regularRole.id,
    },
  });
  const badTrade = await prisma.trade.create({
    data: {
      tradeCode: `TRD-DISC-${Date.now()}`,
      userId: throwawayUser.id,
      productId: prod.id,
      side: "BUY",
      quantity: "5",
      unitPrice: "1000000",
      totalAmount: "5000000",
      settlementTerm: "نقد فردا",
      status: "APPROVED",
    },
  });
  const dirtyDisc = await api("/admin/reports/discrepancy", adminToken);
  assert.equal(dirtyDisc.json.isConsistent, false);
  assert.ok(
    dirtyDisc.json.discrepancies.some(
      (d) => d.userId === throwawayUser.id && d.productId === prod.id
    )
  );
  // Cleanup throwaway test data
  await prisma.trade.delete({ where: { id: badTrade.id } });
  await prisma.user.delete({ where: { id: throwawayUser.id } });
  const restoredDisc = await api("/admin/reports/discrepancy", adminToken);
  assert.equal(restoredDisc.json.isConsistent, true);
  console.log("PASS: discrepancy empty when consistent, flags mismatch, cleaned up");

  // 7. order-balance for past date excludes today's trades
  const pastBal = await api("/admin/reports/order-balance?date=2026-01-01", adminToken);
  assert.equal(pastBal.status, 200);
  assert.equal(pastBal.json.rows.find((r) => r.productId === prod.id).netWeight, "0");
  console.log("PASS: order-balance?date= excludes later trades");

  // 8. Gold & Cash remittances update derived balances & respect isolation
  const beforeRem = await api("/accounting/mine", parsianToken);
  const remGold = await api("/admin/remittances", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsianId,
      type: "GOLD_WEIGHT",
      productId: prod.id,
      weightGrams: "2.5",
      warehouse: "خزانه تست",
    }),
  });
  assert.equal(remGold.status, 201);

  const remCash = await api("/admin/remittances", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsianId,
      type: "CASH_RIAL",
      cashAmount: "10000000",
      warehouse: "حساب تست",
    }),
  });
  assert.equal(remCash.status, 201);

  const afterRem = await api("/accounting/mine", parsianToken);
  assert.equal(
    Number(afterRem.json.summary.totalGoldGrams) -
      Number(beforeRem.json.summary.totalGoldGrams),
    2.5
  );
  assert.equal(
    BigInt(afterRem.json.summary.cashBalanceToman) -
      BigInt(beforeRem.json.summary.cashBalanceToman),
    10000000n
  );

  const mineParsianRem = await api("/remittances/mine", parsianToken);
  assert.ok(mineParsianRem.json.remittances.some((r) => r.id === remGold.json.remittance.id));
  const mineKouroshRem = await api("/remittances/mine", kouroshToken);
  assert.equal(
    mineKouroshRem.json.remittances.some((r) => r.id === remGold.json.remittance.id),
    false
  );
  console.log("PASS: Gold & cash remittances update derived balances & isolate /remittances/mine");

  await prisma.$disconnect();
  console.log("B12_FINANCE_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
