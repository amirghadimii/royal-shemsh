"use client";

import { useState } from "react";
import {
  BellRing,
  Edit3,
  Eye,
  Pin,
  Radio,
  Send,
  Trash2,
} from "lucide-react";
import { AppShell, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

type AlertColor = "gold" | "green" | "red" | "blue";

const COLOR_OPTIONS: { id: AlertColor; label: string; dot: string }[] = [
  { id: "gold", label: "طلایی", dot: "bg-gold" },
  { id: "green", label: "سبز", dot: "bg-buy" },
  { id: "red", label: "قرمز", dot: "bg-sell" },
  { id: "blue", label: "آبی", dot: "bg-blue-500" },
];

export function Screen26InternalMessenger() {
  const [sendToAll, setSendToAll] = useState(true);
  const [messageType, setMessageType] = useState("پیام عادی");
  const [alertColor, setAlertColor] = useState<AlertColor>("gold");
  const [title, setTitle] = useState("تغییر ساعت کاری معاملات در روز پنجشنبه");
  const [body, setBody] = useState(
    "احتراماً به اطلاع کلیه همکاران و خریداران محترم می‌رساند، با توجه به تعطیلات پایان هفته، تسویه معاملات نقد فردا تا ساعت ۱۳:۰۰ انجام خواهد شد."
  );

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <ProposedBanner subBadge="نسخه جدید" />

        {/* Header */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              پیام{"\u200c"}رسان و اعلانات داخلی سامانه
            </h1>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              <Radio className="h-3 w-3" aria-hidden="true" />
              ارتباط زنده
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            مدیریت هشدارهای لحظه{"\u200c"}ای میز معاملات شمش رویال
          </p>
        </section>

        {/* Composer Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3.5">
          {/* Send to all checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-bg-primary/70 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendToAll}
              onChange={(e) => setSendToAll(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#D4AF37]"
            />
            <div>
              <span className="block text-xs font-bold text-text-primary">
                ارسال برای همه کاربران
              </span>
              <span className="mt-0.5 block text-[10px] text-text-secondary">
                انتشار مستقیم در تمامی ترمینال{"\u200c"}های فعال خریدار و فروشنده
              </span>
            </div>
          </label>

          {/* Message Type */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label
                htmlFor="s26-type"
                className="font-semibold text-text-primary"
              >
                نوع پیام
              </label>
              <span className="text-text-secondary">
                دسته{"\u200c"}بندی ارجاع بخشنامه
              </span>
            </div>
            <select
              id="s26-type"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary focus:border-gold focus:outline-none"
            >
              <option value="پیام عادی">پیام عادی</option>
              <option value="بخشنامه فوری">بخشنامه فوری</option>
            </select>
          </div>

          {/* Alert Color */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-text-primary">
                رنگ اعلان و شاخص بصری
              </span>
              <span dir="ltr" className="text-[10px] text-gold font-semibold">
                طلایی سلطنتی (#D4AF37)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = alertColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAlertColor(c.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? "border-gold bg-gold-soft text-gold"
                        : "border-border-subtle bg-bg-primary text-text-secondary"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${c.dot}`}
                      aria-hidden="true"
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label
                htmlFor="s26-title"
                className="font-semibold text-text-primary"
              >
                عنوان پیام
              </label>
              <span className="text-[10px] text-text-muted">
                حداکثر ۱۰۰ کاراکتر
              </span>
            </div>
            <input
              id="s26-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label
                htmlFor="s26-body"
                className="font-semibold text-text-primary"
              >
                متن بخشنامه و بدنه اعلان
              </label>
              <span className="text-[10px] text-gold font-semibold">
                رسمی و دارای ارجاع
              </span>
            </div>
            <textarea
              id="s26-body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs leading-relaxed text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          {/* Clear & Send Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setBody("");
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-bg-primary py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>پاکسازی</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gold py-2.5 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ارسال</span>
            </button>
          </div>
        </section>

        {/* Active System Announcements */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-text-primary">
              <BellRing className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>اعلانات فعال سامانه</span>
            </h2>
            <span className="text-[10px] font-bold text-gold">
              ۱ پیام فعال روی تابلو
            </span>
          </div>

          <article className="rounded-2xl border border-gold/35 bg-bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 font-bold text-gold">
                <Pin className="h-3 w-3" aria-hidden="true" />
                سنجاق{"\u200c"}شده به تابلوی معاملات
              </span>
              <span className="tabular-nums-fa text-text-secondary">
                ارسال شده: ۰۳ آذر - ساعت ۰۹:۱۱
              </span>
            </div>

            <h3 className="text-xs font-extrabold text-text-primary">
              برنامه کاری ساعات نوسان و تسویه فیزیکی
            </h3>

            <p className="text-[11px] leading-relaxed text-text-secondary">
              اعلام ساعت شروع رسمی معاملات ۱۰:۳۰ الی ۲۱:۰۰ و هماهنگی دفتر تسویه
              حسابداری. لطفاً حواله{"\u200c"}ها قبل از ساعت پایان تایید شوند.
            </p>

            <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
              <span className="tabular-nums-fa flex items-center gap-1 text-[10px] font-semibold text-buy">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                نمایش برای ۲,۴۳۰ کاربر آنلاین
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-gold/35 bg-gold-soft px-3 py-1 text-[10px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
              >
                <Edit3 className="h-3 w-3" aria-hidden="true" />
                <span>ویرایش پیام</span>
              </button>
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
