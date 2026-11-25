"use client";

import {
  CheckCircle2,
  Database,
  Lock,
  PauseCircle,
  Phone,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

const LOCKED_SYMBOLS = [
  "نقد فردا (شمش ۱۰۰g)",
  "نقد پس\u200cفردا",
  "USD / طلا",
  "CNY / درهم",
];

const TIME_CHIPS = ["۱۵ دقیقه", "۱ ساعته", "روزانه"];

export function Screen20PricesNoAccess() {
  return (
    <div className="space-y-3.5">
      {/* Title Card */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-sm font-extrabold text-text-primary">
              تحلیل قیمت{"\u200c"}ها و تاریخچه مظنه
            </h1>
            <p className="mt-1 text-[11px] text-text-secondary">
              واحد رصد الگوریتمی بازار طلای آبشده و شمش
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sell/35 bg-sell-soft px-2.5 py-1 text-[10px] font-bold text-sell">
            <Lock className="h-3 w-3" aria-hidden="true" />
            سرویس قفل است
          </span>
        </div>
      </section>

      {/* Locked Symbol Rows */}
      <section className="grid grid-cols-2 gap-2">
        {LOCKED_SYMBOLS.map((sym) => (
          <div
            key={sym}
            className="flex items-center justify-between gap-1.5 rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-[11px]"
          >
            <span className="truncate font-semibold text-text-secondary">
              {sym}
            </span>
            <Lock
              className="h-3.5 w-3.5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
          </div>
        ))}
      </section>

      {/* Red No-Access Banner */}
      <section
        role="alert"
        className="rounded-2xl border border-sell/50 bg-[#2A1217] p-4 space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert
            className="h-5 w-5 shrink-0 text-sell"
            aria-hidden="true"
          />
          <h2 className="text-sm font-extrabold text-sell">
            شما به این سرویس دسترسی ندارید
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-sell">
            کد حفاظتی:{" "}
            <span dir="ltr" className="tabular-nums-fa inline-block">
              RYS-AUTH-۴۰۳
            </span>
          </span>
          <span className="rounded-md bg-bg-primary/60 px-2 py-0.5 text-[10px] font-bold text-text-secondary">
            سطح کاربری: عادی
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-sell/90">
          مشاهده نمودار تکنیکال، عمق بازار و تاریخچه لحظه{"\u200c"}ای مظنه
          {"\u200c"}ها منوط به داشتن حساب دسترسی مدیریت یا معامله{"\u200c"}گر
        </p>

        <div className="flex items-center justify-between gap-2 border-t border-sell/25 pt-2 text-[10px]">
          <span className="text-sell/90 font-medium">
            تأییدیه دو مرحله{"\u200c"}ای امنیتی مورد نیاز است
          </span>
          <span className="shrink-0 rounded-full border border-sell/35 bg-sell-soft px-2 py-0.5 font-bold text-sell">
            پروتکل سطح ۳
          </span>
        </div>
      </section>

      {/* Time Chips */}
      <div className="grid grid-cols-3 gap-2">
        {TIME_CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-xl border border-border-subtle bg-bg-card py-2 text-center text-[11px] font-semibold text-text-muted"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Disabled Chart Area */}
      <section className="rounded-2xl border border-dashed border-border-subtle bg-bg-card/75 p-4 text-center space-y-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-primary text-text-muted">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-xs font-extrabold text-text-primary">
          فضای نمودار به دلیل عدم مجوز غیرفعال است
        </h3>
        <p className="text-[11px] leading-relaxed text-text-secondary">
          داده{"\u200c"}های بلادرنگ (Tick-by-Tick) و اندیکاتورهای هوشمند تحلیل
          طلا در حساب شما پیکربندی نشده است.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl border border-buy/25 bg-buy-soft/50 px-3 py-2">
            <span className="block text-[10px] text-buy">عمق مظنه خرید</span>
            <span
              dir="ltr"
              className="mt-0.5 inline-block text-xs font-extrabold text-buy"
            >
              ●●●,●●●
            </span>
          </div>
          <div className="rounded-xl border border-sell/25 bg-sell-soft/50 px-3 py-2">
            <span className="block text-[10px] text-sell">عمق مظنه فروش</span>
            <span
              dir="ltr"
              className="mt-0.5 inline-block text-xs font-extrabold text-sell"
            >
              ●●●,●●●
            </span>
          </div>
        </div>
      </section>

      {/* Activation CTA */}
      <button
        type="button"
        className="w-full rounded-2xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
      >
        درخواست فعال{"\u200c"}سازی اشتراک تحلیل بازار
      </button>

      {/* Confirmation Block (shown on same screen below button) */}
      <section className="flex items-start gap-2.5 rounded-2xl border border-buy/35 bg-buy-soft p-3.5 text-buy">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-extrabold">درخواست ارتقای حساب ثبت شد</p>
          <p className="mt-0.5 text-[11px] text-buy/90">
            کارشناس تخصصی اتاق پایاپای تا ۱۵ دقیقه آینده تماس می{"\u200c"}گیرد.
          </p>
        </div>
      </section>

      {/* Support / DB / Stream Status */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <Phone className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            میز معامله{"\u200c"}گران ارشد:
          </span>
          <span className="tabular-nums-fa font-bold text-gold">
            <span dir="ltr" className="inline-block">
              ۰۲۱-۸۸۸۸۴۳۲۱
            </span>{" "}
            (داخلی ۴۰۸)
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2 text-[10px]">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <Database className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            پایگاه داده رویال شمش (تهران)
          </span>
          <span className="flex items-center gap-1 font-semibold text-sell">
            <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
            جریان مظنه{"\u200c"}گیری متوقف
          </span>
        </div>
      </section>
    </div>
  );
}
