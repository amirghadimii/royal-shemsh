"use client";

import { KeyRound, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

const ROLES = [
  {
    id: "admin",
    title: "ادمین",
    subtitle: "ADMIN",
    desc: "مدیر ارشد سامانه • سطح دسترسی کامل مالی و شمش",
    badge: "سطح ۱",
  },
  {
    id: "shahin",
    title: "شاهین",
    subtitle: "مدیر سیستم",
    desc: "نظارت بر سفارشات، پیش\u200cخرید شمش و کنترل تسویه",
    badge: "سرگروه",
  },
];

const GROUPS = [
  { num: "۰۱", name: "امین", desc: "۲۴ معامله\u200cگر شمش" },
  { num: "۰۲", name: "عضو های جدید", desc: "۱۱۵ کاربر در انتظار احراز هویت" },
  { num: "۰۳", name: "درجه سه", desc: "سقف مجاز: ۵۰ گرم در روز" },
  { num: "۰۴", name: "شاهین 2", desc: "معاملات عمده و شمش سنگین" },
  { num: "۰۵", name: "درجه یک", desc: "تسویه آنی بدون کارمزد اضافه" },
  { num: "۰۶", name: "خانگی", desc: "خرید خرد و پس\u200cانداز شمش پلاک" },
  { num: "۰۷", name: "متغیر", desc: "اسپرد منعطف بسته به حجم بازاری" },
  { num: "۰۸", name: "شاهین", desc: "۴۲ کارگزار ارشد و بنکدار" },
  { num: "۰۹", name: "درجه دو", desc: "سقف اعتباری: ۵۰۰ گرم طلا" },
  { num: "۱۰", name: "هوم گلد", desc: "مشتریان وفادار باشگاه طلایی رویال" },
];

export function Screen28RolesGroups() {
  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Header Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              نقش{"\u200c"}ها و گروه{"\u200c"}های کاربری
            </h1>
            <span className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
              امنیت فعال
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            مدیریت سطوح دسترسی، سرپرستی معاملات و گروه{"\u200c"}بندی اعضا
          </p>
        </section>

        {/* System Roles */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="text-xs font-extrabold text-text-primary">
              نقش{"\u200c"}های کاربری سامانه
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl bg-gold px-3 py-1.5 text-[11px] font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>افزودن نقش جدید</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {ROLES.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-extrabold text-text-primary">
                        {r.title}
                      </h3>
                      <span
                        dir="ltr"
                        className="text-[10px] font-bold text-text-secondary"
                      >
                        {r.subtitle}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-text-secondary">
                      {r.desc}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-gold/35 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
                    {r.badge}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-gold/30 bg-gold-soft py-2 text-[10px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
                  >
                    <KeyRound className="h-3 w-3" aria-hidden="true" />
                    <span>دسترسی</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-subtle bg-bg-primary py-2 text-[10px] font-bold text-text-primary hover:border-gold/40 cursor-pointer"
                  >
                    <Pencil className="h-3 w-3 text-gold" aria-hidden="true" />
                    <span>ویرایش</span>
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
        </section>

        {/* Active Groups (10) */}
        <section className="space-y-2.5">
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-text-primary">
                <Users className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>گروه{"\u200c"}های کاربری فعال (۱۰ گروه)</span>
              </h2>
              <span className="rounded-full bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
                ۱۰۰٪ فعال
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-text-secondary">
              تنظیمات دسته{"\u200c"}بندی مشتریان، سهمیه تخصیص نمادهای طلای آبشده
              و شمش ونوس
            </p>
          </div>

          <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
            {GROUPS.map((g) => (
              <div
                key={g.num}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="tabular-nums-fa flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold-soft text-[11px] font-extrabold text-gold">
                    {g.num}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-text-primary">
                      {g.name}
                    </p>
                    <p className="truncate text-[10px] text-text-secondary">
                      {g.desc}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-buy/30 bg-buy-soft px-2.5 py-0.5 text-[10px] font-bold text-buy">
                  فعال
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-bg-card px-3.5 py-2.5 text-[10px] text-text-secondary">
          <span className="flex items-center gap-1.5">
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-gold"
              aria-hidden="true"
            />
            <span>
              هرگونه تغییر نقش مستلزم تأیید کلید دوعاملی سخت{"\u200c"}افزاری
              خزانه{"\u200c"}داری است.
            </span>
          </span>
          <span className="shrink-0 rounded-md bg-gold-soft px-2 py-0.5 font-bold text-gold">
            ۲۴ عیار
          </span>
        </footer>
      </div>
    </AppShell>
  );
}
