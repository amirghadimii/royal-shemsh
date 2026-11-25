"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ShieldAlert,
  UserPlus,
  XCircle,
} from "lucide-react";

export function Screen19CommissionNoAccess() {
  return (
    <div className="space-y-3.5">
      {/* Starts with Breadcrumb (No user/brand header) */}
      <nav
        aria-label="مسیر ناوبری"
        className="flex items-center gap-1.5 px-1 text-[11px] text-text-secondary"
      >
        <span className="font-semibold text-text-secondary">ناوبری امن</span>
        <ChevronLeft className="h-3 w-3 text-text-muted" aria-hidden="true" />
        <span className="font-bold text-gold">بخش ویژه همکاران</span>
      </nav>

      {/* Title Card */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-extrabold text-text-primary">
            گزارش پورسانت و کارمزد مشتریان
          </h1>
          <span className="shrink-0 rounded-full border border-border-subtle bg-bg-primary px-2.5 py-0.5 text-[10px] font-bold text-text-secondary">
            سطح: عادی
          </span>
        </div>
      </section>

      {/* Red No-Access Banner */}
      <section
        role="alert"
        className="rounded-2xl border border-sell/50 bg-[#2A1217] p-4 space-y-2"
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

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-bold text-sell">
            کد دسترسی:{" "}
            <span dir="ltr" className="inline-block">
              RYS-AUTH-403
            </span>
          </span>
          <span className="text-sell/80">(عدم دسترسی به پنل بازاریابی)</span>
        </div>

        <p className="text-[11px] leading-relaxed text-sell/90">
          مشاهده و دریافت گزارش کارمزد و پورسانت شبکه بازاریابی صرفاً مختص
          کاربران سرگروه و نمایندگان رسمی رویال شمش
        </p>
      </section>

      {/* Auth & Partner Status */}
      <section className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-buy/30 bg-buy-soft px-3 py-2.5 text-[11px] font-bold text-buy">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>احراز هویت پایه: تایید شده</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-sell/30 bg-sell-soft px-3 py-2.5 text-[11px] font-bold text-sell">
          <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>دسترسی پارتنر: غیرفعال</span>
        </div>
      </section>

      {/* Empty Chart Placeholder */}
      <section className="rounded-2xl border border-dashed border-border-subtle bg-bg-card/75 p-4 text-center space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-text-secondary">
            <BarChart3 className="h-4 w-4 text-text-muted" aria-hidden="true" />
            نمودار حجم محاسباتی کارمزد
          </span>
          <span dir="ltr" className="font-bold text-text-muted">
            --- / ---
          </span>
        </div>
        <p className="py-3 text-xs font-medium text-text-secondary">
          هیچ داده یا گزارشی برای سطح دسترسی شما قابل نمایش نیست.
        </p>
      </section>

      {/* Three Zero Stats */}
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
          <span className="block text-[10px] text-text-secondary">
            پورسانت دوره
          </span>
          <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-text-primary">
            ۰ ریال
          </span>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
          <span className="block text-[10px] text-text-secondary">
            تعداد تراکنش
          </span>
          <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-text-primary">
            ۰ مورد
          </span>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
          <span className="block text-[10px] text-text-secondary">
            اعضای فعال
          </span>
          <span className="tabular-nums-fa mt-1 block text-xs font-extrabold text-text-primary">
            ۰ نفر
          </span>
        </div>
      </section>

      {/* Upgrade CTA + Back Link */}
      <div className="space-y-2.5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>درخواست ارتقای سطح دسترسی به سرگروه</span>
        </button>

        <Link
          href="/more"
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card py-2.5 text-xs font-bold text-text-primary hover:border-gold/40"
        >
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>بازگشت به منوی اصلی</span>
        </Link>
      </div>
    </div>
  );
}
