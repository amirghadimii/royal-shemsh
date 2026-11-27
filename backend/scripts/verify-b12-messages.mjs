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

  const rulesInit = await api("/admin/sms-rules", adminToken);
  assert.equal(rulesInit.status, 200);
  assert.equal(rulesInit.json.rules.length, 3);
  const manualRule = rulesInit.json.rules.find((r) => r.triggerType === "MANUAL");
  const rejectRule = rulesInit.json.rules.find((r) =>
    r.title.includes("پس از رد معامله")
  );
  assert.ok(manualRule && rejectRule);

  // 1. Regular user -> 403 on all admin message/notification/sms-rule endpoints
  for (const [m, p] of [
    ["POST", "/admin/messages"],
    ["PATCH", "/admin/messages/last-normal"],
    ["GET", "/admin/notifications"],
    ["GET", "/admin/sms-rules"],
    ["PATCH", `/admin/sms-rules/${rejectRule.id}`],
    ["POST", `/admin/sms-rules/${manualRule.id}/send-manual`],
  ]) {
    const r = await api(p, parsianToken, {
      method: m,
      headers: m !== "GET" ? { "Content-Type": "application/json" } : {},
      body: m !== "GET" ? JSON.stringify({}) : undefined,
    });
    assert.equal(r.status, 403, `Expected 403 for REGULAR ${m} ${p}, got ${r.status}`);
  }
  console.log("PASS: Regular user receives 403 on all admin message/notification/sms endpoints");

  // 2. Send message to ALL -> both parsian & kourosh receive it; mark-as-read works
  const allTitle = `اطلاعیه همگانی ${Date.now()}`;
  const sendAll = await api("/admin/messages", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: allTitle,
      body: "متن پیام همگانی آزمایشی",
      category: "NORMAL",
      priorityColor: "GOLD",
      audience: "ALL",
    }),
  });
  assert.equal(sendAll.status, 201);
  const msgAllId = sendAll.json.message.id;

  const parsianMine1 = await api("/messages/mine", parsianToken);
  const kouroshMine1 = await api("/messages/mine", kouroshToken);
  assert.ok(parsianMine1.json.messages.some((m) => m.id === msgAllId && !m.isRead));
  assert.ok(kouroshMine1.json.messages.some((m) => m.id === msgAllId));

  const readRes = await api(`/messages/${msgAllId}/read`, parsianToken, {
    method: "POST",
  });
  assert.equal(readRes.status, 200);
  const parsianMineAfterRead = await api("/messages/mine", parsianToken);
  assert.equal(
    parsianMineAfterRead.json.messages.find((m) => m.id === msgAllId).isRead,
    true
  );
  console.log("PASS: Send to ALL delivered to all users and mark-as-read works");

  // 3. Online-only send -> only connected socket user receives it
  const parsianSock = io(BASE, {
    auth: { token: parsianToken },
    transports: ["websocket"],
    reconnection: false,
  });
  await new Promise((res) => parsianSock.once("connected", res));

  const onlineTitle = `پیام آنلاین ${Date.now()}`;
  const sendOnline = await api("/admin/messages", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: onlineTitle,
      body: "فقط برای کاربران آنلاین",
      category: "OFFICIAL_CIRCULAR",
      priorityColor: "GREEN",
      audience: "ONLINE_ONLY",
    }),
  });
  assert.equal(sendOnline.status, 201);
  const msgOnlineId = sendOnline.json.message.id;

  const parsianMine2 = await api("/messages/mine", parsianToken);
  const kouroshMine2 = await api("/messages/mine", kouroshToken);
  assert.ok(parsianMine2.json.messages.some((m) => m.id === msgOnlineId));
  assert.equal(
    kouroshMine2.json.messages.some((m) => m.id === msgOnlineId),
    false,
    "Offline user must not receive ONLINE_ONLY message"
  );
  parsianSock.close();
  console.log("PASS: ONLINE_ONLY message delivered only to connected socket users");

  // 4. Announcement + edit last normal message
  const ann1 = await api("/messages/announcement");
  assert.equal(ann1.json.announcement.title, allTitle);

  const editedBody = `متن ویرایش‌شده اطلاعیه ${Date.now()}`;
  const editLast = await api("/admin/messages/last-normal", adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: editedBody }),
  });
  assert.equal(editLast.status, 200);

  const ann2 = await api("/messages/announcement");
  assert.equal(ann2.json.announcement.body, editedBody);
  console.log("PASS: Announcement returns latest NORMAL message & edit-last-normal updates it");

  // 5. Notifications archive filters
  const notifCirc = await api(
    "/admin/notifications?type=OFFICIAL_CIRCULAR",
    adminToken
  );
  assert.ok(notifCirc.json.notifications.some((n) => n.title === onlineTitle));
  const notifApproved = await api("/admin/notifications?status=approved", adminToken);
  assert.ok(
    notifApproved.json.notifications.every((n) => n.title.includes("تایید"))
  );
  console.log("PASS: Notifications archive filters return matching subsets");

  // 6. SMS rule deactivate -> reject order -> NO stub row; reactivate -> reject -> stub row created
  const parsianBoard = await api("/board/products", parsianToken);
  const prod = parsianBoard.json.products[0];
  await api("/admin/prices/manual", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: prod.id,
      buyPrice: prod.buyPrice,
      sellPrice: prod.sellPrice,
    }),
  });

  await api(`/admin/sms-rules/${rejectRule.id}`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false }),
  });

  const ordOff = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "1" }),
  });
  await api(`/orders/${ordOff.json.order.id}/reject`, adminToken, {
    method: "POST",
  });
  const stubsOff = await api(
    `/orders/sms-stubs?orderId=${ordOff.json.order.id}`,
    adminToken
  );
  assert.equal(stubsOff.json.logs.length, 0, "Deactivated SMS rule must write 0 stub rows");

  await api(`/admin/sms-rules/${rejectRule.id}`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: true }),
  });
  const ordOn = await api("/orders", parsianToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: prod.id, side: "BUY", quantity: "1" }),
  });
  await api(`/orders/${ordOn.json.order.id}/reject`, adminToken, {
    method: "POST",
  });
  const stubsOn = await api(
    `/orders/sms-stubs?orderId=${ordOn.json.order.id}`,
    adminToken
  );
  assert.equal(stubsOn.json.logs.length, 1);
  assert.equal(stubsOn.json.logs[0].status, "STUB");
  assert.equal(stubsOn.json.logs[0].body, rejectRule.templateText);
  console.log("PASS: SMS rule active flag honoured on reject (0 stub when off, 1 STUB when on)");

  // 7. Manual SMS send -> 1 STUB row per active user
  const usersRes = await api("/admin/users", adminToken);
  const activeCount = usersRes.json.users.filter(
    (u) => u.isActive && u.username !== "system_treasury"
  ).length;
  const manualSend = await api(
    `/admin/sms-rules/${manualRule.id}/send-manual`,
    adminToken,
    { method: "POST" }
  );
  assert.equal(manualSend.status, 200);
  assert.equal(manualSend.json.count, activeCount);
  assert.ok(manualSend.json.logs.every((l) => l.status === "STUB"));
  console.log(`PASS: Manual SMS send wrote ${activeCount} STUB rows (1 per active user)`);

  console.log("B12_MESSAGES_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
