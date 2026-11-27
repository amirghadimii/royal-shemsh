import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:4001";

async function login(identifier, password) {
  const res = await fetch(`${BASE}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  return { status: res.status, data };
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
  const parsianId = parsianRes.data.user.id;

  const uniqueSuffix = Date.now().toString().slice(-5);
  const testUsername = `b4_user_${uniqueSuffix}`;
  const testMobile = `091288${uniqueSuffix}`;
  const testPass = "TestB4@1405";

  // 1. Create user
  const created = await api("/admin/users", adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: `کاربر تست ${uniqueSuffix}`,
      username: testUsername,
      mobile: testMobile,
      email: `${testUsername}@example.com`,
      roleCode: "REGULAR",
      password: testPass,
    }),
  });
  assert.equal(created.status, 201, `Create failed: ${JSON.stringify(created.json)}`);
  const userId = created.json.user.id;
  const userCode = created.json.user.code;

  // Appears in search by username & code
  const bySearch = await api(
    `/admin/users?search=${encodeURIComponent(testUsername)}`,
    adminToken
  );
  assert.equal(bySearch.status, 200);
  assert.ok(bySearch.json.users.some((u) => u.id === userId));

  const byCode = await api(`/admin/users?code=${userCode}`, adminToken);
  assert.equal(byCode.status, 200);
  assert.ok(byCode.json.users.some((u) => u.id === userId));

  // Can log in with set password
  const newLogin = await login(testUsername, testPass);
  assert.equal(newLogin.status, 200);
  const userToken = newLogin.data.token;
  console.log("PASS: Create user -> appears in list/search -> logs in with set password");

  // 2. Edit user -> persists
  const editedName = `کاربر ویرایش‌شده ${uniqueSuffix}`;
  const editRes = await api(`/admin/users/${userId}`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: editedName }),
  });
  assert.equal(editRes.status, 200);
  assert.equal(editRes.json.user.fullName, editedName);
  const verifyEdit = await api(`/admin/users?code=${userCode}`, adminToken);
  assert.equal(verifyEdit.json.users[0].fullName, editedName);
  console.log("PASS: Edit user persists");

  // 3. Deactivate -> login rejected; Reactivate -> login succeeds
  const deactRes = await api(`/admin/users/${userId}/status`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false }),
  });
  assert.equal(deactRes.status, 200);
  assert.equal(deactRes.json.user.isActive, false);

  const rejectedLogin = await login(testUsername, testPass);
  assert.equal(rejectedLogin.status, 401, "Deactivated user login must be rejected");

  const reactRes = await api(`/admin/users/${userId}/status`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: true }),
  });
  assert.equal(reactRes.status, 200);
  const okLoginAgain = await login(testUsername, testPass);
  assert.equal(okLoginAgain.status, 200);
  console.log("PASS: Deactivated user login rejected; reactivated user login succeeds");

  // 4. Group assignment changes /board/products
  const groupsRes = await api("/admin/groups", adminToken);
  assert.equal(groupsRes.status, 200);
  const groupWithProducts = groupsRes.json.groups.find((g) => g.productCount > 0);
  assert.ok(groupWithProducts, "Expected at least 1 group with products");

  const beforeBoard = await api("/board/products", userToken);
  assert.equal(beforeBoard.status, 200);
  assert.equal(beforeBoard.json.products.length, 0);

  const addGrp = await api(`/admin/users/${userId}/groups`, adminToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId: groupWithProducts.id }),
  });
  assert.equal(addGrp.status, 200);

  const afterAddBoard = await api("/board/products", userToken);
  assert.equal(afterAddBoard.status, 200);
  assert.ok(
    afterAddBoard.json.products.length > 0,
    "Expected board products after adding user to group"
  );

  const rmGrp = await api(
    `/admin/users/${userId}/groups/${groupWithProducts.id}`,
    adminToken,
    { method: "DELETE" }
  );
  assert.equal(rmGrp.status, 200);

  const afterRmBoard = await api("/board/products", userToken);
  assert.equal(afterRmBoard.status, 200);
  assert.equal(afterRmBoard.json.products.length, 0);
  console.log("PASS: Group assignment adds/removes products from /board/products");

  // 5. Upload valid PDF < 10 MB -> stored on disk & listed
  const pdfForm = new FormData();
  const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
  pdfForm.append("userId", userId);
  pdfForm.append("docType", "NATIONAL_ID");
  pdfForm.append("title", "کارت ملی تست");
  pdfForm.append(
    "file",
    new Blob([pdfBytes], { type: "application/pdf" }),
    "national-id.pdf"
  );

  const uploadOk = await api("/attachments", adminToken, {
    method: "POST",
    body: pdfForm,
  });
  assert.equal(uploadOk.status, 201, `Upload failed: ${JSON.stringify(uploadOk.json)}`);
  const storedName = uploadOk.json.attachment.storedName;
  assert.ok(storedName, "Expected storedName");
  const diskPath = path.resolve(process.cwd(), "backend", "uploads", "staging", storedName);
  assert.equal(fs.existsSync(diskPath), true, `Expected uploaded file on disk at ${diskPath}`);

  const listAdmin = await api(`/attachments?userId=${userId}`, adminToken);
  assert.equal(listAdmin.status, 200);
  assert.ok(listAdmin.json.attachments.some((a) => a.id === uploadOk.json.attachment.id));
  console.log("PASS: Valid PDF < 10MB uploaded, stored in uploads/staging, and listed");

  // 6. Upload .exe -> rejected 400
  const exeForm = new FormData();
  exeForm.append("userId", userId);
  exeForm.append("docType", "NATIONAL_ID");
  exeForm.append(
    "file",
    new Blob([Buffer.from("MZ...")], { type: "application/x-msdownload" }),
    "malware.exe"
  );
  const uploadExe = await api("/attachments", adminToken, {
    method: "POST",
    body: exeForm,
  });
  assert.equal(uploadExe.status, 400, `Expected 400 for .exe, got ${uploadExe.status}`);
  console.log("PASS: .exe upload rejected with 400");

  // 7. Upload > 10 MB PDF -> rejected 400
  const bigForm = new FormData();
  const bigBuf = Buffer.alloc(10 * 1024 * 1024 + 1024, 0x25);
  bigForm.append("userId", userId);
  bigForm.append("docType", "BUSINESS_LICENSE");
  bigForm.append(
    "file",
    new Blob([bigBuf], { type: "application/pdf" }),
    "too-large.pdf"
  );
  const uploadBig = await api("/attachments", adminToken, {
    method: "POST",
    body: bigForm,
  });
  assert.equal(uploadBig.status, 400, `Expected 400 for >10MB, got ${uploadBig.status}`);
  console.log("PASS: >10MB upload rejected with 400");

  // 8. Regular user listing another user's documents -> 403; own -> 200
  const otherList = await api(`/attachments?userId=${userId}`, parsianToken);
  assert.equal(otherList.status, 403, `Expected 403 for other user's docs, got ${otherList.status}`);

  const ownList = await api(`/attachments?userId=${parsianId}`, parsianToken);
  assert.equal(ownList.status, 200);
  console.log("PASS: Regular user listing another user's docs -> 403; own -> 200");

  console.log("B4_API_QA_PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
