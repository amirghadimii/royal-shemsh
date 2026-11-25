"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, ShieldCheck, Sliders, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/design-system";
import { Screen20PricesNoAccess } from "@/components/Screen20PricesNoAccess";
import { SAMPLE_USER } from "@/data/sample";

type PeriodId = "1d" | "1w" | "1m" | "3m";

const SYMBOL_CHIPS = [
  "USD",
  "نقد فردا",
  "نقد پس\u200cفردا",
  "CNY",
  "نیم سکه",
  "گرمی بانکی",
  "EURO",
  "بهار آزادی/قدیم",
  "ربع سکه",
];

const PERIOD_CHIPS: { id: PeriodId; label: string }[] = [
  { id: "1d", label: "۱ روز" },
  { id: "1w", label: "۱ هفته" },
  { id: "1m", label: "۱ ماه" },
  { id: "3m", label: "۳ ماه" },
];

const Y_TICKS = ["۴۴,۵۰۰,۰۰۰", "۴۴,۳۰۰,۰۰۰", "۴۴,۱۰۰,۰۰۰", "۴۳,۸۰۰,۰۰۰"];
const X_TICKS = ["۰۸/۰۴", "۰۸/۱۰", "۰۸/۱۶", "۰۸/۲۲", "۰۸/۲۸", "۰۹/۰۲"];

export function Screen6Prices() {
  const searchParams = useSearchParams();
  const isDenied = searchParams.get("access") === "denied";
  const [selectedSymbol, setSelectedSymbol] = useState<string>("نقد فردا");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodId>("1m");

  if (isDenied) {
    return (
      <AppShell
        activeTab="more"
        userName={SAMPLE_USER.fullName}
        isOnline={SAMPLE_USER.isOnline}
        brandSubtitle="سامانه معاملات شمش طلا"
      >
        <Screen20PricesNoAccess />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Title Block */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-text-primary">
                  تحلیل قیمت{"\u200c"}ها
                </h1>
                <span className="rounded-md border border-gold/35 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
                  ویژه مدیران
                </span>
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                سامانه مانیتورینگ مظنه و دفاتر تحویل شمش
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-1 text-[10px] font-bold text-buy">
              سطح ۱ (ارشد)
            </span>
          </div>
        </section>

        {/* Symbol Selector */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-text-primary">
              انتخاب ابزار معاملاتی
            </h2>
            <span className="text-[11px] font-semibold text-gold">
              ۹ نماد فعال
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SYMBOL_CHIPS.map((chip) => {
              const isActive = selectedSymbol === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedSymbol(chip)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-gold font-extrabold text-bg-primary"
                      : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </section>

        {/* WHITE Chart Card */}
        <section className="rounded-2xl bg-white p-4 text-[#0B0E14] shadow-md space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold">شمش رویال • نقد تهران</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
              ۹۹۹.۹
            </span>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-600">
              روند تغییرات قیمت {selectedSymbol}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="tabular-nums-fa text-2xl font-extrabold text-[#0B0E14]">
                  ۴۴,۲۸۰,۰۰۰
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  تومان
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-[#10B981]"
                >
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  +۲.۴٪
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  آخرین تسویه امروز
                </span>
              </div>
            </div>
          </div>

          {/* Period Chips */}
          <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1">
            {PERIOD_CHIPS.map((p) => {
              const isActive = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`rounded-lg py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#0B0E14] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#0B0E14]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Rising Red Line Chart with Light Red Fill & Endpoint Dot */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-stretch gap-2">
              {/* Y-Axis */}
              <div className="flex flex-col justify-between py-1 text-[9px] font-semibold text-slate-400 tabular-nums-fa">
                {Y_TICKS.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              {/* SVG Chart */}
              <div className="flex-1">
                <svg
                  viewBox="0 0 260 120"
                  className="h-32 w-full overflow-visible"
                  role="img"
                  aria-label="نمودار روند تغییرات قیمت"
                >
                  <defs>
                    <linearGradient
                      id="redAreaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#EF4444"
                        stopOpacity="0.22"
                      />
                      <stop
                        offset="100%"
                        stopColor="#EF4444"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[12, 44, 76, 108].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="260"
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Light Red Area */}
                  <path
                    d="M 4 102 L 48 92 L 96 76 L 146 66 L 198 42 L 250 22 L 250 112 L 4 112 Z"
                    fill="url(#redAreaGrad)"
                  />

                  {/* Rising Red Line */}
                  <path
                    d="M 4 102 L 48 92 L 96 76 L 146 66 L 198 42 L 250 22"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Red Endpoint Dot */}
                  <circle
                    cx="250"
                    cy="22"
                    r="5"
                    fill="#EF4444"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* X-Axis */}
            <div className="flex items-center justify-between pr-12 text-[9px] font-semibold text-slate-400 tabular-nums-fa">
              {X_TICKS.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div className="rounded-xl bg-slate-50 p-2">
              <span className="block text-[9px] text-slate-500">کف ۳۰ روزه</span>
              <span className="tabular-nums-fa mt-0.5 block text-[11px] font-extrabold text-slate-800">
                ۴۳,۷۵۰,۰۰۰
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <span className="block text-[9px] text-slate-500">سقف ۳۰ روزه</span>
              <span className="tabular-nums-fa mt-0.5 block text-[11px] font-extrabold text-slate-800">
                ۴۴,۶۰۰,۰۰۰
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <span className="block text-[9px] text-slate-500">
                حجم کل بازار
              </span>
              <span className="tabular-nums-fa mt-0.5 block text-[11px] font-extrabold text-slate-800">
                ۱۸.۴ کیلوگرم
              </span>
            </div>
          </div>
        </section>

        {/* Action Buttons Below */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>خروجی اکسل مظنه{"\u200c"}ها</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-bg-card py-3 text-xs font-bold text-text-primary hover:border-gold/40 cursor-pointer"
          >
            <Sliders className="h-4 w-4 text-gold" aria-hidden="true" />
            <span>تنظیم بازه و اسپرد</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-1 pt-1 text-center text-[10px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span>سامانه یکپارچه شمش و فلزات گرانبها</span>
          </div>
          <span dir="ltr" className="text-[10px] font-semibold text-text-muted">
            V2.4.9 - Vault Secured
          </span>
        </footer>
      </div>
    </AppShell>
  );
}
