"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Info,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AppShell, NoAccessBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { useEndpointAccess } from "@/lib/useEndpointAccess";

type SelectedDirection = "buy" | "sell" | null;

const STEP_CHIPS = [
  "شناسه مشتری",
  "انتخاب شمش ۲۴ عیار",
  "تعیین نرخ لیمیت",
  "وزن سفارش",
];

export function Screen14ManualPreorder() {
  const router = useRouter();
  const { accessDenied } = useEndpointAccess("/admin/users");
  const [direction, setDirection] = useState<SelectedDirection>(null);

  if (accessDenied) {
    return (
      <AppShell
        activeTab="more"
        userName={SAMPLE_USER.fullName}
        isOnline={SAMPLE_USER.isOnline}
      >
        <NoAccessBanner />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Breadcrumb (the only breadcrumb in the system) */}
        <nav
          aria-label="مسیر صفحه"
          className="flex items-center gap-1.5 px-1 text-[11px] text-text-secondary"
        >
          <Link href="/" className="hover:text-gold">
            رویال
          </Link>
          <ChevronLeft className="h-3 w-3 text-text-muted" aria-hidden="true" />
          <Link href="/more" className="hover:text-gold">
            سامانه معاملات
          </Link>
          <ChevronLeft className="h-3 w-3 text-text-muted" aria-hidden="true" />
          <span className="font-bold text-gold">ثبت پیش سفارش دستی</span>
        </nav>

        {/* Operator Access Strip */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-bg-card px-3 py-2 text-[10px]">
          <span className="font-bold text-gold">دسترسی مستقیم اپراتور ارشد</span>
          <span className="inline-flex items-center gap-1 font-semibold text-buy">
            <Lock className="h-3 w-3" aria-hidden="true" />
            اتصال امن خزانه
          </span>
        </div>

        {/* H1 & Subtitle */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-1.5">
          <h1 className="text-sm font-extrabold text-text-primary">
            پنل ادمین: ثبت دستی پیش{"\u200c"}سفارش شرطی
          </h1>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            ثبت دستور سرخطی لیمیت (Limit Order) در صف تسویه لحظه{"\u200c"}ای به
            نیابت از مشتری
          </p>
        </section>

        {/* Direction Selector (BOTH dark/neutral when unselected) */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-text-primary">
              انتخاب جهت معامله
            </h2>
            <span className="text-[10px] font-medium text-gold">
              {direction === null
                ? "در انتظار انتخاب نوع سفارش..."
                : direction === "buy"
                  ? "جهت انتخابی: خرید"
                  : "جهت انتخابی: فروش"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setDirection("buy");
                router.push("/manual-preorder-form?side=buy");
              }}
              className={`rounded-2xl border px-3 py-3.5 text-center transition-colors cursor-pointer ${
                direction === "buy"
                  ? "border-gold bg-gold-soft text-gold"
                  : "border-border-subtle bg-bg-primary text-text-primary hover:border-gold/40"
              }`}
            >
              <span className="block text-sm font-extrabold">خرید</span>
              <span className="mt-1 block text-[10px] text-text-secondary">
                ثبت تقاضای شمش
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirection("sell");
                router.push("/manual-preorder-form?side=sell");
              }}
              className={`rounded-2xl border px-3 py-3.5 text-center transition-colors cursor-pointer ${
                direction === "sell"
                  ? "border-gold bg-gold-soft text-gold"
                  : "border-border-subtle bg-bg-primary text-text-primary hover:border-gold/40"
              }`}
            >
              <span className="block text-sm font-extrabold">فروش</span>
              <span className="mt-1 block text-[10px] text-text-secondary">
                ثبت عرضه شمش
              </span>
            </button>
          </div>
        </section>

        {/* Info Block + 4 Step Chips */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-gold"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-bold text-text-primary">
                برای نمایش فرم ثبت، ابتدا خرید یا فروش را انتخاب کنید
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                پس از تعیین نوع معامله (خرید یا فروش)، فیلدهای انتخاب کاربر،
                انتخاب نماد، قیمت هدف و وزن سفارش فعال...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {STEP_CHIPS.map((step) => (
              <span
                key={step}
                className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-2 text-center text-[10px] font-semibold text-text-secondary"
              >
                {step}
              </span>
            ))}
          </div>
        </section>

        {/* Supervisory Rules Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-gold"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-xs font-extrabold text-gold">
                دستورالعمل{"\u200c"}های نظارتی ثبت دستی اپراتور
              </h2>
              <p className="mt-0.5 text-[10px] text-text-secondary">
                ضوابط ثبت سرخطی توسط ادمین برای کاربران
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-[11px] leading-relaxed text-text-secondary">
            <li className="rounded-xl bg-bg-primary/70 p-3">
              ثبت پیش{"\u200c"}سفارش صرفاً بر اساس درخواست معتبر کتبی یا مکالمه
              ضبط{"\u200c"}شده دارنده حساب طلایی مجاز است.
            </li>

            <li className="rounded-xl bg-bg-primary/70 p-3 space-y-1">
              <p className="font-bold text-text-primary">
                بررسی خودکار سقف اعتبار و موجودی ریالی/طلایی پیش از تایید نهایی
              </p>
              <p>
                هسته موتور پایاپیش، ظرفیت انسداد دارایی را در لحظه ورود سفارش به
                سامانه رزرو می{"\u200c"}نماید.
              </p>
            </li>

            <li className="rounded-xl bg-bg-primary/70 p-3 space-y-1">
              <p className="font-bold text-text-primary">
                ثبت لاگ حسابرسی برخط کلیه عملیات مدیر
              </p>
              <p>
                آدرس شبکه، شناسه توکن ادمین و مهر زمانی مایکروثانیه به همراه هش
                تراکنش بایگانی ابدی خواهد شد.
              </p>
            </li>

            <li className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gold-soft/50 px-3 py-2 text-[10px] font-semibold text-gold">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                پروتکل رمزنگاری دوجانبه سامانه متمرکز رویال شمش (نسخه ۳.۴)
              </span>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
