"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, SearchX, WifiOff } from "lucide-react";
import { AppShell } from "@/components/design-system";
import { Screen15LoginNoticeModal } from "@/components/Screen15LoginNoticeModal";
import { Screen16ApprovalModal } from "@/components/Screen16ApprovalModal";
import { Screen18EmptyBoard } from "@/components/Screen18EmptyBoard";
import { SAMPLE_USER, SCREEN1_BOARD_SYMBOLS } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";
import { type SocketNewOrder, useBoardSocket } from "@/lib/useBoardSocket";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

export function Screen1Board() {
  const searchParams = useSearchParams();
  const modalParam = searchParams.get("modal");
  const viewParam = searchParams.get("view");
  const [loginNoticeDismissed, setLoginNoticeDismissed] = useState(false);
  const [approvalDismissed, setApprovalDismissed] = useState(false);
  const [tradingStopped, setTradingStopped] = useState(true);
  const [workingHours, setWorkingHours] = useState("۱۰:۳۰ تا ۲۱:۰۰");
  const [lastTickAt, setLastTickAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [boardSymbols, setBoardSymbols] = useState(SCREEN1_BOARD_SYMBOLS);
  const [pendingOrder, setPendingOrder] = useState<SocketNewOrder | null>(null);

  const syncBoard = useCallback(() => {
    fetch(`${API_BASE}/board/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (typeof data.tradingStopped === "boolean") {
          setTradingStopped(data.tradingStopped);
        }
        if (typeof data.workingHours === "string" && data.workingHours) {
          setWorkingHours(data.workingHours);
        }
        if (data.lastTickAt !== undefined) setLastTickAt(data.lastTickAt);
        if (typeof data.elapsedSeconds === "number") {
          setElapsedSeconds(data.elapsedSeconds);
        }
        if (typeof data.isStale === "boolean") setIsStale(data.isStale);
      })
      .catch(() => {});

    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;

    fetch(`${API_BASE}/board/products`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          setBoardSymbols(
            data.products.slice(0, 7).map(
              (p: {
                id: string;
                name: string;
                badge: string;
                subtitle: string;
                buyPrice: string | number;
                sellPrice: string | number;
              }) => ({
                id: p.id,
                name: p.name,
                badge: p.badge,
                subtitle: p.subtitle,
                buyPrice: Number(p.buyPrice),
                sellPrice: Number(p.sellPrice),
                clickable: true,
              })
            )
          );
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/orders/pending`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.orders) && data.orders.length > 0) {
          const o = data.orders[0];
          setPendingOrder({
            id: o.id,
            quoteCode: o.quoteCode,
            userId: o.userId,
            userName: o.user?.fullName ?? "کاربر",
            productId: o.productId,
            productName: o.product?.name ?? "کالا",
            unit: o.product?.unit ?? "گرم",
            side: o.side,
            quantity: String(o.quantity),
            unitPrice: String(o.unitPrice),
            totalAmount: String(o.totalAmount),
            status: o.status,
            expiresAt: o.expiresAt,
            createdAt: o.createdAt,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    syncBoard();
  }, [syncBoard]);

  const { socketStatus } = useBoardSocket({
    onPriceUpdate: (ev) => {
      setLastTickAt(ev.recordedAt);
      setElapsedSeconds(0);
      setIsStale(false);
      setBoardSymbols((prev) =>
        prev.map((item) =>
          item.id === ev.productId || item.name === ev.name
            ? {
                ...item,
                buyPrice: Number(ev.buyPrice),
                sellPrice: Number(ev.sellPrice),
              }
            : item
        )
      );
    },
    onBoardStatus: (ev) => {
      setTradingStopped(ev.tradingStopped);
      if (ev.workingHours) setWorkingHours(ev.workingHours);
    },
    onNewOrder: (ev) => {
      setPendingOrder(ev);
      setApprovalDismissed(false);
    },
    onOrderUpdated: (ev) => {
      setPendingOrder((prev) =>
        prev && prev.id === ev.id ? { ...prev, status: ev.status } : prev
      );
    },
    onReconnect: syncBoard,
  });

  const lastUpdateLabel = lastTickAt
    ? new Date(lastTickAt).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "۱۰:۴۵";

  const isRegularEmptyView = viewParam === "empty-regular";
  const showLoginNotice =
    modalParam === "login-notice" && !loginNoticeDismissed;
  const showApprovalModal =
    modalParam === "pending-approval" && !approvalDismissed;

  return (
    <AppShell
      activeTab="home"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
      brandSubtitle={
        isRegularEmptyView ? "سامانه معاملات شمش طلا" : "معاملات سامانه رویال شمش"
      }
    >
      <Screen15LoginNoticeModal
        open={showLoginNotice}
        onDismiss={() => setLoginNoticeDismissed(true)}
      />
      <Screen16ApprovalModal
        open={showApprovalModal || Boolean(pendingOrder)}
        order={pendingOrder}
        onClose={() => {
          setApprovalDismissed(true);
          setPendingOrder(null);
        }}
      />
      {isRegularEmptyView ? (
        <Screen18EmptyBoard />
      ) : (
      <div className="space-y-3">
        {/* Hours Card (#161B26) */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gold">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ساعات کاری سامانه</span>
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                ساعات رسمی بازار
              </p>
            </div>
            <p className="tabular-nums-fa text-lg font-extrabold tracking-tight text-gold sm:text-xl">
              {workingHours}
            </p>
          </div>
        </section>

        {/* Stopped Banner (Dark Red) */}
        {tradingStopped ? (
          <section
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-sell/45 bg-[#2A1217] px-3.5 py-3 text-sell"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-sell"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-sell">
                معاملات توسط مدیر متوقف شده است
              </p>
              <p className="mt-0.5 text-[11px] text-sell/85">
                ثبت سفارش و معاملات لحظه‌ای موقتاً غیرفعال می‌باشد
              </p>
            </div>
          </section>
        ) : null}

        {/* Socket Disconnected Banner */}
        {socketStatus === "disconnected" ? (
          <section
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-sell/45 bg-[#2A1217] px-3.5 py-3 text-sell"
          >
            <WifiOff
              className="mt-0.5 h-4 w-4 shrink-0 text-sell"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-sell">
                ارتباط با سرور قطع شده است
              </p>
              <p className="mt-0.5 text-[11px] text-sell/85">
                در حال تلاش برای اتصال مجدد و همگام‌سازی قیمت‌ها...
              </p>
            </div>
          </section>
        ) : null}

        {/* Last-Update Row */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isStale || socketStatus === "disconnected"
                  ? "bg-sell shadow-[0_0_6px_rgba(239,68,68,0.85)]"
                  : "bg-buy shadow-[0_0_6px_rgba(16,185,129,0.85)]"
              }`}
              aria-hidden="true"
            />
            <span className="text-text-secondary">
              آخرین به‌روزرسانی قیمت:{" "}
              <strong className="tabular-nums-fa font-bold text-gold">
                {lastUpdateLabel}
              </strong>
            </span>
          </div>

          {socketStatus === "disconnected" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sell/35 bg-sell-soft px-2.5 py-0.5 text-[11px] font-semibold text-sell">
              قطع ارتباط
            </span>
          ) : isStale ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sell/35 bg-sell-soft px-2.5 py-0.5 text-[11px] font-semibold text-sell">
              منقضی{elapsedSeconds !== null ? ` (${formatFaNumber(elapsedSeconds)} ثانیه)` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[11px] font-semibold text-buy">
              زنده
            </span>
          )}
        </div>

        {/* Trading Board Table */}
        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
          {/* Table Header */}
          <div className="grid grid-cols-[1.45fr_1fr_1fr] items-center gap-1.5 border-b border-border-subtle bg-bg-elevated/60 px-3 py-2.5 text-[11px] font-semibold">
            <div className="text-right text-text-secondary">
              نام نماد معاملاتی
            </div>
            <div className="flex justify-center">
              <span className="rounded-full border border-buy/35 bg-buy-soft px-3 py-0.5 text-buy">
                خرید
              </span>
            </div>
            <div className="flex justify-end">
              <span className="rounded-full border border-sell/35 bg-sell-soft px-3 py-0.5 text-sell">
                فروش
              </span>
            </div>
          </div>

          {/* Product Rows */}
          <div className="divide-y divide-border-subtle">
            {boardSymbols.map((item) => {
              const rowContent = (
                <div className="grid grid-cols-[1.45fr_1fr_1fr] items-center gap-1.5 px-3 py-3 transition-colors hover:bg-bg-elevated/40">
                  {/* Symbol Name + Badge + Subtitle */}
                  <div className="min-w-0 text-right">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-text-primary">
                        {item.name}
                      </span>
                      <span className="shrink-0 rounded-md border border-gold/25 bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-gold-t80">
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-text-secondary">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Buy Price (Center) */}
                  <div className="text-center">
                    <p className="tabular-nums-fa text-xs font-bold text-buy sm:text-[13px]">
                      {formatFaNumber(item.buyPrice)}
                    </p>
                    <p className="text-[10px] text-text-muted">تومان</p>
                  </div>

                  {/* Sell Price (Left) */}
                  <div className="text-left">
                    <p className="tabular-nums-fa text-xs font-bold text-sell sm:text-[13px]">
                      {formatFaNumber(item.sellPrice)}
                    </p>
                    <p className="text-[10px] text-text-muted">تومان</p>
                  </div>
                </div>
              );

              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block focus:outline-none focus-visible:bg-bg-elevated/60"
                  >
                    {rowContent}
                  </Link>
                );
              }

              return <div key={item.id}>{rowContent}</div>;
            })}
          </div>
        </section>

        {/* Empty State */}
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-card/70 px-4 py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary text-text-muted">
            <SearchX className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2.5 text-xs font-bold text-text-primary">
            کالایی جهت معامله یافت نشد
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            برای نمادهای بیشتر فیلترهای جستجو را بازنشانی کنید
          </p>
        </section>
      </div>
      )}
    </AppShell>
  );
}
