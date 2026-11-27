import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { PrismaService } = require("../dist/prisma/prisma.service.js");

const prisma = new PrismaClient();
const service = new PrismaService();

async function main() {
  const [
    roleCount,
    userCount,
    groupCount,
    productGroupCount,
    productCount,
    tickCount,
    orderCount,
    preOrderCount,
    tradeCount,
    ledgerCount,
    remittanceCount,
    attachmentCount,
    notifCount,
    smsRuleCount,
    settingCount,
  ] = await Promise.all([
    prisma.role.count(),
    prisma.user.count(),
    prisma.userGroup.count(),
    prisma.productGroup.count(),
    prisma.product.count(),
    prisma.priceTick.count(),
    prisma.order.count(),
    prisma.preOrder.count(),
    prisma.trade.count(),
    prisma.ledgerEntry.count(),
    prisma.remittance.count(),
    prisma.attachment.count(),
    prisma.notification.count(),
    prisma.smsRule.count(),
    prisma.setting.count(),
  ]);

  assert.ok(roleCount >= 2, "Expected >= 2 roles");
  assert.ok(userCount >= 8, "Expected >= 8 users");
  assert.equal(groupCount, 10, "Expected 10 user groups");
  assert.equal(productGroupCount, 3, "Expected 3 product groups");
  assert.ok(productCount >= 25, "Expected >= 25 products");
  assert.ok(tickCount >= 25, "Expected >= 25 price_ticks");
  assert.ok(orderCount >= 1, "Expected >= 1 order");
  assert.ok(preOrderCount >= 1, "Expected >= 1 pre_order");
  assert.ok(tradeCount >= 3, "Expected >= 3 trades");
  assert.ok(ledgerCount >= 1, "Expected >= 1 ledger_entry");
  assert.ok(remittanceCount >= 1, "Expected >= 1 remittance");
  assert.ok(attachmentCount >= 1, "Expected >= 1 attachment");
  assert.ok(notifCount >= 1, "Expected >= 1 notification");
  assert.equal(smsRuleCount, 3, "Expected 3 SMS rules");
  assert.ok(settingCount >= 4, "Expected >= 4 settings");

  // Verify specific product limits
  const naghdeFarda = await prisma.product.findUniqueOrThrow({
    where: { code: "NAGHDE_FARDA" },
    include: { productGroup: true, priceTicks: true },
  });
  assert.equal(Number(naghdeFarda.minOrder), 1);
  assert.equal(Number(naghdeFarda.maxOrder), 1000);

  const naghdePasfarda = await prisma.product.findUniqueOrThrow({
    where: { code: "NAGHDE_PASFARDA" },
  });
  assert.equal(Number(naghdePasfarda.minOrder), 10);
  assert.equal(Number(naghdePasfarda.maxOrder), 1000);

  const emami86 = await prisma.product.findUniqueOrThrow({
    where: { code: "EMAMI_86" },
  });
  assert.equal(Number(emami86.minOrder), 1);
  assert.equal(Number(emami86.maxOrder), 100);

  // Relationship queries
  const admin = await prisma.user.findUniqueOrThrow({
    where: { code: 1 },
    include: {
      role: true,
      groupMemberships: { include: { group: true } },
      ledgerEntries: true,
      trades: true,
    },
  });
  assert.equal(admin.fullName, "امیر قدیمی");
  assert.equal(admin.role.code, "ADMIN");
  assert.ok(admin.groupMemberships.length >= 1);
  assert.ok(admin.ledgerEntries.length >= 1);

  const pendingOrder = await prisma.order.findFirstOrThrow({
    where: { quoteCode: "#RS-8831" },
    include: { user: true, product: true },
  });
  assert.equal(pendingOrder.quoteCode, "#RS-8831");

  // Immutability test 1: PostgreSQL trigger must reject raw DELETE on ledger_entries
  const docNum = admin.ledgerEntries[0].documentNumber;
  let dbTriggerError = "";
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "ledger_entries" WHERE "documentNumber" = $1`,
      docNum
    );
    assert.fail("Expected PostgreSQL trigger to block DELETE on ledger_entries");
  } catch (err) {
    dbTriggerError = err instanceof Error ? err.message : String(err);
    assert.match(dbTriggerError, /immutable and cannot be deleted/i);
  }

  // Immutability test 2: PrismaService.immutableClient must reject ORM delete
  let ormError = "";
  try {
    await service.immutableClient.ledgerEntry.delete({
      where: { documentNumber: docNum },
    });
    assert.fail("Expected PrismaService.immutableClient to block delete");
  } catch (err) {
    ormError = err instanceof Error ? err.message : String(err);
    assert.match(ormError, /cannot be deleted/i);
  }

  console.log(
    JSON.stringify(
      {
        status: "B1_QA_PASS",
        counts: {
          roles: roleCount,
          users: userCount,
          user_groups: groupCount,
          product_groups: productGroupCount,
          products: productCount,
          price_ticks: tickCount,
          orders: orderCount,
          pre_orders: preOrderCount,
          trades: tradeCount,
          ledger_entries: ledgerCount,
          remittances: remittanceCount,
          attachments: attachmentCount,
          notifications: notifCount,
          sms_rules: smsRuleCount,
          settings: settingCount,
        },
        immutabilityTests: {
          postgresTriggerBlockedDelete: true,
          ormGuardBlockedDelete: true,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error("B1_QA_FAIL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await service.$disconnect();
  });
