import assert from "node:assert/strict";

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
  return { status: res.status, json };
}

async function main() {
  const adminRes = await login("admin", "Royal@1405");
  assert.equal(adminRes.status, 200);
  const adminToken = adminRes.data.token;

  const parsianRes = await login("parsian", "User@1405");
  assert.equal(parsianRes.status, 200);
  const parsianToken = parsianRes.data.token;

  const boardInit = await api("/board/products", adminToken);
  assert.equal(boardInit.status, 200);
  const targetProd = boardInit.json.products[0];
  const origBuy = targetProd.buyPrice;
  const origSell = targetProd.sellPrice;

  // 1. Regular user -> 403 on price history, manual price, and stub inject
  for (const [method, p, body] of [
    ["GET", "/prices/history", undefined],
    [
      "POST",
      "/admin/prices/manual",
      { productId: targetProd.id, buyPrice: "44000000", sellPrice: "44100000" },
    ],
    [
      "POST",
      "/admin/prices/homegold-stub/tick",
      { productId: targetProd.id, buyPrice: "44000000", sellPrice: "44100000" },
    ],
  ]) {
    const r = await api(p, parsianToken, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(r.status, 403, `Expected 403 for REGULAR ${method} ${p}, got ${r.status}`);
  }
  console.log("PASS: Regular user receives 403 on history, manual price, and stub inject");

  // 2. Manual price set -> board price changes & history grows by 1 tick
  const histBefore = await api(
    `/prices/history?productId=${targetProd.id}`,
    adminToken
  );
  const countBefore = histBefore.json.ticks.length;
  const latestTickBefore = histBefore.json.ticks[histBefore.json.ticks.length - 1]?.id;

  const manualRes = await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: targetProd.id,
      buyPrice: "44500000",
      sellPrice: "44600000",
    }),
  });
  assert.equal(manualRes.status, 200);

  const boardAfterManual = await api("/board/products", adminToken);
  const pAfterManual = boardAfterManual.json.products.find((p) => p.id === targetProd.id);
  assert.equal(pAfterManual.buyPrice, "44500000");

  const histAfterManual = await api(
    `/prices/history?productId=${targetProd.id}`,
    adminToken
  );
  if (countBefore < 50) {
    assert.equal(histAfterManual.json.ticks.length, countBefore + 1);
  }
  const latestTickAfter =
    histAfterManual.json.ticks[histAfterManual.json.ticks.length - 1];
  assert.notEqual(latestTickAfter?.id, latestTickBefore);
  assert.equal(latestTickAfter?.buyPrice, "44500000");
  console.log("PASS: Manual price set updates board and grows history by 1 tick");

  // 3. Mode 2 + injected stub tick -> board changes and tick in price_ticks
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeGoldMode: "2" }),
  });
  const stub2 = await api("/admin/prices/homegold-stub/tick", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: targetProd.id,
      buyPrice: "44700000",
      sellPrice: "44800000",
    }),
  });
  assert.equal(stub2.status, 200);
  assert.equal(stub2.json.applied, true);
  assert.equal(stub2.json.mode, "2");

  const boardAfterMode2 = await api("/board/products", adminToken);
  assert.equal(
    boardAfterMode2.json.products.find((p) => p.id === targetProd.id).buyPrice,
    "44700000"
  );
  const histAfterMode2 = await api(
    `/prices/history?productId=${targetProd.id}`,
    adminToken
  );
  if (countBefore + 2 <= 50) {
    assert.equal(histAfterMode2.json.ticks.length, countBefore + 2);
  }
  const latestMode2Tick =
    histAfterMode2.json.ticks[histAfterMode2.json.ticks.length - 1];
  assert.notEqual(latestMode2Tick?.id, latestTickAfter?.id);
  assert.equal(latestMode2Tick?.source, "HOMEGOLD_STUB");
  console.log("PASS: Mode 2 stub tick updates board and records in price_ticks");

  // 4. Mode 1 + injected stub tick -> board unchanged (no restart)
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeGoldMode: "1" }),
  });
  const stub1 = await api("/admin/prices/homegold-stub/tick", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: targetProd.id,
      buyPrice: "49999000",
      sellPrice: "50000000",
    }),
  });
  assert.equal(stub1.status, 200);
  assert.equal(stub1.json.applied, false);

  const boardAfterMode1 = await api("/board/products", adminToken);
  assert.equal(
    boardAfterMode1.json.products.find((p) => p.id === targetProd.id).buyPrice,
    "44700000",
    "Board must remain unchanged in Mode 1 when stub tick is injected"
  );
  console.log("PASS: Mode 1 ignores stub tick without restart");

  // 5. Mode 3 + injected stub tick -> board changes & homegold_outbox row exists
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeGoldMode: "3" }),
  });
  const stub3 = await api("/admin/prices/homegold-stub/tick", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: targetProd.id,
      buyPrice: "44900000",
      sellPrice: "45000000",
    }),
  });
  assert.equal(stub3.status, 200);
  assert.equal(stub3.json.applied, true);
  assert.equal(stub3.json.mode, "3");
  assert.ok(stub3.json.outbox?.id, "Expected homegold_outbox row in Mode 3");

  const outboxRes = await api(
    `/admin/prices/outbox?productId=${targetProd.id}`,
    adminToken
  );
  assert.equal(outboxRes.status, 200);
  assert.ok(outboxRes.json.outbox.some((o) => o.id === stub3.json.outbox.id));
  console.log("PASS: Mode 3 updates board and writes homegold_outbox row");

  // 6. Stale state after threshold with no new ticks
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceStaleThresholdSeconds: 1 }),
  });
  await new Promise((r) => setTimeout(r, 2100));
  const staleStatus = await api("/board/status");
  assert.equal(staleStatus.status, 200);
  assert.equal(staleStatus.json.isStale, true, "Expected isStale=true after threshold");
  assert.ok(staleStatus.json.elapsedSeconds >= 2);
  console.log("PASS: Stale state reported after threshold with no new ticks");

  // Restore defaults & original sample price
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      homeGoldMode: "1",
      priceStaleThresholdSeconds: 120,
    }),
  });
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: targetProd.id,
      buyPrice: origBuy,
      sellPrice: origSell,
    }),
  });
  const freshStatus = await api("/board/status");
  assert.equal(freshStatus.json.isStale, false);
  console.log("B6_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
