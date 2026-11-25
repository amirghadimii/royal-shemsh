"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

type PLFilter = "all" | "profit" | "loss";

interface CustomerPLRow {
  id: string;
  name: string;
  codeText: string;
  plText: string;
  isLoss: boolean;
  hazerStatus: string;
  goldBalance: string;
  isNegativeGold?: boolean;
  aed: string;
  naghdeFarda: string;
  emami86: string;
}

const CUSTOMER_PL_ROWS: CustomerPLRow[] = [
  {
    id: "1048",
    name: "امیر قدیمی",
    codeText: "کد: ۱۰۴۸",
    plText: "+۴۸,۲۰۰,۰۰۰",
    isLoss: false,
    hazerStatus: "آنلاین / فعال",
    goldBalance: "۴۵۰ گرم",
    aed: "۱۲,۴۰۰",
    naghdeFarda: "+۲۰",
    emami86: "۵ عدد",
  },
  {
    id: "2091",
    name: "رضا محمدی",
    codeText: "کد: ۲۰۹۱ (هشدار)",
    plText: "-۱۴,۶۰۰,۰۰۰",
    isLoss: true,
    hazerStatus: "غایب / بدهکار",
    goldBalance: "۱۲۰ گرم",
    aed: "۰",
    naghdeFarda: "-۱۰",
    emami86: "۲ عدد",
  },
  {
    id: "1002",
    name: "بازرگانی طلا سپهر",
    codeText: "کد: ۱۰۰۲",
    plText: "+۱۲۵,۸۰۰,۰۰۰",
    isLoss: false,
    hazerStatus: "فعال",
    goldBalance: "۱,۲۵۰ گرم",
    aed: "۴۵,۰۰۰",
    naghdeFarda: "+۱۰۰",
    emami86: "۲۵ عدد",
  },
  {
    id: "3410",
    name: "جواهری کوروش",
    codeText: "کد: ۳۴۱۰ (حد ضرر)",
    plText: "-۸,۳۰۰,۰۰۰",
    isLoss: true,
    hazerStatus: "مسدود / زیان\u200cده",
    goldBalance: "-۳۵ گرم",
    isNegativeGold: true,
    aed: "۱,۵۰۰",
    naghdeFarda: "۵",
    emami86: "۰",
  },
  {
    id: "5188",
    name: "مهدی علوی",
    codeText: "کد: ۵۱۸۸",
    plText: "+۶,۱۵۰,۰۰۰",
    isLoss: false,
    hazerStatus: "فعال",
    goldBalance: "۸۰ گرم",
    aed: "۵,۰۰۰",
    naghdeFarda: "+۱۰",
    emami86: "۱ عدد",
  },
  {
    id: "7721",
    name: "صرافی پارسیان",
    codeText: "کد: ۷۷۲۱",
    plText: "+۳۱,۹۰۰,۰۰۰",
    isLoss: false,
    hazerStatus: "فعال",
    goldBalance: "۶۲۰ گرم",
    aed: "۲۲,۰۰۰",
    naghdeFarda: "+۴۰",
    emami86: "۱۰ عدد",
  },
];

export function Screen9CustomerPL() {
  const [filter, setFilter] = useState<PLFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredRows = useMemo(() => {
    return CUSTOMER_PL_ROWS.filter((row) => {
      if (filter === "profit" && row.isLoss) return false;
      if (filter === "loss" && !row.isLoss) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.trim();
        return row.name.includes(q) || row.codeText.includes(q);
      }
      return true;
    });
  }, [filter, searchQuery]);

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Title Block */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              سود و زیان مشتریان (P&amp;L)
            </h1>
            <span className="rounded-full border border-sell/35 bg-sell-soft px-2.5 py-0.5 text-[10px] font-bold text-sell">
              حد ضرر
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            پایش زنده وضعیت تعهدات و تراز طلایی
          </p>
        </section>

        {/* Green CTA Button */}
        <Link
          href="/prices"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90"
        >
          <Tag className="h-4 w-4" aria-hidden="true" />
          <span>تعیین قیمت کالاها</span>
        </Link>

        {/* Sync Line */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-[10px]">
          <span className="text-text-secondary">
            این داده{"\u200c"}ها مستقیماً از حسابداری کیمیا دریافت می{"\u200c"}شود
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-buy">
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            همگام{"\u200c"}سازی لحظه{"\u200c"}ای
          </span>
        </div>

        {/* Search & Filter Chips */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5">
            <Search
              className="h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام کاربر یا کد مشتری..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all" as const, label: "همه (۶)" },
              { id: "profit" as const, label: "سودآور (۴)" },
              { id: "loss" as const, label: "زیان\u200cده (۲)" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  filter === chip.id
                    ? "bg-gold font-extrabold text-bg-primary"
                    : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* Warning Banner */}
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-sell/45 bg-[#2A1217] px-3.5 py-2.5 text-xs font-bold text-sell"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>۲ کاربر مرز خطر</span>
        </div>

        {/* Horizontal Scroll Table (Pinned Name Column) */}
        <section className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-card">
          <table className="w-full min-w-[740px] border-collapse text-right text-[11px]">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-elevated text-[10px] font-bold text-text-secondary">
                <th className="sticky right-0 z-10 min-w-[145px] border-l border-border-subtle bg-bg-elevated px-3 py-2.5 text-right">
                  نام کاربر / شناسه
                </th>
                <th className="px-3 py-2.5 text-center">سود / زیان (P&amp;L)</th>
                <th className="px-3 py-2.5 text-center">حاضر</th>
                <th className="px-3 py-2.5 text-center">مانده طلا (گرم)</th>
                <th className="px-3 py-2.5 text-center">AED درهم</th>
                <th className="px-3 py-2.5 text-center">نقد فردا (گرم)</th>
                <th className="px-3 py-2.5 text-center">سکه امامی ۸۶</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-bg-elevated/35">
                  <td className="sticky right-0 z-10 border-l border-border-subtle bg-bg-card px-3 py-2.5">
                    <p className="font-bold text-text-primary">{row.name}</p>
                    <p
                      className={`tabular-nums-fa mt-0.5 text-[10px] ${
                        row.isLoss ? "text-sell font-semibold" : "text-text-muted"
                      }`}
                    >
                      {row.codeText}
                    </p>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`tabular-nums-fa font-extrabold ${
                        row.isLoss ? "text-sell" : "text-buy"
                      }`}
                    >
                      <span dir="ltr" className="inline-block">
                        {row.plText}
                      </span>{" "}
                      تومان
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center text-text-secondary">
                    {row.hazerStatus}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`tabular-nums-fa font-bold ${
                        row.isNegativeGold ? "text-sell" : "text-gold"
                      }`}
                    >
                      <span dir="ltr" className="inline-block">
                        {row.goldBalance.replace(" گرم", "")}
                      </span>{" "}
                      گرم
                    </span>
                  </td>

                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.aed}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span
                      dir="ltr"
                      className="tabular-nums-fa inline-block font-semibold text-text-primary"
                    >
                      {row.naghdeFarda}
                    </span>
                  </td>

                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.emami86}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Scroll Hint */}
        <div className="flex items-center justify-between px-1 text-[10px] text-text-secondary">
          <span>برای مشاهده مانده{"\u200c"}ها به چپ اسکرول کنید</span>
          <span className="font-semibold text-gold">۶ مشتری بارگذاری شد</span>
        </div>

        {/* Summary Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-text-primary">
              خلاصه تراز تجمیعی مشتریان
            </h2>
            <span className="tabular-nums-fa text-[10px] text-text-secondary">
              امروز، ساعت ۱۷:۴۵
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2.5">
              <span className="text-text-secondary">خالص سود / زیان سیستم</span>
              <span className="tabular-nums-fa font-extrabold text-buy">
                <span dir="ltr" className="inline-block">
                  +۱۸۹,۱۵۰,۰۰۰
                </span>{" "}
                تومان
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2.5">
              <span className="text-text-secondary">مجموع طلای در جریان</span>
              <span className="tabular-nums-fa font-extrabold text-gold">
                ۲,۴۸۵ گرم ۲۴ عیار
              </span>
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>دریافت خروجی اکسل (Excel .xlsx)</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
