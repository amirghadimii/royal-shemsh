"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Search,
  SlidersHorizontal,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface LiveTradeItem {
  id: string;
  tradeCode: string;
  side: "BUY" | "SELL";
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  status: "APPROVED" | "REJECTED" | "PENDING" | "NO_RESPONSE";
  audited: boolean;
  createdAt: string;
  user?: { fullName: string };
  product: { name: string; unit: string };
}

interface LiveLedgerEntry {
  id: string;
  documentNumber: string;
  entryType: string;
  rialAmount: string;
  goldGrams: string;
  description: string;
  createdAt: string;
}

interface LiveAccountingSummary {
  cashBalanceToman: string;
  totalGoldGrams: string;
}

type DealsTab = "trades" | "accounting";
type DateChip = "today" | "week" | "month" | "calendar";
type OrderStatusChip = "all" | "approved" | "rejected" | "pending" | "no-response";
type AuditChip = "all" | "audited" | "unaudited";

const DATE_CHIPS: { id: DateChip; label: string }[] = [
  { id: "today", label: "امروز" },
  { id: "week", label: "هفته جاری" },
  { id: "month", label: "ماه جاری" },
  { id: "calendar", label: "تقویم" },
];

const STATUS_CHIPS: { id: OrderStatusChip; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "approved", label: "تایید شده" },
  { id: "rejected", label: "رد شده" },
  { id: "pending", label: "در انتظار" },
  { id: "no-response", label: "بدون پاسخ" },
];

const AUDIT_CHIPS: { id: AuditChip; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "audited", label: "حسابرسی شده" },
  { id: "unaudited", label: "حسابرسی نشده" },
];

export function Screen4Deals() {
  const [activeTab, setActiveTab] = useState<DealsTab>("trades");
  const [dateChip, setDateChip] = useState<DateChip>("today");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusChip, setStatusChip] = useState<OrderStatusChip>("all");
  const [auditChip, setAuditChip] = useState<AuditChip>("all");
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [liveTrades, setLiveTrades] = useState<LiveTradeItem[] | null>(null);
  const [accountingSummary, setAccountingSummary] =
    useState<LiveAccountingSummary | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LiveLedgerEntry[]>([]);

  const loadDealsData = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;

    try {
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = meRes.ok ? await meRes.json() : null;
      const admin =
        meJson?.user?.role?.code === "ADMIN" ||
        meJson?.user?.role?.code === "SYSTEM_MANAGER";
      setIsAdminSession(admin);

      const statusParam =
        statusChip === "no-response" ? "NO_RESPONSE" : statusChip;
      const qs = new URLSearchParams({
        range: dateChip === "calendar" ? "month" : dateChip,
        ...(statusChip !== "all" ? { status: statusParam } : {}),
        ...(auditChip !== "all" ? { audit: auditChip } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });

      const [tradesRes, accRes] = await Promise.all([
        fetch(`${API_BASE}${admin ? "/trades" : "/trades/mine"}?${qs.toString()}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/accounting/mine`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (tradesRes.ok) {
        const tj = await tradesRes.json();
        if (Array.isArray(tj?.trades)) setLiveTrades(tj.trades);
      }
      if (accRes.ok) {
        const aj = await accRes.json();
        if (aj?.summary) setAccountingSummary(aj.summary);
        if (Array.isArray(aj?.entries)) setLedgerEntries(aj.entries);
      }
    } catch {
      // keep sample fallback
    }
  }, [dateChip, statusChip, auditChip, searchQuery]);

  useEffect(() => {
    void loadDealsData();
  }, [loadDealsData]);

  const handleToggleAudit = async (tradeId: string) => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || !isAdminSession) return;
    await fetch(`${API_BASE}/trades/${tradeId}/audit`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadDealsData();
  };

  const handleExportCsv = async () => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    const res = await fetch(`${API_BASE}/accounting/mine/export`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger-mine.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const showRow1 =
    (statusChip === "all" || statusChip === "approved") &&
    (auditChip === "all" || auditChip === "audited");
  const showRow2 =
    (statusChip === "all" || statusChip === "rejected") &&
    (auditChip === "all" || auditChip === "unaudited");
  const showRow3 =
    (statusChip === "all" || statusChip === "pending") &&
    (auditChip === "all" || auditChip === "unaudited");

  return (
    <AppShell
      activeTab="deals"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Main Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-subtle bg-bg-card p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("trades")}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === "trades"
                ? "bg-gold text-bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            معاملات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("accounting")}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === "accounting"
                ? "bg-gold text-bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            حسابداری
          </button>
        </div>

        {activeTab === "trades" ? (
          <>
            {/* Date Chips */}
            <div className="flex flex-wrap gap-1.5">
              {DATE_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setDateChip(chip.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    dateChip === chip.id
                      ? "bg-gold text-bg-primary font-bold"
                      : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search + Filter Button */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5">
                <Search
                  className="h-4 w-4 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی کاربر، کد رهگیری، نوع شمش..."
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
              <button
                type="button"
                aria-label="فیلتر"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary hover:border-gold/40 hover:text-gold cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Status & Audit Filter Chips */}
            <section className="rounded-2xl border border-border-subtle bg-bg-card p-3 space-y-2.5">
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-text-secondary">
                  وضعیت سفارش:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setStatusChip(chip.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        statusChip === chip.id
                          ? "bg-gold text-bg-primary font-bold"
                          : "border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
                <span className="block text-[11px] font-semibold text-text-secondary">
                  فیلتر حسابرسی اسناد:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIT_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setAuditChip(chip.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        auditChip === chip.id
                          ? "bg-gold text-bg-primary font-bold"
                          : "border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Trades Section Header */}
            <div className="flex items-center justify-between px-1">
              <h1 className="text-xs font-bold text-text-primary">
                لیست معاملات ثبت{"\u200c"}شده
              </h1>
              <span className="text-[11px] font-medium text-buy">
                به{"\u200c"}روزرسانی: آنی
              </span>
            </div>

            {/* Trade Rows (Live when authenticated, Sample fallback otherwise) */}
            {liveTrades !== null ? (
              <div className="space-y-2.5">
                {liveTrades.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border-subtle bg-bg-card p-6 text-center text-xs text-text-secondary">
                    معامله‌ای با فیلترهای انتخابی یافت نشد.
                  </p>
                ) : (
                  liveTrades.map((t) => (
                    <article
                      key={t.id}
                      className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary">
                              {t.product.name}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                t.side === "BUY"
                                  ? "bg-buy-soft text-buy"
                                  : "bg-sell-soft text-sell"
                              }`}
                            >
                              {t.side === "BUY" ? "خرید" : "فروش"}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary">
                            طرف حساب: {t.user?.fullName ?? "شما"} • کد {t.tradeCode}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-buy">
                          {t.status === "APPROVED" ? "تایید شده" : t.status}
                        </span>
                      </div>

                      <div className="space-y-1 rounded-xl bg-bg-primary/65 p-2.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">مقدار مبادله:</span>
                          <span className="tabular-nums-fa font-semibold text-text-primary">
                            {formatFaNumber(Number(t.quantity))} {t.product.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">مبلغ تسویه (تومان):</span>
                          <span className="tabular-nums-fa font-bold text-buy">
                            {formatFaNumber(Number(t.totalAmount))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-text-secondary">
                          {t.audited ? "حسابرسی شده" : "حسابرسی نشده"}
                        </span>
                        {isAdminSession ? (
                          <button
                            type="button"
                            onClick={() => void handleToggleAudit(t.id)}
                            className="rounded-lg border border-gold/35 bg-gold-soft px-3 py-1 text-[11px] font-bold text-gold cursor-pointer"
                          >
                            {t.audited ? "لغو حسابرسی" : "تایید حسابرسی"}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : (
            <div className="space-y-2.5">
              {showRow1 ? (
                <article className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">
                          نقد فردا
                        </span>
                        <span className="rounded-md bg-buy-soft px-2 py-0.5 text-[10px] font-bold text-buy">
                          خرید
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        طرف حساب: امیر قدیمی
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-secondary">
                        امروز ۱۰:۳۲
                      </span>
                      <span
                        aria-label="تایید شده"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-buy-soft text-buy"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl bg-bg-primary/65 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">وزن مبادله:</span>
                      <span className="font-semibold text-text-primary">
                        ۱۰ گرم شمش ونوس
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">
                        مبلغ تسویه (تومان):
                      </span>
                      <span className="tabular-nums-fa font-bold text-buy">
                        ۴۴۲,۸۰۰,۰۰۰
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-text-secondary">
                      حسابرسی رسمی خزانه مرکزی
                    </span>
                    <button
                      type="button"
                      className="rounded-lg border border-gold/35 bg-gold-soft px-3 py-1 text-[11px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
                    >
                      رسید دیجیتال
                    </button>
                  </div>
                </article>
              ) : null}

              {showRow2 ? (
                <article className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">
                          سکه امامی ۸۶
                        </span>
                        <span className="rounded-md bg-sell-soft px-2 py-0.5 text-[10px] font-bold text-sell">
                          فروش
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        طرف حساب: امیر قدیمی
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-secondary">
                        امروز ۰۹:۱۵
                      </span>
                      <span
                        aria-label="رد شده"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-sell-soft text-sell"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl bg-bg-primary/65 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">تعداد تحویل:</span>
                      <span className="font-semibold text-text-primary">
                        ۲ عدد گواهی سپرده
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">
                        مبلغ مطالبه (تومان):
                      </span>
                      <span className="tabular-nums-fa font-bold text-sell">
                        ۱۰۲,۵۰۰,۰۰۰
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-sell/45 bg-[#2A1217] px-3 py-2 text-[11px] text-sell">
                    علت رد درخواست: عدم کفایت موجودی خزانه و تکمیل سقف حواله
                    روزانه
                  </div>
                </article>
              ) : null}

              {showRow3 ? (
                <article className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">
                          نقد پس{"\u200c"}فردا
                        </span>
                        <span className="rounded-md bg-buy-soft px-2 py-0.5 text-[10px] font-bold text-buy">
                          خرید
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        طرف حساب: امیر قدیمی
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-secondary">
                        دیروز ۱۸:۴۰
                      </span>
                      <span className="rounded-full border border-gold/35 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
                        در انتظار
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl bg-bg-primary/65 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">وزن سفارش:</span>
                      <span className="font-semibold text-text-primary">
                        ۲۵ گرم پلاک استاندارد
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">
                        مبلغ سفارش (تومان):
                      </span>
                      <span className="tabular-nums-fa font-bold text-gold">
                        ۱,۱۰۸,۷۵۰,۰۰۰
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] text-text-secondary">
                    <span>در انتظار تایید و تطبیق مدیر معاملات</span>
                    <span>
                      شناسه:{" "}
                      <span dir="ltr" className="inline-block font-semibold text-gold">
                        #RS-9942
                      </span>
                    </span>
                  </div>
                </article>
              ) : null}
            </div>
            )}
          </>
        ) : null}

        {/* Balance Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-gold" aria-hidden="true" />
              <h2 className="text-xs font-bold text-text-primary">
                مانده حساب و وضعیت مالی
              </h2>
            </div>
            <span className="rounded-full border border-gold/35 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
              حساب فعال VIP
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-text-secondary">
                  مانده ریالی قابل معامله
                </span>
                <span className="tabular-nums-fa text-xs font-extrabold text-buy">
                  {accountingSummary
                    ? `${formatFaNumber(Number(accountingSummary.cashBalanceToman))} تومان`
                    : "۵۸۰,۴۰۰,۰۰۰ تومان"}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-text-muted">
                آزاد جهت خرید نقدی و ثبت پیش{"\u200c"}سفارش
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-text-secondary">
                  مانده وزن طلا / کالا
                </span>
                <span className="tabular-nums-fa text-xs font-extrabold text-gold">
                  {accountingSummary
                    ? `${formatFaNumber(Number(accountingSummary.totalGoldGrams))} گرم`
                    : "۱,۴۵۰,۰۰۰,۰۰۰"}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-text-muted">
                محاسبه‌شده مستقیم از اسناد دفتر کل
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-text-secondary">
                  اعتبار فعال معامله
                </span>
                <span className="tabular-nums-fa text-xs font-extrabold text-text-primary">
                  ۲۰۰,۰۰۰,۰۰۰ تومان
                </span>
              </div>
              <p className="mt-1 text-[10px] text-text-muted">
                خط اعتباری تسویه ۴۸ ساعته
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-xl bg-gold py-2.5 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
            >
              افزایش وجه حساب
            </button>
            <button
              type="button"
              className="rounded-xl border border-border-subtle bg-bg-primary py-2.5 text-xs font-bold text-text-primary hover:border-gold/40 cursor-pointer"
            >
              درخواست تسویه ریالی
            </button>
          </div>
        </section>

        {/* Documents Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gold" aria-hidden="true" />
              <h2 className="text-xs font-bold text-text-primary">
                جزئیات اسناد و صورتحساب
              </h2>
            </div>
            <span className="rounded-lg border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] text-text-secondary">
              سامانه مودیان و سنا
            </span>
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg-primary/70 px-3 py-2.5 text-xs text-text-secondary">
            انتخاب بازه تاریخی اسناد:{" "}
            <strong className="tabular-nums-fa text-gold">۱۴۰۵/۰۹/۰۴</strong>
          </div>

          {ledgerEntries.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {ledgerEntries.slice(0, 10).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-bg-primary/65 px-3 py-2 text-[11px]"
                >
                  <span className="truncate text-text-primary">{e.description}</span>
                  <span className="tabular-nums-fa shrink-0 font-bold text-gold">
                    {Number(e.rialAmount) > 0
                      ? `${formatFaNumber(Number(e.rialAmount))} ت`
                      : `${formatFaNumber(Number(e.goldGrams))} گ`}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void handleExportCsv()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>دریافت خروجی اکسل اسناد (CSV)</span>
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-border-subtle bg-bg-primary py-2.5 text-xs font-semibold text-text-primary hover:border-gold/40 cursor-pointer"
            >
              مشاهده ریز تراکنش{"\u200c"}ها و اسناد بانکی
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
