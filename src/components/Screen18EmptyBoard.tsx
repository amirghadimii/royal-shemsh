"use client";

import {
  CheckCircle2,
  Headphones,
  Inbox,
  Lock,
  MessageSquarePlus,
  Phone,
} from "lucide-react";

export function Screen18EmptyBoard() {
  return (
    <div className="space-y-3.5">
      {/* Status Strip */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary">
            وضعیت بازار:{" "}
            <strong className="font-bold text-buy">پیوسته و برخط</strong>
          </span>
          <span className="text-text-secondary">
            سطح کاربری:{" "}
            <strong className="font-bold text-text-primary">کاربر عادی</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold-soft px-3 py-2 text-[11px] font-bold text-gold">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>بدون مجوز تابلوی مظنه</span>
        </div>
      </section>

      {/* Empty Board Card (No Price Cards) */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-primary text-text-muted">
          <Inbox className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-extrabold text-text-primary">
          کالایی جهت معامله یافت نشد
        </h2>
        <p className="text-xs leading-relaxed text-text-secondary">
          جهت فعال{"\u200c"}سازی مظنه{"\u200c"}های شمش طلا و تخصیص سقف اعتبار،
          لطفاً با مدیریت معاملات تماس حاصل فرمایید.
        </p>
      </section>

      {/* Support & Contact Card */}
      <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-gold" aria-hidden="true" />
          <h3 className="text-xs font-extrabold text-gold">
            تماس با پشتیبانی و مدیریت معاملات
          </h3>
        </div>

        <p className="text-[11px] leading-relaxed text-text-secondary">
          ساعات کاری واحد میز معاملات و احراز هویت: همه{"\u200c"}روزه از ۹:۰۰
          الی ۱۸:۰۰
        </p>

        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:02188880000"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gold/35 bg-gold-soft py-2.5 text-xs font-extrabold text-gold hover:bg-gold hover:text-bg-primary"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            <span dir="ltr" className="tabular-nums-fa">
              ۰۲۱-۸۸۸۸۰۰۰۰
            </span>
          </a>

          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ثبت تیکت آنلاین</span>
          </button>
        </div>
      </section>

      {/* Activation Steps */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
        <h3 className="text-xs font-bold text-text-primary">
          مراحل فعال{"\u200c"}سازی تابلوی شمش:
        </h3>
        <ul className="space-y-2 text-[11px] text-text-secondary">
          {[
            "تکمیل مدارک احراز هویت شرکتی یا حقیقی معتبر",
            "انعقاد قرارداد رسمی کارگزاری و تسویه ریالی",
            "تأیید دسترسی توسط ناظر معاملات رویال شمش",
          ].map((step) => (
            <li key={step} className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
                aria-hidden="true"
              />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
