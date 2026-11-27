"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface QuickTool {
  id: string;
  label: string;
  icon: typeof User;
  href: string;
}

interface FinanceLink {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "buy" | "gold" | "neutral";
  icon: typeof BarChart3;
  href: string;
}

const QUICK_TOOLS: QuickTool[] = [
  { id: "profile", label: "ویرایش پروفایل", icon: UserCog, href: "/contact-profile" },
  { id: "documents", label: "مدارک آپلود شده", icon: FileCheck2, href: "/attachments" },
  { id: "users", label: "مدیریت کاربران", icon: Users, href: "/users" },
  { id: "sms", label: "مدیریت پیامک", icon: MessageSquare, href: "/sms-management" },
  { id: "messenger", label: "پیامرسان داخلی", icon: MessagesSquare, href: "/messenger" },
  { id: "internal-msg", label: "مدیریت پیام داخلی", icon: SlidersHorizontal, href: "/internal-messenger" },
  { id: "settings", label: "تنظیمات", icon: Settings, href: "/settings" },
  { id: "contact", label: "تماس با ما", icon: Phone, href: "/contact-profile" },
];

export function Screen5More() {
  const router = useRouter();
  const [darkThemeOn, setDarkThemeOn] = useState(true);
  const [userName, setUserName] = useState(SAMPLE_USER.fullName);
  const [userCode, setUserCode] = useState<string>("RS-۹۰۴");
  const [roleCode, setRoleCode] = useState<string>("ADMIN");
  const [goldBalance, setGoldBalance] = useState<string>("۰");
  const [productCount, setProductCount] = useState<number | null>(null);
  const [discrepancyConsistent, setDiscrepancyConsistent] = useState<boolean | null>(null);
  const [stopLossBreached, setStopLossBreached] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE}/auth/me`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserName(data.user.fullName);
          setUserCode(`RS-${data.user.code ?? 0}`);
          const rc = data.user.role?.code ?? "REGULAR";
          setRoleCode(rc);

          if (rc === "ADMIN" || rc === "SYSTEM_MANAGER") {
            fetch(`${API_BASE}/admin/reports/discrepancy`, { headers })
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (typeof d?.isConsistent === "boolean") {
                  setDiscrepancyConsistent(d.isConsistent);
                }
              })
              .catch(() => {});

            fetch(`${API_BASE}/admin/reports/stop-loss`, { headers })
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (typeof d?.summary?.breached === "number") {
                  setStopLossBreached(d.summary.breached);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/accounting/mine`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.goldGramsBalance !== undefined) {
          setGoldBalance(Number(data.goldGramsBalance).toLocaleString("fa-IR"));
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/board/products`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.products)) {
          setProductCount(data.products.length);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("rs_session_token");
      window.sessionStorage.removeItem("rs_session_user");
    }
    router.push("/login");
  }

  const isPrivileged = roleCode === "ADMIN" || roleCode === "SYSTEM_MANAGER";

  const financeLinks: FinanceLink[] = [
    {
      id: "pnl",
      title: "سود و زیان (P&L)",
      subtitle: "گزارش تراز لحظه‌ای باز و بسته",
      badge: "گزارش زنده",
      badgeTone: "buy",
      icon: BarChart3,
      href: "/profit-loss",
    },
    {
      id: "dashboard",
      title: "داشبورد معاملاتی",
      subtitle: "نمای جامع سفارشات و وضعیت دارایی",
      icon: LayoutDashboard,
      href: "/asset-dashboard",
    },
    {
      id: "products",
      title: "کالاها و اوزان شمش",
      subtitle: "مدیریت نمادها، قیمت و محدودیت سفارش",
      badge:
        productCount !== null
          ? `${productCount.toLocaleString("fa-IR")} قلم`
          : undefined,
      badgeTone: "gold",
      icon: Package,
      href: "/commodities",
    },
    {
      id: "gold-remittance",
      title: "حواله طلا",
      subtitle: "انتقال آنی بین حسابی و تحویل فیزیکی",
      icon: Coins,
      href: "/gold-remittance",
    },
    {
      id: "full-empty",
      title: "پر و خالی",
      subtitle: "تراز تحویل‌های باز فیزیکی و ریالی",
      icon: ArrowLeftRight,
      href: "/full-empty",
    },
    {
      id: "accounting",
      title: "دفتر حسابداری",
      subtitle: "ریز اسناد دوطرفه و مانده حساب‌ها",
      icon: Wallet,
      href: isPrivileged ? "/accounting" : "/deals",
    },
    {
      id: "stop-loss",
      title: "حد ضرر مشتری (Stop-Loss)",
      subtitle: "آستانه خروج اضطراری و هشدار مارجین",
      badge:
        stopLossBreached !== null
          ? stopLossBreached > 0
            ? `${stopLossBreached.toLocaleString("fa-IR")} هشدار`
            : "فعال"
          : "فعال",
      badgeTone: stopLossBreached && stopLossBreached > 0 ? "neutral" : "buy",
      icon: ShieldAlert,
      href: "/stop-loss",
    },
    {
      id: "commission",
      title: "پورسانت مشتری و معرفی",
      subtitle: "محاسبه کارمزد گروه‌ها و معرفی",
      icon: Percent,
      href: "/commission",
    },
    {
      id: "discrepancy",
      title: "مغایرت‌گیری انبار و بانک",
      subtitle: "بررسی ناهماهنگی معاملات و دفتر کل",
      badge:
        discrepancyConsistent === false
          ? "دارای مغایرت"
          : "بدون مغایرت",
      badgeTone: "neutral",
      icon: Scale,
      href: "/discrepancy",
    },
    {
      id: "manual-preorder",
      title: "پیش سفارش دستی (Limit Order)",
      subtitle: "تنظیم قیمت سرخطی و خرید شرطی طلا",
      icon: FileSpreadsheet,
      href: isPrivileged ? "/manual-preorder" : "/preorder",
    },
  ];

  return (
    <AppShell
      activeTab="more"
      userName={userName}
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
                    {userName}
                  </p>
                  <span className="shrink-0 rounded-md border border-gold/35 bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-gold">
                    {isPrivileged ? "مدیر سامانه" : "ویژه VIP"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  شناسه کاربری:{" "}
                  <span dir="ltr" className="inline-block font-semibold text-gold">
                    {userCode}
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
                {goldBalance} گرم
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
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card px-1.5 py-3 text-center transition-colors hover:border-gold/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-gold/25 bg-gold-soft text-gold">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-text-primary">
                    {tool.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* خزانه رویال شمش ونوس (تحویل فیزیکی و حواله طلا) */}
        <Link
          href="/gold-remittance"
          className="flex items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-bg-card p-3.5 transition-colors hover:border-gold/60"
        >
          <div className="flex items-center gap-3 min-w-0">
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
          </div>
          <ChevronLeft className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
        </Link>

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
            {financeLinks.map((item) => {
              const Icon = item.icon;
              const badgeClass =
                item.badgeTone === "buy"
                  ? "bg-buy-soft text-buy border-buy/30"
                  : item.badgeTone === "gold"
                    ? "bg-gold-soft text-gold border-gold/30"
                    : "bg-bg-primary text-text-secondary border-border-subtle";

              return (
                <Link key={item.id} href={item.href} className="block">
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
                </Link>
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
              بانکی رویال می‌باشد.
            </p>
          </div>
        </section>

        {/* Wide Red Exit Button */}
        <button
          type="button"
          disabled={loggingOut}
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sell/45 bg-sell-soft py-3.5 text-sm font-extrabold text-sell transition-colors hover:bg-sell hover:text-white disabled:opacity-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{loggingOut ? "در حال خروج..." : "خروج از حساب کاربری"}</span>
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
