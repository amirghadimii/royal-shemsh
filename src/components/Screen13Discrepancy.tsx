"use client";

import { useState } from "react";
import {
  ArrowUp,
  Calendar,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER, SCREEN1_BOARD_SYMBOLS } from "@/data/sample";

type DateChip = "today" | "3days" | "7days" | "month";

const DATE_CHIPS: { id: DateChip; label: string }[] = [
  { id: "today", label: "امروز" },
  { id: "3days", label: "۳ روز گذشته" },
  { id: "7days", label: "۷ روز گذشته" },
  { id: "month", label: "ماه جاری" },
];

export function Screen13Discrepancy() {
  const [dateChip, setDateChip] = useState<DateChip>("today");
  const [counterparty, setCounterparty] = useState("all");
  const [commodity, setCommodity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recheckNotice, setRecheckNotice] = useState<string | null>(null);

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="relative space-y-3.5 pb-6">
        {/* Title Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              مغایرت{"\u200c"}گیری انبار، حساب و معاملات
            </h1>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              همگام با دفتر کل
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            بررسی تطابق آنی اسناد خزانه، کاردکس فیزیکی شمش و مانده ریالی
          </p>
        </section>

        {/* Date Chips */}
        <div className="flex flex-wrap gap-1.5">
          {DATE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDateChip(chip.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                dateChip === chip.id
                  ? "bg-gold font-extrabold text-bg-primary"
                  : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Date Range Card */}
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-card px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <div>
              <p className="text-[10px] text-text-secondary">
                محدوده زمانی گزارش مغایرت
              </p>
              <p className="tabular-nums-fa mt-0.5 text-xs font-bold text-text-primary">
                ۱۴۰۵/۰۹/۰۴ تا ۱۴۰۵/۰۹/۰۴
              </p>
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 rounded-xl border border-gold/35 bg-gold-soft px-3 py-1.5 text-[11px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
          >
            تغییر بازه
          </button>
        </section>

        {/* Dropdown Filters */}
        <section className="grid grid-cols-1 gap-2.5 rounded-2xl border border-border-subtle bg-bg-card p-3.5">
          <div className="space-y-1">
            <label
              htmlFor="disc-counterparty"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              طرف حساب / معامله{"\u200c"}گر
            </label>
            <select
              id="disc-counterparty"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary focus:border-gold focus:outline-none"
            >
              <option value="all">طرف حساب (همه)</option>
              <option value="amir">امیر قدیمی</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="disc-commodity"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              نوع کالا / قطع شمش
            </label>
            <select
              id="disc-commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary focus:border-gold focus:outline-none"
            >
              <option value="all">نماد (همه کالاها)</option>
              {SCREEN1_BOARD_SYMBOLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Search + Tune */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5">
            <Search
              className="h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در اسناد و ردیف‌های مغایرت..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <button
            type="button"
            aria-label="تنظیمات فیلتر"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary hover:border-gold/40 hover:text-gold cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* 100% Balance Strip */}
        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-buy/35 bg-buy-soft py-2 text-xs font-extrabold text-buy">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>تراز ۱۰۰٪ فیزیکی و ریالی</span>
        </div>

        {/* Empty State */}
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-card/75 px-5 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-primary text-text-muted">
            <Inbox className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-sm font-extrabold text-text-primary">
            هیچ داده{"\u200c"}ای یافت نشد
          </h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
            در بازه زمانی و فیلترهای انتخابی هیچگونه مغایرت حسابی یا فیزیکی ثبت
            نشده است و ترازهای سیستم کاملاً منطبق می{"\u200c"}باشد.
          </p>
        </section>

        {/* Three Mini-Stats */}
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
            <span className="block text-[10px] text-text-secondary">
              اختلاف شمش
            </span>
            <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-buy">
              ۰ گرم
            </span>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
            <span className="block text-[10px] text-text-secondary">
              اختلاف ریالی
            </span>
            <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-buy">
              ۰ ریال
            </span>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
            <span className="block text-[10px] text-text-secondary">
              وضعیت تراز
            </span>
            <span className="mt-1 block text-xs font-extrabold text-gold">
              منطبق
            </span>
          </div>
        </section>

        {/* Gold Button */}
        <button
          type="button"
          onClick={() =>
            setRecheckNotice("ترازهای فیزیکی و ریالی بدون مغایرت تایید شد.")
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>بررسی مجدد ترازها</span>
        </button>

        {recheckNotice ? (
          <p className="rounded-xl border border-buy/35 bg-buy-soft px-3 py-2 text-center text-xs text-buy">
            {recheckNotice}
          </p>
        ) : null}

        {/* Last Readout */}
        <p className="tabular-nums-fa text-center text-[10px] text-text-secondary">
          آخرین بازخوانی خودکار دفتر کل: امروز، ساعت ۱۶:۴۲:۱۰
        </p>

        {/* Floating Yellow Scroll-to-Top Circle (Bottom-Left) */}
        <button
          type="button"
          aria-label="بازگشت به ابتدای صفحه"
          title="بازگشت به ابتدای صفحه"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-bg-primary shadow-lg transition-transform hover:scale-105 cursor-pointer"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </AppShell>
  );
}
