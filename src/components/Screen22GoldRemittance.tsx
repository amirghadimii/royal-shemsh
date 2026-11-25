"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Inbox,
  ShieldCheck,
  UserCheck,
  Vault,
} from "lucide-react";
import { AppShell, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

export function Screen22GoldRemittance() {
  const [remittanceType, setRemittanceType] = useState<"gold" | "cash">("gold");
  const [weightText, setWeightText] = useState("۵۰ گرم");
  const [noteText, setNoteText] = useState(
    "بابت تسویه فاکتور شماره ۹۸۲۴ - تحویل فیزیکی با بارکد پلمپ امنیتی"
  );
  const [submitted, setSubmitted] = useState(false);

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
            onClick={() => setSubmitted(true)}
            className="w-full rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            ثبت حواله طلایی
          </button>

          {submitted ? (
            <p className="flex items-center justify-center gap-1.5 rounded-xl bg-buy-soft px-3 py-2 text-xs font-bold text-buy">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              حواله طلایی نمونه ثبت نمایشی شد.
            </p>
          ) : null}
        </section>

        {/* Today's Remittances Empty List */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-text-primary">
              لیست حواله{"\u200c"}های ثبت{"\u200c"}شده امروز
            </h2>
            <span className="tabular-nums-fa text-[10px] text-gold font-semibold">
              امروز: ۱۴۰۵/۰۹/۰۴
            </span>
          </div>

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

          <p className="tabular-nums-fa text-center text-[10px] text-text-muted">
            آخرین به{"\u200c"}روزرسانی لحظه{"\u200c"}ای: ۱۰:۴۲:۱۵
          </p>
        </section>
      </div>
    </AppShell>
  );
}
