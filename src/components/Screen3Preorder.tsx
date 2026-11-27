"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Inbox,
  Minus,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface PreOrderProductOption {
  id: string;
  name: string;
}

interface PreOrderItem {
  id: string;
  side: "BUY" | "SELL";
  targetPrice: string;
  weightGrams: string;
  totalAmount: string;
  status: "ACTIVE" | "EXECUTED" | "CANCELLED" | "EXPIRED";
  product: { id: string; name: string; unit: string };
}

const STATUS_LABEL: Record<PreOrderItem["status"], string> = {
  ACTIVE: "فعال",
  EXECUTED: "اجرا شده",
  CANCELLED: "لغو شده",
  EXPIRED: "منقضی",
};

type ConditionalSide = "buy" | "sell";
type DateChip = "today" | "3days" | "7days" | "month";
type StatusChip = "all" | "active" | "executed" | "cancelled" | "expired";

const SYMBOL_OPTIONS = [
  "نقد فردا (تحویل فردایی شمش رویال)",
  "نقد پس\u200cفردا (تحویل دو روزه شمش رویال)",
  "سکه امامی ۸۶ (ضرب بانک مرکزی)",
  "نیم سکه بهار آزادی",
  "ربع سکه بهار آزادی",
  "سکه گرمی بانکی",
  "دلار آمریکا (حواله نقدی تهران)",
];

const DATE_CHIPS: { id: DateChip; label: string }[] = [
  { id: "today", label: "امروز" },
  { id: "3days", label: "۳ روز گذشته" },
  { id: "7days", label: "۷ روز گذشته" },
  { id: "month", label: "ماه جاری" },
];

const STATUS_CHIPS: { id: StatusChip; label: string }[] = [
  { id: "all", label: "همه (۰)" },
  { id: "active", label: "فعال" },
  { id: "executed", label: "اجرا شده" },
  { id: "cancelled", label: "لغو شده" },
  { id: "expired", label: "منقضی" },
];

function parseNumeric(raw: string): number {
  const ascii = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[,٬\s]/g, "");
  const n = Number(ascii);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function Screen3Preorder() {
  const [topTab, setTopTab] = useState<"new" | "list">("new");
  const [side, setSide] = useState<ConditionalSide>("buy");
  const [symbol, setSymbol] = useState<string>(SYMBOL_OPTIONS[0]);
  const [productOptions, setProductOptions] = useState<PreOrderProductOption[]>(
    SYMBOL_OPTIONS.map((name) => ({ id: name, name }))
  );
  const [preOrders, setPreOrders] = useState<PreOrderItem[]>([]);
  const [targetPrice, setTargetPrice] = useState<number>(44_150_000);
  const [weight, setWeight] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateChip, setDateChip] = useState<DateChip>("today");
  const [statusChip, setStatusChip] = useState<StatusChip>("all");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMyPreOrders = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    try {
      const qs = new URLSearchParams({
        range: dateChip,
        status: statusChip,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });
      const res = await fetch(`${API_BASE}/preorders/mine?${qs.toString()}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.preOrders)) {
          setPreOrders(data.preOrders);
        }
      }
    } catch {
      // ignore
    }
  }, [dateChip, statusChip, searchQuery]);

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
          const mapped = data.products.map(
            (p: { id: string; name: string }) => ({ id: p.id, name: p.name })
          );
          setProductOptions(mapped);
          setSymbol(mapped[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadMyPreOrders();
  }, [loadMyPreOrders]);

  const handleSubmitPreOrder = async () => {
    setErrorMsg(null);
    setSubmittedMessage(null);
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) {
      setSubmittedMessage(
        `پیش سفارش شرطی نمونه (${formatFaNumber(weight)} گرم) ثبت نمایشی شد.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/preorders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          productId: symbol,
          side: side.toUpperCase(),
          targetPrice: String(targetPrice),
          weightGrams: String(weight),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در ثبت پیش‌سفارش");
        return;
      }
      setSubmittedMessage(
        `پیش‌سفارش ${data.preOrder.product.name} (${formatFaNumber(
          Number(data.preOrder.weightGrams)
        )} ${data.preOrder.product.unit}) با وضعیت فعال ثبت شد.`
      );
      await loadMyPreOrders();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPreOrder = async (id: string) => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/preorders/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        await loadMyPreOrders();
      }
    } catch {
      // ignore
    }
  };

  const estimatedTotal = targetPrice * weight;
  const feeAmount = Math.round(estimatedTotal * 0.001);

  return (
    <AppShell
      activeTab="preorder"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Live-quote strip under header */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-bg-card px-3 py-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-buy shadow-[0_0_6px_rgba(16,185,129,0.85)]"
              aria-hidden="true"
            />
            <span>سامانه مظنه{"\u200c"}گیری زنده</span>
          </div>
          <span className="tabular-nums-fa font-bold text-gold">
            طلای ۱۸ عیار: ۴,۴۱۵,۰۰۰ تومان
          </span>
        </div>

        {/* Two Separate Top Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTopTab("new")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
              topTab === "new"
                ? "bg-gold text-bg-primary"
                : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
            }`}
          >
            پیش{"\u200c"}سفارش جدید
          </button>
          <button
            type="button"
            onClick={() => setTopTab("list")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              topTab === "list"
                ? "bg-gold text-bg-primary"
                : "border border-border-subtle bg-bg-card text-text-primary hover:border-gold/40"
            }`}
          >
            پیش{"\u200c"}سفارشات {formatFaNumber(preOrders.length)}
          </button>
        </div>

        {/* Conditional Buy / Sell Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              side === "buy"
                ? "bg-buy text-white"
                : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
            }`}
          >
            خرید شرطی
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              side === "sell"
                ? "bg-sell text-white"
                : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
            }`}
          >
            فروش شرطی
          </button>
        </div>

        {/* Form Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xs font-bold text-text-primary">
              انتخاب کالا و نماد تحویل
            </h1>
            <span className="rounded-lg border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-gold-t80">
              عیار ۹۹۵ (۲۴ عیار)
            </span>
          </div>

          <select
            aria-label="انتخاب کالا و نماد تحویل"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-gold focus:outline-none"
          >
            {productOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>

          {/* قیمت هدف (تومان) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="target-price-input"
                className="font-semibold text-text-primary"
              >
                قیمت هدف (تومان)
              </label>
              <span className="tabular-nums-fa text-[11px] text-text-secondary">
                مظنه پایه: ۴۴,۱۰۰,۰۰۰
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-primary px-3 py-2">
              <input
                id="target-price-input"
                type="text"
                inputMode="numeric"
                value={formatFaNumber(targetPrice)}
                onChange={(e) => {
                  const val = parseNumeric(e.target.value);
                  setTargetPrice(val);
                  setSubmittedMessage(null);
                }}
                className="tabular-nums-fa w-full bg-transparent text-sm font-extrabold text-text-primary focus:outline-none"
              />
              <span className="shrink-0 text-xs text-text-secondary">تومان</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "+۵۰,۰۰۰", delta: 50_000 },
                { label: "+۱۰۰,۰۰۰", delta: 100_000 },
                { label: "−۵۰,۰۰۰", delta: -50_000 },
                { label: "−۱۰۰,۰۰۰", delta: -100_000 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  dir="ltr"
                  onClick={() =>
                    setTargetPrice((prev) => Math.max(0, prev + btn.delta))
                  }
                  className="tabular-nums-fa rounded-lg border border-border-subtle bg-bg-primary py-1.5 text-[10px] font-semibold text-text-secondary transition-colors hover:border-gold/40 hover:text-gold cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* وزن درخواستی (گرم) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                وزن درخواستی (گرم)
              </span>
              <span className="text-[11px] text-text-secondary">
                حداقل: ۱ گرم
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1.5">
              <button
                type="button"
                aria-label="کاهش وزن"
                onClick={() => setWeight((prev) => Math.max(1, prev - 1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary hover:text-gold cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex flex-1 items-center justify-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="وزن درخواستی"
                  value={formatFaNumber(weight)}
                  onChange={(e) => {
                    const next = Math.max(1, parseNumeric(e.target.value));
                    setWeight(next);
                  }}
                  className="tabular-nums-fa w-14 bg-transparent text-center text-sm font-extrabold text-text-primary focus:outline-none"
                />
                <span className="text-xs text-text-secondary">گرم</span>
              </div>

              <button
                type="button"
                aria-label="افزایش وزن"
                onClick={() => setWeight((prev) => prev + 1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary hover:text-gold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Fee Line & Estimated Total (fee listed separately, NOT added to total) */}
          <div className="space-y-1.5 rounded-xl border border-gold/25 bg-bg-primary/75 p-3 text-xs">
            <div className="flex items-center justify-between gap-2 text-[11px] text-text-secondary">
              <span>کارمزد سامانه رویال (۰.۱٪):</span>
              <span className="tabular-nums-fa font-semibold text-text-primary">
                {formatFaNumber(feeAmount)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle">
              <span className="font-semibold text-text-primary">
                مبلغ کل تخمینی:
              </span>
              <span className="tabular-nums-fa text-sm font-extrabold text-gold">
                {formatFaNumber(estimatedTotal)} تومان
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 rounded-xl border border-border-subtle bg-bg-primary/60 p-3 text-[11px] leading-relaxed text-text-secondary">
            <div className="flex items-start gap-2">
              <AlertCircle
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
                aria-hidden="true"
              />
              <p>
                اعتبار این سفارش صرفاً تا پایان معاملات امروز می{"\u200c"}باشد و
                پس از تسویه بازار منقضی خواهد شد.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
                aria-hidden="true"
              />
              <p>
                این سفارش شرطی بوده و ثبت نهایی منوط به تطبیق حجم بازار و تایید
                ناظر سامانه است.
              </p>
            </div>
          </div>

          {/* Gold Submit */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmitPreOrder()}
            className="w-full rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "در حال ثبت..." : "ثبت پیش سفارش شرطی"}
          </button>

          {errorMsg ? (
            <p
              role="alert"
              className="rounded-xl border border-sell/45 bg-sell-soft px-3 py-2 text-center text-xs font-bold text-sell"
            >
              {errorMsg}
            </p>
          ) : null}

          {submittedMessage ? (
            <p className="rounded-xl border border-buy/35 bg-buy-soft px-3 py-2 text-center text-xs text-buy">
              {submittedMessage}
            </p>
          ) : null}
        </section>

        {/* Registered Conditional Orders List Section */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-text-primary">
              سفارش{"\u200c"}های شرطی ثبت شده
            </h2>
            <span className="rounded-lg border border-gold/25 bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-gold">
              سامانه تطبیق هوشمند
            </span>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary px-3 py-2">
            <Search
              className="h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نماد، کد پیگیری یا وزن..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          {/* Date Chips */}
          <div className="flex flex-wrap gap-1.5">
            {DATE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setDateChip(chip.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  dateChip === chip.id
                    ? "bg-gold text-bg-primary font-bold"
                    : "border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Status Chips */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusChip(chip.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusChip === chip.id
                    ? "bg-gold text-bg-primary font-bold"
                    : "border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Pre-orders List or Empty State */}
          {preOrders.length > 0 ? (
            <div className="space-y-2.5">
              {preOrders.map((po) => (
                <article
                  key={po.id}
                  className="rounded-2xl border border-border-subtle bg-bg-primary/70 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-text-primary">
                      {po.product.name} ({po.side === "BUY" ? "خرید" : "فروش"})
                    </span>
                    <span className="rounded-md border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
                      {STATUS_LABEL[po.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span className="tabular-nums-fa">
                      قیمت هدف: {formatFaNumber(Number(po.targetPrice))} تومان
                    </span>
                    <span className="tabular-nums-fa">
                      مقدار: {formatFaNumber(Number(po.weightGrams))} {po.product.unit}
                    </span>
                  </div>
                  {po.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => void handleCancelPreOrder(po.id)}
                      className="w-full rounded-xl border border-sell/45 bg-sell-soft py-1.5 text-[11px] font-bold text-sell cursor-pointer"
                    >
                      لغو پیش‌سفارش
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-primary/60 px-4 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-card text-text-muted">
                <Inbox className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-2.5 text-xs font-bold text-text-primary">
                هیچ داده{"\u200c"}ای یافت نشد
              </p>
              <p className="mt-1 text-[11px] text-text-secondary">
                در حال حاضر هیچ پیش{"\u200c"}سفارشی با فیلترهای انتخابی موجود نیست.
              </p>
              <button
                type="button"
                onClick={() => setTopTab("new")}
                className="mt-3 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-bg-primary transition-opacity hover:opacity-90 cursor-pointer"
              >
                ثبت سفارش شرطی جدید
              </button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-1.5 pb-1 text-center text-[11px] text-text-secondary">
          <ShieldCheck
            className="h-3.5 w-3.5 shrink-0 text-gold"
            aria-hidden="true"
          />
          <span>تضمین نقدشوندگی و اصالت شمش تحت نظارت مستقیم اتحادیه طلا</span>
        </footer>
      </div>
    </AppShell>
  );
}
