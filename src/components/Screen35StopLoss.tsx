"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { AppShell, NoAccessBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { useEndpointAccess } from "@/lib/useEndpointAccess";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface StopLossCustomer {
  userId: string;
  code: number;
  fullName: string;
  mobile: string;
  isActive: boolean;
  rialBalance: string;
  goldGramsBalance: string;
  creditLimitToman: string;
  debtToman: string;
  status: "SAFE" | "WARNING" | "BREACHED";
}

interface StopLossSummary {
  total: number;
  breached: number;
  warning: number;
  safe: number;
}

export function Screen35StopLoss() {
  const { accessDenied } = useEndpointAccess("/admin/reports/stop-loss");
  const [customers, setCustomers] = useState<StopLossCustomer[]>([]);
  const [summary, setSummary] = useState<StopLossSummary>({
    total: 0,
    breached: 0,
    warning: 0,
    safe: 0,
  });
  const [draftLimits, setDraftLimits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || accessDenied) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reports/stop-loss`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: StopLossCustomer[] = data.customers ?? [];
      setCustomers(list);
      if (data.summary) setSummary(data.summary);
      setDraftLimits(
        Object.fromEntries(list.map((c) => [c.userId, c.creditLimitToman]))
      );
    } catch {}
  }, [accessDenied]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveLimit(userId: string) {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    setSavingId(userId);
    setNotice(null);
    try {
      const res = await fetch(`${API_BASE}/admin/reports/stop-loss/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creditLimitToman: draftLimits[userId] ?? "0",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setNotice(err.message ?? "خطا در ذخیره حد ضرر");
        return;
      }
      setNotice("سقف حد ضرر مشتری با موفقیت ذخیره شد.");
      await loadData();
    } catch {
      setNotice("خطا در ارتباط با سرور");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold" aria-hidden="true" />
            <h1 className="text-sm font-extrabold text-text-primary">
              حد ضرر مشتری (Stop-Loss)
            </h1>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-bg-card px-2.5 py-1.5 text-[11px] font-bold text-text-secondary hover:border-gold/40 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>بروزرسانی</span>
          </button>
        </div>

        {accessDenied ? (
          <NoAccessBanner />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-buy/30 bg-buy-soft p-2.5">
                <p className="text-[10px] text-text-secondary">ایمن</p>
                <p className="mt-0.5 text-sm font-extrabold text-buy tabular-nums-fa">
                  {summary.safe.toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="rounded-xl border border-gold/30 bg-gold-soft p-2.5">
                <p className="text-[10px] text-text-secondary">هشدار</p>
                <p className="mt-0.5 text-sm font-extrabold text-gold tabular-nums-fa">
                  {summary.warning.toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="rounded-xl border border-sell/30 bg-sell-soft p-2.5">
                <p className="text-[10px] text-text-secondary">عبور از حد</p>
                <p className="mt-0.5 text-sm font-extrabold text-sell tabular-nums-fa">
                  {summary.breached.toLocaleString("fa-IR")}
                </p>
              </div>
            </div>

            {notice ? (
              <p className="rounded-xl border border-gold/30 bg-gold-soft px-3 py-2 text-center text-xs font-bold text-gold">
                {notice}
              </p>
            ) : null}

            <div className="space-y-2.5">
              {customers.map((c) => {
                const badgeClass =
                  c.status === "BREACHED"
                    ? "bg-sell-soft text-sell border-sell/30"
                    : c.status === "WARNING"
                      ? "bg-gold-soft text-gold border-gold/30"
                      : "bg-buy-soft text-buy border-buy/30";
                const statusLabel =
                  c.status === "BREACHED"
                    ? "عبور از حد"
                    : c.status === "WARNING"
                      ? "هشدار مارجین"
                      : "ایمن";

                return (
                  <article
                    key={c.userId}
                    className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-text-primary">
                          {c.fullName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-text-secondary">
                          کد: {c.code} | موبایل: {c.mobile}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg-primary/70 p-2 text-[11px]">
                      <div>
                        <span className="block text-[10px] text-text-muted">
                          تراز تومانی
                        </span>
                        <span className="font-bold tabular-nums-fa text-text-primary">
                          {Number(c.rialBalance).toLocaleString("fa-IR")} ت
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-text-muted">
                          تراز طلا
                        </span>
                        <span className="font-bold tabular-nums-fa text-gold">
                          {Number(c.goldGramsBalance).toLocaleString("fa-IR")} گرم
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`سقف حد ضرر ${c.fullName}`}
                        value={draftLimits[c.userId] ?? ""}
                        onChange={(e) =>
                          setDraftLimits((prev) => ({
                            ...prev,
                            [c.userId]: e.target.value,
                          }))
                        }
                        className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-primary focus:border-gold focus:outline-none"
                        placeholder="سقف اعتبار (تومان)"
                      />
                      <button
                        type="button"
                        disabled={savingId === c.userId}
                        onClick={() => handleSaveLimit(c.userId)}
                        className="shrink-0 rounded-xl bg-gold px-3 py-1.5 text-[11px] font-extrabold text-bg-primary hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      >
                        {savingId === c.userId ? "در حال ذخیره..." : "ذخیره حد"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
