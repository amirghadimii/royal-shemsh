"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Inbox,
  ShieldCheck,
  UserCheck,
  Vault,
} from "lucide-react";
import { AppShell, NoAccessBanner, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";
import { useEndpointAccess } from "@/lib/useEndpointAccess";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface RemittanceRow {
  id: string;
  remittanceCode: string;
  type: "GOLD_WEIGHT" | "CASH_RIAL";
  weightGrams: string;
  cashAmount: string;
  warehouse: string;
  user: { fullName: string };
  product?: { name: string; unit: string } | null;
}

export function Screen22GoldRemittance() {
  const { accessDenied } = useEndpointAccess("/admin/remittances");
  const [remittanceType, setRemittanceType] = useState<"gold" | "cash">("gold");
  const [weightText, setWeightText] = useState("50");
  const [noteText, setNoteText] = useState(
    "بابت تسویه فاکتور شماره ۹۸۲۴ - تحویل فیزیکی با بارکد پلمپ امنیتی"
  );
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [remittances, setRemittances] = useState<RemittanceRow[]>([]);

  const loadData = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || accessDenied) return;

    const [uRes, pRes, rRes] = await Promise.all([
      fetch(`${API_BASE}/admin/users`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/admin/products`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/admin/remittances`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    if (Array.isArray(uRes?.users) && uRes.users.length > 0) {
      setUsers(uRes.users);
      setSelectedUserId((prev) => prev || uRes.users[0].id);
    }
    if (Array.isArray(pRes?.products) && pRes.products.length > 0) {
      setProducts(pRes.products);
      setSelectedProductId((prev) => prev || pRes.products[0].id);
    }
    if (Array.isArray(rRes?.remittances)) {
      setRemittances(rRes.remittances);
    }
  }, [accessDenied]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const handleRemittanceSubmit = async () => {
    setSubmitted(null);
    setErrorMsg(null);
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || !selectedUserId) {
      setSubmitted("حواله طلایی نمونه ثبت نمایشی شد.");
      return;
    }

    setSubmitting(true);
    try {
      const numeric = weightText
        .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
        .replace(/[^\d.]/g, "");
      const res = await fetch(`${API_BASE}/admin/remittances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUserId,
          type: remittanceType === "gold" ? "GOLD_WEIGHT" : "CASH_RIAL",
          productId: remittanceType === "gold" ? selectedProductId : undefined,
          weightGrams: remittanceType === "gold" ? numeric : undefined,
          cashAmount: remittanceType === "cash" ? numeric : undefined,
          barcodeNote: noteText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در ثبت حواله");
        return;
      }
      setSubmitted(`حواله ${data.remittance.remittanceCode} با موفقیت ثبت شد.`);
      await loadData();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <ProposedBanner subBadge="نسخه آزمایشی" />

        {/* Header Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              ثبت حواله طلا و وجوه ریالی
            </h1>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              خزانه فعال
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            انتقال ایمن دارایی با تضمین خزانه رویال شمش
          </p>
        </section>

        {/* Form Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3.5">
          {/* Type Toggle */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-text-primary">
              نوع حواله انتقالی:
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1.5">
              <button
                type="button"
                onClick={() => setRemittanceType("gold")}
                className={`rounded-lg py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                  remittanceType === "gold"
                    ? "bg-gold text-bg-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                طلایی (وزنی)
              </button>
              <button
                type="button"
                onClick={() => setRemittanceType("cash")}
                className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
                  remittanceType === "cash"
                    ? "bg-gold text-bg-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                پولی (ریالی)
              </button>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="s22-weight"
                className="font-semibold text-text-primary"
              >
                وزن حواله (گرم)
              </label>
              <span className="rounded-md border border-gold/25 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
                شمش ۹۹۹.۹ عیار ۲۴
              </span>
            </div>
            <input
              id="s22-weight"
              type="text"
              value={weightText}
              onChange={(e) => setWeightText(e.target.value)}
              className="tabular-nums-fa w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-sm font-extrabold text-text-primary focus:border-gold focus:outline-none"
            />
            <p className="tabular-nums-fa text-[11px] font-semibold text-gold">
              معادل ارزش تخمینی بازار: ۲,۲۱۴,۰۰۰,۰۰۰ تومان
            </p>
          </div>

          {/* Recipient */}
          <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3 space-y-1">
            <span className="block text-[11px] text-text-secondary">
              گیرنده حواله (همکار / طلافروشی):
            </span>
            <p className="text-xs font-extrabold text-text-primary">
              مهدی علوی (کد ۵۱۸۸) - طلافروشی مرکزی
            </p>
            <p className="flex items-center gap-1 text-[10px] font-bold text-buy">
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              احراز هویت طلایی سطح ۴ تکمیل است
            </p>
          </div>

          {/* Warehouse */}
          <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3 space-y-1">
            <span className="block text-[11px] text-text-secondary">
              انبار / مبدأ تحویل شمش:
            </span>
            <p className="flex items-center gap-1.5 text-xs font-bold text-gold">
              <Vault className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              خزانه مرکزی رویال شمش ونوس
            </p>
          </div>

          {/* Barcode Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="s22-note"
              className="block text-xs font-semibold text-text-primary"
            >
              توضیحات و شناسه امنیتی بارکد:
            </label>
            <textarea
              id="s22-note"
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs leading-relaxed text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          {/* Fee Line */}
          <div className="flex items-center gap-1.5 rounded-xl border border-buy/30 bg-buy-soft px-3 py-2 text-[11px] font-bold text-buy">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>کارمزد انتقال خزانه رویال: رایگان (طرح ویژه اعضا)</span>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleRemittanceSubmit()}
            className="w-full rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "در حال ثبت..." : "ثبت حواله طلایی"}
          </button>

          {users.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="کاربر حواله"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-[11px] text-text-primary"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
              {remittanceType === "gold" && products.length > 0 ? (
                <select
                  aria-label="کالای حواله"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-[11px] text-text-primary"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}

          {errorMsg ? (
            <p
              role="alert"
              className="rounded-xl bg-sell-soft px-3 py-2 text-center text-xs font-bold text-sell"
            >
              {errorMsg}
            </p>
          ) : null}

          {submitted ? (
            <p className="flex items-center justify-center gap-1.5 rounded-xl bg-buy-soft px-3 py-2 text-xs font-bold text-buy">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {submitted}
            </p>
          ) : null}
        </section>

        {/* Today's Remittances List */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-text-primary">
              لیست حواله{"\u200c"}های ثبت{"\u200c"}شده امروز
            </h2>
            <span className="tabular-nums-fa text-[10px] text-gold font-semibold">
              امروز: ۱۴۰۵/۰۹/۰۴
            </span>
          </div>

          {remittances.length > 0 ? (
            <div className="space-y-2">
              {remittances.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-bg-primary/70 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-text-primary">
                      {r.user.fullName} ({r.remittanceCode})
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {r.type === "GOLD_WEIGHT"
                        ? `${r.product?.name ?? "طلا"}`
                        : "حواله ریالی"}
                    </p>
                  </div>
                  <span className="tabular-nums-fa font-extrabold text-gold">
                    {r.type === "GOLD_WEIGHT"
                      ? `${formatFaNumber(Number(r.weightGrams))} گرم`
                      : `${formatFaNumber(Number(r.cashAmount))} ت`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-bg-primary/60 px-4 py-7 text-center">
              <Inbox className="h-6 w-6 text-text-muted" aria-hidden="true" />
              <p className="mt-2 text-xs font-bold text-text-primary">
                حواله{"\u200c"}ای ثبت نشده است
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                هیچ حواله طلایی یا ریالی برای کاربر انتخاب{"\u200c"}شده در تاریخ
                امروز ثبت نگردیده است.
              </p>
            </div>
          )}

          <p className="tabular-nums-fa text-center text-[10px] text-text-muted">
            آخرین به{"\u200c"}روزرسانی لحظه{"\u200c"}ای: ۱۰:۴۲:۱۵
          </p>
        </section>
      </div>
    </AppShell>
  );
}
