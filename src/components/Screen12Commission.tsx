"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/design-system";
import { Screen19CommissionNoAccess } from "@/components/Screen19CommissionNoAccess";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";
import { useEndpointAccess } from "@/lib/useEndpointAccess";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface CommissionMember {
  name: string;
  volume: string;
  commission: string;
}

interface CommissionGroup {
  id: string;
  leader: string;
  code: string;
  level: string;
  countLabel: string;
  members: CommissionMember[];
  groupTotal: string;
}

const COMMISSION_GROUPS: CommissionGroup[] = [
  {
    id: "g1",
    leader: "امین صفری",
    code: "کد: ۱۰۲۴",
    level: "سطح معرف: طلایی سازمانی",
    countLabel: "۳ زیرمجموعه",
    members: [
      {
        name: "مهدی علوی",
        volume: "حجم: ۵۰ گرم شمش ۹۹۹.۹",
        commission: "+۳,۲۵۰,۰۰۰",
      },
      {
        name: "بازرگانی سپهر",
        volume: "حجم: ۱۲۰ گرم شمش ونوس",
        commission: "+۷,۸۰۰,۰۰۰",
      },
      {
        name: "طلای مرکزی",
        volume: "حجم: ۲۵ سکه بهار آزادی",
        commission: "+۲,۴۵۰,۰۰۰",
      },
    ],
    groupTotal: "۱۳,۵۰۰,۰۰۰ تومان",
  },
  {
    id: "g2",
    leader: "شاهین جمشیدی",
    code: "کد: ۲۰۵۸",
    level: "سطح معرف: شریک تجاری ویژه",
    countLabel: "۴ زیرمجموعه",
    members: [
      {
        name: "صرافی پارسیان",
        volume: "حجم: ۲۰۰ گرم شمش نادیر",
        commission: "+۱۳,۰۰۰,۰۰۰",
      },
      {
        name: "کیان طلا",
        volume: "حجم: ۹۰ گرم شمش رویال",
        commission: "+۵,۸۵۰,۰۰۰",
      },
      {
        name: "جواهری کوروش",
        volume: "حجم: ۵۰ سکه بهار آزادی",
        commission: "+۴,۹۰۰,۰۰۰",
      },
      {
        name: "امیر قدیمی",
        volume: "حجم: ۱۷۵ گرم شمش امارات",
        commission: "+۱۱,۳۷۵,۰۰۰",
      },
    ],
    groupTotal: "۳۵,۱۲۵,۰۰۰ تومان",
  },
];

export function Screen12Commission() {
  const searchParams = useSearchParams();
  const { accessDenied } = useEndpointAccess("/commission/report");
  const isDenied = searchParams.get("access") === "denied" || accessDenied;
  const [fromDate, setFromDate] = useState("۱۴۰۵/۰۹/۰۴");
  const [toDate, setToDate] = useState("۱۴۰۵/۰۹/۰۴");
  const [selectedLeader, setSelectedLeader] = useState("all");
  const [liveGroups, setLiveGroups] = useState<CommissionGroup[] | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || isDenied) return;

    fetch(`${API_BASE}/admin/reports/commission`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!Array.isArray(data?.groups) || data.groups.length === 0) return;
        setLiveGroups(
          data.groups.map(
            (g: {
              groupId: string;
              groupNumber: number;
              leaderName: string;
              ratePerGramToman: string;
              groupTotalToman: string;
              members: {
                name: string;
                tradedWeight: string;
                commissionToman: string;
              }[];
            }) => ({
              id: g.groupId,
              leader: g.leaderName,
              code: `گروه: ${formatFaNumber(g.groupNumber)}`,
              level: `نرخ پورسانت: ${formatFaNumber(Number(g.ratePerGramToman))} ت/گ`,
              countLabel: `${formatFaNumber(g.members.length)} زیرمجموعه`,
              members: g.members.map((m) => ({
                name: m.name,
                volume: `حجم: ${formatFaNumber(Number(m.tradedWeight))} گرم/واحد`,
                commission: `+${formatFaNumber(Number(m.commissionToman))}`,
              })),
              groupTotal: `${formatFaNumber(Number(g.groupTotalToman))} تومان`,
            })
          )
        );
      })
      .catch(() => {});
  }, [isDenied]);

  if (isDenied) {
    return (
      <AppShell
        activeTab="more"
        userName={SAMPLE_USER.fullName}
        isOnline={SAMPLE_USER.isOnline}
        hideHeader
      >
        <Screen19CommissionNoAccess />
      </AppShell>
    );
  }

  const visibleGroups = (liveGroups ?? COMMISSION_GROUPS).filter(
    (g) => selectedLeader === "all" || g.id === selectedLeader
  );

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Title Card */}
        <section className="rounded-2xl border border-gold/25 bg-bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-extrabold text-text-primary">
              گزارش پورسانت و کارمزد
            </h1>
            <span className="shrink-0 rounded-full border border-gold/35 bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold text-gold">
              محاسبه تجمیعی
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            تسویه شبکه بازاریابی و معرفین رویال شمش
          </p>
        </section>

        {/* Date Pickers */}
        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-3 space-y-1.5">
            <label
              htmlFor="comm-from"
              className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary"
            >
              <Calendar className="h-3 w-3 text-gold" aria-hidden="true" />
              <span>از تاریخ</span>
            </label>
            <input
              id="comm-from"
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="tabular-nums-fa w-full rounded-lg border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
            <span className="tabular-nums-fa block text-[10px] text-text-muted">
              ۰۰:۰۰
            </span>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-card p-3 space-y-1.5">
            <label
              htmlFor="comm-to"
              className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary"
            >
              <Calendar className="h-3 w-3 text-gold" aria-hidden="true" />
              <span>تا تاریخ</span>
            </label>
            <input
              id="comm-to"
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="tabular-nums-fa w-full rounded-lg border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs font-bold text-text-primary focus:border-gold focus:outline-none"
            />
            <span className="tabular-nums-fa block text-[10px] text-text-muted">
              ۲۳:۵۹
            </span>
          </div>
        </section>

        {/* Leader Selector + Gold Button */}
        <section className="space-y-2.5">
          <div className="space-y-1">
            <label
              htmlFor="leader-select"
              className="block px-1 text-xs font-semibold text-text-secondary"
            >
              انتخاب سرگروه یا کاربر مقصد
            </label>
            <select
              id="leader-select"
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-xs font-medium text-text-primary focus:border-gold focus:outline-none"
            >
              <option value="all">همه سرگروه{"\u200c"}ها و کاربران فعال</option>
              <option value="g1">امین صفری (کد: ۱۰۲۴)</option>
              <option value="g2">شاهین جمشیدی (کد: ۲۰۵۸)</option>
            </select>
          </div>

          <button
            type="button"
            className="w-full rounded-2xl bg-gold py-3 text-xs font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            دریافت پورسانت
          </button>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-buy/30 bg-buy-soft p-2.5 text-center">
            <span className="block text-[9px] text-buy">مجموع پورسانت</span>
            <span className="tabular-nums-fa mt-1 block text-[11px] font-extrabold text-buy">
              <span dir="ltr" className="inline-block">
                +۴۸,۶۲۵,۰۰۰
              </span>{" "}
              تومان
            </span>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
            <span className="block text-[9px] text-text-secondary">
              سرگروه{"\u200c"}های فعال
            </span>
            <span className="mt-1 block text-[11px] font-extrabold text-text-primary">
              ۲ سرگروه معتمد
            </span>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-card p-2.5 text-center">
            <span className="block text-[9px] text-text-secondary">
              تعداد تراکنش{"\u200c"}ها
            </span>
            <span className="tabular-nums-fa mt-1 block text-[11px] font-extrabold text-gold">
              ۲۸ معامله ثبت{"\u200c"}شده
            </span>
          </div>
        </section>

        {/* Commission Groups */}
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <section
              key={group.id}
              className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold-soft text-gold">
                    <Users className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs font-extrabold text-text-primary">
                        {group.leader}
                      </h2>
                      <span className="tabular-nums-fa text-[10px] text-text-muted">
                        {group.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-gold">{group.level}</p>
                  </div>
                </div>
                <span className="rounded-full border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                  {group.countLabel}
                </span>
              </div>

              <div className="divide-y divide-border-subtle">
                {group.members.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between gap-2 py-2 text-[11px]"
                  >
                    <div>
                      <p className="font-bold text-text-primary">
                        {member.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-text-secondary">
                        {member.volume}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="tabular-nums-fa block font-extrabold text-buy">
                        <span dir="ltr" className="inline-block">
                          {member.commission}
                        </span>{" "}
                        تومان
                      </span>
                      <span className="text-[9px] text-text-muted">پورسانت</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-bg-primary/75 px-3 py-2 text-xs">
                <span className="font-semibold text-text-secondary">
                  جمع پورسانت {group.leader}
                </span>
                <span className="tabular-nums-fa font-extrabold text-gold">
                  {group.groupTotal}
                </span>
              </div>
            </section>
          ))}
        </div>

        {/* Gold Total Card */}
        <section className="rounded-2xl border border-gold/40 bg-gold-soft p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-gold">
              جمع کل پورسانت{"\u200c"}های دوره
            </span>
            <span className="text-[10px] font-semibold text-gold-t90">
              تسویه تجمیعی قابل برداشت
            </span>
          </div>
          <p className="tabular-nums-fa text-xl font-extrabold text-gold">
            ۴۸,۶۲۵,۰۰۰ تومان
          </p>
        </section>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-buy py-2.5 text-xs font-extrabold text-white hover:opacity-90 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>خروجی اکسل (XLSX)</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-bg-card py-2.5 text-xs font-bold text-text-primary hover:border-gold/40 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-gold" aria-hidden="true" />
            <span>فایل چاپی PDF</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-1.5 pb-1 text-center text-[10px] text-text-secondary">
          <ShieldCheck className="h-3.5 w-3.5 text-buy" aria-hidden="true" />
          <CheckCircle2 className="sr-only" aria-hidden="true" />
          <span>
            تأیید شده توسط واحد خزانه{"\u200c"}داری و تسویه رویال شمش
          </span>
        </footer>
      </div>
    </AppShell>
  );
}
