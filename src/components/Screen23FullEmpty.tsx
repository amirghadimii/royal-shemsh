"use client";

import { useState } from "react";
import { Calendar, FileSpreadsheet } from "lucide-react";
import { AppShell, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

type RangeId = "today" | "yesterday" | "week";

interface FullEmptyRow {
  name: string;
  sub: string;
  full: string;
  empty: string;
  status: string;
  tone: "gold" | "buy" | "neutral";
}

const ROWS: FullEmptyRow[] = [
  {
    name: "نقد فردا",
    sub: "شمش ۹۹۹.۹",
    full: "۲۵۰ گرم",
    empty: "۵۰ گرم",
    status: "هماهنگ",
    tone: "buy",
  },
  {
    name: "نقد پس\u200cفردا",
    sub: "شمش ۹۹۹.۹",
    full: "۱۲۰ گرم",
    empty: "۳۰ گرم",
    status: "هماهنگ",
    tone: "buy",
  },
  {
    name: "سکه امامی ۸۶",
    sub: "طرح جدید بانکی",
    full: "۴۵ عدد",
    empty: "۵ عدد",
    status: "هماهنگ",
    tone: "buy",
  },
  {
    name: "نیم سکه",
    sub: "بهار آزادی",
    full: "۲۰ عدد",
    empty: "۰ عدد",
    status: "تسویه کامل",
    tone: "gold",
  },
  {
    name: "ربع سکه",
    sub: "بهار آزادی",
    full: "۱۵ عدد",
    empty: "۰ عدد",
    status: "تسویه کامل",
    tone: "gold",
  },
  {
    name: "گرمی بانکی",
    sub: "پلمپ ۱۸ عیار",
    full: "۸۰ عدد",
    empty: "۱۰ عدد",
    status: "هماهنگ",
    tone: "buy",
  },
  {
    name: "دلار آمریکا",
    sub: "حواله نقدی",
    full: "۵,۰۰۰ دلار",
    empty: "۱,۰۰۰ دلار",
    status: "در جریان",
    tone: "neutral",
  },
];

export function Screen23FullEmpty() {
  const [range, setRange] = useState<RangeId>("today");

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <ProposedBanner subBadge="نسخه هوشمند" />

        {/* Header */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              تراز معاملات پر و خالی
            </h1>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              تطبیق فیزیکی و ریالی
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            کنترل همزمان مانده تعهدات تحویل شمش، سکه و ارز سامانه
          </p>
        </section>

        {/* Date Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold/35 bg-bg-card px-3 py-2 text-[11px] font-bold text-gold cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums-fa">۱۴۰۵/۰۹/۰۴ تغییر تاریخ</span>
          </button>

          <div className="flex items-center gap-1">
            {[
              { id: "today" as const, label: "امروز" },
              { id: "yesterday" as const, label: "روز قبل" },
              { id: "week" as const, label: "این هفته" },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setRange(b.id)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                  range === b.id
                    ? "bg-gold text-bg-primary"
                    : "border border-border-subtle bg-bg-card text-text-secondary"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <p className="px-1 text-[11px] text-text-secondary">
          پر خالی تا انتهای روز انتخاب شده می{"\u200c"}باشد
        </p>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
          <div className="grid grid-cols-[1.35fr_0.9fr_0.9fr_0.85fr] items-center gap-1 border-b border-border-subtle bg-bg-elevated/70 px-3 py-2.5 text-[10px] font-bold text-text-secondary">
            <span>کالا / نماد</span>
            <span className="text-center">پر (انجام{"\u200c"}شده)</span>
            <span className="text-center">خالی (معلق)</span>
            <span className="text-left">وضعیت</span>
          </div>

          <div className="divide-y divide-border-subtle text-[11px]">
            {ROWS.map((row) => {
              const badgeClass =
                row.tone === "gold"
                  ? "bg-gold-soft text-gold border-gold/30"
                  : row.tone === "buy"
                    ? "bg-buy-soft text-buy border-buy/30"
                    : "bg-bg-primary text-text-secondary border-border-subtle";

              return (
                <div
                  key={row.name}
                  className="grid grid-cols-[1.35fr_0.9fr_0.9fr_0.85fr] items-center gap-1 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-text-primary">
                      {row.name}
                    </p>
                    <p className="truncate text-[9px] text-text-muted">
                      {row.sub}
                    </p>
                  </div>
                  <span className="tabular-nums-fa text-center font-bold text-buy">
                    {row.full}
                  </span>
                  <span className="tabular-nums-fa text-center font-bold text-gold">
                    {row.empty}
                  </span>
                  <div className="flex justify-end">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${badgeClass}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Totals Card */}
        <section className="rounded-2xl border border-gold/30 bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-gold">
              جمع کل تراز روز
            </h2>
            <span className="tabular-nums-fa rounded-full border border-sell/35 bg-sell-soft px-2.5 py-0.5 text-[10px] font-bold text-sell">
              تسویه{"\u200c"}نشده کل: ۱۵٪
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2">
              <span className="text-text-secondary">
                جمع کل پر (انجام{"\u200c"}شده)
              </span>
              <strong className="tabular-nums-fa font-extrabold text-buy">
                ۳۷۰گرم شمش، ۱۶۰قطعه سکه
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2">
              <span className="text-text-secondary">جمع کل خالی (معلق)</span>
              <strong className="tabular-nums-fa font-extrabold text-gold">
                ۸۰گرم شمش، ۱۵قطعه سکه
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-buy/30 bg-buy-soft px-3 py-2">
              <span className="text-buy font-semibold">
                نرخ تکمیل پر به کل تعهدات فیزیکی
              </span>
              <strong className="tabular-nums-fa font-extrabold text-buy">
                ۸۵٪ تایید نهایی
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>دریافت گزارش اکسل (XLSX)</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
