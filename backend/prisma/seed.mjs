import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const appEnv = process.env.APP_ENV ?? "staging";
if (
  process.env.NODE_ENV === "production" ||
  appEnv === "production" ||
  process.env.ALLOW_SAMPLE_SEED !== "true"
) {
  throw new Error(
    `Refusing to run sample seed: NODE_ENV=${process.env.NODE_ENV}, APP_ENV=${appEnv}, ALLOW_SAMPLE_SEED=${process.env.ALLOW_SAMPLE_SEED}`
  );
}

const prisma = new PrismaClient();
// STAGING-ONLY FIXTURE PASSWORDS — never used in production (blocked by NODE_ENV/APP_ENV guard above)
const ADMIN_SAMPLE_PASSWORD = process.env.STAGING_ADMIN_PASSWORD ?? "Royal@1405";
const MANAGER_SAMPLE_PASSWORD = process.env.STAGING_MANAGER_PASSWORD ?? "Manager@1405";
const REGULAR_SAMPLE_PASSWORD = process.env.STAGING_REGULAR_PASSWORD ?? "User@1405";

async function main() {
  // 1. Roles (ADMIN, SYSTEM_MANAGER, REGULAR)
  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      code: "ADMIN",
      name: "ادمین",
      level: 1,
      description: "مدیر ارشد سامانه • سطح دسترسی کامل مالی و شمش",
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { code: "SYSTEM_MANAGER" },
    update: {},
    create: {
      code: "SYSTEM_MANAGER",
      name: "مدیر سیستم",
      level: 2,
      description: "نظارت بر سفارشات، پیش‌خرید شمش و کنترل تسویه",
    },
  });

  const regularRole = await prisma.role.upsert({
    where: { code: "REGULAR" },
    update: {},
    create: {
      code: "REGULAR",
      name: "کاربر عادی",
      level: 3,
      description: "دسترسی کاربر عادی بر اساس گروه کاربری",
    },
  });

  // 2. Users (8 sample users from Screen 27)
  const adminPasswordHash = await bcrypt.hash(ADMIN_SAMPLE_PASSWORD, 10);
  const managerPasswordHash = await bcrypt.hash(MANAGER_SAMPLE_PASSWORD, 10);
  const regularPasswordHash = await bcrypt.hash(REGULAR_SAMPLE_PASSWORD, 10);
  const usersSeed = [
    {
      code: 1,
      username: "admin",
      fullName: "امیر قدیمی",
      mobile: "09120000001",
      email: "user1@sample.ir",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      isOnline: true,
      creditLimitToman: "200000000",
      goldBalanceGrams: "450.0000",
    },
    {
      code: 2,
      username: "shahin",
      fullName: "شاهین جمشیدی",
      mobile: "09120000002",
      email: "user2@sample.ir",
      passwordHash: managerPasswordHash,
      roleId: managerRole.id,
      isOnline: true,
      creditLimitToman: "500000000",
      goldBalanceGrams: "1200.0000",
    },
    {
      code: 3,
      username: "amin",
      fullName: "امین صفری",
      mobile: "09120000003",
      email: "user3@sample.ir",
      roleId: managerRole.id,
      isOnline: false,
      creditLimitToman: "350000000",
      goldBalanceGrams: "800.0000",
    },
    {
      code: 4,
      username: "kiarash",
      fullName: "کیارش پورسلیک",
      mobile: "09120000004",
      email: "user4@sample.ir",
      roleId: managerRole.id,
      isOnline: true,
      creditLimitToman: "5000000000",
      goldBalanceGrams: "500.0000",
    },
    {
      code: 5,
      username: "mahdi",
      fullName: "مهدی علوی",
      mobile: "09120000005",
      email: "user5@sample.ir",
      roleId: managerRole.id,
      isOnline: false,
      creditLimitToman: "200000000",
      goldBalanceGrams: "80.0000",
    },
    {
      code: 6,
      username: "parsian",
      fullName: "صرافی پارسیان",
      mobile: "09120000006",
      email: "user6@sample.ir",
      passwordHash: regularPasswordHash,
      roleId: regularRole.id,
      isOnline: true,
      creditLimitToman: "1000000000",
      goldBalanceGrams: "620.0000",
    },
    {
      code: 7,
      username: "kian_gold",
      fullName: "کیان طلا",
      mobile: "09120000007",
      email: "user7@sample.ir",
      passwordHash: regularPasswordHash,
      roleId: regularRole.id,
      isOnline: false,
      creditLimitToman: "300000000",
      goldBalanceGrams: "240.0000",
    },
    {
      code: 8,
      username: "kourosh",
      fullName: "جواهری کوروش",
      mobile: "09120000008",
      email: "user8@sample.ir",
      passwordHash: regularPasswordHash,
      roleId: regularRole.id,
      isOnline: false,
      creditLimitToman: "150000000",
      goldBalanceGrams: "-35.0000",
    },
  ];

  const userMap = new Map();
  for (const u of usersSeed) {
    const saved = await prisma.user.upsert({
      where: { code: u.code },
      update: {
        roleId: u.roleId,
        ...(u.passwordHash ? { passwordHash: u.passwordHash } : {}),
      },
      create: u,
    });
    userMap.set(u.code, saved);
  }

  // 3. 10 User Groups (Screen 28)
  const groupsSeed = [
    { number: 1, name: "امین", description: "۲۴ معامله‌گر شمش" },
    { number: 2, name: "عضو های جدید", description: "۱۱۵ کاربر در انتظار احراز هویت" },
    { number: 3, name: "درجه سه", description: "سقف مجاز: ۵۰ گرم در روز" },
    { number: 4, name: "شاهین 2", description: "معاملات عمده و شمش سنگین" },
    { number: 5, name: "درجه یک", description: "تسویه آنی بدون کارمزد اضافه" },
    { number: 6, name: "خانگی", description: "خرید خرد و پس‌انداز شمش پلاک" },
    { number: 7, name: "متغیر", description: "اسپرد منعطف بسته به حجم بازاری" },
    { number: 8, name: "شاهین", description: "۴۲ کارگزار ارشد و بنکدار" },
    { number: 9, name: "درجه دو", description: "سقف اعتباری: ۵۰۰ گرم طلا" },
    { number: 10, name: "هوم گلد", description: "مشتریان وفادار باشگاه طلایی رویال" },
  ];

  const groupMap = new Map();
  for (const g of groupsSeed) {
    const saved = await prisma.userGroup.upsert({
      where: { number: g.number },
      update: {
        leaderName: g.number === 10 ? "شاهین جمشیدی" : "امین صفری",
        commissionRateToman: 65000,
      },
      create: {
        ...g,
        leaderName: g.number === 10 ? "شاهین جمشیدی" : "امین صفری",
        commissionRateToman: 65000,
      },
    });
    groupMap.set(g.number, saved);
  }

  // Group memberships
  const adminUser = userMap.get(1);
  const kiarashUser = userMap.get(4);
  const group5 = groupMap.get(5);
  const group10 = groupMap.get(10);
  if (adminUser && group10) {
    await prisma.userGroupMember.upsert({
      where: {
        userId_groupId: { userId: adminUser.id, groupId: group10.id },
      },
      update: {},
      create: { userId: adminUser.id, groupId: group10.id },
    });
  }
  if (kiarashUser && group5) {
    await prisma.userGroupMember.upsert({
      where: {
        userId_groupId: { userId: kiarashUser.id, groupId: group5.id },
      },
      update: {},
      create: { userId: kiarashUser.id, groupId: group5.id },
    });
  }

  // Group memberships: parsian (code 6, REGULAR) -> group 10; kourosh (code 8, REGULAR) -> no groups
  const parsianUser = userMap.get(6);
  const kouroshUser = userMap.get(8);
  if (parsianUser && group10) {
    await prisma.userGroupMember.upsert({
      where: {
        userId_groupId: { userId: parsianUser.id, groupId: group10.id },
      },
      update: {},
      create: { userId: parsianUser.id, groupId: group10.id },
    });
  }
  if (kouroshUser) {
    await prisma.userGroupMember.deleteMany({
      where: { userId: kouroshUser.id },
    });
  }

  // 4. Product Groups (3) & 25 Products
  const bullionGroup = await prisma.productGroup.upsert({
    where: { code: "BULLION" },
    update: {},
    create: { code: "BULLION", name: "طلای آبشده و شمش", sortOrder: 1 },
  });
  const coinGroup = await prisma.productGroup.upsert({
    where: { code: "COINS" },
    update: {},
    create: { code: "COINS", name: "مسکوکات", sortOrder: 2 },
  });
  const fxGroup = await prisma.productGroup.upsert({
    where: { code: "FX" },
    update: {},
    create: { code: "FX", name: "ارز", sortOrder: 3 },
  });

  const productsSeed = [
    { code: "NAGHDE_FARDA", name: "نقد فردا", badge: "طلا", subtitle: "تسویه فردا", unit: "گرم", purity: "۷۵۰ / ۹۹۵", groupId: bullionGroup.id, buy: "44280000", sell: "44320000", min: "1", max: "1000" },
    { code: "NAGHDE_PASFARDA", name: "نقد پس‌فردا", badge: "طلا", subtitle: "تسویه ۲ روزه", unit: "گرم", purity: "۷۵۰ / ۹۹۵", groupId: bullionGroup.id, buy: "44300000", sell: "44350000", min: "10", max: "1000" },
    { code: "EMAMI_86", name: "سکه امامی ۸۶", badge: "طرح جدید", subtitle: "۸.۱۳۳ گرم ۲۲ عیار", unit: "عدد", purity: "۲۲ عیار", groupId: coinGroup.id, buy: "51100000", sell: "51250000", min: "1", max: "100" },
    { code: "NIM_SEKKEH", name: "نیم سکه", badge: "بانکی", subtitle: "۴.۰۶۶ گرم ۲۲ عیار", unit: "عدد", purity: "۲۲ عیار", groupId: coinGroup.id, buy: "27400000", sell: "27550000", min: "1", max: "200" },
    { code: "ROB_SEKKEH", name: "ربع سکه", badge: "بانکی", subtitle: "۲.۰۳۳ گرم ۲۲ عیار", unit: "عدد", purity: "۲۲ عیار", groupId: coinGroup.id, buy: "17100000", sell: "17250000", min: "1", max: "300" },
    { code: "GERAMI_BANKI", name: "گرمی بانکی", badge: "وکیوم", subtitle: "۱.۰۱ گرم ۲۲ عیار", unit: "عدد", purity: "۲۲ عیار", groupId: coinGroup.id, buy: "8400000", sell: "8500000", min: "1", max: "500" },
    { code: "USD_CASH", name: "دلار آمریکا", badge: "اسکناس", subtitle: "تحویل تهران نقدی", unit: "دلار", purity: null, groupId: fxGroup.id, buy: "69200", sell: "69400", min: "100", max: "50000" },
    { code: "BAHAR_GHADIM", name: "بهار آزادی / قدیم", badge: "طرح قدیم", subtitle: "۸.۱۳۳ گرم ۲۲ عیار", unit: "عدد", purity: "۲۲ عیار", groupId: coinGroup.id, buy: "48900000", sell: "49100000", min: "1", max: "100" },
    { code: "EURO_CASH", name: "یورو (EURO)", badge: "اسکناس", subtitle: "حواله و اسکناس تهران", unit: "یورو", purity: null, groupId: fxGroup.id, buy: "74500", sell: "74800", min: "100", max: "50000" },
    { code: "AED_DIRHAM", name: "درهم امارات (AED)", badge: "حواله", subtitle: "تسویه دبی و تهران", unit: "درهم", purity: null, groupId: fxGroup.id, buy: "18850", sell: "18950", min: "500", max: "200000" },
    { code: "CNY_YUAN", name: "یوان چین (CNY)", badge: "حواله", subtitle: "حواله تجاری شانگهای", unit: "یوان", purity: null, groupId: fxGroup.id, buy: "9650", sell: "9750", min: "1000", max: "300000" },
    { code: "ABSHODEH_NAGHDI", name: "طلای آبشده نقدی", badge: "آبشده", subtitle: "تسویه هم‌روز", unit: "مثقال", purity: "۷۵۰", groupId: bullionGroup.id, buy: "28450000", sell: "28520000", min: "1", max: "500" },
    { code: "BULLION_1G", name: "شمش ۱ گرمی رویال", badge: "پلمپ", subtitle: "شمش استاندارد ۲۴ عیار", unit: "عدد", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "5950000", sell: "6020000", min: "1", max: "200" },
    { code: "BULLION_5G", name: "شمش ۵ گرمی رویال", badge: "پلمپ", subtitle: "شمش استاندارد ۲۴ عیار", unit: "عدد", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "29600000", sell: "29800000", min: "1", max: "100" },
    { code: "BULLION_10G", name: "شمش ۱۰ گرمی رویال", badge: "پلمپ", subtitle: "شمش استاندارد ۲۴ عیار", unit: "عدد", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "59100000", sell: "59400000", min: "1", max: "100" },
    { code: "BULLION_50G", name: "شمش ۵۰ گرمی رویال", badge: "پلمپ", subtitle: "شمش استاندارد ۲۴ عیار", unit: "عدد", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "295000000", sell: "296200000", min: "1", max: "50" },
    { code: "BULLION_100G", name: "شمش ۱۰۰ گرمی رویال", badge: "پلمپ", subtitle: "شمش استاندارد ۲۴ عیار", unit: "عدد", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "589500000", sell: "591000000", min: "1", max: "50" },
    { code: "BULLION_VENUS", name: "شمش ونوس ۲۴ عیار", badge: "خزانه", subtitle: "تحویل فیزیکی ونوس", unit: "گرم", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "44280000", sell: "44340000", min: "10", max: "1000" },
    { code: "BULLION_NADIR", name: "شمش نادیر", badge: "وارداتی", subtitle: "شمش سوئیسی و ترک", unit: "گرم", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "44350000", sell: "44420000", min: "10", max: "1000" },
    { code: "BULLION_UAE", name: "شمش امارات", badge: "صادراتی", subtitle: "عیار ۹۹۵ استاندارد", unit: "گرم", purity: "۹۹۵", groupId: bullionGroup.id, buy: "44180000", sell: "44250000", min: "10", max: "1000" },
    { code: "PLAQUE_STANDARD", name: "پلاک استاندارد ۱۸ عیار", badge: "پلاک", subtitle: "عیار ۷۵۰", unit: "گرم", purity: "۷۵۰", groupId: bullionGroup.id, buy: "4410000", sell: "4430000", min: "5", max: "1000" },
    { code: "CERT_BULLION", name: "گواهی سپرده شمش", badge: "بورسی", subtitle: "تضمین خزانه مرکزی", unit: "گرم", purity: "۹۹۹.۹", groupId: bullionGroup.id, buy: "44290000", sell: "44330000", min: "1", max: "1000" },
    { code: "EMAMI_BELOW_86", name: "سکه امامی زیر ۸۶", badge: "تاریخی", subtitle: "۸.۱۳۳ گرم ۲۲ عیار", unit: "عدد", purity: "۲۲ عیار", groupId: coinGroup.id, buy: "49800000", sell: "50000000", min: "1", max: "100" },
    { code: "GOLD_18K_RAW", name: "طلای ۱۸ عیار مبنا", badge: "مرجع", subtitle: "مظنه مرجع ۱۸ عیار", unit: "گرم", purity: "۷۵۰", groupId: bullionGroup.id, buy: "4415000", sell: "4425000", min: "1", max: "1000" },
    { code: "USD_REMITTANCE", name: "دلار حواله", badge: "حواله", subtitle: "حواله بانکی امارات", unit: "دلار", purity: null, groupId: fxGroup.id, buy: "69500", sell: "69800", min: "500", max: "100000" },
  ];

  const productMap = new Map();
  for (let i = 0; i < productsSeed.length; i++) {
    const p = productsSeed[i];
    const saved = await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        badge: p.badge,
        subtitle: p.subtitle,
        unit: p.unit,
        purity: p.purity,
        productGroupId: p.groupId,
        buyPrice: p.buy,
        sellPrice: p.sell,
        minOrder: p.min,
        maxOrder: p.max,
        sortOrder: i + 1,
      },
    });
    productMap.set(p.code, saved);
  }

  // Grant group 10 (هوم گلد) access to the 7 main board products
  if (group10) {
    const boardCodes = [
      "NAGHDE_FARDA",
      "NAGHDE_PASFARDA",
      "EMAMI_86",
      "NIM_SEKKEH",
      "ROB_SEKKEH",
      "GERAMI_BANKI",
      "USD_CASH",
    ];
    for (const code of boardCodes) {
      const prod = productMap.get(code);
      if (prod) {
        await prisma.userGroupProduct.upsert({
          where: {
            groupId_productId: { groupId: group10.id, productId: prod.id },
          },
          update: {},
          create: { groupId: group10.id, productId: prod.id },
        });
      }
    }
  }

  // 5. Initial price_ticks (if empty)
  const existingTicks = await prisma.priceTick.count();
  if (existingTicks === 0) {
    for (const p of productsSeed) {
      const prod = productMap.get(p.code);
      await prisma.priceTick.create({
        data: {
          productId: prod.id,
          buyPrice: p.buy,
          sellPrice: p.sell,
          source: "STAGING_SEED",
        },
      });
    }
  }

  // 6. Orders (including PENDING_APPROVAL #RS-8831 from Screen 16)
  const naghdeFarda = productMap.get("NAGHDE_FARDA");
  const naghdePasfarda = productMap.get("NAGHDE_PASFARDA");
  const emami86 = productMap.get("EMAMI_86");

  const orderPending = await prisma.order.upsert({
    where: { quoteCode: "#RS-8831" },
    update: {},
    create: {
      quoteCode: "#RS-8831",
      userId: kiarashUser.id,
      productId: naghdePasfarda.id,
      side: "BUY",
      quantity: "250.0000",
      unitPrice: "110145000",
      totalAmount: "27536250000",
      status: "PENDING_APPROVAL",
      expiresAt: new Date(Date.now() + 60 * 1000),
    },
  });

  // 7. Trades & Ledger Entries (immutable accounting documents)
  const trade1 = await prisma.trade.upsert({
    where: { tradeCode: "#RS-9941" },
    update: {},
    create: {
      tradeCode: "#RS-9941",
      userId: adminUser.id,
      productId: naghdeFarda.id,
      side: "BUY",
      quantity: "10.0000",
      unitPrice: "44280000",
      totalAmount: "442800000",
      settlementTerm: "فردا",
      audited: true,
      status: "APPROVED",
    },
  });

  await prisma.trade.upsert({
    where: { tradeCode: "#RS-9942" },
    update: {},
    create: {
      tradeCode: "#RS-9942",
      orderId: orderPending.id,
      userId: adminUser.id,
      productId: naghdePasfarda.id,
      side: "BUY",
      quantity: "25.0000",
      unitPrice: "44300000",
      totalAmount: "1108750000",
      settlementTerm: "۲ روزه",
      audited: false,
      status: "PENDING",
    },
  });

  await prisma.trade.upsert({
    where: { tradeCode: "#RS-9940" },
    update: {},
    create: {
      tradeCode: "#RS-9940",
      userId: adminUser.id,
      productId: emami86.id,
      side: "SELL",
      quantity: "2.0000",
      unitPrice: "51250000",
      totalAmount: "102500000",
      settlementTerm: "نقدی",
      audited: false,
      status: "REJECTED",
      rejectionReason: "عدم کفایت موجودی خزانه و تکمیل سقف حواله روزانه",
    },
  });

  await prisma.ledgerEntry.upsert({
    where: { documentNumber: "DOC-1405-0001" },
    update: {},
    create: {
      documentNumber: "DOC-1405-0001",
      userId: adminUser.id,
      tradeId: trade1.id,
      entryType: "GOLD_IN",
      rialAmount: "442800000",
      goldGrams: "10.0000",
      description: "ثبت نمونه خرید نقد فردا ۱۰ گرم شمش ونوس",
      isFinalized: true,
    },
  });

  // 8. Pre-order, Remittance, Attachment, Notification
  const existingPreOrders = await prisma.preOrder.count();
  if (existingPreOrders === 0) {
    await prisma.preOrder.create({
      data: {
        userId: kiarashUser.id,
        productId: naghdeFarda.id,
        createdByAdminId: adminUser.id,
        side: "BUY",
        targetPrice: "44150000",
        weightGrams: "10.0000",
        feeAmount: "441500",
        totalAmount: "441500000",
        status: "ACTIVE",
        isManual: true,
      },
    });
  }

  await prisma.remittance.upsert({
    where: { remittanceCode: "REM-1405-9824" },
    update: {},
    create: {
      remittanceCode: "REM-1405-9824",
      userId: userMap.get(5).id,
      type: "GOLD_WEIGHT",
      weightGrams: "50.0000",
      cashAmount: "2214000000",
      warehouse: "خزانه مرکزی رویال شمش ونوس",
      barcodeNote: "بابت تسویه فاکتور شماره ۹۸۲۴ - تحویل فیزیکی با بارکد پلمپ امنیتی",
      status: "PENDING",
    },
  });

  const existingAttachments = await prisma.attachment.count();
  if (existingAttachments === 0) {
    await prisma.attachment.create({
      data: {
        userId: adminUser.id,
        docType: "NATIONAL_ID",
        title: "تصویر روی کارت ملی هوشمند",
        fileName: "national-id-sample.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 245760,
        status: "APPROVED",
      },
    });
  }

  const existingNotifs = await prisma.notification.count();
  if (existingNotifs === 0) {
    await prisma.notification.create({
      data: {
        title: "شروع کار سامانه رویال شمش ۱۰:۳۰ الی ۲۱:۰۰",
        body: "نقد فردا و مسکوکات روز چهارشنبه است، نقد پس‌فردا روز شنبه است، و شماره حساب بانکی باید حداکثر تا ساعت ۱۰:۰۰ ارسال شود.",
        category: "NORMAL",
        priorityColor: "GOLD",
        onlineOnly: true,
        isPinned: true,
      },
    });
  }

  // 9. 3 SMS Rules (Screen 30)
  const smsRules = [
    {
      code: "#RM-101",
      title: "شروع معاملات آبشده",
      triggerType: "MANUAL",
      triggerCondition: "هدف: کلیه خریداران و فروشندگان تاییدشده",
      templateText:
        "«همکار گرامی؛ معاملات تابلوی طلای آبشده و شمش رویال هم‌اکنون رأس ساعت ۱۰:۳۰ آغاز شد.»",
      extraNote: null,
    },
    {
      code: "#RM-204",
      title: "پس از رد معامله",
      triggerType: "AUTO_SYSTEM",
      triggerCondition: "محرک: ثبت وضعیت رد در داشبورد تسویه",
      templateText:
        "«درخواست معامله شماره #RS با علت عدم تایید اعتبار رد گردید.»",
      extraNote: "ارسال آنی کمتر از ۳ ثانیه",
    },
    {
      code: "#RM-309",
      title: "پس از تایید معامله",
      triggerType: "AUTO_SYSTEM",
      triggerCondition: "محرک: ثبت نهایی سند در خزانه رویال شمش",
      templateText:
        "«درخواست معامله شما با موفقیت تایید و سند قطعی صادر شد.»",
      extraNote: "شامل شماره رهگیری و فاکتور آنلاین",
    },
  ];

  for (const r of smsRules) {
    await prisma.smsRule.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // 10. Settings (Screen 29)
  const settingsSeed = [
    { key: "response_timeout_seconds", value: "60", description: "مدت زمان پاسخ (ثانیه)" },
    { key: "home_gold_mode", value: "1", description: "نحوه ارتباط با هوم گلد" },
    { key: "working_hours", value: "۱۰:۳۰ تا ۲۱:۰۰", description: "ساعت کاری بازار" },
    { key: "trading_stopped", value: "false", description: "توقف معاملات توسط مدیر" },
    {
      key: "portal_notice_text",
      value:
        "همکار گرامی؛ نقد فردا و مسکوکات روز چهارشنبه، نقد پس‌فردا روز شنبه تسویه می‌شود. مهلت ارسال شماره حساب بانکی حداکثر تا ساعت ۱۰:۰۰ می‌باشد.",
      description: "متن اطلاعیه تابلو اعلان زنده",
    },
  ];

  for (const s of settingsSeed) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Ensure every APPROVED trade has balanced double-entry ledger entries
  let treasury = await prisma.user.findUnique({
    where: { username: "system_treasury" },
  });
  if (!treasury) {
    treasury = await prisma.user.create({
      data: {
        code: 0,
        username: "system_treasury",
        fullName: "خزانه مرکزی رویال شمش",
        mobile: "09000000000",
        roleId: adminRole.id,
        isActive: false,
      },
    });
  }
  const missingLedgerTrades = await prisma.trade.findMany({
    where: { status: "APPROVED", ledgerEntries: { none: {} } },
    include: { product: true },
  });
  for (const tr of missingLedgerTrades) {
    const isBuy = tr.side === "BUY";
    const docPrefix = `DOC-${tr.tradeCode}`;
    await prisma.ledgerEntry.createMany({
      data: [
        {
          documentNumber: `${docPrefix}-UC`,
          userId: tr.userId,
          tradeId: tr.id,
          productId: tr.productId,
          entryType: isBuy ? "DEBIT" : "CREDIT",
          rialAmount: tr.totalAmount,
          goldGrams: 0,
          description: `${isBuy ? "بدهکار خرید" : "بستانکار فروش"} ${tr.product.name} (${tr.tradeCode})`,
          isFinalized: true,
        },
        {
          documentNumber: `${docPrefix}-TC`,
          userId: treasury.id,
          tradeId: tr.id,
          productId: tr.productId,
          entryType: isBuy ? "CREDIT" : "DEBIT",
          rialAmount: tr.totalAmount,
          goldGrams: 0,
          description: `طرف خزانه وجه ${tr.product.name} (${tr.tradeCode})`,
          isFinalized: true,
        },
        {
          documentNumber: `${docPrefix}-UG`,
          userId: tr.userId,
          tradeId: tr.id,
          productId: tr.productId,
          entryType: isBuy ? "GOLD_IN" : "GOLD_OUT",
          rialAmount: 0,
          goldGrams: tr.quantity,
          description: `${isBuy ? "ورود کالای" : "خروج کالای"} ${tr.product.name} (${tr.tradeCode})`,
          isFinalized: true,
        },
        {
          documentNumber: `${docPrefix}-TG`,
          userId: treasury.id,
          tradeId: tr.id,
          productId: tr.productId,
          entryType: isBuy ? "GOLD_OUT" : "GOLD_IN",
          rialAmount: 0,
          goldGrams: tr.quantity,
          description: `طرف خزانه کالای ${tr.product.name} (${tr.tradeCode})`,
          isFinalized: true,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log("STAGING_SEED_OK");
}

main()
  .catch((err) => {
    console.error("SEED_ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
