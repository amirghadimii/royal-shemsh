"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Crown,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  Smartphone,
  Vault,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface AuthUser {
  id: string;
  code: number;
  username: string;
  fullName: string;
  mobile: string;
  role: { code: string; name: string; level: number };
}

export function Screen17Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("۰۹۱۲۰۰۰۰۰۰۰");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [passwordMode, setPasswordMode] = useState(false);
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!saved) return;

    fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setSessionToken(saved);
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleRequestOtp = async () => {
    setErrorMsg(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در ارسال کد تایید");
        return;
      }
      setNotice(data?.message ?? "کد احراز هویت ارسال شد");
      otpRefs.current[0]?.focus();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور احراز هویت");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride ?? otpDigits.join("");
    if (code.length !== 6) return;
    setErrorMsg(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "کد تایید نامعتبر است");
        return;
      }
      if (data?.token) {
        window.sessionStorage.setItem("rs_session_token", data.token);
        setSessionToken(data.token);
      }
      setCurrentUser(data.user);
      setNotice("ورود با موفقیت انجام شد.");
      const target =
        data?.user?.role?.code === "REGULAR" ? "/regular-user" : "/";
      router.push(target);
    } catch {
      setErrorMsg("خطا در بررسی کد تایید");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setErrorMsg(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "نام کاربری یا رمز عبور نادرست است");
        return;
      }
      if (data?.token) {
        window.sessionStorage.setItem("rs_session_token", data.token);
        setSessionToken(data.token);
      }
      setCurrentUser(data.user);
      setNotice("ورود با رمز ثابت با موفقیت انجام شد.");
      const target =
        data?.user?.role?.code === "REGULAR" ? "/regular-user" : "/";
      router.push(target);
    } catch {
      setErrorMsg("خطا در ارتباط با سرور احراز هویت");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: sessionToken
          ? { Authorization: `Bearer ${sessionToken}` }
          : undefined,
      });
    } catch {
      // ignore network errors on logout cleanup
    } finally {
      window.sessionStorage.removeItem("rs_session_token");
      setSessionToken(null);
      setCurrentUser(null);
      setPassword("");
      setOtpDigits(["", "", "", "", "", ""]);
      setNotice("نشست کاربری با موفقیت بسته شد.");
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.slice(-1);
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);

    if (clean && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (clean && next.every((d) => d !== "")) {
      void handleVerifyOtp(next.join(""));
    }
  };

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary flex flex-col justify-between px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        {/* Top Security Strip */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-bg-card px-3 py-2 text-[10px]">
          <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
            <Lock className="h-3 w-3 text-buy" aria-hidden="true" />
            اتصال امن به خزانه معاملات رویال شمش
          </span>
          <span
            dir="ltr"
            className="rounded-md border border-gold/30 bg-gold-soft px-2 py-0.5 font-extrabold text-gold"
          >
            AU 999.9
          </span>
        </div>

        {/* Brand Hero */}
        <header className="text-center space-y-1.5 py-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gold/45 bg-gold-soft text-gold shadow-lg">
            <Crown className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-gold">رویال شمش</h1>
          <p className="text-xs text-text-secondary">
            سامانه یکپارچه معاملات آنلاین شمش و مسکوکات طلا
          </p>
        </header>

        {/* Auth Card */}
        <main className="rounded-3xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-text-primary">
              ورود به سامانه معاملات
            </h2>
            <span className="rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
              نسخه شرکتی
            </span>
          </div>

          {currentUser ? (
            <div className="space-y-3 rounded-2xl border border-buy/40 bg-buy-soft p-4 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-buy">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>نشست فعال: {currentUser.fullName}</span>
              </div>
              <p className="text-[11px] text-text-primary">
                نقش: <strong className="text-gold">{currentUser.role.name}</strong>{" "}
                ({currentUser.username})
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sell/45 bg-sell-soft py-2.5 text-xs font-bold text-sell hover:bg-sell hover:text-white cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] leading-relaxed text-text-secondary">
                شماره تلفن همراه خود را جهت دریافت کد تایید پیامکی یکبار مصرف
                وارد فرمایید.
              </p>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-phone"
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-primary"
                >
                  <Smartphone
                    className="h-3.5 w-3.5 text-gold"
                    aria-hidden="true"
                  />
                  <span>شماره موبایل</span>
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-border-subtle bg-bg-primary focus-within:border-gold">
                  <input
                    ref={phoneRef}
                    id="login-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="tabular-nums-fa w-full bg-transparent px-3 py-2.5 text-sm font-bold text-text-primary focus:outline-none"
                  />
                  <span
                    dir="ltr"
                    className="shrink-0 border-r border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-bold text-gold"
                  >
                    +۹۸
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleRequestOtp}
                className="w-full rounded-xl bg-gold py-3 text-xs font-extrabold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                ارسال کد احراز هویت
              </button>

              {/* OTP Section (6 empty boxes) */}
              <div className="space-y-2.5 border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-text-primary">
                    کد تایید ۶ رقمی ارسال{"\u200c"}شده
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(["", "", "", "", "", ""]);
                      setErrorMsg(null);
                      phoneRef.current?.focus();
                    }}
                    className="text-[11px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    ویرایش شماره
                  </button>
                </div>

                <div dir="ltr" className="grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      aria-label={`رقم ${index + 1} کد تایید`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="tabular-nums-fa h-11 w-full rounded-xl border border-border-subtle bg-bg-primary text-center text-base font-extrabold text-text-primary focus:border-gold focus:outline-none"
                    />
                  ))}
                </div>

                {otpDigits.join("").length === 6 ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleVerifyOtp()}
                    className="w-full rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
                  >
                    تایید کد و ورود
                  </button>
                ) : null}

                <div className="flex items-center justify-between text-[11px] text-text-secondary">
                  <span>ارسال مجدد کد پس از:</span>
                  <span className="tabular-nums-fa font-bold text-gold">
                    ۰۱:۴۵
                  </span>
                </div>
              </div>

              {passwordMode ? (
                <div className="space-y-2.5 border-t border-border-subtle pt-3">
                  <input
                    type="text"
                    aria-label="نام کاربری یا موبایل"
                    placeholder="نام کاربری یا شماره موبایل"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
                  />
                  <input
                    type="password"
                    aria-label="رمز عبور"
                    placeholder="رمز عبور ثابت"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handlePasswordLogin}
                    className="w-full rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
                  >
                    ورود با رمز ثابت
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setPasswordMode((prev) => !prev)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-bg-primary py-2.5 text-xs font-bold text-text-primary hover:border-gold/40 cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                <span>ورود با رمز ثابت و حساب کاربری</span>
              </button>
            </>
          )}

          {notice ? (
            <p className="rounded-xl border border-buy/35 bg-buy-soft px-3 py-2 text-center text-[11px] text-buy">
              {notice}
            </p>
          ) : null}
          {errorMsg ? (
            <p
              role="alert"
              className="rounded-xl border border-sell/45 bg-sell-soft px-3 py-2 text-center text-[11px] font-bold text-sell"
            >
              {errorMsg}
            </p>
          ) : null}
        </main>

        {/* Trust Badges */}
        <section className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2">
            <Vault
              className="h-3.5 w-3.5 shrink-0 text-gold"
              aria-hidden="true"
            />
            <span className="font-semibold text-text-primary">
              خزانه امن متمرکز
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2">
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-buy"
              aria-hidden="true"
            />
            <span className="font-semibold text-text-primary">
              پوشش کامل بیمه شمش
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2">
            <Award
              className="h-3.5 w-3.5 shrink-0 text-gold"
              aria-hidden="true"
            />
            <div>
              <span className="block font-semibold text-text-primary">
                مجوز رسمی اتحادیه
              </span>
              <span className="text-[9px] text-text-secondary">
                صنف طلا و جواهر کشور
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2">
            <Lock
              className="h-3.5 w-3.5 shrink-0 text-buy"
              aria-hidden="true"
            />
            <span className="font-semibold text-text-primary">
              پروتکل امنیتی ۲۵۶ بیتی
            </span>
          </div>
        </section>

        {/* Footer */}
        <footer className="space-y-1 pt-1 text-center text-[10px] text-text-secondary">
          <p className="font-semibold text-gold">
            • عضو رسمی اتحادیه طلا و جواهر • نسخه ۳.۴
          </p>
          <p className="text-text-muted">
            کلیه معاملات مشمول رهگیری برخط در پنجره امن شمش بانکی می{"\u200c"}
            باشند.
          </p>
        </footer>
      </div>
    </div>
  );
}
