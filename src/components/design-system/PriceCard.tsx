"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatFaNumber } from "@/lib/format";
import type { GoldProduct, TradeSide } from "@/types/trading";

interface PriceCardProps {
  product: GoldProduct;
  onSelectSide?: (product: GoldProduct, side: TradeSide) => void;
}

export function PriceCard({ product, onSelectSide }: PriceCardProps) {
  return (
    <article className="rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-sm transition-colors hover:border-gold/35">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary sm:text-base">
            {product.name}
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">{product.unit}</p>
        </div>
        {product.purity ? (
          <span className="rounded-lg border border-gold/25 bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold">
            {product.purity}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onSelectSide?.(product, "buy")}
          className="flex flex-col items-start rounded-xl border border-buy/25 bg-buy-soft px-3 py-2.5 text-right transition-colors hover:border-buy/50 cursor-pointer"
        >
          <span className="flex items-center gap-1 text-[11px] font-medium text-buy">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            خرید
          </span>
          <span className="tabular-nums-fa mt-1 text-sm font-bold text-buy sm:text-base">
            {formatFaNumber(product.buyPrice)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSide?.(product, "sell")}
          className="flex flex-col items-start rounded-xl border border-sell/25 bg-sell-soft px-3 py-2.5 text-right transition-colors hover:border-sell/50 cursor-pointer"
        >
          <span className="flex items-center gap-1 text-[11px] font-medium text-sell">
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            فروش
          </span>
          <span className="tabular-nums-fa mt-1 text-sm font-bold text-sell sm:text-base">
            {formatFaNumber(product.sellPrice)}
          </span>
        </button>
      </div>
    </article>
  );
}
