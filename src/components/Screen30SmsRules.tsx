"use client";

import Link from "next/link";
import { Pencil, Plus, Power, Send, Trash2 } from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

interface SmsRule {
  id: string;
  title: string;
  mode: string;
  targetLabel: string;
  code: string;
  template: string;
  extraNote?: string;
  hasManualSend: boolean;
}

const RULES: SmsRule[] = [
  {
    id: "rm101",
    title: "شروع معاملات آبشده",
    mode: "دستی",
    targetLabel: "هدف: کلیه خریداران و فروشندگان تاییدشده",
    code: "#RM-101",
    template:
      "«همکار گرامی؛ معاملات تابلوی طلای آبشده و شمش رویال هم‌اکنون رأس ساعت ۱۰:۳۰ آغاز شد.»",
    hasManualSend: true,
  },
  {
    id: "rm204",
    title: "پس از رد معامله",
    mode: "سیستمی / خودکار",
    targetLabel: "محرک: ثبت وضعیت رد در داشبورد تسویه",
    code: "#RM-204",
    template:
      "«درخواست معامله شماره #RS با علت عدم تایید اعتبار رد گردید.»",
    extraNote: "ارسال آنی کمتر از ۳ ثانیه",
    hasManualSend: false,
  },
  {
    id: "rm309",
    title: "پس از تایید معامله",
    mode: "سیستمی / خودکار",
    targetLabel: "محرک: ثبت نهایی سند در خزانه رویال شمش",
    code: "#RM-309",
    template: "«درخواست معامله شما با موفقیت تایید و سند قطعی صادر شد.»",
    extraNote: "شامل شماره رهگیری و فاکتور آنلاین",
    hasManualSend: false,
  },
];

export function Screen30SmsRules() {
  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Header */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-text-primary">
                  مدیریت قوانین پیامک
                </h1>
                <span className="rounded-full border border-buy/35 bg-buy-soft px-2 py-0.5 text-[10px] font-bold text-buy">
                  ۳ قانون فعال
                </span>
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                تنظیمات اعلان{"\u200c"}ها و الگوهای ارسال خودکار و دستی
              </p>
            </div>

            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gold px-3 py-2 text-[11px] font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>افزودن قانون</span>
            </button>
          </div>
        </section>

        {/* Two Count Chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-xs">
            <span className="text-text-secondary font-semibold">
              قوانین سیستمی
            </span>
            <span className="font-extrabold text-gold">۲ مورد</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-xs">
            <span className="text-text-secondary font-semibold">ارسال دستی</span>
            <span className="font-extrabold text-buy">۱ مورد</span>
          </div>
        </div>

        {/* Three Rule Cards */}
        <div className="space-y-3">
          {RULES.map((rule) => (
            <article
              key={rule.id}
              className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-xs font-extrabold text-text-primary">
                      {rule.title}
                    </h2>
                    <span className="rounded-md border border-gold/25 bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-gold">
                      {rule.mode}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-text-secondary">
                    {rule.targetLabel}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-buy/30 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
                  فعال
                </span>
              </div>

              <div className="rounded-xl border border-border-subtle bg-bg-primary/70 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-text-secondary">
                    الگوی متن پیامک
                  </span>
                  <span className="text-gold font-bold">
                    کد:{" "}
                    <span dir="ltr" className="inline-block">
                      {rule.code}
                    </span>
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-text-primary">
                  {rule.template}
                </p>
                {rule.extraNote ? (
                  <p className="text-[10px] font-medium text-buy">
                    {rule.extraNote}
                  </p>
                ) : null}
              </div>

              <div
                className={`grid gap-1.5 ${
                  rule.hasManualSend ? "grid-cols-4" : "grid-cols-3"
                }`}
              >
                {rule.hasManualSend ? (
                  <Link
                    href="/sms-management"
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-gold py-2 text-[10px] font-extrabold text-bg-primary hover:opacity-90"
                  >
                    <Send className="h-3 w-3" aria-hidden="true" />
                    <span>ارسال دستی</span>
                  </Link>
                ) : null}

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-subtle bg-bg-primary py-2 text-[10px] font-bold text-text-primary hover:border-gold/40 cursor-pointer"
                >
                  <Pencil className="h-3 w-3 text-gold" aria-hidden="true" />
                  <span>ویرایش</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-subtle bg-bg-primary py-2 text-[10px] font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <Power className="h-3 w-3" aria-hidden="true" />
                  <span>غیرفعال</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-sell/40 bg-sell-soft py-2 text-[10px] font-bold text-sell hover:bg-sell hover:text-white cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span>حذف</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
