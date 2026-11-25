"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";

type RoleFilter = "all" | "admin" | "leader" | "trader" | "regular";

interface UserCardData {
  id: string;
  initials: string;
  name: string;
  roleCategory: Exclude<RoleFilter, "all">;
  roleLabel: string;
  username: string;
  code: string;
  phone: string;
  email: string;
  extraLine: string;
  middleButton?: string;
}

const USERS_LIST: UserCardData[] = [
  {
    id: "1",
    initials: "اق",
    name: "امیر قدیمی",
    roleCategory: "admin",
    roleLabel: "مدیر سیستم",
    username: "admin",
    code: "۰۱#",
    phone: "۰۹۱۲۰۰۰۰۰۰۱",
    email: "user1@sample.ir",
    extraLine: "دسترسی فوق‌سریع شمش و تسویه",
    middleButton: "دفتر کل و تراکنش‌ها",
  },
  {
    id: "2",
    initials: "شج",
    name: "شاهین جمشیدی",
    roleCategory: "leader",
    roleLabel: "سرگروه",
    username: "shahin",
    code: "۰۲#",
    phone: "۰۹۱۲۰۰۰۰۰۰۲",
    email: "user2@sample.ir",
    extraLine: "زیرمجموعه: ۱۲ معامله‌گر فعال",
    middleButton: "گروه‌ها",
  },
  {
    id: "3",
    initials: "اص",
    name: "امین صفری",
    roleCategory: "leader",
    roleLabel: "سرگروه",
    username: "amin",
    code: "۰۳#",
    phone: "۰۹۱۲۰۰۰۰۰۰۳",
    email: "user3@sample.ir",
    extraLine: "زیرمجموعه: ۸ معامله‌گر فعال",
    middleButton: "گروه‌ها",
  },
  {
    id: "4",
    initials: "کپ",
    name: "کیارش پورسلیک",
    roleCategory: "trader",
    roleLabel: "معامله‌گر",
    username: "kiarash",
    code: "۰۴#",
    phone: "۰۹۱۲۰۰۰۰۰۰۴",
    email: "user4@sample.ir",
    extraLine: "سقف مجاز: ۵۰ شمش ۱۰۰ گرمی",
  },
  {
    id: "5",
    initials: "مع",
    name: "مهدی علوی",
    roleCategory: "trader",
    roleLabel: "معامله‌گر",
    username: "mahdi",
    code: "۰۵#",
    phone: "۰۹۱۲۰۰۰۰۰۰۵",
    email: "user5@sample.ir",
    extraLine: "سقف مجاز: ۳۰ شمش ۱۰۰ گرمی",
  },
  {
    id: "6",
    initials: "صپ",
    name: "صرافی پارسیان",
    roleCategory: "regular",
    roleLabel: "کاربر عادی",
    username: "parsian",
    code: "۰۶#",
    phone: "۰۹۱۲۰۰۰۰۰۰۶",
    email: "user6@sample.ir",
    extraLine: "احراز هویت طلایی: تأیید شده",
  },
  {
    id: "7",
    initials: "کط",
    name: "کیان طلا",
    roleCategory: "regular",
    roleLabel: "کاربر عادی",
    username: "kian_gold",
    code: "۰۷#",
    phone: "۰۹۱۲۰۰۰۰۰۰۷",
    email: "user7@sample.ir",
    extraLine: "احراز هویت طلایی: تأیید شده",
  },
  {
    id: "8",
    initials: "جک",
    name: "جواهری کوروش",
    roleCategory: "regular",
    roleLabel: "کاربر عادی",
    username: "kourosh",
    code: "۰۸#",
    phone: "۰۹۱۲۰۰۰۰۰۰۸",
    email: "user8@sample.ir",
    extraLine: "احراز هویت طلایی: تأیید شده",
  },
];

const ROLE_CHIPS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "همه کاربران (۸)" },
  { id: "admin", label: "مدیران (۱)" },
  { id: "leader", label: "سرگروه‌ها (۲)" },
  { id: "trader", label: "معامله‌گران (۲)" },
  { id: "regular", label: "کاربران عادی (۳)" },
];

export function Screen27Users() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [codeText, setCodeText] = useState("");

  const filteredUsers = useMemo(() => {
    return USERS_LIST.filter((u) => {
      if (roleFilter !== "all" && u.roleCategory !== roleFilter) return false;
      if (searchText.trim() !== "") {
        const q = searchText.trim().toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.username.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (codeText.trim() !== "" && !u.code.includes(codeText.trim())) {
        return false;
      }
      return true;
    });
  }, [roleFilter, searchText, codeText]);

  const getRoleIcon = (cat: UserCardData["roleCategory"]) => {
    if (cat === "admin") return Crown;
    if (cat === "leader") return Users;
    if (cat === "trader") return Shield;
    return User;
  };

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Header + Add Button */}
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-gold/25 bg-bg-card p-4">
          <div>
            <h1 className="text-sm font-extrabold text-text-primary">
              مدیریت کاربران
            </h1>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              ۸ کاربر فعال در سامانه رویال شمش
            </p>
          </div>
          <Link
            href="/add-user"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gold px-3.5 py-2 text-xs font-extrabold text-bg-primary hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>افزودن</span>
          </Link>
        </section>

        {/* Search & Code Fields */}
        <div className="grid grid-cols-[1.5fr_0.9fr] gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-card px-3 py-2">
            <Search
              className="h-3.5 w-3.5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="جستجو بر اساس نام و نامکاربری..."
              className="w-full bg-transparent text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <input
            type="text"
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            placeholder="کد کاربر"
            className="rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-[11px] text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {ROLE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setRoleFilter(chip.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                roleFilter === chip.id
                  ? "bg-gold font-extrabold text-bg-primary"
                  : "border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Eight User Cards */}
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const RoleIcon = getRoleIcon(u.roleCategory);
            return (
              <article
                key={u.id}
                className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold-soft text-xs font-extrabold text-gold">
                      {u.initials}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xs font-extrabold text-text-primary">
                        {u.name}
                      </h2>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-gold">
                        <RoleIcon className="h-3 w-3" aria-hidden="true" />
                        {u.roleLabel}
                      </span>
                    </div>
                  </div>

                  <span className="tabular-nums-fa shrink-0 rounded-lg border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                    کد:{" "}
                    <span dir="ltr" className="inline-block text-gold">
                      {u.code}
                    </span>
                  </span>
                </div>

                {/* Username, Phone, Email */}
                <div className="space-y-1 rounded-xl bg-bg-primary/65 p-2.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary">نام کاربری:</span>
                    <span dir="ltr" className="font-bold text-text-primary">
                      {u.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Phone className="h-3 w-3 text-gold" aria-hidden="true" />
                      شماره همراه
                    </span>
                    <span className="tabular-nums-fa font-semibold text-text-primary">
                      {u.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Mail className="h-3 w-3 text-gold" aria-hidden="true" />
                      پست الکترونیک
                    </span>
                    <span dir="ltr" className="text-[10px] text-text-secondary">
                      {u.email}
                    </span>
                  </div>
                </div>

                {/* Extra Role Line */}
                <p className="text-[11px] font-medium text-buy">{u.extraLine}</p>

                {/* Action Buttons */}
                <div
                  className={`grid gap-1.5 ${
                    u.middleButton ? "grid-cols-3" : "grid-cols-2"
                  }`}
                >
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-gold/30 bg-gold-soft py-2 text-[10px] font-bold text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
                  >
                    <Pencil className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">ویرایش اطلاعات</span>
                  </button>

                  {u.middleButton ? (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-subtle bg-bg-primary py-2 px-1 text-[10px] font-bold text-text-primary hover:border-gold/40 cursor-pointer"
                    >
                      <Wallet className="h-3 w-3 shrink-0 text-gold" aria-hidden="true" />
                      <span className="truncate">{u.middleButton}</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-subtle bg-bg-primary py-2 text-[10px] font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    <Eye className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">جزئیات پرونده</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
