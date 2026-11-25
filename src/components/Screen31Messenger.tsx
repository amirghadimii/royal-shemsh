"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  Edit3,
  Inbox,
  Pin,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

const AUDIENCE_OPTIONS = [
  "ارسال برای همه",
  "معامله‌گران فعال شمش",
  "صندوق‌های سرمایه‌گذاری",
  "نمایندگان خزانه طلا",
];

const MSG_TYPE_OPTIONS = [
  "پیام عادی",
  "بخشنامه رسمی",
  "توقف موقت نماد",
  "هشدار نوسان شدید",
];

const ARCHIVE_USERS = [
  "همه کاربران",
  "امیر قدیمی (خودم)",
  "معامله‌گران خرد",
  "تاییدکنندگان مالی",
];

const ARCHIVE_TYPES = ["همه انواع", "پیام عادی", "سیستمی", "فوری"];

const STATUS_BUTTONS = ["همه", "تایید شده", "رد شده", "پذیرفته شده"];

const SWATCHES = [
  { id: "gold", bg: "bg-[#D4AF37]", caption: "طلایی ویژه سامانه" },
  { id: "green", bg: "bg-[#10B981]", caption: "سبز تاییدیه" },
  { id: "red", bg: "bg-[#EF4444]", caption: "قرمز هشدار فوری" },
  { id: "blue", bg: "bg-blue-500", caption: "آبی اطلاع‌رسانی" },
];

export function Screen31Messenger() {
  const [onlineOnly, setOnlineOnly] = useState(true);
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [msgType, setMsgType] = useState(MSG_TYPE_OPTIONS[0]);
  const [swatch, setSwatch] = useState("gold");
  const [title, setTitle] = useState("تغییر در روند تسویه نقدی");
  const [body, setBody] = useState(
    "کلیه معامله‌گران محترم شمش طلا توجه فرمایند، تسویه ریالی معاملات انجام‌شده در پلتفرم از فردا راس ساعت ۱۲:۰۰ از طریق سامانه پایا بانک مرکزی اجرا خواهد شد."
  );

  const [fromDate, setFromDate] = useState("۱۴۰۵/۰۹/۰۴");
  const [toDate, setToDate] = useState("۱۴۰۵/۰۹/۰۴");
  const [archiveUser, setArchiveUser] = useState(ARCHIVE_USERS[0]);
  const [archiveType, setArchiveType] = useState(ARCHIVE_TYPES[0]);
  const [archiveStatus, setArchiveStatus] = useState("همه");

  const activeSwatch =
    SWATCHES.find((s) => s.id === swatch) ?? SWATCHES[0];

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Header + Gold Button */}
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-gold/25 bg-bg-card p-4">
          <h2 className="text-sm font-extrabold text-text-primary">
            پیام‌رسان و اعلانات
          </h2>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gold px-3 py-2 text-[10px] font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <Edit3 className="h-3 w-3" aria-hidden="true" />
            <span>ویرایش آخرین پیام عادی</span>
          </button>
        </section>

        {/* New Announcement Form */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-gold">
              ارسال اعلان جدید
            </span>
            <span className="text-[10px] text-text-secondary">
              سیستم اطلاع‌رسانی بورس
            </span>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary/70 px-3 py-2.5 text-xs font-semibold text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="h-4 w-4 accent-[#D4AF37]"
            />
            <span>فقط کاربران آنلاین نمایش داده شود</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="s31-audience"
                className="block text-[10px] font-semibold text-text-secondary"
              >
                مخاطبان دریافت‌کننده
              </label>
              <select
                id="s31-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-2 text-[11px] font-semibold text-text-primary focus:border-gold focus:outline-none"
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="s31-type"
                className="block text-[10px] font-semibold text-text-secondary"
              >
                نوع پیام
              </label>
              <select
                id="s31-type"
                value={msgType}
                onChange={(e) => setMsgType(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-2 text-[11px] font-semibold text-text-primary focus:border-gold focus:outline-none"
              >
                {MSG_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Swatches (no text labels on swatches) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-text-primary">
                رنگ اولویت شاخص
              </span>
              <span className="text-[10px] font-semibold text-gold">
                {activeSwatch.caption}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {SWATCHES.map((s) => {
                const selected = swatch === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={s.caption}
                    onClick={() => setSwatch(s.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform cursor-pointer ${s.bg} ${
                      selected
                        ? "ring-2 ring-white ring-offset-2 ring-offset-bg-card scale-105"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    {selected ? (
                      <Check
                        className="h-4 w-4 text-bg-primary stroke-[3]"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label
              htmlFor="s31-title"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              عنوان پیام
            </label>
            <input
              id="s31-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label
              htmlFor="s31-body"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              متن پیام / بدنه اعلان
            </label>
            <textarea
              id="s31-body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs leading-relaxed text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          {/* Red Clear & Green Send */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setBody("");
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-sell py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>پاکسازی</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ارسال</span>
            </button>
          </div>
        </section>

        {/* Pinned Card */}
        <article className="rounded-2xl border border-gold/35 bg-bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 font-bold text-gold">
              <Pin className="h-3 w-3" aria-hidden="true" />
              سنجاق‌شده
            </span>
            <span className="tabular-nums-fa text-text-secondary">
              ۰۳ آذر ۰۹:۱۱
            </span>
          </div>
          <h3 className="text-xs font-extrabold text-text-primary">
            شروع کار سامانه رویال شمش 10:30 الی 21
          </h3>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            معاملات گواهی سپرده شمش طلای استاندارد ۲۴ عیار طبق زمانبندی رسمی
            تالار بدون وقفه برقرار خواهد بود.
          </p>
        </article>

        {/* Live Archive Section */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-text-primary">
              <Bell className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              اعلان‌ها
            </span>
            <span className="text-[10px] font-bold text-buy">آرشیو زنده</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="s31-from"
                className="block text-[10px] text-text-secondary"
              >
                از تاریخ
              </label>
              <input
                id="s31-from"
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="tabular-nums-fa w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="s31-to"
                className="block text-[10px] text-text-secondary"
              >
                تا تاریخ
              </label>
              <input
                id="s31-to"
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="tabular-nums-fa w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="s31-user"
                className="block text-[10px] text-text-secondary"
              >
                کاربر
              </label>
              <select
                id="s31-user"
                value={archiveUser}
                onChange={(e) => setArchiveUser(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-2 text-[11px] text-text-primary focus:border-gold focus:outline-none"
              >
                {ARCHIVE_USERS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="s31-atype"
                className="block text-[10px] text-text-secondary"
              >
                نوع
              </label>
              <select
                id="s31-atype"
                value={archiveType}
                onChange={(e) => setArchiveType(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-2 text-[11px] text-text-primary focus:border-gold focus:outline-none"
              >
                {ARCHIVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_BUTTONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setArchiveStatus(st)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  archiveStatus === st
                    ? "bg-gold text-bg-primary"
                    : "border border-border-subtle bg-bg-primary text-text-secondary"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-primary/60 px-4 py-7 text-center">
            <Inbox className="h-6 w-6 text-text-muted" aria-hidden="true" />
            <p className="mt-2 text-xs font-bold text-text-primary">
              اعلانی یافت نشد
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              در بازه انتخابی و فیلترهای اعمال‌شده، پیامی در سامانه ثبت نگردیده
              است.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gold/35 bg-gold-soft px-3.5 py-2 text-[11px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>بارگذاری مجدد اطلاعات</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
