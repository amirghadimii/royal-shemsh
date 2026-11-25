"use client";

import { useState } from "react";
import {
  AppShell,
  EmptyState,
  NoAccessBanner,
  PriceCard,
  TradeRow,
} from "@/components/design-system";
import { SAMPLE_PRODUCTS, SAMPLE_TRADES, SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";
import type {
  GoldProduct,
  NavTabId,
  SampleTrade,
  TradeSide,
} from "@/types/trading";

export function RoyalGoldDemo() {
  const [activeTab, setActiveTab] = useState<NavTabId>("home");
  const [trades, setTrades] = useState<SampleTrade[]>(SAMPLE_TRADES);
  const [selectedAction, setSelectedAction] = useState<{
    product: GoldProduct;
    side: TradeSide;
  } | null>(null);
  const [showEmptyMarket, setShowEmptyMarket] = useState(false);

  const handleSelectPrice = (product: GoldProduct, side: TradeSide) => {
    setSelectedAction({ product, side });
    setActiveTab("trade");
  };

  const handleTradeDecision = (tradeId: string, status: "approved" | "rejected") => {
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === tradeId ? { ...trade, status } : trade
      )
    );
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      {activeTab === "home" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-gold/25 bg-bg-card px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-gold">تابلوی قیمت نمونه</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                نمایش داده‌های نمونه بدون قیمت لحظه‌ای و بدون معامله واقعی
              </p>
            </div>
            <span className="rounded-lg bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-gold">
              پیش‌نمایش
            </span>
          </div>

          <div className="grid gap-3">
            {SAMPLE_PRODUCTS.map((product) => (
              <PriceCard
                key={product.id}
                product={product}
                onSelectSide={handleSelectPrice}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "trade" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">خرید / فروش</h2>
            <button
              type="button"
              onClick={() => setShowEmptyMarket((prev) => !prev)}
              className="rounded-xl border border-border-subtle bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-gold/40 hover:text-gold cursor-pointer"
            >
              {showEmptyMarket ? "نمایش کالاها" : "نمایش وضعیت خالی"}
            </button>
          </div>

          {selectedAction ? (
            <div className="rounded-2xl border border-gold/30 bg-bg-card p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">انتخاب نمونه:</span>
                <span
                  className={`font-bold ${
                    selectedAction.side === "buy" ? "text-buy" : "text-sell"
                  }`}
                >
                  {selectedAction.side === "buy" ? "خرید" : "فروش"}{" "}
                  {selectedAction.product.name}
                </span>
              </div>
              <p className="tabular-nums-fa mt-2 text-sm font-bold text-gold">
                قیمت نمونه:{" "}
                {formatFaNumber(
                  selectedAction.side === "buy"
                    ? selectedAction.product.buyPrice
                    : selectedAction.product.sellPrice
                )}{" "}
                تومان
              </p>
            </div>
          ) : null}

          {showEmptyMarket ? (
            <EmptyState
              title="کالایی جهت معامله یافت نشد"
              description="در حال حاضر کالای فعالی برای ثبت سفارش نمونه وجود ندارد."
            />
          ) : (
            <div className="grid gap-3">
              {SAMPLE_PRODUCTS.map((product) => (
                <PriceCard
                  key={product.id}
                  product={product}
                  onSelectSide={handleSelectPrice}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "preorder" && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-text-primary">پیش سفارش</h2>
          <NoAccessBanner
            message="شما به این سرویس دسترسی ندارید"
            description="دسترسی ثبت پیش سفارش برای حساب کاربری شما فعال نشده است."
          />
          <EmptyState
            title="هیچ داده ای یافت نشد"
            description="پیش سفارشی برای نمایش وجود ندارد."
          />
        </section>
      )}

      {activeTab === "deals" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">معاملات</h2>
            <span className="tabular-nums-fa text-xs text-text-secondary">
              {formatFaNumber(trades.length)} مورد نمونه
            </span>
          </div>

          <div className="space-y-3">
            {trades.map((trade) => (
              <TradeRow
                key={trade.id}
                trade={trade}
                onApprove={(id) => handleTradeDecision(id, "approved")}
                onReject={(id) => handleTradeDecision(id, "rejected")}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "more" && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-text-primary">بیشتر</h2>

          <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">کاربر فعال</span>
              <span className="text-sm font-bold text-text-primary">
                {SAMPLE_USER.fullName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">وضعیت اتصال</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-buy">
                <span className="h-2 w-2 rounded-full bg-buy" aria-hidden="true" />
                آنلاین
              </span>
            </div>
          </div>

          <NoAccessBanner message="شما به این سرویس دسترسی ندارید" />

          <EmptyState title="کالایی جهت معامله یافت نشد" />
        </section>
      )}
    </AppShell>
  );
}
