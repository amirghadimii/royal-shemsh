"use client";

import { useState } from "react";
import {
  FileCheck2,
  FolderOpen,
  Info,
  Search,
  Upload,
  UploadCloud,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { CustomLevel3Header } from "@/components/CustomLevel3Header";

const USER_OPTIONS = [
  { id: "۱", name: "امیر قدیمی", label: "۱ امیر قدیمی" },
  { id: "۲", name: "شاهین جمشیدی", label: "۲ شاهین جمشیدی" },
  { id: "۳", name: "امین صفری", label: "۳ امین صفری" },
  { id: "۴", name: "کیارش پورسلیک", label: "۴ کیارش پورسلیک" },
  { id: "۵", name: "مهدی علوی", label: "۵ مهدی علوی" },
  { id: "۶", name: "صرافی پارسیان", label: "۶ صرافی پارسیان" },
  { id: "۷", name: "کیان طلا", label: "۷ کیان طلا" },
  { id: "۸", name: "جواهری کوروش", label: "۸ جواهری کوروش" },
];

const DOC_TABS = ["همه مدارک", "کارت ملی", "جواز کسب", "قرارداد کارگزاری"];

const DOC_TITLES = [
  "تصویر روی کارت ملی هوشمند",
  "پروانه کسب یا گواهی اتحادیه طلا و جواهر",
  "قرارداد تعهدنامه تحویل فیزیکی شمش",
  "تاییدیه حساب بانکی و شبا شتابی",
];

export function Screen34Attachments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("۱");
  const [activeDocTab, setActiveDocTab] = useState("همه مدارک");
  const [docTitle, setDocTitle] = useState(DOC_TITLES[0]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const selectedUser =
    USER_OPTIONS.find((u) => u.id === selectedUserId) ?? USER_OPTIONS[0];

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col">
      <CustomLevel3Header />

      <AppShell activeTab="more" hideHeader>
        <div className="space-y-3.5 -mt-2">
          {/* Sub-header */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-[10px]">
            <span className="font-bold text-gold">
              معاملات سامانه رویال شمش
            </span>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">
                امیر قدیمی (کاربر متصل)
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-buy">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-buy"
                  aria-hidden="true"
                />
                آنلاین
              </span>
            </div>
          </div>

          {/* H1 & Subtitle */}
          <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1">
            <h1 className="text-sm font-extrabold text-text-primary">
              مدیریت مدارک و پیوست‌های کاربران
            </h1>
            <p className="text-[11px] leading-relaxed text-text-secondary">
              بررسی و الصاق مدارک احراز هویت، مجوزهای زرگری و قراردادهای
              کارگزاری
            </p>
          </section>

          {/* User Selection Dropdown Card */}
          <section className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-text-primary">
                انتخاب کاربر مورد نظر
              </span>
              <span className="tabular-nums-fa font-semibold text-gold">
                ۸ حساب کاربری
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary px-3 py-2">
              <Search
                className="h-3.5 w-3.5 shrink-0 text-text-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا کد کاربر..."
                className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="s34-user-dropdown"
                className="block text-[10px] font-semibold text-text-secondary"
              >
                مدارک کاربر انتخاب شده
              </label>
              <select
                id="s34-user-dropdown"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
              >
                {USER_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Selected-user Header */}
          <section className="flex items-center justify-between gap-2 rounded-2xl border border-gold/30 bg-bg-card px-3.5 py-3">
            <div>
              <p className="text-xs font-extrabold text-text-primary">
                مدارک کاربر: {selectedUser.name} - کد {selectedUser.id}
              </p>
              <span className="mt-1 inline-block rounded-md bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
                سطح طلایی
              </span>
            </div>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              پرونده فعال
            </span>
          </section>

          {/* 4 Document-Type Tabs */}
          <div className="grid grid-cols-4 gap-1.5">
            {DOC_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveDocTab(tab)}
                className={`rounded-xl py-2 px-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  activeDocTab === tab
                    ? "bg-gold text-bg-primary"
                    : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Empty State */}
          <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-card/75 px-4 py-7 text-center">
            <FolderOpen
              className="h-7 w-7 text-text-muted"
              aria-hidden="true"
            />
            <p className="mt-2.5 text-xs font-extrabold text-text-primary">
              مدرکی برای این کاربر یافت نشد
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              هنوز سندی نظیر تصویر کارت ملی، تاییدیه ثبتی یا پروانه اتحادیه طلا
              برای این حساب الصاق نگردیده است.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>بارگذاری مدرک جدید توسط مدیر</span>
            </button>
          </section>

          {/* Upload Rules */}
          <section className="flex items-start gap-2 rounded-2xl border border-gold/25 bg-bg-card p-3.5 text-[11px]">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-gold"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold text-gold">
                ضوابط بارگذاری اسناد فیزیکی و تجاری
              </p>
              <p className="mt-0.5 leading-relaxed text-text-secondary">
                فرمت‌های مجاز: PDF، JPG و PNG با حداکثر حجم ۱۰ مگابایت. اسناد
                باید دارای وضوح کامل، خوانا و بدون بازتاب نور باشند.
              </p>
            </div>
          </section>

          {/* Upload Form (coexists with empty state) */}
          <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
            <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-text-primary">
              <FileCheck2 className="h-4 w-4 text-gold" aria-hidden="true" />
              <span>بارگذاری سند جدید</span>
            </h2>

            <div className="space-y-1">
              <label
                htmlFor="s34-doc-title"
                className="block text-[11px] font-semibold text-text-secondary"
              >
                انتخاب عنوان سند
              </label>
              <select
                id="s34-doc-title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-gold focus:outline-none"
              >
                {DOC_TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold/40 bg-bg-primary/70 px-4 py-6 text-center">
              <UploadCloud
                className="h-6 w-6 text-gold"
                aria-hidden="true"
              />
              <p className="mt-2 text-xs font-bold text-text-primary">
                فایل را اینجا رها کنید یا کلیک نمایید
              </p>
              <p className="mt-0.5 text-[10px] text-text-secondary">
                حداکثر ۱۰ مگابایت (JPG, PNG, PDF)
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setUploadNotice(
                  `سند «${docTitle}» برای ${selectedUser.name} ثبت نمایشی شد.`
                )
              }
              className="w-full rounded-xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
            >
              ثبت و پیوست به پرونده
            </button>

            {uploadNotice ? (
              <p className="rounded-xl border border-buy/35 bg-buy-soft px-3 py-2 text-center text-[11px] font-bold text-buy">
                {uploadNotice}
              </p>
            ) : null}
          </section>
        </div>
      </AppShell>
    </div>
  );
}
