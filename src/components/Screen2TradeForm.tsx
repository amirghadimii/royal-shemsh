"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber, toPersianDigits } from "@/lib/format";
import { useBoardSocket } from "@/lib/useBoardSocket";
import type { TradeSide } from "@/types/trading";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

const BUY_UNIT_PRICE = 44_280_000;
const SELL_UNIT_PRICE = 44_320_000;
const MIN_GRAMS = 1;
const MAX_GRAMS = 1_000;
const TIMER_DURATION = 60;

interface LiveProduct {
  id: string;
  name: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  minOrder: number;
  maxOrder: number;
}

interface PendingOrderState {
  id: string;
  quoteCode: string;
  status: string;
  totalAmount: string;
  expiresAt: string;
}

export function Screen2TradeForm() {
  const [side, setSide] = useState<TradeSide>("buy");
  const [grams, setGrams] = useState<number>(10);
  const [gramsInput, setGramsInput] = useState<string>("۱۰");
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMER_DURATION);
  const [submittedNote, setSubmittedNote] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [liveProduct, setLiveProduct] = useState<LiveProduct | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrderState | null>(null);

  useBoardSocket({
    onOrderUpdated: (ev) => {
      if (!pendingOrder || ev.id !== pendingOrder.id) return;
      setPendingOrder((prev) => (prev ? { ...prev, status: ev.status } : null));
      if (ev.status === "APPROVED") {
        setSubmittedNote(
          `تایید شده — سفارش ${ev.quoteCode} با موفقیت تایید شد.`
        );
      } else if (ev.status === "REJECTED") {
        setSubmittedNote(
          `رد شده — سفارش ${ev.quoteCode} رد شد (${ev.rejectionReason ?? "رد توسط مدیر"}).`
        );
      } else if (ev.status === "EXPIRED") {
        setSubmittedNote(
          `منقضی / بدون پاسخ — مهلت تایید سفارش ${ev.quoteCode} به پایان رسید.`
        );
      }
    },
  });
  const [clientRequestId, setClientRequestId] = useState<string>(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}`
  );

  useEffect(() => {
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
          const p = data.products[0];
          setLiveProduct({
            id: p.id,
            name: p.name,
            unit: p.unit,
            buyPrice: Number(p.buyPrice),
            sellPrice: Number(p.sellPrice),
            minOrder: Number(p.minOrder),
            maxOrder: Number(p.maxOrder),
          });
        }
      })
      .catch(() => {});
  }, []);

  // Single live countdown value shared by ring, text, and pending order
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingOrder?.expiresAt) {
        const left = Math.max(
          0,
          Math.floor(
            (new Date(pendingOrder.expiresAt).getTime() - Date.now()) / 1000
          )
        );
        setSecondsLeft(left);
      } else {
        setSecondsLeft((prev) => (prev <= 1 ? TIMER_DURATION : prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingOrder?.expiresAt]);

  const activeBuyPrice = liveProduct?.buyPrice ?? BUY_UNIT_PRICE;
  const activeSellPrice = liveProduct?.sellPrice ?? SELL_UNIT_PRICE;
  const minLimit = liveProduct?.minOrder ?? MIN_GRAMS;
  const maxLimit = liveProduct?.maxOrder ?? MAX_GRAMS;
  const unitPrice = side === "buy" ? activeBuyPrice : activeSellPrice;
  const isValidGrams =
    Number.isFinite(grams) && grams >= minLimit && grams <= maxLimit;
  const totalToman = isValidGrams ? Math.round(grams * unitPrice) : 0;
  const totalRial = totalToman * 10;

  const timerProgress = (secondsLeft / TIMER_DURATION) * 100;
  const ringRadius = 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (secondsLeft / TIMER_DURATION) * ringCircumference;
  const formattedSeconds = toPersianDigits(String(secondsLeft).padStart(2, "0"));

  const applyGrams = (next: number) => {
    const clamped = Math.max(0, Math.min(99_999, next));
    setGrams(clamped);
    setGramsInput(formatFaNumber(clamped));
    setSubmittedNote(null);
  };

  const handleGramsInputChange = (raw: string) => {
    setGramsInput(raw);
    const ascii = raw
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[,٬\s]/g, "");
    const parsed = Number(ascii);
    if (ascii === "" || Number.isNaN(parsed)) {
      setGrams(0);
    } else {
      setGrams(Math.floor(parsed));
    }
    setSubmittedNote(null);
  };

  const handleTotalInputChange = (raw: string) => {
    const ascii = raw
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[,٬\sتومان]/g, "");
    const parsed = Number(ascii);
    if (!Number.isNaN(parsed) && parsed > 0) {
      const nextGrams = Math.round(parsed / unitPrice);
      applyGrams(Math.max(1, nextGrams));
    }
  };

  const handleSubmit = async () => {
    if (!isValidGrams) return;
    setErrorMsg(null);
    setSubmittedNote(null);

    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;

    if (!token || !liveProduct) {
      setSubmittedNote(
        `درخواست نمونه ${side === "buy" ? "خرید" : "فروش"} ${formatFaNumber(
          grams
        )} گرم به مبلغ ${formatFaNumber(totalToman)} تومان ثبت نمایشی شد.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          productId: liveProduct.id,
          side: side.toUpperCase(),
          quantity: String(grams),
          clientRequestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در ثبت سفارش");
        return;
      }
      const o = data.order;
      setPendingOrder({
        id: o.id,
        quoteCode: o.quoteCode,
        status: o.status,
        totalAmount: String(o.totalAmount),
        expiresAt: o.expiresAt,
      });
      if (o.expiresAt) {
        setSecondsLeft(
          Math.max(
            0,
            Math.floor((new Date(o.expiresAt).getTime() - Date.now()) / 1000)
          )
        );
      }
      setSubmittedNote(
        `سفارش ${o.quoteCode} در وضعیت در انتظار تایید (${formatFaNumber(
          Number(o.totalAmount)
        )} تومان) ثبت شد.`
      );
      setClientRequestId(
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `req-${Date.now()}`
      );
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    if (!pendingOrder) return;
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${pendingOrder.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        setPendingOrder(null);
        setSubmittedNote("سفارش با موفقیت لغو شد.");
      }
    } catch {
      // ignore
    }
  };

  return (
    <AppShell
      activeTab="trade"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Status Strip */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-buy/25 bg-bg-card px-3 py-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-text-primary">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-buy shadow-[0_0_6px_rgba(16,185,129,0.85)]"
              aria-hidden="true"
            />
            <span className="font-medium">
              بازار باز • نوسان لحظه‌ای مظنه طلا
            </span>
          </div>
          <span className="shrink-0 rounded-md bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-gold">
            مظنه مرجع: ۱۸ عیار
          </span>
        </div>

        {/* Symbol Card (نقد فردا) */}
        <section className="rounded-2xl border border-gold/30 bg-bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold text-text-primary">
                  نقد فردا
                </h1>
                <span className="rounded-lg border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-gold-t80">
                  شمش استانداردی ۲۴ عیار
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                تسویه فیزیکی و ریالی روز کاری آتی
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/35 bg-gold-soft px-2.5 py-1 text-[10px] font-bold text-gold">
              <Lock className="h-3 w-3" aria-hidden="true" />
              قیمت قفل‌شده
            </span>
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg-primary/70 px-3 py-2.5">
            <p className="text-xs text-text-secondary">
              نرخ قطعی هر گرم {side === "buy" ? "خرید" : "فروش"}:{" "}
              <strong
                className={`tabular-nums-fa text-sm font-extrabold ${
                  side === "buy" ? "text-buy" : "text-sell"
                }`}
              >
                {formatFaNumber(unitPrice)} تومان
              </strong>
            </p>
          </div>

          {/* Single 60s Countdown Timer Row */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r={ringRadius}
                    fill="none"
                    stroke="#242B3A"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={ringRadius}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-[stroke-dashoffset] duration-500"
                  />
                </svg>
                <span className="tabular-nums-fa absolute text-xs font-extrabold text-gold">
                  ۰۰:{formattedSeconds}
                </span>
              </div>

              <div>
                <p className="tabular-nums-fa text-xs font-bold text-text-primary">
                  {toPersianDigits(secondsLeft)} ثانیه تا پایان قفل قیمت
                </p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  کد مظنه:{" "}
                  <span dir="ltr" className="inline-block font-semibold text-gold">
                    #RS-۹۰۴
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Gold Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-primary">
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-500"
              style={{ width: `${timerProgress}%` }}
            />
          </div>
        </section>

        {/* Buy / Sell Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-subtle bg-bg-card p-1.5">
          <button
            type="button"
            onClick={() => {
              setSide("buy");
              setSubmittedNote(null);
            }}
            className={`rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              side === "buy"
                ? "bg-buy text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            خرید از سامانه
          </button>
          <button
            type="button"
            onClick={() => {
              setSide("sell");
              setSubmittedNote(null);
            }}
            className={`rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              side === "sell"
                ? "bg-sell text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            فروش به سامانه
          </button>
        </div>

        {/* Order Calculator */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">
              محاسبه‌گر سفارش نقد فردا
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isValidGrams
                  ? "bg-buy-soft text-buy"
                  : "bg-sell-soft text-sell"
              }`}
            >
              {isValidGrams ? (
                <>
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  معتبر
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  نامعتبر
                </>
              )}
            </span>
          </div>

          {/* Stepper: − [۱۰] گرم + */}
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1.5">
            <button
              type="button"
              onClick={() => applyGrams(Math.max(1, grams - 1))}
              aria-label="کاهش وزن"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary transition-colors hover:border hover:border-gold/40 hover:text-gold cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="flex flex-1 items-center justify-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                aria-label="وزن به گرم"
                value={gramsInput}
                onChange={(e) => handleGramsInputChange(e.target.value)}
                className="tabular-nums-fa w-14 bg-transparent text-center text-base font-extrabold text-text-primary focus:outline-none"
              />
              <span className="text-xs font-medium text-text-secondary">
                گرم
              </span>
            </div>

            <button
              type="button"
              onClick={() => applyGrams(grams + 1)}
              aria-label="افزایش وزن"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary transition-colors hover:border hover:border-gold/40 hover:text-gold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Weight Chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "+۵ گرم", value: grams + 5, isDefault: false },
              { label: "۱۰ گرم (پیش‌فرض)", value: 10, isDefault: true },
              { label: "+۵۰ گرم", value: grams + 50, isDefault: false },
              { label: "+۱۰۰ گرم", value: grams + 100, isDefault: false },
            ].map((chip) => {
              const isSelected = chip.isDefault && grams === 10;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => applyGrams(chip.value)}
                  className={`rounded-xl border px-1.5 py-2 text-[10px] font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "border-gold bg-gold-soft text-gold"
                      : "border-border-subtle bg-bg-primary text-text-secondary hover:border-gold/40 hover:text-text-primary"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Range & Acceptance Rule */}
          <div className="space-y-1 rounded-xl bg-bg-primary/60 p-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-secondary">
                محدوده مجاز سفارش: حداقل ۱ گرم — حداکثر ۱٬۰۰۰ گرم
              </span>
              <span
                className={`shrink-0 font-bold ${
                  isValidGrams ? "text-buy" : "text-sell"
                }`}
              >
                {isValidGrams ? "معتبر" : "نامعتبر"}
              </span>
            </div>
            <p className="text-text-muted">
              ضابطه پذیرش: وزن باید صرفاً بین ۱ تا ۱٬۰۰۰ گرم کامل تعیین گردد.
            </p>
          </div>

          {/* Formula & Total */}
          <div className="space-y-2 rounded-xl border border-gold/25 bg-bg-primary/80 p-3">
            <p className="tabular-nums-fa text-[11px] text-text-secondary">
              {formatFaNumber(unitPrice)} × {formatFaNumber(grams)} گرم = تراز
              قطعی
            </p>

            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="total-contract-input"
                className="text-xs font-semibold text-text-primary"
              >
                مبلغ کل قرارداد نقد فردا:
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-card px-2.5 py-1.5">
                <input
                  id="total-contract-input"
                  type="text"
                  inputMode="numeric"
                  value={formatFaNumber(totalToman)}
                  onChange={(e) => handleTotalInputChange(e.target.value)}
                  className="tabular-nums-fa w-28 bg-transparent text-left text-sm font-extrabold text-gold focus:outline-none"
                />
                <span className="text-[11px] text-text-secondary">تومان</span>
              </div>
            </div>

            <p className="tabular-nums-fa text-left text-[11px] text-text-muted">
              {formatFaNumber(totalRial)} ریال
            </p>
          </div>

          {/* Error Validation Sample */}
          <div className="rounded-xl border border-sell/45 bg-[#2A1217]/70 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-sell/85">
                نمونه خطای اعتبارسنجی
              </span>
              <span className="rounded-md bg-sell-soft px-2 py-0.5 text-[10px] font-bold text-sell">
                نامعتبر
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-sell/60 bg-bg-primary/90 px-3 py-2">
              <span className="tabular-nums-fa text-xs font-bold text-sell">
                ۱٬۵۰۰ گرم
              </span>
              <AlertCircle className="h-4 w-4 text-sell" aria-hidden="true" />
            </div>
            <p className="text-[11px] font-medium text-sell">
              وزن باید بین ۱ تا ۱٬۰۰۰ گرم باشد
            </p>
          </div>
        </section>

        {/* Settlement Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />
            <h2 className="text-sm font-bold text-gold">
              جزئیات تسویه حساب رویال
            </h2>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2">
              <dt className="text-text-secondary">کارمزد سامانه رویال شمش:</dt>
              <dd className="font-bold text-buy">۰ تومان (رایگان)</dd>
            </div>
            <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2">
              <dt className="text-text-secondary">نوع و چرخه تسویه:</dt>
              <dd className="text-left font-medium text-text-primary">
                نقدی فردا (۱ روز کاری پایا / ساتنا)
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2">
              <dt className="flex items-center gap-1 text-text-secondary">
                <Clock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                زمان اعتبار مظنه:
              </dt>
              <dd className="tabular-nums-fa text-left font-medium text-gold">
                تا انقضای تایمر جاری ({toPersianDigits(secondsLeft)} ثانیه)
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="text-text-secondary">
                محل تحویل فیزیکی (اختیاری):
              </dt>
              <dd className="text-left font-medium text-text-primary">
                خزانه مرکزی رویال شمش - تهران
              </dd>
            </div>
          </dl>
        </section>

        {/* Submit Button + Disclaimer */}
        <div className="space-y-2 pb-2">
          <button
            type="button"
            disabled={!isValidGrams || submitting}
            onClick={() => void handleSubmit()}
            className={`w-full rounded-2xl py-3.5 text-sm font-extrabold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
              side === "buy" ? "bg-buy" : "bg-sell"
            }`}
          >
            {submitting
              ? "در حال ثبت سفارش..."
              : `ثبت درخواست ${side === "buy" ? "خرید" : "فروش"} (${formatFaNumber(totalToman)} تومان)`}
          </button>

          {errorMsg ? (
            <p
              role="alert"
              className="rounded-xl border border-sell/45 bg-sell-soft px-3 py-2 text-center text-xs font-bold text-sell"
            >
              {errorMsg}
            </p>
          ) : null}

          {submittedNote ? (
            <div className="space-y-2 rounded-xl border border-gold/30 bg-gold-soft px-3 py-2 text-center text-xs font-medium text-gold">
              <p>{submittedNote}</p>
              {pendingOrder && pendingOrder.status === "PENDING_APPROVAL" ? (
                <button
                  type="button"
                  onClick={() => void handleCancelPending()}
                  className="rounded-lg border border-sell/45 bg-sell-soft px-3 py-1 text-[11px] font-bold text-sell cursor-pointer"
                >
                  لغو سفارش
                </button>
              ) : null}
            </div>
          ) : null}

          <p className="text-center text-[11px] text-text-secondary">
            این درخواست برای تایید به مدیر ارسال می‌شود و معامله نهایی نیست.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
