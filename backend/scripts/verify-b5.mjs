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

  // 1. Regular user -> 403 on products and settings endpoints
  for (const [method, p] of [
    ["GET", "/admin/products"],
    ["GET", "/admin/product-groups"],
    ["GET", "/admin/settings"],
    ["PUT", "/admin/settings"],
  ]) {
    const r = await api(p, parsianToken, {
      method,
      headers: method === "PUT" ? { "Content-Type": "application/json" } : {},
      body: method === "PUT" ? JSON.stringify({ responseTimeoutSeconds: 30 }) : undefined,
    });
    assert.equal(r.status, 403, `Expected 403 for REGULAR ${method} ${p}, got ${r.status}`);
  }
  console.log("PASS: Regular user receives 403 on products and settings endpoints");

  // 2. min > max rejected on create
  const groupsRes = await api("/admin/product-groups", adminToken);
  assert.equal(groupsRes.status, 200);
  const groupId = groupsRes.json.groups[0].id;

  const invalidCreate = await api("/admin/products", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "کالای نامعتبر",
      productGroupId: groupId,
      buyPrice: "10000000",
      sellPrice: "10100000",
      minOrder: "50",
      maxOrder: "10",
    }),
  });
  assert.equal(invalidCreate.status, 400, "Expected 400 when minOrder > maxOrder");
  console.log("PASS: minOrder > maxOrder rejected with 400");

  // 3. Create product -> appears on board
  const suffix = Date.now().toString().slice(-5);
  const createRes = await api("/admin/products", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `شمش تست ${suffix}`,
      badge: "طلا ۲۴ عیار",
      unit: "گرم",
      productGroupId: groupId,
      buyPrice: "55000000",
      sellPrice: "55200000",
      minOrder: "1",
      maxOrder: "50",
    }),
  });
  assert.equal(createRes.status, 201, `Create failed: ${JSON.stringify(createRes.json)}`);
  const createdId = createRes.json.product.id;

  const boardAfterCreate = await api("/board/products", adminToken);
  assert.ok(boardAfterCreate.json.products.some((p) => p.id === createdId));
  console.log("PASS: Created product appears on /board/products");

  // 4. Edit price/min/max -> persists & shows on board; invalid edit rejected
  const invalidEdit = await api(`/admin/products/${createdId}`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minOrder: "100", maxOrder: "50" }),
  });
  assert.equal(invalidEdit.status, 400);

  const editRes = await api(`/admin/products/${createdId}`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyPrice: "56000000",
      sellPrice: "56250000",
      minOrder: "2",
      maxOrder: "75",
    }),
  });
  assert.equal(editRes.status, 200);
  const boardAfterEdit = await api("/board/products", adminToken);
  const editedOnBoard = boardAfterEdit.json.products.find((p) => p.id === createdId);
  assert.equal(editedOnBoard.buyPrice, "56000000");
  assert.equal(editedOnBoard.minOrder, "2");
  console.log("PASS: Edit price/min/max persists and shows on board");

  // 5. Reorder -> persists
  const listBefore = await api("/admin/products", adminToken);
  const originalOrder = listBefore.json.products.map((p) => p.id);
  const reversed = [...originalOrder].reverse();
  const reorderRes = await api("/admin/products/reorder", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds: reversed }),
  });
  assert.equal(reorderRes.status, 200);
  const listAfter = await api("/admin/products", adminToken);
  assert.equal(listAfter.json.products[0].id, reversed[0]);
  // restore original order
  await api("/admin/products/reorder", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds: originalOrder }),
  });
  console.log("PASS: Reorder persists");

  // 6. Deactivate -> gone from board, history intact
  const deactRes = await api(`/admin/products/${createdId}/status`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false }),
  });
  assert.equal(deactRes.status, 200);
  const boardAfterDeact = await api("/board/products", adminToken);
  assert.equal(
    boardAfterDeact.json.products.some((p) => p.id === createdId),
    false,
    "Deactivated product must not appear on board"
  );
  const detailAfterDeact = await api(`/admin/products/${createdId}`, adminToken);
  assert.equal(detailAfterDeact.status, 200);
  assert.ok(
    detailAfterDeact.json.product.priceTicks.length >= 2,
    "Price history must remain intact after deactivation"
  );
  // clean up test product (has no orders/trades)
  const delClean = await api(`/admin/products/${createdId}`, adminToken, {
    method: "DELETE",
  });
  assert.equal(delClean.status, 200);
  console.log("PASS: Deactivate removes from board while keeping price history intact");

  // 7. Delete product that has trades -> rejected
  const prodWithTrades = listBefore.json.products.find(
    (p) => p._count.trades > 0 || p._count.orders > 0
  );
  assert.ok(prodWithTrades, "Expected at least 1 seeded product with orders/trades");
  const delProtected = await api(`/admin/products/${prodWithTrades.id}`, adminToken, {
    method: "DELETE",
  });
  assert.equal(delProtected.status, 400, "Deleting product with trades/orders must be rejected");
  console.log("PASS: Deleting product with orders/trades rejected with 400");

  // 8. Settings update (response time, stop flag) -> persists & board reports stopped
  const updSettings = await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      responseTimeoutSeconds: 45,
      homeGoldMode: "2",
      tradingStopped: true,
    }),
  });
  assert.equal(updSettings.status, 200);
  assert.equal(updSettings.json.config.responseTimeoutSeconds, 45);
  assert.equal(updSettings.json.config.tradingStopped, true);

  const boardStatusStopped = await api("/board/status");
  assert.equal(boardStatusStopped.status, 200);
  assert.equal(boardStatusStopped.json.tradingStopped, true);

  const boardStopped = await api("/board/products", adminToken);
  assert.equal(boardStopped.json.tradingStopped, true);

  // Restore defaults
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      responseTimeoutSeconds: 60,
      homeGoldMode: "1",
      tradingStopped: false,
    }),
  });
  const boardStatusActive = await api("/board/status");
  assert.equal(boardStatusActive.json.tradingStopped, false);
  console.log("PASS: Settings update persists and board reports stopped state");

  console.log("B5_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
