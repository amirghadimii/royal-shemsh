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

function connectSocket(token) {
  return io(BASE, {
    auth: token ? { token } : undefined,
    transports: ["websocket"],
    reconnection: false,
  });
}

async function main() {
  const adminRes = await login("admin", "Royal@1405");
  assert.equal(adminRes.status, 200);
  const adminToken = adminRes.data.token;

  const parsianRes = await login("parsian", "User@1405");
  assert.equal(parsianRes.status, 200);
  const parsianToken = parsianRes.data.token;

  // 1. Unauthenticated socket rejected
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Unauth socket timeout")), 5000);
    const bad = connectSocket(null);
    let sawDisconnect = false;
    bad.on("auth_error", () => {
      sawDisconnect = true;
    });
    bad.on("disconnect", () => {
      clearTimeout(t);
      bad.close();
      resolve();
    });
    bad.on("connected", () => {
      clearTimeout(t);
      bad.close();
      reject(new Error("Unauthenticated socket should have been rejected"));
    });
    void sawDisconnect;
  });
  console.log("PASS: Unauthenticated socket connection rejected");

  // 2. Connect admin and parsian sockets
  const adminSock = connectSocket(adminToken);
  const parsianSock = connectSocket(parsianToken);

  await Promise.all([
    new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("admin connect timeout")), 5000);
      adminSock.once("connected", (d) => {
        clearTimeout(t);
        assert.equal(d.role, "ADMIN");
        res();
      });
    }),
    new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("parsian connect timeout")), 5000);
      parsianSock.once("connected", (d) => {
        clearTimeout(t);
        assert.equal(d.role, "REGULAR");
        res();
      });
    }),
  ]);
  console.log("PASS: Admin and regular clients connected with valid sessions");

  // 3. Ping/pong heartbeat
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("pong timeout")), 4000);
    adminSock.once("pong", (d) => {
      clearTimeout(t);
      assert.ok(typeof d.ts === "number");
      res();
    });
    adminSock.emit("ping");
  });
  console.log("PASS: Ping/pong heartbeat verified");

  // Find one product IN parsian's group and one OUTSIDE parsian's group
  const [adminBoard, parsianBoard] = await Promise.all([
    api("/board/products", adminToken),
    api("/board/products", parsianToken),
  ]);
  const parsianIds = new Set(parsianBoard.json.products.map((p) => p.id));
  const inGroupProd = parsianBoard.json.products[0];
  const outGroupProd = adminBoard.json.products.find((p) => !parsianIds.has(p.id));
  assert.ok(inGroupProd && outGroupProd, "Expected both in-group and out-group products");

  const adminEvents = [];
  const parsianEvents = [];
  const statusEvents = [];
  adminSock.on("price:update", (ev) => adminEvents.push(ev));
  parsianSock.on("price:update", (ev) => parsianEvents.push(ev));
  parsianSock.on("board:status", (ev) => statusEvents.push(ev));

  // 4. Manual price on IN-GROUP product -> both receive it
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: inGroupProd.id,
      buyPrice: "44610000",
      sellPrice: "44710000",
    }),
  });
  await new Promise((r) => setTimeout(r, 400));

  assert.ok(
    adminEvents.some((e) => e.productId === inGroupProd.id && e.buyPrice === "44610000"),
    "Admin did not receive price:update for in-group product"
  );
  assert.ok(
    parsianEvents.some((e) => e.productId === inGroupProd.id && e.buyPrice === "44610000"),
    "Regular user did not receive price:update for in-group product"
  );
  console.log("PASS: Both admin & regular user receive price:update for in-group product");

  // 5. Manual price on OUT-OF-GROUP product -> admin receives, parsian does NOT
  const parsianCountBefore = parsianEvents.length;
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: outGroupProd.id,
      buyPrice: "45110000",
      sellPrice: "45210000",
    }),
  });
  await new Promise((r) => setTimeout(r, 400));

  assert.ok(
    adminEvents.some((e) => e.productId === outGroupProd.id && e.buyPrice === "45110000"),
    "Admin did not receive price:update for out-group product"
  );
  assert.equal(
    parsianEvents.length,
    parsianCountBefore,
    "Regular user must NOT receive price:update for out-of-group product"
  );
  assert.ok(adminEvents[1].seq > adminEvents[0].seq, "Expected monotonically increasing seq");
  console.log("PASS: Out-of-group update blocked for regular user; monotonic seq verified");

  // 6. Stop flag toggled -> board:status received
  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tradingStopped: true }),
  });
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(statusEvents.some((s) => s.tradingStopped === true), "Expected tradingStopped=true event");

  await api("/admin/settings", adminToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tradingStopped: false }),
  });
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(statusEvents.some((s) => s.tradingStopped === false), "Expected tradingStopped=false event");
  console.log("PASS: board:status event received when stop flag toggled");

  // Restore original prices
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: inGroupProd.id,
      buyPrice: inGroupProd.buyPrice,
      sellPrice: inGroupProd.sellPrice,
    }),
  });
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: outGroupProd.id,
      buyPrice: outGroupProd.buyPrice,
      sellPrice: outGroupProd.sellPrice,
    }),
  });

  adminSock.close();
  parsianSock.close();
  console.log("B7_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
