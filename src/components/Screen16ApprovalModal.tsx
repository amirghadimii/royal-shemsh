"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Clock, ShieldCheck, X } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

interface Screen16ApprovalModalProps {
  open: boolean;
  onClose: () => void;
}

const DURATION = 60;

export function Screen16ApprovalModal({
  open,
  onClose,
}: Screen16ApprovalModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(DURATION);
    setDecision(null);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const isExpired = secondsLeft === 0;
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (secondsLeft / DURATION) * ringCircumference;
  const formattedSeconds = toPersianDigits(String(secondsLeft).padStart(2, "0"));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/75 px-3.5 py-6 backdrop-blur-sm"
    >
      <div className="my-auto w-full max-w-md rounded-3xl border border-gold/45 bg-bg-card p-4 shadow-2xl space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2
              id="approval-modal-title"
              className="text-sm font-extrabold text-gold"
            >
              درخواست معامله در انتظار تایید
            </h2>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              رسید سامانه اختصاصی کارگزاری رویال
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
            اتاق معاملات
          </span>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-primary/75 p-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <Clock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>مهلت پاسخگویی مدیریت</span>
            </p>
            <p className="tabular-nums-fa mt-0.5 text-[11px] text-text-secondary">
              {toPersianDigits(secondsLeft)} ثانیه تا انقضای درخواست
            </p>
          </div>

          <div className="relative flex h-13 w-13 shrink-0 items-center justify-center">
            <svg className="h-13 w-13 -rotate-90" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r={ringRadius}
                fill="none"
                stroke="#242B3A"
                strokeWidth="4"
              />
              <circle
                cx="26"
                cy="26"
                r={ringRadius}
                fill="none"
                stroke={isExpired ? "#EF4444" : "#D4AF37"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <span
              className={`tabular-nums-fa absolute text-xs font-extrabold ${
                isExpired ? "text-sell" : "text-gold"
              }`}
            >
              ۰۰:{formattedSeconds}
            </span>
          </div>
        </div>

        {/* Details */}
        <dl className="space-y-2 rounded-2xl border border-border-subtle bg-bg-primary/65 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">درخواست{"\u200c"}کننده معامله</dt>
            <dd className="font-bold text-text-primary">کیارش پورسلیک</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">کد معاملاتی</dt>
            <dd dir="ltr" className="font-bold text-gold">
              RS-8831
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">نوع معامله:</dt>
            <dd className="rounded-md bg-buy-soft px-2 py-0.5 text-[11px] font-extrabold text-buy">
              خرید قطعی
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">کالا:</dt>
            <dd className="font-bold text-text-primary">
              نقد پس{"\u200c"}فردا (۲۴ عیار)
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">قیمت واحد مظنه:</dt>
            <dd className="tabular-nums-fa font-bold text-text-primary">
              ۱۱۰,۱۴۵,۰۰۰ تومان
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-secondary">مقدار / وزن درخواست:</dt>
            <dd className="tabular-nums-fa font-bold text-text-primary">
              ۲۵۰ گرم شمش استاندارد
            </dd>
          </div>
        </dl>

        {/* Total Contract Card */}
        <div className="rounded-2xl border border-gold/30 bg-gold-soft/50 p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gold-t90">مبلغ کل قرارداد معامله:</span>
            <span className="text-gold font-semibold">محاسبه برخط سیستم</span>
          </div>
          <p className="tabular-nums-fa mt-1 text-lg font-extrabold text-gold">
            ۲۷,۵۳۶,۲۵۰,۰۰۰ تومان
          </p>
        </div>

        {/* Credit & Collateral */}
        <div className="space-y-1.5 rounded-xl border border-border-subtle bg-bg-primary/65 p-3 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-buy">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              سقف اعتبار کاربر: تایید شده و کافی
            </span>
            <span className="rounded-md border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-gold">
              وثیقه شمش طلایی
            </span>
          </div>
          <p className="text-text-secondary">
            تایید نهایی مستلزم قفل وجه ریالی و تخصیص فیزیکی شمش در خزانه است.
          </p>
        </div>

        {/* Buttons: رد درخواست (red) then تایید درخواست (green) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setDecision("rejected")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-sell/45 bg-sell-soft py-3 text-xs font-extrabold text-sell hover:bg-sell hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span>رد درخواست</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision("approved")}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>تایید درخواست</span>
          </button>
        </div>

        {decision ? (
          <p
            className={`rounded-xl px-3 py-2 text-center text-xs font-bold ${
              decision === "approved"
                ? "bg-buy-soft text-buy"
                : "bg-sell-soft text-sell"
            }`}
          >
            {decision === "approved"
              ? "درخواست معامله تایید نمایشی شد."
              : "درخواست معامله رد نمایشی شد."}
          </p>
        ) : null}

        {/* Expiry State */}
        {isExpired ? (
          <div className="space-y-2.5 rounded-2xl border border-sell/50 bg-[#2A1217] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-sell">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>انقضای زمان معامله</span>
            </div>
            <p className="text-[11px] text-sell/90">
              مهلت ۶۰ ثانیه{"\u200c"}ای بررسی به پایان رسید و سفارش لغو گردید.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-bg-card py-2.5 text-xs font-bold text-text-primary border border-border-subtle hover:border-gold/40 cursor-pointer"
            >
              بازگشت به تابلوی معاملات
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
