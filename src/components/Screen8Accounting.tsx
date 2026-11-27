"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Lock,
  Megaphone,
  Search,
  X,
} from "lucide-react";
import { AppShell, NoAccessBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";
import { useEndpointAccess } from "@/lib/useEndpointAccess";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

type LedgerFilter = "all" | "creditor" | "debtor";

interface LedgerRow {
  id: string;
  name: string;
  code: string;
  badge?: "verified" | "lock";
  hazer: string;
  isNegativeHazer: boolean;
  goldGrams: string;
  isNegativeGold?: boolean;
  aed: string;
  naghdeFarda: string;
  emami86: string;
  nimSekkeh: string;
  usd: string;
  euro: string;
}

const LEDGER_ROWS: LedgerRow[] = [
  {
    id: "1048",
    name: "امیر قدیمی",
    code: "۱۰۴۸",
    hazer: "+۵,۴۰۰,۰۰۰",
    isNegativeHazer: false,
    goldGrams: "۴۵۰",
    aed: "۱۲,۵۰۰",
    naghdeFarda: "۲۵",
    emami86: "۱۰",
    nimSekkeh: "۵",
    usd: "۳,۰۰۰",
    euro: "۱,۲۰۰",
  },
  {
    id: "2091",
    name: "رضا محمدی",
    code: "۲۰۹۱",
    hazer: "-۱۲,۳۰۰,۰۰۰",
    isNegativeHazer: true,
    goldGrams: "۱۲۰",
    aed: "۰",
    naghdeFarda: "۰",
    emami86: "۲",
    nimSekkeh: "۱",
    usd: "۵۰۰",
    euro: "۰",
  },
  {
    id: "1002",
    name: "بازرگانی طلا سپهر",
    code: "۱۰۰۲",
    badge: "verified",
    hazer: "+۴۸,۰۰۰,۰۰۰",
    isNegativeHazer: false,
    goldGrams: "۱,۲۵۰",
    aed: "۴۵,۰۰۰",
    naghdeFarda: "۱۰۰",
    emami86: "۳۵",
    nimSekkeh: "۲۰",
    usd: "۱۰,۰۰۰",
    euro: "۵,۰۰۰",
  },
  {
    id: "3410",
    name: "جواهری کوروش",
    code: "۳۴۱۰",
    hazer: "-۸,۵۰۰,۰۰۰",
    isNegativeHazer: true,
    goldGrams: "-۳۵",
    isNegativeGold: true,
    aed: "۱,۲۰۰",
    naghdeFarda: "۱۰",
    emami86: "۰",
    nimSekkeh: "۲",
    usd: "۰",
    euro: "۸۰۰",
  },
  {
    id: "5188",
    name: "مهدی علوی",
    code: "۵۱۸۸",
    hazer: "+۱,۲۰۰,۰۰۰",
    isNegativeHazer: false,
    goldGrams: "۸۰",
    aed: "۵,۰۰۰",
    naghdeFarda: "۵",
    emami86: "۴",
    nimSekkeh: "۰",
    usd: "۱,۵۰۰",
    euro: "۰",
  },
  {
    id: "6054",
    name: "طلا فروشی مرکزی",
    code: "۶۰۵۴",
    badge: "lock",
    hazer: "-۳۵,۰۰۰,۰۰۰",
    isNegativeHazer: true,
    goldGrams: "۵۰۰",
    aed: "۲۰,۰۰۰",
    naghdeFarda: "۵۰",
    emami86: "۱۵",
    nimSekkeh: "۱۰",
    usd: "۴,۰۰۰",
    euro: "۲,۵۰۰",
  },
  {
    id: "7721",
    name: "صرافی پارسیان",
    code: "۷۷۲۱",
    hazer: "+۱۹,۴۰۰,۰۰۰",
    isNegativeHazer: false,
    goldGrams: "۶۲۰",
    aed: "۸۵,۰۰۰",
    naghdeFarda: "۱۵",
    emami86: "۲۲",
    nimSekkeh: "۱۴",
    usd: "۲۵,۰۰۰",
    euro: "۱۸,۲۰۰",
  },
  {
    id: "8910",
    name: "کیان طلا البرز",
    code: "۸۹۱۰",
    hazer: "+۲,۹۰۰,۰۰۰",
    isNegativeHazer: false,
    goldGrams: "۲۴۰",
    aed: "۶,۳۰۰",
    naghdeFarda: "۸",
    emami86: "۶",
    nimSekkeh: "۳",
    usd: "۸۰۰",
    euro: "۰",
  },
];

export function Screen8Accounting() {
  const { accessDenied } = useEndpointAccess("/admin/accounting");
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rows, setRows] = useState<LedgerRow[]>(LEDGER_ROWS);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || accessDenied) return;

    const qs = new URLSearchParams({
      filter,
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    });
    fetch(`${API_BASE}/admin/accounting?${qs.toString()}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!Array.isArray(data?.rows)) return;
        setRows(
          data.rows.map(
            (r: {
              id: string;
              code: number;
              name: string;
              cashBalanceToman: string;
              isDebtor: boolean;
              goldGrams: string;
              aed: string;
              naghdeFarda: string;
              emami86: string;
              nimSekkeh: string;
              usd: string;
              euro: string;
            }) => {
              const cashNum = Number(r.cashBalanceToman);
              const sign = cashNum > 0 ? "+" : "";
              return {
                id: r.id,
                name: r.name,
                code: formatFaNumber(r.code),
                hazer: `${sign}${formatFaNumber(cashNum)}`,
                isNegativeHazer: r.isDebtor,
                goldGrams: formatFaNumber(Number(r.goldGrams)),
                isNegativeGold: Number(r.goldGrams) < 0,
                aed: formatFaNumber(Number(r.aed)),
                naghdeFarda: formatFaNumber(Number(r.naghdeFarda)),
                emami86: formatFaNumber(Number(r.emami86)),
                nimSekkeh: formatFaNumber(Number(r.nimSekkeh)),
                usd: formatFaNumber(Number(r.usd)),
                euro: formatFaNumber(Number(r.euro)),
              };
            }
          )
        );
      })
      .catch(() => {});
  }, [accessDenied, filter, searchQuery]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "creditor" && row.isNegativeHazer) return false;
      if (filter === "debtor" && !row.isNegativeHazer) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.trim();
        return row.name.includes(q) || row.code.includes(q);
      }
      return true;
    });
  }, [rows, filter, searchQuery]);

  if (accessDenied) {
    return (
      <AppShell
        activeTab="more"
        userName={SAMPLE_USER.fullName}
        isOnline={SAMPLE_USER.isOnline}
      >
        <NoAccessBanner />
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
        {/* Green Full-Width Broadcast Button */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
        >
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          <span>ارسال پیام همگانی</span>
        </button>

        {/* Ledger Header + Search + Cancel */}
        <section className="space-y-2.5 rounded-2xl border border-border-subtle bg-bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xs font-extrabold text-text-primary">
              دفتر کل به{"\u200c"}روزرسانی شده
            </h1>
            <span className="h-2 w-2 rounded-full bg-buy" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary px-3 py-2">
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

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>لغو</span>
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all" as const, label: "همه (۱۲۸)" },
              { id: "creditor" as const, label: "بستانکار (۸۴)" },
              { id: "debtor" as const, label: "بدهکار (۴۴)" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  filter === chip.id
                    ? "bg-gold font-extrabold text-bg-primary"
                    : "border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
            <span className="block text-[10px] text-text-secondary">
              کاربران فعال
            </span>
            <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-text-primary">
              ۱۲۸ طرف{"\u200c"}حساب
            </span>
          </div>
          <div className="rounded-xl border border-buy/30 bg-buy-soft p-2.5 text-center">
            <span className="block text-[10px] text-buy">مجموع بستانکاری</span>
            <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-buy">
              ۱۴۲,۵۰۰ میلیون
            </span>
          </div>
          <div className="rounded-xl border border-sell/30 bg-sell-soft p-2.5 text-center">
            <span className="block text-[10px] text-sell">مجموع بدهکاری</span>
            <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-sell">
              <span dir="ltr" className="inline-block">
                -۵۵,۸۰۰
              </span>{" "}
              میلیون
            </span>
          </div>
        </section>

        {/* Horizontal Scroll Hint */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-gold-soft/50 px-3 py-2 text-[10px] text-gold-t90">
          <span>جدول افقی: برای مشاهده اقلام ارزی و سکه{"\u200c"}ها به چپ بکشید</span>
          <span className="shrink-0 font-bold text-gold">
            ستون نام کاربر ثابت است
          </span>
        </div>

        {/* Horizontal Scroll Table with Pinned "نام کاربر" Column */}
        <section className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-card">
          <table className="w-full min-w-[780px] border-collapse text-right text-[11px]">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-elevated text-[10px] font-bold text-text-secondary">
                <th className="sticky right-0 z-10 min-w-[145px] border-l border-border-subtle bg-bg-elevated px-3 py-2.5 text-right">
                  نام کاربر
                </th>
                <th className="px-3 py-2.5 text-center">حاضر (وضعیت)</th>
                <th className="px-3 py-2.5 text-center">مانده طلا (گرم)</th>
                <th className="px-3 py-2.5 text-center">AED درهم</th>
                <th className="px-3 py-2.5 text-center">نقد فردا</th>
                <th className="px-3 py-2.5 text-center">سکه امامی ۸۶</th>
                <th className="px-3 py-2.5 text-center">نیم سکه</th>
                <th className="px-3 py-2.5 text-center">USD دلار</th>
                <th className="px-3 py-2.5 text-center">EURO یورو</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-bg-elevated/35">
                  {/* Pinned User Name Column */}
                  <td className="sticky right-0 z-10 border-l border-border-subtle bg-bg-card px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-primary">
                        {row.name}
                      </span>
                      {row.badge === "verified" ? (
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0 text-buy"
                          aria-label="تایید شده"
                        />
                      ) : null}
                      {row.badge === "lock" ? (
                        <Lock
                          className="h-3.5 w-3.5 shrink-0 text-sell"
                          aria-label="قفل شده"
                        />
                      ) : null}
                    </div>
                    <span className="tabular-nums-fa block text-[10px] text-text-muted">
                      کد: {row.code}
                    </span>
                  </td>

                  {/* حاضر (Signed Rial) */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      dir="ltr"
                      className={`tabular-nums-fa inline-block font-extrabold ${
                        row.isNegativeHazer ? "text-sell" : "text-buy"
                      }`}
                    >
                      {row.hazer}
                    </span>
                  </td>

                  {/* مانده طلا (گرم) */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      dir="ltr"
                      className={`tabular-nums-fa inline-block font-bold ${
                        row.isNegativeGold ? "text-sell" : "text-gold"
                      }`}
                    >
                      {row.goldGrams}
                    </span>
                  </td>

                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.aed}
                  </td>
                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.naghdeFarda}
                  </td>
                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.emami86}
                  </td>
                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.nimSekkeh}
                  </td>
                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.usd}
                  </td>
                  <td className="tabular-nums-fa px-3 py-2.5 text-center text-text-primary">
                    {row.euro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <section className="space-y-2.5 rounded-2xl border border-border-subtle bg-bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-buy px-3 py-2 text-[11px] font-extrabold text-white hover:opacity-90 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
              <span>خروجی اکسل کامل (XLSX)</span>
            </button>
            <span className="tabular-nums-fa text-[11px] text-text-secondary">
              نمایش {filteredRows.length === 8 ? "۸" : filteredRows.length} از
              ۱۲۸ ردیف
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
            <div>
              <p className="text-xs font-bold text-text-primary">
                تسویه روزانه طلا و ارز
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-text-secondary">
                <Clock className="h-3 w-3 text-gold" aria-hidden="true" />
                <span>محاسبه خودکار تراز پایانی ساعت ۲۱:۰۰</span>
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl bg-gold px-3.5 py-2 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
            >
              بستن دفتر
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
