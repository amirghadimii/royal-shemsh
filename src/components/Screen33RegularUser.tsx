"use client";

import Link from "next/link";
import {
  FileCheck2,
  Headphones,
  Inbox,
  Lock,
  ShieldAlert,
  User,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { CustomLevel3Header } from "@/components/CustomLevel3Header";
import { SCREEN1_BOARD_SYMBOLS } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";

const EMPTY_SECTIONS = [
  {
    title: "پیش‌سفارش‌های من",
    desc: "هیچ پیش‌سفارش فعالی برای حساب شما ثبت نشده است.",
  },
  {
    title: "معاملات من",
    desc: "تاکنون معامله قطعی در تاریخچه شما ثبت نگردیده است.",
  },
  {
    title: "حسابداری من (دفتر کل)",
    desc: "گردش مالی یا تراکنش ریالی/طلایی در این دوره موجود نیست.",
  },
  {
    title: "حواله‌های من (حواله فیزیکی)",
    desc: "درخواست تحویل فیزیکی یا حواله انتقال شمش ثبت نشده است.",
  },
];

const LOCKED_SERVICES = [
  { title: "پورسانت مشتری", href: "/commission?access=denied" },
  { title: "قیمتها (نمودار)", href: "/prices?access=denied" },
];

export function Screen33RegularUser() {
  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col">
      <CustomLevel3Header />

      <AppShell activeTab="home" hideHeader>
        <div className="space-y-3.5 -mt-2">
          {/* User Block */}
          <section className="flex items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-bg-card p-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold-soft text-gold">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-extrabold text-text-primary">
                    امیر قدیمی ۱
                  </h1>
                  <span className="rounded-md border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                    کاربر عادی
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-buy font-semibold">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-buy"
                    aria-hidden="true"
                  />
                  آنلاین • سامانه معاملات رویال شمش
                </p>
              </div>
            </div>
          </section>

          {/* Price Board — Identical 7 products & تومان prices to Screen 1 */}
          <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
            <div className="flex items-center justify-between border-b border-border-subtle bg-bg-elevated/60 px-3.5 py-2.5">
              <h2 className="text-xs font-extrabold text-gold">
                تابلوی زنده قیمت‌ها
              </h2>
              <span className="text-[10px] font-semibold text-text-secondary">
                نرخ آنی بازار تهران
              </span>
            </div>

            <div className="grid grid-cols-[1.45fr_1fr_1fr] items-center gap-1.5 border-b border-border-subtle bg-bg-primary/50 px-3 py-2 text-[10px] font-semibold">
              <div className="text-right text-text-secondary">
                نام نماد معاملاتی
              </div>
              <div className="flex justify-center">
                <span className="rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-buy">
                  خرید
                </span>
              </div>
              <div className="flex justify-end">
                <span className="rounded-full border border-sell/35 bg-sell-soft px-2.5 py-0.5 text-sell">
                  فروش
                </span>
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              {SCREEN1_BOARD_SYMBOLS.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.45fr_1fr_1fr] items-center gap-1.5 px-3 py-2.5"
                >
                  <div className="min-w-0 text-right">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-text-primary">
                        {item.name}
                      </span>
                      <span className="shrink-0 rounded-md border border-gold/25 bg-gold-soft px-1.5 py-0.5 text-[9px] font-semibold text-gold-t80">
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-text-secondary">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="tabular-nums-fa text-xs font-bold text-buy">
                      {formatFaNumber(item.buyPrice)}
                    </p>
                    <p className="text-[9px] text-text-muted">تومان</p>
                  </div>

                  <div className="text-left">
                    <p className="tabular-nums-fa text-xs font-bold text-sell">
                      {formatFaNumber(item.sellPrice)}
                    </p>
                    <p className="text-[9px] text-text-muted">تومان</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Access */}
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-extrabold text-text-primary">
              دسترسی‌های سریع کاربری
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/contact-profile"
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card px-2 py-3 text-center hover:border-gold/40"
              >
                <UserCheck className="h-4 w-4 text-gold" aria-hidden="true" />
                <span className="text-[10px] font-bold text-text-primary">
                  پروفایل کاربری من
                </span>
              </Link>
              <Link
                href="/attachments"
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card px-2 py-3 text-center hover:border-gold/40"
              >
                <FileCheck2 className="h-4 w-4 text-gold" aria-hidden="true" />
                <span className="text-[10px] font-bold text-text-primary">
                  مدارک و احراز هویت
                </span>
              </Link>
              <Link
                href="/contact-profile"
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card px-2 py-3 text-center hover:border-gold/40"
              >
                <Headphones className="h-4 w-4 text-gold" aria-hidden="true" />
                <span className="text-[10px] font-bold text-text-primary">
                  تماس با ما و پشتیبانی
                </span>
              </Link>
            </div>
          </section>

          {/* Four Empty Sections */}
          <section className="space-y-2.5">
            {EMPTY_SECTIONS.map((sec) => (
              <div
                key={sec.title}
                className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-text-primary">
                    {sec.title}
                  </h3>
                  <span className="tabular-nums-fa rounded-full border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                    تعداد: ۰
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border-subtle bg-bg-primary/60 p-2.5">
                  <Inbox
                    className="h-4 w-4 shrink-0 text-text-muted"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] font-bold text-text-primary">
                      موردی یافت نشد
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {sec.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Locked Services */}
          <section className="space-y-2.5">
            <h2 className="px-1 text-xs font-extrabold text-text-primary">
              سرویس‌های سازمانی و ویژه
            </h2>
            {LOCKED_SERVICES.map((srv) => (
              <Link
                key={srv.title}
                href={srv.href}
                className="block rounded-2xl border border-sell/45 bg-[#2A1217] p-3.5 space-y-1.5 hover:border-sell"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-text-primary">
                    {srv.title}
                  </span>
                  <Lock className="h-3.5 w-3.5 text-sell" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sell">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>شما به این سرویس دسترسی ندارید</span>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </AppShell>
    </div>
  );
}
