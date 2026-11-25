"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Minus,
  Plus,
  Save,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";

const HOME_GOLD_OPTIONS = [
  {
    value: "1",
    label: "۱ قیمت دهی توسط ادمین سیستم + ثبت محلی",
    sub: "کنترل کامل تابلوی مظنه در سرور متمرکز",
  },
  {
    value: "2",
    label: "۲ قیمت دهی از سامانه هوم گلد + ثبت محلی",
    sub: "دریافت خودکار مظنه و پایگاه داده مستقل",
  },
  {
    value: "3",
    label: "۳ قیمت دهی از سامانه هوم گلد + ثبت در هوم گلد",
    sub: "همگام‌سازی کامل دوطرفه با پایگاه مرکزی",
  },
];

export function Screen29Settings() {
  const [responseSeconds, setResponseSeconds] = useState(60);
  const [homeGoldMode, setHomeGoldMode] = useState("1");
  const [noticeText, setNoticeText] = useState(
    "همکار گرامی؛ نقد فردا و مسکوکات روز چهارشنبه، نقد پس‌فردا روز شنبه تسویه می‌شود. مهلت ارسال شماره حساب بانکی حداکثر تا ساعت ۱۰:۰۰ می‌باشد."
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const selectedMode =
    HOME_GOLD_OPTIONS.find((o) => o.value === homeGoldMode) ??
    HOME_GOLD_OPTIONS[0];

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Top Security Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/25 bg-bg-card px-3 py-2 text-[10px]">
          <span className="flex items-center gap-1 font-bold text-gold">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            پروتکل امنیتی خزانه‌داری
          </span>
          <span dir="ltr" className="text-text-secondary font-semibold">
            نسخه هسته معاملات: v4.8.2
          </span>
          <span className="font-bold text-buy">ارتباط پایدار</span>
        </div>

        {/* H1 */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-1">
          <h1 className="text-sm font-extrabold text-text-primary">
            تنظیمات عمومی سامانه
          </h1>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            پیکربندی زمان‌بندی معاملات، سرویس هوم گلد و اعلانات تابلو
          </p>
        </section>

        {/* Field 1: Response Time */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-text-primary">
              مدت زمان پاسخ (ثانیه)
            </span>
            <span className="rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
              پیش‌فرض سفارشات
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1.5">
            <button
              type="button"
              aria-label="کاهش ثانیه"
              onClick={() =>
                setResponseSeconds((prev) => Math.max(10, prev - 5))
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary hover:text-gold cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="flex flex-1 items-center justify-center gap-1.5">
              <span className="tabular-nums-fa text-base font-extrabold text-gold">
                {formatFaNumber(responseSeconds)}
              </span>
              <span className="text-xs text-text-secondary">ثانیه</span>
            </div>

            <button
              type="button"
              aria-label="افزایش ثانیه"
              onClick={() => setResponseSeconds((prev) => prev + 5)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-card text-text-primary hover:text-gold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-secondary">
              مهلت تایید یا رد درخواست‌های سرخطی پیش از انقضا.
            </span>
            <span className="shrink-0 font-bold text-buy">پاسخگویی سریع</span>
          </div>
        </section>

        {/* Field 2: Home Gold Connection */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <label
              htmlFor="s29-homegold"
              className="flex items-center gap-1.5 font-extrabold text-text-primary"
            >
              <Globe className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>نحوه ارتباط با هوم گلد</span>
            </label>
            <span className="rounded-full border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
              سرویس وب‌سرویس
            </span>
          </div>

          <select
            id="s29-homegold"
            value={homeGoldMode}
            onChange={(e) => setHomeGoldMode(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
          >
            {HOME_GOLD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <p className="text-[11px] text-gold font-medium">
            {selectedMode.sub}
          </p>
        </section>

        {/* Field 3: Working Hours */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-extrabold text-text-primary">
              <Clock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>ساعت کاری</span>
            </span>
            <span className="rounded-full border border-buy/30 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              بازار فعال
            </span>
          </div>

          <div className="rounded-xl border border-gold/25 bg-bg-primary/75 p-3 space-y-1.5">
            <p className="tabular-nums-fa text-base font-extrabold text-gold">
              ۱۰:۳۰ تا ۲۱:۰۰
            </p>
            <p className="tabular-nums-fa text-[11px] text-text-secondary">
              ۱۰:۳۰ الی ۲۱:۰۰ به وقت تهران
            </p>
            <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] text-text-primary">
              <span className="tabular-nums-fa">آغاز معاملات: ۱۰:۳۰</span>
              <span className="tabular-nums-fa">تسویه پایانی: ۲۱:۰۰</span>
            </div>
          </div>
        </section>

        {/* Field 4: Notice Text */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <label
              htmlFor="s29-notice"
              className="flex items-center gap-1.5 font-extrabold text-text-primary"
            >
              <Bell className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>متن اطلاعیه</span>
            </label>
            <span className="rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
              تابلو اعلان زنده
            </span>
          </div>

          <textarea
            id="s29-notice"
            rows={3}
            value={noticeText}
            onChange={(e) => setNoticeText(e.target.value)}
            placeholder="متن اطلاعیه را وارد نمایید..."
            className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs leading-relaxed text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
          />

          <div className="flex items-center justify-between text-[10px] text-text-secondary">
            <span>نمایش در نوار متحرک پورتال</span>
            <span className="tabular-nums-fa font-semibold text-gold">
              ۱۳۸ کاراکتر
            </span>
          </div>
        </section>

        {/* Save Button */}
        <button
          type="button"
          onClick={() => setSavedNotice(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-sm font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>ذخیره تنظیمات</span>
        </button>

        {savedNotice ? (
          <p className="flex items-center justify-center gap-1.5 rounded-xl bg-buy-soft px-3 py-2 text-xs font-bold text-buy">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            تنظیمات با موفقیت ذخیره نمایشی شد.
          </p>
        ) : null}

        <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-[10px] text-text-secondary">
          <Lock className="h-3 w-3 text-gold" aria-hidden="true" />
          <span>تمامی تغییرات با کلید امنیتی کاربر ذخیره و لاگ می‌شوند</span>
        </p>
      </div>
    </AppShell>
  );
}
