"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { formatFaNumber } from "@/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface UserOptionItem {
  id: string;
  codeLabel: string;
  name: string;
  label: string;
}

interface AttachmentItem {
  id: string;
  docType: string;
  docTypeLabel: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  status: string;
  uploadedAt: string;
  uploadedBy?: { fullName: string } | null;
}

const USER_OPTIONS: UserOptionItem[] = [
  { id: "۱", codeLabel: "۱", name: "امیر قدیمی", label: "۱ امیر قدیمی" },
  { id: "۲", codeLabel: "۲", name: "شاهین جمشیدی", label: "۲ شاهین جمشیدی" },
  { id: "۳", codeLabel: "۳", name: "امین صفری", label: "۳ امین صفری" },
  { id: "۴", codeLabel: "۴", name: "کیارش پورسلیک", label: "۴ کیارش پورسلیک" },
  { id: "۵", codeLabel: "۵", name: "مهدی علوی", label: "۵ مهدی علوی" },
  { id: "۶", codeLabel: "۶", name: "صرافی پارسیان", label: "۶ صرافی پارسیان" },
  { id: "۷", codeLabel: "۷", name: "کیان طلا", label: "۷ کیان طلا" },
  { id: "۸", codeLabel: "۸", name: "جواهری کوروش", label: "۸ جواهری کوروش" },
];

const DOC_TABS = ["همه مدارک", "کارت ملی", "جواز کسب", "قرارداد کارگزاری"];

const DOC_TITLES = [
  "تصویر روی کارت ملی هوشمند",
  "پروانه کسب یا گواهی اتحادیه طلا و جواهر",
  "قرارداد تعهدنامه تحویل فیزیکی شمش",
  "تاییدیه حساب بانکی و شبا شتابی",
];

const TITLE_TO_DOCTYPE: Record<string, string> = {
  "تصویر روی کارت ملی هوشمند": "NATIONAL_ID",
  "پروانه کسب یا گواهی اتحادیه طلا و جواهر": "BUSINESS_LICENSE",
  "قرارداد تعهدنامه تحویل فیزیکی شمش": "BROKERAGE_CONTRACT",
  "تاییدیه حساب بانکی و شبا شتابی": "BANK_CONFIRMATION",
};

export function Screen34Attachments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userOptions, setUserOptions] = useState<UserOptionItem[]>(USER_OPTIONS);
  const [selectedUserId, setSelectedUserId] = useState("۱");
  const [activeDocTab, setActiveDocTab] = useState("همه مدارک");
  const [docTitle, setDocTitle] = useState(DOC_TITLES[0]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdminSession, setIsAdminSession] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAttachments = useCallback(async (userId: string) => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || !userId || userId.length < 5) {
      setAttachments([]);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/attachments?userId=${encodeURIComponent(userId)}`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        setAttachments([]);
        return;
      }
      const data = await res.json();
      setAttachments(Array.isArray(data?.attachments) ? data.attachments : []);
    } catch {
      setAttachments([]);
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;

    fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(async (meData) => {
        const me = meData?.user;
        if (!me) return;
        const admin =
          me.role?.code === "ADMIN" || me.role?.code === "SYSTEM_MANAGER";
        setIsAdminSession(admin);

        if (admin) {
          const usersRes = await fetch(`${API_BASE}/admin/users`, {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (usersRes.ok) {
            const usersJson = await usersRes.json();
            if (Array.isArray(usersJson?.users) && usersJson.users.length > 0) {
              const mapped: UserOptionItem[] = usersJson.users.map(
                (u: { id: string; code: number; fullName: string }) => {
                  const codeLabel = formatFaNumber(u.code);
                  return {
                    id: u.id,
                    codeLabel,
                    name: u.fullName,
                    label: `${codeLabel} ${u.fullName}`,
                  };
                }
              );
              setUserOptions(mapped);
              setSelectedUserId(mapped[0].id);
              return;
            }
          }
        }

        const ownCode = formatFaNumber(me.code);
        const ownItem: UserOptionItem = {
          id: me.id,
          codeLabel: ownCode,
          name: me.fullName,
          label: `${ownCode} ${me.fullName}`,
        };
        setUserOptions([ownItem]);
        setSelectedUserId(ownItem.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadAttachments(selectedUserId);
  }, [selectedUserId, loadAttachments]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.codeLabel.includes(q)
    );
  }, [userOptions, searchQuery]);

  const selectedUser =
    userOptions.find((u) => u.id === selectedUserId) ??
    filteredUsers[0] ??
    userOptions[0];

  const filteredAttachments = useMemo(() => {
    if (activeDocTab === "همه مدارک") return attachments;
    return attachments.filter((a) => a.docTypeLabel === activeDocTab);
  }, [attachments, activeDocTab]);

  const handleUploadSubmit = async () => {
    setUploadNotice(null);
    setUploadError(null);
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;

    if (!token) {
      setUploadNotice(
        `سند «${docTitle}» برای ${selectedUser.name} ثبت نمایشی شد.`
      );
      return;
    }

    if (!selectedFile) {
      setUploadError("لطفاً ابتدا فایل مدرک را انتخاب کنید.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("userId", selectedUserId);
      formData.append("docType", TITLE_TO_DOCTYPE[docTitle] ?? "NATIONAL_ID");
      formData.append("title", docTitle);
      formData.append("file", selectedFile);

      const res = await fetch(`${API_BASE}/attachments`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data?.message ?? "خطا در بارگذاری مدرک");
        return;
      }
      setUploadNotice(
        `سند «${docTitle}» (${selectedFile.name}) برای ${selectedUser.name} ثبت شد.`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAttachments(selectedUserId);
    } catch {
      setUploadError("خطا در ارتباط با سرور");
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentStatus = async (
    attachmentId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;
    setUploadError(null);
    setUploadNotice(null);
    try {
      const res = await fetch(`${API_BASE}/attachments/${attachmentId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setUploadError(err?.message ?? "خطا در تغییر وضعیت مدرک");
        return;
      }
      setUploadNotice(
        status === "APPROVED" ? "مدرک تایید شد." : "مدرک رد شد."
      );
      await loadAttachments(selectedUserId);
    } catch {
      setUploadError("خطا در ارتباط با سرور");
    }
  };

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
                {formatFaNumber(userOptions.length)} حساب کاربری
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
                {filteredUsers.map((u) => (
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
                مدارک کاربر: {selectedUser.name} - کد {selectedUser.codeLabel}
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

          {/* Attachments List or Empty State */}
          {filteredAttachments.length > 0 ? (
            <section className="space-y-2">
              {filteredAttachments.map((att) => (
                <article
                  key={att.id}
                  className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-text-primary">
                      {att.title}
                    </span>
                    <span className="rounded-md border border-gold/35 bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">
                      {att.docTypeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span dir="ltr" className="truncate font-mono text-[10px]">
                      {att.fileName}
                    </span>
                    <span className="tabular-nums-fa shrink-0">
                      {formatFaNumber(Math.max(1, Math.round(att.sizeBytes / 1024)))} KB
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span>
                      بارگذاری توسط: {att.uploadedBy?.fullName ?? "مدیر سیستم"}
                    </span>
                    <span className="tabular-nums-fa">
                      {new Date(att.uploadedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  {isAdminSession ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleAttachmentStatus(att.id, "APPROVED")}
                        className="flex-1 rounded-lg border border-buy/35 bg-buy-soft py-1.5 text-[10px] font-bold text-buy hover:bg-buy hover:text-white cursor-pointer"
                      >
                        تایید مدرک
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAttachmentStatus(att.id, "REJECTED")}
                        className="flex-1 rounded-lg border border-sell/35 bg-sell-soft py-1.5 text-[10px] font-bold text-sell hover:bg-sell hover:text-white cursor-pointer"
                      >
                        رد مدرک
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </section>
          ) : (
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
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>بارگذاری مدرک جدید توسط مدیر</span>
              </button>
            </section>
          )}

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

            {isAdminSession ? (
              <>
                <label className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold/40 bg-bg-primary/70 px-4 py-6 text-center cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] ?? null);
                      setUploadError(null);
                      setUploadNotice(null);
                    }}
                  />
                  <UploadCloud
                    className="h-6 w-6 text-gold"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-xs font-bold text-text-primary">
                    {selectedFile
                      ? selectedFile.name
                      : "فایل را اینجا رها کنید یا کلیک نمایید"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-text-secondary">
                    حداکثر ۱۰ مگابایت (JPG, PNG, PDF)
                  </p>
                </label>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void handleUploadSubmit()}
                  className="w-full rounded-xl bg-buy py-3 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? "در حال بارگذاری..." : "ثبت و پیوست به پرونده"}
                </button>
              </>
            ) : null}

            {uploadError ? (
              <p
                role="alert"
                className="rounded-xl border border-sell/45 bg-sell-soft px-3 py-2 text-center text-[11px] font-bold text-sell"
              >
                {uploadError}
              </p>
            ) : null}

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
