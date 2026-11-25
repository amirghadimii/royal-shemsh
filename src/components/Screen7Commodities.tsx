"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FolderKanban,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";

interface CommodityItem {
  id: string;
  name: string;
  badge: string;
  buyPrice: number;
  sellPrice: number;
  minLimit: string;
  maxLimit: string;
}

const INITIAL_COMMODITIES: CommodityItem[] = [
  {
    id: "c1",
    name: "نقد فردا (آبشده)",
    badge: "طلا ۱۸ عیار",
    buyPrice: 44_280_000,
    sellPrice: 44_320_000,
    minLimit: "۱ گرم",
    maxLimit: "۱٬۰۰۰ گرم",
  },
  {
    id: "c2",
    name: "نقد پس\u200cفردا",
    badge: "طلا ۱۸ عیار",
    buyPrice: 44_300_000,
    sellPrice: 44_350_000,
    minLimit: "۱۰ گرم",
    maxLimit: "۱٬۰۰۰ گرم",
  },
  {
    id: "c3",
    name: "سکه امامی ۸۶",
    badge: "طرح جدید",
    buyPrice: 51_100_000,
    sellPrice: 51_250_000,
    minLimit: "۱ عدد",
    maxLimit: "۱۰۰ عدد",
  },
  {
    id: "c4",
    name: "نیم سکه",
    badge: "بانکی",
    buyPrice: 27_400_000,
    sellPrice: 27_550_000,
    minLimit: "۱ عدد",
    maxLimit: "۲۰۰ عدد",
  },
  {
    id: "c5",
    name: "ربع سکه",
    badge: "بانکی",
    buyPrice: 17_100_000,
    sellPrice: 17_250_000,
    minLimit: "۱ عدد",
    maxLimit: "۳۰۰ عدد",
  },
  {
    id: "c6",
    name: "گرمی بانکی",
    badge: "سکه ۱ گرمی",
    buyPrice: 8_400_000,
    sellPrice: 8_500_000,
    minLimit: "۱ عدد",
    maxLimit: "۵۰۰ عدد",
  },
  {
    id: "c7",
    name: "دلار آمریکا",
    badge: "اسکناس",
    buyPrice: 69_200,
    sellPrice: 69_400,
    minLimit: "۱۰۰ دلار",
    maxLimit: "۵۰٬۰۰۰ دلار",
  },
];

export function Screen7Commodities() {
  const [items, setItems] = useState<CommodityItem[]>(INITIAL_COMMODITIES);
  const [notice, setNotice] = useState<string | null>(null);

  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next;
    });
  };

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Toolbar */}
        <div className="grid grid-cols-[1.35fr_1fr_0.95fr] gap-1.5">
          <button
            type="button"
            onClick={() => setNotice("فرم افزودن کالای جدید (نمایش نمونه)")}
            className="flex items-center justify-center gap-1 rounded-xl bg-gold px-2 py-2.5 text-[10.5px] font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>افزودن کالای جدید</span>
          </button>

          <button
            type="button"
            onClick={() => setNotice("مدیریت گروه\u200cهای کالا (نمایش نمونه)")}
            className="flex items-center justify-center gap-1 rounded-xl bg-buy px-2 py-2.5 text-[10.5px] font-bold text-white hover:opacity-90 cursor-pointer"
          >
            <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>گروه{"\u200c"}های کالا</span>
          </button>

          <button
            type="button"
            onClick={() => setNotice("ترتیب نمایش کالاها ذخیره نمایشی شد.")}
            className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 py-2.5 text-[10.5px] font-bold text-white hover:bg-blue-500 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>ذخیره ترتیب</span>
          </button>
        </div>

        {/* Count & Hint */}
        <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
          <h1 className="font-bold text-text-primary">
            تعداد کل کالاها: {formatFaNumber(items.length)} نماد فعال
          </h1>
          <span className="text-[10px] text-text-secondary">
            تغییر ترتیب با نگهداشتن یا دکمه{"\u200c"}ها
          </span>
        </div>

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

        {/* Seven Commodity Cards */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-3"
            >
              {/* Top Row: Drag Handle + Name + Badge + 4 Control Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-text-muted"
                    aria-label="جابجایی"
                  >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xs font-extrabold text-text-primary">
                      {item.name}
                    </h2>
                    <span className="mt-0.5 inline-block rounded-md border border-gold/25 bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-gold-t80">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* 4 Control Buttons */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="انتقال به بالا"
                    title="انتقال به بالا"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-text-secondary hover:border-gold/40 hover:text-gold disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="انتقال به پایین"
                    title="انتقال به پایین"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-text-secondary hover:border-gold/40 hover:text-gold disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="ویرایش کالا"
                    title="ویرایش کالا"
                    onClick={() => setNotice(`ویرایش ${item.name} (نمایش نمونه)`)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold/30 bg-gold-soft text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف کالا"
                    title="حذف کالا"
                    onClick={() => setNotice(`حذف ${item.name} (نمایش نمونه)`)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-sell/30 bg-sell-soft text-sell hover:bg-sell hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Buy & Sell Prices */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-buy/25 bg-buy-soft px-3 py-2">
                  <span className="block text-[10px] font-medium text-buy">
                    قیمت خرید (تومان)
                  </span>
                  <span className="tabular-nums-fa mt-0.5 block text-xs font-extrabold text-buy sm:text-sm">
                    {formatFaNumber(item.buyPrice)}
                  </span>
                </div>

                <div className="rounded-xl border border-sell/25 bg-sell-soft px-3 py-2">
                  <span className="block text-[10px] font-medium text-sell">
                    قیمت فروش (تومان)
                  </span>
                  <span className="tabular-nums-fa mt-0.5 block text-xs font-extrabold text-sell sm:text-sm">
                    {formatFaNumber(item.sellPrice)}
                  </span>
                </div>
              </div>

              {/* Order Limit */}
              <p className="rounded-lg bg-bg-primary/65 px-2.5 py-1.5 text-[11px] text-text-secondary">
                محدودیت سفارش: حداقل: {item.minLimit} | حداکثر:{" "}
                {item.maxLimit}
              </p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
