"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";
import { AppShell, ProposedBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

const ROLE_OPTIONS = [
  "کاربر عادی",
  "معامله\u200cگر (دسترسی لحظه\u200cای به مظنه رویال)",
  "سرگروه دفاتر بازار",
  "مدیر ارشد سامانه",
];

const BRANCH_OPTIONS = [
  "بازاریابی طلایی - ناحیه بازار بزرگ تهران",
  "همکاران و کارگزاران رسمی",
  "مشتریان ویژه (VIP)",
  "سرگروه\u200cها و خزانه\u200cداران",
  "عادی - معاملات عمومی",
];

export function Screen24AddUser() {
  const [fullName, setFullName] = useState("محمدجواد رضایی");
  const [username, setUsername] = useState("m_rezaei_gold");
  const [mobile, setMobile] = useState("۰۹۱۲۳۴۵۶۷۸۹");
  const [email, setEmail] = useState("m.rezaei@royalshemsh.com");
  const [role, setRole] = useState(ROLE_OPTIONS[1]);
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
  const [require2FA, setRequire2FA] = useState(true);

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        <ProposedBanner subBadge="نمونه اولیه" />

        {/* Header */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              تعریف و ثبت کاربر جدید
            </h1>
            <span className="shrink-0 rounded-full border border-gold/35 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
              امنیت ۲۴ عیار
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            ورود اطلاعات هویتی و تعیین سطح دسترسی معاملات شمش
          </p>
        </section>

        {/* Identity & Account Details */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <h2 className="text-xs font-extrabold text-gold">
            مشخصات هویتی و حساب
          </h2>

          <div className="space-y-1">
            <label
              htmlFor="u-name"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              نام و نام خانوادگی *
            </label>
            <input
              id="u-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="u-username"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              نام کاربری (شناسه لاتین سامانه) *
            </label>
            <input
              id="u-username"
              type="text"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-left text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="u-mobile"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              شماره موبایل (جهت احراز و پیامک تایید) *
            </label>
            <div className="flex items-center overflow-hidden rounded-xl border border-border-subtle bg-bg-primary focus-within:border-gold">
              <input
                id="u-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="tabular-nums-fa w-full bg-transparent px-3 py-2 text-xs font-bold text-text-primary focus:outline-none"
              />
              <span
                dir="ltr"
                className="shrink-0 border-r border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-bold text-gold"
              >
                +98
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="u-email"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              رایانامه (ایمیل سازمانی یا شخصی)
            </label>
            <input
              id="u-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-left text-xs font-medium text-text-primary focus:border-gold focus:outline-none"
            />
          </div>
        </section>

        {/* Role & Group */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <h2 className="text-xs font-extrabold text-gold">
            سطح دسترسی و گروه{"\u200c"}بندی معاملات
          </h2>

          <div className="space-y-1">
            <label
              htmlFor="u-role"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              نقش کاربر در سامانه
            </label>
            <select
              id="u-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary focus:border-gold focus:outline-none"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="u-branch"
              className="block text-[11px] font-semibold text-text-secondary"
            >
              گروه تجاری / شعبه
            </label>
            <select
              id="u-branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary focus:border-gold focus:outline-none"
            >
              {BRANCH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Security & Credit */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <h2 className="text-xs font-extrabold text-gold">
            اختیارات امنیتی و سقف اعتبار اولیه
          </h2>

          <label className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-bg-primary/70 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={require2FA}
              onChange={(e) => setRequire2FA(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#D4AF37]"
            />
            <div>
              <span className="block text-xs font-bold text-text-primary">
                احراز هویت دو مرحله{"\u200c"}ای (2FA)
              </span>
              <span className="mt-0.5 block text-[10px] text-text-secondary">
                الزام وارد کردن کد پیامکی در هر ورود
              </span>
            </div>
          </label>

          <div className="rounded-xl border border-gold/25 bg-bg-primary/70 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">
                سقف اعتبار اولیه معاملات
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-buy">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                تایید شده خزانه{"\u200c"}داری
              </span>
            </div>
            <p className="tabular-nums-fa text-xs font-extrabold text-gold">
              ۲۰۰,۰۰۰,۰۰۰ تومان (معادل ۲ میلیارد ریال)
            </p>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>ذخیره کاربر</span>
          </button>

          <p className="text-center text-[10px] text-text-secondary">
            رمز عبور موقت و لینک فعال{"\u200c"}سازی از طریق پیامک برای کاربر
            ارسال خواهد شد.
          </p>
        </section>

        {/* Success Line (shown below form on same screen) */}
        <section className="flex items-start gap-2.5 rounded-2xl border border-buy/40 bg-buy-soft p-3.5 text-buy">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-extrabold">
              کاربر جدید با موفقیت ثبت شد
            </p>
            <p className="tabular-nums-fa mt-0.5 text-[11px] text-buy/90">
              پیامک فعال{"\u200c"}سازی به ۰۹۱۲۳۴۵۶۷۸۹ ارسال گردید.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
