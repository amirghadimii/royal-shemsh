"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CircleDollarSign,
  Coins,
  Gem,
  Search,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

type PositionFilter = "all" | "Long" | "Short";

interface PositionItem {
  id: string;
  name: string;
  subtitle: string;
  totalVolume: string;
  direction: "Long" | "Short";
  amount: string;
  currentPrice: string;
  estimatedPL: string;
  avgLabel: string;
  icon: typeof Coins;
}

const POSITIONS: PositionItem[] = [
  {
    id: "p1",
    name: "نقد فردا",
    subtitle: "طلا ۲۴",
    totalVolume: "۶,۶۴۲,۰۰۰,۰۰۰",
    direction: "Long",
    amount: "۱۵۰گرم",
    currentPrice: "۴۴,۲۸۰,۰۰۰",
    estimatedPL: "+۵۴,۳۰۰,۰۰۰",
    avgLabel: "میانگین خرید: ۴۳,۹۱۸,۰۰۰",
    icon: Gem,
  },
  {
    id: "p2",
    name: "نقد پس\u200cفردا",
    subtitle: "طلا ۲۴",
    totalVolume: "۲,۲۱۵,۰۰۰,۰۰۰",
    direction: "Long",
    amount: "۵۰گرم",
    currentPrice: "۴۴,۳۰۰,۰۰۰",
    estimatedPL: "+۱۸,۲۰۰,۰۰۰",
    avgLabel: "میانگین خرید: ۴۳,۹۳۶,۰۰۰",
    icon: Gem,
  },
  {
    id: "p3",
    name: "سکه امامی ۸۶",
    subtitle: "طرح جدید",
    totalVolume: "۱,۲۷۷,۵۰۰,۰۰۰",
    direction: "Short",
    amount: "۲۵عدد",
    currentPrice: "۵۱,۱۰۰,۰۰۰",
    estimatedPL: "-۱۵,۴۰۰,۰۰۰",
    avgLabel: "میانگین فروش: ۵۰,۴۸۴,۰۰۰",
    icon: Coins,
  },
  {
    id: "p4",
    name: "نیم سکه",
    subtitle: "بهار آزادی",
    totalVolume: "۱,۰۹۶,۰۰۰,۰۰۰",
    direction: "Long",
    amount: "۴۰عدد",
    currentPrice: "۲۷,۴۰۰,۰۰۰",
    estimatedPL: "+۲۹,۱۲۰,۰۰۰",
    avgLabel: "میانگین خرید: ۲۶,۶۷۲,۰۰۰",
    icon: Coins,
  },
  {
    id: "p5",
    name: "ربع سکه",
    subtitle: "بهار آزادی",
    totalVolume: "۲۵۶,۵۰۰,۰۰۰",
    direction: "Short",
    amount: "۱۵عدد",
    currentPrice: "۱۷,۱۰۰,۰۰۰",
    estimatedPL: "-۴,۲۰۰,۰۰۰",
    avgLabel: "میانگین فروش: ۱۶,۸۲۰,۰۰۰",
    icon: Coins,
  },
  {
    id: "p6",
    name: "گرمی بانکی",
    subtitle: "پلمپ مرکزی",
    totalVolume: "۶۷۲,۰۰۰,۰۰۰",
    direction: "Long",
    amount: "۸۰عدد",
    currentPrice: "۸,۴۰۰,۰۰۰",
    estimatedPL: "+۱۱,۸۴۰,۰۰۰",
    avgLabel: "میانگین خرید: ۸,۲۵۲,۰۰۰",
    icon: CircleDollarSign,
  },
  {
    id: "p7",
    name: "دلار آمریکا",
    subtitle: "اسکناس نقد",
    totalVolume: "۳۴۶,۰۰۰,۰۰۰",
    direction: "Short",
    amount: "۵,۰۰۰دلار",
    currentPrice: "۶۹,۲۰۰",
    estimatedPL: "-۲,۸۰۰,۰۰۰",
    avgLabel: "میانگین فروش: ۶۸,۶۴۰",
    icon: Banknote,
  },
];

export function Screen10AssetDashboard() {
  const [filter, setFilter] = useState<PositionFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPositions = useMemo(() => {
    return POSITIONS.filter((pos) => {
      if (filter !== "all" && pos.direction !== filter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.trim();
        return pos.name.includes(q) || pos.subtitle.includes(q);
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
        {/* Market Status Strip */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-buy/25 bg-bg-card px-3 py-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-text-primary">
            <span
              className="h-2 w-2 rounded-full bg-buy shadow-[0_0_6px_rgba(16,185,129,0.85)]"
              aria-hidden="true"
            />
            <span className="font-semibold">وضعیت بازار: پیوسته و برخط</span>
          </div>
          <span className="tabular-nums-fa text-[10px] text-gold font-bold">
            بروزرسانی: ۱۴:۳۵:۰۸
          </span>
        </div>

        {/* Three Summary Cards */}
        <section className="space-y-2.5">
          {/* Gold-highlighted total P&L */}
          <div className="rounded-2xl border border-gold/40 bg-bg-card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gold">
                سود/زیان کل تحقق{"\u200c"}یافته + شناور
              </span>
              <span
                dir="ltr"
                className="rounded-full bg-buy-soft px-2 py-0.5 text-[11px] font-extrabold text-buy"
              >
                +۷.۴٪
              </span>
            </div>
            <p className="mt-1.5 text-sm font-extrabold text-text-primary">
              خالص تراز{" "}
              <span dir="ltr" className="tabular-nums-fa inline-block text-gold">
                +۱۶۲,۱۰۰,۰۰۰
              </span>{" "}
              تومان
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-buy/30 bg-buy-soft p-3">
              <span className="block text-[10px] font-semibold text-buy">
                سود تحقق{"\u200c"}یافته بسته{"\u200c"}شده
              </span>
              <span
                dir="ltr"
                className="tabular-nums-fa mt-1 inline-block text-xs font-extrabold text-buy"
              >
                +۱۸۴,۵۰۰,۰۰۰
              </span>{" "}
              <span className="text-[10px] text-buy">تومان قطعی</span>
            </div>

            <div className="rounded-2xl border border-sell/30 bg-sell-soft p-3">
              <span className="block text-[10px] font-semibold text-sell">
                سود/زیان شناور مارکت
              </span>
              <span
                dir="ltr"
                className="tabular-nums-fa mt-1 inline-block text-xs font-extrabold text-sell"
              >
                -۲۲,۴۰۰,۰۰۰
              </span>{" "}
              <span className="text-[10px] text-sell">تومان باز</span>
            </div>
          </div>
        </section>

        {/* Green CTA Button */}
        <Link
          href="/prices"
          className="block rounded-2xl bg-buy px-4 py-3 text-white hover:opacity-90"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>تعیین قیمت کالاها</span>
          </div>
          <p className="mt-0.5 text-[10px] text-white/90">
            مدیریت نرخ مبنا، اسپرد و حاشیه سود لحظه{"\u200c"}ای
          </p>
        </Link>

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
              placeholder="جستجوی نماد یا کالا..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-bg-card px-2 py-1 text-[10px] font-bold text-text-secondary">
              ۷ کالا
            </span>
            {[
              { id: "all" as const, label: "همه کالاها ۷" },
              { id: "Long" as const, label: "پوزیشن Long ۴" },
              { id: "Short" as const, label: "پوزیشن Short ۳" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
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

        {/* Section Heading */}
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xs font-extrabold text-text-primary">
            جزئیات سبد و پوزیشن کالاها
          </h1>
          <span className="text-[10px] text-text-secondary">ارقام به تومان</span>
        </div>

        {/* Seven Position Cards */}
        <div className="space-y-3">
          {filteredPositions.map((pos) => {
            const Icon = pos.icon;
            const isLong = pos.direction === "Long";
            const isProfit = pos.estimatedPL.startsWith("+");

            return (
              <article
                key={pos.id}
                className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-soft text-gold">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xs font-extrabold text-text-primary">
                        {pos.name}
                      </h2>
                      <p className="text-[10px] text-text-secondary">
                        {pos.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      isLong
                        ? "bg-buy-soft text-buy border border-buy/30"
                        : "bg-sell-soft text-sell border border-sell/30"
                    }`}
                  >
                    {pos.direction}
                  </span>
                </div>

                <p className="tabular-nums-fa text-[11px] text-text-secondary">
                  حجم ریالی کل:{" "}
                  <strong className="text-text-primary">
                    {pos.totalVolume} تومان
                  </strong>
                </p>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-bg-primary/65 p-2.5 text-[11px]">
                  <div>
                    <span className="block text-[9px] text-text-muted">
                      مقدار پوزیشن
                    </span>
                    <span className="tabular-nums-fa mt-0.5 block font-bold text-text-primary">
                      {pos.amount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-text-muted">
                      قیمت جاری
                    </span>
                    <span className="tabular-nums-fa mt-0.5 block font-bold text-text-primary">
                      {pos.currentPrice}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-text-muted">
                      سود/زیان برآورد
                    </span>
                    <span
                      dir="ltr"
                      className={`tabular-nums-fa mt-0.5 inline-block font-extrabold ${
                        isProfit ? "text-buy" : "text-sell"
                      }`}
                    >
                      {pos.estimatedPL}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="tabular-nums-fa text-[10px] text-text-secondary">
                    {pos.avgLabel}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-gold/35 bg-gold-soft px-3 py-1.5 text-[10px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
                  >
                    <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                    <span>مدیریت پوزیشن</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
