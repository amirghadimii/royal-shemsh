"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Award,
  BarChart3,
  ChevronLeft,
  Coins,
  FileCheck2,
  FileSpreadsheet,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  MessagesSquare,
  Moon,
  Package,
  Percent,
  Phone,
  Scale,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  User,
  UserCog,
  Users,
  Vault,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

interface QuickTool {
  id: string;
  label: string;
  icon: typeof User;
}

interface FinanceLink {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "buy" | "gold" | "neutral";
  icon: typeof BarChart3;
  href?: string;
}

const QUICK_TOOLS: QuickTool[] = [
  { id: "profile", label: "ویرایش پروفایل", icon: UserCog },
  { id: "documents", label: "مدارک آپلود شده", icon: FileCheck2 },
  { id: "users", label: "مدیریت کاربران", icon: Users },
  { id: "sms", label: "مدیریت پیامک", icon: MessageSquare },
  { id: "messenger", label: "پیامرسان داخلی", icon: MessagesSquare },
  { id: "internal-msg", label: "مدیریت پیام داخلی", icon: SlidersHorizontal },
  { id: "settings", label: "تنظیمات", icon: Settings },
  { id: "contact", label: "تماس با ما", icon: Phone },
];

const FINANCE_LINKS: FinanceLink[] = [
  {
    id: "pnl",
    title: "سود و زیان (P&L)",
    subtitle: "گزارش تراز لحظه\u200cای باز و بسته",
    badge: "+۱۲.۴٪",
    badgeTone: "buy",
    icon: BarChart3,
  },
  {
    id: "dashboard",
    title: "داشبورد معاملاتی",
    subtitle: "نمای جامع سفارشات و عمق مظنه",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    id: "products",
    title: "کالاها و اوزان شمش",
    subtitle: "شمش\u200cهای ۱، ۵، ۱۰، ۵۰ و ۱۰۰ گرمی",
    badge: "۵ قلم",
    badgeTone: "gold",
    icon: Package,
    href: "/",
  },
  {
    id: "gold-remittance",
    title: "حواله طلا",
    subtitle: "انتقال آنی بین حسابی و صدور سند",
    icon: Coins,
  },
  {
    id: "full-empty",
    title: "پر و خالی",
    subtitle: "تراز تحویل\u200cهای باز فیزیکی و ریالی",
    icon: ArrowLeftRight,
  },
  {
    id: "accounting",
    title: "دفتر حسابداری",
    subtitle: "ریز تراکنش\u200cهای بانکی، شتابی و ساتنا",
    icon: Wallet,
    href: "/deals",
  },
  {
    id: "stop-loss",
    title: "حد ضرر مشتری (Stop-Loss)",
    subtitle: "آستانه خروج اضطراری و هشدار مارجین",
    badge: "فعال",
    badgeTone: "buy",
    icon: ShieldAlert,
  },
  {
    id: "commission",
    title: "پورسانت مشتری و معرفی",
    subtitle: "محاسبه درصدی کارمزد شبکه اختصاصی",
    icon: Percent,
  },
  {
    id: "discrepancy",
    title: "مغایرت\u200cگیری انبار و بانک",
    subtitle: "بررسی ناهماهنگی کاردکس شمش فیزیکی",
    badge: "بدون مغایرت",
    badgeTone: "neutral",
    icon: Scale,
  },
  {
    id: "manual-preorder",
    title: "پیش سفارش دستی (Limit Order)",
    subtitle: "تنظیم قیمت سرخطی و خرید شرطی طلا",
    icon: FileSpreadsheet,
    href: "/preorder",
  },
];

export function Screen5More() {
  const [darkThemeOn, setDarkThemeOn] = useState(true);
  const [placeholderNotice, setPlaceholderNotice] = useState<string | null>(
    null
  );

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Top Title + Server Chip */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-extrabold text-text-primary">
            مرکز کنترل حساب و تنظیمات
          </h1>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-1 text-[10px] font-bold text-buy">
            <span
              className="h-1.5 w-1.5 rounded-full bg-buy"
              aria-hidden="true"
            />
            سرور فرابورس متصل
          </span>
        </div>

        {/* Profile Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold-soft text-gold">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-extrabold text-text-primary">
                    {SAMPLE_USER.fullName}
                  </p>
                  <span className="shrink-0 rounded-md border border-gold/35 bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-gold">
                    ویژه VIP
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  شناسه کاربری:{" "}
                  <span dir="ltr" className="inline-block font-semibold text-gold">
                    RS-۹۰۴
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg-primary/70 p-2.5 text-[11px]">
            <div>
              <span className="block font-bold text-gold">احراز هویت طلایی</span>
              <span className="mt-0.5 block text-[10px] text-text-secondary">
                تایید شمش استاندارد ۹۹۹.۹
              </span>
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-text-muted">
                موجودی طلا
              </span>
              <span className="tabular-nums-fa font-bold text-text-primary">
                موجودی طلا: ۴۵۰گرم
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-secondary">
            <span>سطح امنیتی: حداکثر (۲ عاملی)</span>
            <span className="text-buy font-semibold">فعال</span>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-primary/70 px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <Moon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                <span>پوسته تاریک رویال</span>
              </div>
              <p className="mt-0.5 text-[10px] text-text-secondary">
                نسخه ۱.۰.۰ (پایدار سرور زوریخ)
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={darkThemeOn}
              aria-label="تغییر تم"
              onClick={() => setDarkThemeOn((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                darkThemeOn
                  ? "bg-gold text-bg-primary"
                  : "border border-border-subtle bg-bg-card text-text-secondary"
              }`}
            >
              <span>تغییر تم</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  darkThemeOn ? "bg-bg-primary" : "bg-text-muted"
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </section>

        {placeholderNotice ? (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold-soft px-3 py-2 text-xs text-gold"
          >
            <span>
              بخش «<strong>{placeholderNotice}</strong>» در دسترس نیست.
            </span>
            <button
              type="button"
              onClick={() => setPlaceholderNotice(null)}
              className="text-[11px] font-bold underline cursor-pointer"
            >
              بستن
            </button>
          </div>
        ) : null}

        {/* ابزارها و مدیریت سریع (4x2) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-text-primary">
              ابزارها و مدیریت سریع
            </h2>
            <span className="text-[11px] text-gold font-semibold">
              ۸ دسترسی کاربری
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setPlaceholderNotice(tool.label)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card px-1.5 py-3 text-center transition-colors hover:border-gold/40 cursor-pointer"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-gold/25 bg-gold-soft text-gold">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-text-primary">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* خزانه رویال شمش ونوس */}
        <section className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-bg-card p-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-gold-soft text-gold">
            <Vault className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-gold">
              خزانه رویال شمش ونوس
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              تحویل فیزیکی با بارکد پلمپ امنیتی ۲۴ ساعته
            </p>
          </div>
        </section>

        {/* معاملات و دفاتر مالی (10 Links with Chevron) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-text-primary">
              معاملات و دفاتر مالی
            </h2>
            <span className="text-[11px] font-semibold text-gold">
              دفتر شمش
            </span>
          </div>

          <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
            {FINANCE_LINKS.map((item) => {
              const Icon = item.icon;
              const badgeClass =
                item.badgeTone === "buy"
                  ? "bg-buy-soft text-buy border-buy/30"
                  : item.badgeTone === "gold"
                    ? "bg-gold-soft text-gold border-gold/30"
                    : "bg-bg-primary text-text-secondary border-border-subtle";

              const rowBody = (
                <div className="flex items-center justify-between gap-2.5 px-3.5 py-3 transition-colors hover:bg-bg-elevated/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary text-gold">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-text-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-text-secondary">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.badge ? (
                      <span
                        dir={item.badge.startsWith("+") ? "ltr" : undefined}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                    <ChevronLeft
                      className="h-4 w-4 text-text-muted"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href} className="block">
                    {rowBody}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlaceholderNotice(item.title)}
                  className="block w-full text-right cursor-pointer"
                >
                  {rowBody}
                </button>
              );
            })}
          </div>
        </section>

        {/* اصالت و شمش عیار ۹۹۹.۹ */}
        <section className="flex items-start gap-2.5 rounded-2xl border border-gold/25 bg-bg-card p-3.5">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold text-gold">
              اصالت و شمش عیار ۹۹۹.۹
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              کلیه معاملات دارای تاییدیه اتحادیه طلا و جواهر و پشتوانه مخزن شمش
              بانکی رویال می{"\u200c"}باشند.
            </p>
          </div>
        </section>

        {/* Wide Red Exit Button */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sell/45 bg-sell-soft py-3.5 text-sm font-extrabold text-sell transition-colors hover:bg-sell hover:text-white cursor-pointer"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>خروج از حساب کاربری</span>
        </button>

        {/* SSL Footer */}
        <footer className="flex items-center justify-center gap-1.5 pb-1 text-center text-[10px] text-text-secondary">
          <Lock className="h-3 w-3 shrink-0 text-buy" aria-hidden="true" />
          <span>
            اتصال امن SSL ۲۵۶ بیتی | کد سرور:{" "}
            <span dir="ltr" className="inline-block font-semibold text-gold">
              #RS-SH-۲۲۴
            </span>
          </span>
        </footer>
      </div>
    </AppShell>
  );
}
