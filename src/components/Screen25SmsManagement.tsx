"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import { AppShell, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

const SMS_BODY =
  "همکار گرامی؛ معاملات تابلوی طلای آبشده و شمش رویال هم‌اکنون رأس ساعت ۱۰:۳۰ آغاز شد. جهت مشاهده مظنه‌ها و ثبت سفارشات به سامانه مراجعه فرمایید.";

const HISTORY_ROWS = [
  {
    title: "آغاز به کار بازار مظنه",
    sub: "ارسال عمومی • ۱۴۲ دریافت‌کننده",
    status: "موفق (۱۰۰٪)",
    time: "۱۰:۳۰ - امروز",
  },
  {
    title: "تغییر نرخ و نوسان شمش",
    sub: "معامله‌گران طلای ۲۴ عیار",
    status: "موفق (۸۹ شماره)",
    time: "دیروز - ۱۶:۴۰",
  },
  {
    title: "پایان معاملات روزانه و تسویه",
    sub: "دفتر حسابداری و تسویه‌حساب",
    status: "موفق (۱۳۵ شماره)",
    time: "دیروز - ۱۹:۰۰",
  },
];

export function Screen25SmsManagement() {
  const [copied, setCopied] = useState(false);

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <ProposedBanner subBadge="آزمایشی" />

        {/* Header */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              مدیریت و ارسال پیامک{"\u200c"}های اطلاع{"\u200c"}رسانی
            </h1>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              سامانه متصل
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            تنظیم پیش{"\u200c"}نویس، اطلاع{"\u200c"}رسانی مظنه به معامله{"\u200c"}
            گران و بازبینی وضعیت ارسال
          </p>
        </section>

        {/* Panel Validation & Credit */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gold">
              اعتبارسنجی پنل پیامکی رویال
            </span>
            <span className="tabular-nums-fa font-semibold text-text-secondary">
              خط خدماتی اختصاصی ۳۰۰۰۹۸۲
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2">
            <span className="text-text-secondary">اعتبار باقیمانده</span>
            <span className="tabular-nums-fa font-extrabold text-buy">
              ۱۲,۴۵۰ پیامک
            </span>
          </div>
        </section>

        {/* SMS Composer / Preview */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-text-primary">
              قالب پیامکی: شروع معاملات آبشده
            </span>
            <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
              اولویت آنی
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            ارسال به: تمامی معامله{"\u200c"}گران فعال (۱۴۲ کاربر)
          </p>

          <div className="space-y-2 rounded-xl border border-border-subtle bg-bg-primary/75 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-gold">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                پیش{"\u200c"}نمایش متن پیامک (SMS)
              </span>
              <button
                type="button"
                onClick={() => setCopied(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-card px-2 py-1 text-[10px] font-bold text-text-primary hover:border-gold/40 cursor-pointer"
              >
                <Copy className="h-3 w-3 text-gold" aria-hidden="true" />
                <span>{copied ? "کپی شد" : "کپی متن"}</span>
              </button>
            </div>

            <p className="text-xs leading-relaxed text-text-primary">
              {SMS_BODY}
            </p>

            <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] text-text-secondary">
              <span>شمش طلای رویال • لغو ۱۱</span>
              <span className="tabular-nums-fa">۱۲۴ کاراکتر، ۲ پارت</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2">
              <span className="text-text-secondary">ارسال فوری Flash</span>
              <span className="font-bold text-buy">فعال</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-bg-primary/70 px-3 py-2">
              <span className="text-text-secondary">فیلتر بلک{"\u200c"}لیست</span>
              <span className="font-bold text-gold">مجاز</span>
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>ارسال دستی پیامک به ۱۴۲ کاربر</span>
          </button>

          <p className="text-center text-[10px] text-text-muted">
            هزینه ارسال این مرحله از مانده اعتبار کسر خواهد شد
          </p>
        </section>

        {/* Success Card */}
        <section className="rounded-2xl border border-buy/40 bg-buy-soft p-4 space-y-2 text-[11px] text-buy">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-extrabold">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              پیامک با موفقیت ارسال شد
            </span>
            <span className="rounded-full bg-buy px-2 py-0.5 text-[10px] font-bold text-white">
              تأیید اپراتور
            </span>
          </div>
          <p className="tabular-nums-fa text-buy/90">
            زمان ارسال: امروز ساعت ۱۰:۳۰:۱۴
          </p>
          <div className="space-y-1 rounded-xl bg-bg-primary/50 p-2.5 text-text-primary">
            <p className="tabular-nums-fa">تعداد ارسال موفق: ۱۴۲ شماره</p>
            <p className="tabular-nums-fa">
              خطای ارسال / بلک{"\u200c"}لیست مخابرات: ۰ کاربر
            </p>
            <p>
              کد رهگیری سامانه پیامکی:{" "}
              <span dir="ltr" className="inline-block font-bold text-gold">
                SMS-RYS-99482
              </span>
            </p>
          </div>
        </section>

        {/* Recent History */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-text-primary">
              تاریخچه ارسال{"\u200c"}های اخیر
            </h2>
            <button
              type="button"
              className="text-[11px] font-bold text-gold hover:underline cursor-pointer"
            >
              مشاهده همه گزارش{"\u200c"}ها
            </button>
          </div>

          <div className="divide-y divide-border-subtle">
            {HISTORY_ROWS.map((row) => (
              <div
                key={row.title}
                className="flex items-center justify-between gap-2 py-2.5 text-[11px]"
              >
                <div>
                  <p className="font-bold text-text-primary">{row.title}</p>
                  <p className="mt-0.5 text-[10px] text-text-secondary">
                    {row.sub}
                  </p>
                </div>
                <div className="text-left">
                  <span className="block font-bold text-buy">{row.status}</span>
                  <span className="tabular-nums-fa text-[10px] text-text-muted">
                    {row.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-start gap-2 rounded-xl border border-border-subtle bg-bg-card/70 p-3 text-[10px] leading-relaxed text-text-secondary">
          <ShieldCheck
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
            aria-hidden="true"
          />
          <span>
            تمامی پیامک{"\u200c"}ها از درگاه شاپرک و اپراتورهای دارای مجوز با
            سرشماره تأییدشده رویال شمش مانیتور و بایگانی می{"\u200c"}شوند.
          </span>
        </footer>
      </div>
    </AppShell>
  );
}
