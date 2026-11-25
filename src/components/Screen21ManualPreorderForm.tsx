"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { AppShell, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";

const PRODUCT_OPTIONS = [
  { value: "naghde-farda", label: "نقد فردا (تحویل فردایی شمش رویال)" },
  { value: "naghde-pasfarda", label: "نقد پس‌فردا" },
  { value: "emami-86", label: "سکه امامی ۸۶" },
  { value: "nim-sekkeh", label: "نیم سکه" },
  { value: "rob-sekkeh", label: "ربع سکه" },
  { value: "usd", label: "دلار آمریکا" },
];

export function Screen21ManualPreorderForm() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [product, setProduct] = useState("naghde-farda");
  const [unitPrice, setUnitPrice] = useState(44_280_000);
  const [weight, setWeight] = useState(100);
  const [notice, setNotice] = useState<string | null>(null);

  const totalToman = unitPrice * weight;

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <ProposedBanner subBadge="پیش‌نمایش تعاملی" />

        {/* Breadcrumb */}
        <nav
          aria-label="مسیر صفحه"
          className="flex items-center gap-1.5 px-1 text-[11px] text-text-secondary"
        >
          <Link href="/" className="hover:text-gold">
            رویال
          </Link>
          <ChevronLeft className="h-3 w-3 text-text-muted" aria-hidden="true" />
          <Link href="/more" className="hover:text-gold">
            سامانه معاملات
          </Link>
          <ChevronLeft className="h-3 w-3 text-text-muted" aria-hidden="true" />
          <span className="font-bold text-gold">ثبت پیش سفارش دستی</span>
        </nav>

        {/* Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-subtle bg-bg-card p-1.5">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
              side === "buy"
                ? "bg-buy text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            خرید (سفارش ورودی)
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
              side === "sell"
                ? "bg-sell text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            فروش شمش
          </button>
        </div>

        {/* Form Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              فرم ثبت سفارش شمش طلا
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              ضمانت خزانه
            </span>
          </div>

          {/* Counterparty User */}
          <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">کاربر طرف حساب</span>
              <span className="inline-flex items-center gap-1 font-bold text-buy">
                <UserCheck className="h-3 w-3" aria-hidden="true" />
                احراز شده
              </span>
            </div>
            <p className="text-xs font-extrabold text-text-primary">
              کیارش پورسلیک (کد{" "}
              <span dir="ltr" className="inline-block text-gold">
                RS-8831
              </span>
              )
            </p>
            <p className="text-[10px] text-text-secondary">
              کیف دارایی: ۵ شمش ۱۰۰ گرمی فعال
            </p>
          </div>

          {/* Commodity & Delivery */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="s21-product"
                className="font-semibold text-text-primary"
              >
                نوع کالا و تعهد تحویل
              </label>
              <span className="rounded-md border border-gold/25 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
                عیار ۹۹۹.۹
              </span>
            </div>
            <select
              id="s21-product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-gold focus:outline-none"
            >
              {PRODUCT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-text-secondary">
              تسویه فیزیکی / اعتبار آنی اتاق پایاپای
            </p>
          </div>

          {/* Unit Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                قیمت واحد سفارش (هر گرم / تومان)
              </span>
              <span className="tabular-nums-fa text-[10px] text-text-secondary">
                آخرین مظنه: ۴۴,۱۲۰,۰۰۰
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5">
              <span className="tabular-nums-fa text-sm font-extrabold text-gold">
                {formatFaNumber(unitPrice)} تومان
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "+۱۰۰,۰۰۰", delta: 100_000 },
                { label: "+۵۰,۰۰۰", delta: 50_000 },
                { label: "-۵۰,۰۰۰", delta: -50_000 },
                { label: "-۱۰۰,۰۰۰", delta: -100_000 },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  dir="ltr"
                  onClick={() =>
                    setUnitPrice((prev) => Math.max(0, prev + b.delta))
                  }
                  className="tabular-nums-fa rounded-lg border border-border-subtle bg-bg-primary py-1.5 text-[10px] font-semibold text-text-secondary hover:border-gold/40 hover:text-gold cursor-pointer"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requested Weight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                وزن درخواست شده (گرم)
              </span>
              <span className="text-[10px] text-text-secondary">
                معادل ۱ شمش استاندارد ۱۰۰ گرمی
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1.5">
              <button
                type="button"
                aria-label="کاهش وزن"
                onClick={() => setWeight((prev) => Math.max(1, prev - 10))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary hover:text-gold cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex flex-1 items-center justify-center gap-1.5">
                <span className="tabular-nums-fa text-sm font-extrabold text-text-primary">
                  {formatFaNumber(weight)}
                </span>
                <span className="text-xs text-text-secondary">
                  گرم شمش خالص
                </span>
              </div>
              <button
                type="button"
                aria-label="افزایش وزن"
                onClick={() => setWeight((prev) => prev + 10)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary hover:text-gold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Total Estimate */}
          <div className="rounded-xl border border-gold/30 bg-gold-soft/50 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gold-t90">مبلغ کل برآورد معامله</span>
              <span className="font-bold text-gold">محاسبه آنی</span>
            </div>
            <p className="tabular-nums-fa text-base font-extrabold text-gold">
              {formatFaNumber(totalToman)} تومان
            </p>
          </div>

          {/* Fee & Tax & Rules */}
          <div className="space-y-1 rounded-xl bg-bg-primary/65 p-3 text-[11px] text-text-secondary">
            <div className="flex items-center justify-between">
              <span>کارمزد کارگزاری رویال: ۰٪ (صفر)</span>
              <span className="text-buy font-semibold">
                مالیات بر ارزش افزوده: معاف
              </span>
            </div>
            <p className="pt-1 text-[10px]">
              اعتبار سفارش تا پایان وقت معاملات امروز (ساعت ۱۷:۰۰ به وقت تهران)
            </p>
            <p className="text-[10px] text-text-muted">
              ثبت نهایی نیازمند موجودی کافی ریالی یا طلا در خزانه مرکزی رویال
              شمش است.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setNotice("پیش سفارش پیشنهادی با موفقیت ثبت نمایشی شد.")
            }
            className="w-full rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            ثبت پیش سفارش
          </button>

          {notice ? (
            <p className="flex items-center justify-center gap-1.5 rounded-xl bg-buy-soft px-3 py-2 text-xs font-bold text-buy">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {notice}
            </p>
          ) : null}

          <p className="flex items-center justify-center gap-1 text-[10px] text-text-muted">
            <Lock className="h-3 w-3 text-gold" aria-hidden="true" />
            <span>
              امضای دیجیتال سیستم معاملاتی کد پروتکل{" "}
              <span dir="ltr" className="inline-block font-semibold text-gold">
                RS-SECURE-99
              </span>
            </span>
          </p>
        </section>

        {/* Order Queue */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-bold text-text-primary">صف سفارشات فردایی</h2>
            <span className="text-[10px] font-semibold text-buy">
              جریان زنده بازار
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-buy/30 bg-buy-soft p-2.5">
              <span className="block text-[10px] text-buy">
                بهترین تقاضای خرید
              </span>
              <span className="tabular-nums-fa mt-0.5 block font-extrabold text-buy">
                ۴۴,۱۴۰,۰۰۰
              </span>
              <span className="tabular-nums-fa text-[10px] text-buy/85">
                حجم: ۳۰۰ گرم
              </span>
            </div>
            <div className="rounded-xl border border-sell/30 bg-sell-soft p-2.5">
              <span className="block text-[10px] text-sell">
                بهترین عرضه فروش
              </span>
              <span className="tabular-nums-fa mt-0.5 block font-extrabold text-sell">
                ۴۴,۱۶۰,۰۰۰
              </span>
              <span className="tabular-nums-fa text-[10px] text-sell/85">
                حجم: ۱,۲۰۰ گرم
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
