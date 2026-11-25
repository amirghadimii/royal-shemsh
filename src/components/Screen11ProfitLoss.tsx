"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

export function Screen11ProfitLoss() {
  const [fromDate, setFromDate] = useState("۱۴۰۵/۰۹/۰۴");
  const [toDate, setToDate] = useState("۱۴۰۵/۰۹/۰۴");
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Title Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              گزارش سود و زیان جامع (P&amp;L)
            </h1>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              تراز هماهنگ
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            دفتر کل مدیریت خزانه رویال شمش
          </p>
        </section>

        {/* Date Pickers */}
        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-3 space-y-1.5">
            <label
              htmlFor="pl-from-date"
              className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary"
            >
              <Calendar className="h-3 w-3 text-gold" aria-hidden="true" />
              <span>از ابتدای روز</span>
            </label>
            <input
              id="pl-from-date"
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="tabular-nums-fa w-full rounded-lg border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
            <span className="tabular-nums-fa block text-[10px] text-text-muted">
              ۰۰:۰۰
            </span>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-card p-3 space-y-1.5">
            <label
              htmlFor="pl-to-date"
              className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary"
            >
              <Calendar className="h-3 w-3 text-gold" aria-hidden="true" />
              <span>تا آخر روز</span>
            </label>
            <input
              id="pl-to-date"
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="tabular-nums-fa w-full rounded-lg border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
            <span className="tabular-nums-fa block text-[10px] text-text-muted">
              ۲۳:۵۹
            </span>
          </div>
        </section>

        {/* Gold Full-Width Button */}
        <button
          type="button"
          onClick={() =>
            setNotice("گزارش سود و زیان بازه انتخابی به‌روزرسانی نمایشی شد.")
          }
          className="w-full rounded-2xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
        >
          دریافت سود و زیان
        </button>

        {notice ? (
          <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold-soft px-3 py-2 text-xs text-gold">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[11px] font-bold underline cursor-pointer"
            >
              بستن
            </button>
          </div>
        ) : null}

        {/* Financial Summary Card */}
        <section className="rounded-2xl border border-buy/30 bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-text-primary">
              خلاصه وضعیت مالی دوره انتخابی
            </h2>
            <span className="text-[10px] font-semibold text-gold">
              حسابرسی لحظه{"\u200c"}ای
            </span>
          </div>

          <div className="rounded-xl border border-buy/25 bg-buy-soft p-3.5 space-y-1.5">
            <span className="block text-[11px] text-buy">
              بازده خالص کل معاملات
            </span>
            <p className="tabular-nums-fa text-xl font-extrabold text-buy">
              <span dir="ltr" className="inline-block">
                +۱۵۷,۱۰۰,۰۰۰
              </span>{" "}
              تومان
            </p>
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-buy">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />▲ ۸.۵۳٪ سود
                موزون نسبت به حجم مبادلات
              </span>
              <span className="shrink-0 rounded-full bg-buy px-2 py-0.5 text-[10px] font-bold text-white">
                ٪۸۲ موفق
              </span>
            </div>
          </div>
        </section>

        {/* P&L Table: کالا | جمع (تومان) */}
        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
          <div className="flex items-center justify-between border-b border-border-subtle bg-bg-elevated/70 px-3.5 py-2.5 text-[11px] font-bold text-text-secondary">
            <span>کالا</span>
            <span>جمع (تومان)</span>
          </div>

          <div className="divide-y divide-border-subtle text-xs">
            <div className="flex items-center justify-between gap-2 px-3.5 py-3">
              <div>
                <p className="font-bold text-text-primary">جمع فروش</p>
                <p className="mt-0.5 text-[10px] text-text-secondary">
                  مجموع حواله و تحویل فیزیکی
                </p>
              </div>
              <span className="tabular-nums-fa font-bold text-text-primary">
                ۱,۸۴۲,۵۰۰,۰۰۰ تومان
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 px-3.5 py-3">
              <div>
                <p className="font-bold text-text-primary">جمع خرید</p>
                <p className="mt-0.5 text-[10px] text-text-secondary">
                  ورودی شمش و تسویه{"\u200c"}ها
                </p>
              </div>
              <span className="tabular-nums-fa font-bold text-text-primary">
                ۱,۷۱۰,۲۰۰,۰۰۰ تومان
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 px-3.5 py-3">
              <div>
                <p className="font-bold text-text-primary">جمع پر و خالی</p>
                <p className="mt-0.5 text-[10px] text-text-secondary">
                  موازنه مانده و اختلاف مظنه{"\u200c"}ها
                </p>
              </div>
              <span className="tabular-nums-fa font-bold text-text-primary">
                ۲۴,۸۰۰,۰۰۰ تومان
              </span>
            </div>

            {/* Gold Total Row */}
            <div className="flex items-center justify-between gap-2 bg-gold-soft px-3.5 py-3.5">
              <div>
                <p className="font-extrabold text-gold">جمع کل (سود خالص)</p>
                <p className="mt-0.5 text-[10px] text-gold-t90">
                  خالص تراز تجمعی روزانه
                </p>
              </div>
              <div className="text-left">
                <p className="tabular-nums-fa font-extrabold text-gold">
                  <span dir="ltr" className="inline-block">
                    +۱۵۷,۱۰۰,۰۰۰
                  </span>{" "}
                  تومان
                </p>
                <p className="text-[10px] font-bold text-buy">سود قطعی</p>
              </div>
            </div>
          </div>
        </section>

        {/* Breakdown by Symbol */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-text-primary">
              تفکیک سود و زیان بر اساس نمادها
            </h2>
            <span className="text-[11px] font-semibold text-gold">
              ۳ نماد کلیدی
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                name: "نقد فردا (شمش رویال)",
                chip: "۹۹۹.۹",
                volume: "حجم: ۳۲ کیلوگرم خالص",
                amount: "+۱۰۸,۳۰۰,۰۰۰",
              },
              {
                name: "سکه امامی طرح جدید",
                chip: "۸۶",
                volume: "تعداد: ۱۲۵ قطعه",
                amount: "+۳۴,۵۰۰,۰۰۰",
              },
              {
                name: "دلار نقدی بازار",
                chip: "اسکناس",
                volume: "حجم: ۳۰,۰۰۰ واحد",
                amount: "+۱۴,۳۰۰,۰۰۰",
              },
            ].map((item) => (
              <article
                key={item.name}
                className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      {item.name}
                    </span>
                    <span className="rounded-md border border-gold/25 bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                      {item.chip}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {item.volume}
                  </p>
                </div>

                <span className="tabular-nums-fa shrink-0 text-xs font-extrabold text-buy">
                  <span dir="ltr" className="inline-block">
                    {item.amount}
                  </span>{" "}
                  تومان
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* Export Section */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gold" aria-hidden="true" />
              <h2 className="text-xs font-bold text-text-primary">
                خروجی اسناد رسمی و بایگانی
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              با مهر دیجیتال رویال
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold-soft py-2.5 text-xs font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>گزارش PDF نسخه چاپی A4</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>خروجی Excel فرمت استاندارد xlsx</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
