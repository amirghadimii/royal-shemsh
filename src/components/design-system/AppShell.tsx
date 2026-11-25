"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ClipboardList,
  Clock,
  Crown,
  Home,
  MoreHorizontal,
  User,
} from "lucide-react";
import type { NavTabId } from "@/types/trading";

export interface BottomNavItem {
  id: NavTabId;
  label: string;
  href: string;
  icon: typeof Home;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: "more", label: "بیشتر", href: "/more", icon: MoreHorizontal },
  { id: "trade", label: "خرید/فروش", href: "/trade", icon: ArrowLeftRight },
  { id: "home", label: "خانه", href: "/", icon: Home },
  { id: "preorder", label: "پیش سفارش", href: "/preorder", icon: Clock },
  { id: "deals", label: "معاملات", href: "/deals", icon: ClipboardList },
];

interface AppShellProps {
  children: ReactNode;
  activeTab: NavTabId;
  onTabChange?: (tab: NavTabId) => void;
  userName?: string;
  isOnline?: boolean;
  brandTitle?: string;
  brandSubtitle?: string;
  hideHeader?: boolean;
}

export function AppShell({
  children,
  activeTab,
  onTabChange,
  userName = "امیر قدیمی",
  isOnline = true,
  brandTitle = "رویال شمش",
  brandSubtitle = "معاملات سامانه رویال شمش",
  hideHeader = false,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col">
      {!hideHeader ? (
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
          {/* Right in RTL: User info + Gold circular avatar */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold-soft text-gold">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-primary">
                {userName}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline
                      ? "bg-buy shadow-[0_0_6px_rgba(16,185,129,0.85)]"
                      : "bg-text-muted"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-[11px] font-medium ${
                    isOnline ? "text-buy" : "text-text-muted"
                  }`}
                >
                  {isOnline ? "آنلاین" : "آفلاین"}
                </span>
              </div>
            </div>
          </div>

          {/* Left in RTL: Brand title + subtitle */}
          <div className="flex items-center gap-2 text-left min-w-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-gold">
                {brandTitle}
              </p>
              <p className="truncate text-[10px] text-text-secondary">
                {brandSubtitle}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold-soft text-gold">
              <Crown className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </header>
      ) : null}

      {/* Main Content */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">
        {children}
      </main>

      {/* 5-Tab Bottom Navigation (RTL right-to-left: بیشتر، خرید/فروش، خانه، پیش‌سفارش، معاملات) */}
      <nav
        aria-label="منوی اصلی"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const classes = `flex min-w-0 w-full flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
              isActive
                ? "text-gold"
                : "text-text-secondary hover:text-text-primary"
            }`;

            const inner = (
              <>
                <span
                  className={`flex h-7 w-10 items-center justify-center rounded-xl transition-colors ${
                    isActive ? "bg-gold-soft" : "bg-transparent"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="truncate">{item.label}</span>
              </>
            );

            if (onTabChange) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={classes}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={classes}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
