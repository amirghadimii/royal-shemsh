"use client";

import { ApproveRejectButtons } from "@/components/design-system/ApproveRejectButtons";
import { formatFaNumber } from "@/lib/format";
import type { SampleTrade, TradeStatus } from "@/types/trading";

interface TradeRowProps {
  trade: SampleTrade;
  onApprove?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
}

const STATUS_BADGE: Record<
  TradeStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "در انتظار تایید",
    className: "border-gold/30 bg-gold-soft text-gold",
  },
  approved: {
    label: "تایید شده",
    className: "border-buy/30 bg-buy-soft text-buy",
  },
  rejected: {
    label: "رد شده",
    className: "border-sell/30 bg-sell-soft text-sell",
  },
};

export function TradeRow({ trade, onApprove, onReject }: TradeRowProps) {
  const isBuy = trade.side === "buy";
  const statusInfo = STATUS_BADGE[trade.status];

  return (
    <article className="rounded-2xl border border-border-subtle bg-bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
              isBuy ? "bg-buy-soft text-buy" : "bg-sell-soft text-sell"
            }`}
          >
            {isBuy ? "خرید" : "فروش"}
          </span>
          <h3 className="text-sm font-bold text-text-primary">
            {trade.productName}
          </h3>
        </div>

        <span
          className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-bg-primary/60 p-2.5 text-xs">
        <div>
          <span className="block text-[11px] text-text-muted">مقدار</span>
          <span className="tabular-nums-fa mt-0.5 block font-semibold text-text-primary">
            {trade.amount}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-text-muted">فی</span>
          <span className="tabular-nums-fa mt-0.5 block font-semibold text-text-primary">
            {formatFaNumber(trade.price)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-text-muted">مبلغ کل</span>
          <span className="tabular-nums-fa mt-0.5 block font-semibold text-gold">
            {formatFaNumber(trade.total)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-secondary">
        <span className="tabular-nums-fa">شناسه: {trade.id}</span>
        <span className="tabular-nums-fa">ساعت: {trade.time}</span>
      </div>

      {trade.status === "pending" && (onApprove || onReject) ? (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <ApproveRejectButtons
            size="sm"
            onApprove={() => onApprove?.(trade.id)}
            onReject={() => onReject?.(trade.id)}
          />
        </div>
      ) : null}
    </article>
  );
}
