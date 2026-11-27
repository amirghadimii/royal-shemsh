"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

export function Screen32ContactProfile() {
  const [userName, setUserName] = useState(SAMPLE_USER.fullName);
  const [userMeta, setUserMeta] = useState<{
    username?: string;
    mobile?: string;
    roleName?: string;
  } | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.fullName) {
          setUserName(data.user.fullName);
          setUserMeta({
            username: data.user.username,
            mobile: data.user.mobile,
            roleName: data.user.role?.name,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppShell
      activeTab="more"
      userName={userName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {userMeta ? (
          <section className="rounded-2xl border border-gold/30 bg-bg-card p-3.5 text-xs space-y-1">
            <p className="font-extrabold text-gold">{userName}</p>
            <p className="text-[11px] text-text-secondary">
              نام کاربری: {userMeta.username} | موبایل: {userMeta.mobile} | نقش:{" "}
              {userMeta.roleName ?? "کاربر"}
            </p>
          </section>
        ) : null}
        {/* Top Strip with Gold "R" Shield Logo & ۹۹۹.۹ */}
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-gold/30 bg-bg-card px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/45 bg-gold-soft text-gold">
              <Shield className="h-5 w-5" aria-hidden="true" />
              <span className="absolute text-[9px] font-black text-gold">
                R
              </span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-extrabold text-text-primary">
                واحد پشتیبانی و معاملات آنلاین
              </p>
              <p className="truncate text-[10px] text-text-secondary">
                اتحادیه طلا و جواهر تهران
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-md border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-extrabold text-gold">
            ۹۹۹.۹
          </span>
        </section>

        {/* H1 & Intro */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2">
          <h1 className="text-sm font-extrabold text-gold">
            سامانه جامع خرید و فروش رویال شمش
          </h1>
          <p className="text-xs font-bold text-text-primary">
            پایانه رسمی تحویل فیزیکی و تسویه نقدی
          </p>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            سامانه‌ای نقدی و متمرکز جهت خرید و فروش شمش طلای آبشده و مسکوکات
            مطابق با عرف و رسوم بازار بزرگ تهران
          </p>
        </section>

        {/* Contact Rows (each a link) */}
        <section className="space-y-2">
          <a
            href="tel:02188880000"
            className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3.5 transition-colors hover:border-gold/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-primary">
                  پشتیبانی معاملات
                </p>
                <p className="text-[10px] text-text-secondary">
                  میز راهنمای مشتریان و سفارشات
                </p>
              </div>
            </div>
            <span
              dir="ltr"
              className="tabular-nums-fa text-xs font-extrabold text-gold"
            >
              ۰۲۱-۸۸۸۸۰۰۰۰
            </span>
          </a>

          <a
            href="tel:02188880001"
            className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3.5 transition-colors hover:border-gold/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-primary">
                  امور مالی و حسابداری
                </p>
                <p className="text-[10px] text-text-secondary">
                  تسویه پایا، ساتنا و حساب دفتری
                </p>
              </div>
            </div>
            <div className="text-left">
              <span
                dir="ltr"
                className="tabular-nums-fa block text-xs font-extrabold text-gold"
              >
                ۰۲۱-۸۸۸۸۰۰۰۱
              </span>
              <span className="text-[10px] text-text-secondary">داخلی ۱۰۲</span>
            </div>
          </a>

          <a
            href="tel:02188880002"
            className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3.5 transition-colors hover:border-gold/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-primary">
                  دفتر مرکزی خزانه‌داری
                </p>
                <p className="text-[10px] text-text-secondary">
                  هماهنگی تحویل فیزیکی شمش
                </p>
              </div>
            </div>
            <span
              dir="ltr"
              className="tabular-nums-fa text-xs font-extrabold text-gold"
            >
              ۰۲۱-۸۸۸۸۰۰۰۲
            </span>
          </a>

          <a
            href="#delivery-address"
            className="flex items-start justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3.5 transition-colors hover:border-gold/40"
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-primary">
                  آدرس تحویل و مرکز معاملات
                </p>
                <p className="mt-0.5 text-[10px] text-text-secondary">
                  تحویل حضوری با احراز هویت بیومتریک و اصل کارت ملی
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-gold/25 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
              بازار بزرگ
            </span>
          </a>

          <a
            href="https://wa.me/989120000000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 rounded-2xl border border-buy/40 bg-buy-soft p-3.5 text-buy transition-opacity hover:opacity-90"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-buy text-white">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-extrabold">پشتیبانی برخط واتساپ</p>
                <p className="text-[10px] text-buy/90">
                  ارسال فیش و تاییدیه کارگزاری
                </p>
              </div>
            </div>
            <span className="tabular-nums-fa text-xs font-extrabold">
              ۰۹۱۲۰۰۰۰۰۰۰
            </span>
          </a>
        </section>

        {/* Display-Only Profile Card */}
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-text-primary">
                <UserCheck className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>اطلاعات کاربری و حساب مدیر</span>
              </h2>
              <p className="mt-0.5 text-[10px] text-text-secondary">
                شناسه حساب کاربری مجاز سطح یک
              </p>
            </div>
            <span
              dir="ltr"
              className="shrink-0 rounded-full border border-buy/35 bg-buy-soft px-2.5 py-0.5 text-[10px] font-extrabold text-buy"
            >
              سطح امنیتی A+
            </span>
          </div>

          <dl className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-primary/65 px-3 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-text-secondary">نام کاربری</dt>
              <dd dir="ltr" className="font-bold text-text-primary">
                admin
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-text-secondary">نام و نام خانوادگی</dt>
              <dd className="font-bold text-text-primary">امیر قدیمی</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-text-secondary">شماره تلفن همراه</dt>
              <dd className="flex items-center gap-1.5">
                <span className="tabular-nums-fa font-bold text-text-primary">
                  ۰۹۱۲۰۰۰۰۰۰۱
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-buy-soft px-2 py-0.5 text-[9px] font-bold text-buy">
                  <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                  تأیید پیامکی
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-text-secondary">پست الکترونیک</dt>
              <dd dir="ltr" className="text-[11px] font-semibold text-gold">
                user1@sample.ir
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-text-secondary">نقش و سطح دسترسی</dt>
              <dd className="font-bold text-gold">مدیر سیستم</dd>
            </div>
          </dl>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span>تنظیم یا تغییر کلمه عبور</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
