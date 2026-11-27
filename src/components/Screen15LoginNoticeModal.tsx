"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Landmark } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface Screen15LoginNoticeModalProps {
  open: boolean;
  onDismiss: () => void;
}

export function Screen15LoginNoticeModal({
  open,
  onDismiss,
}: Screen15LoginNoticeModalProps) {
  const [title, setTitle] = useState(
    "شروع کار سامانه رویال شمش ۱۰:۳۰ الی ۲۱:۰۰"
  );
  const [body, setBody] = useState(
    "نقد فردا و مسکوکات روز چهارشنبه است، نقد پس‌فردا روز شنبه است، و شماره حساب بانکی باید حداکثر تا ساعت ۱۰:۰۰ ارسال شود."
  );

  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/messages/announcement`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.announcement?.title) setTitle(data.announcement.title);
        if (data?.announcement?.body) setBody(data.announcement.body);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-notice-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 pb-20 pt-16 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-gold/60 bg-bg-card p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-soft px-3 py-1 text-[11px] font-bold text-gold">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums-fa">۰۳ آذر — ۰۹:۱۱</span>
          </span>
        </div>

        <h1
          id="login-notice-title"
          className="text-base font-extrabold leading-snug text-gold"
        >
          {title}
        </h1>

        <p className="text-xs leading-relaxed text-text-secondary">
          {body}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-primary/80 px-3 py-2.5 text-xs">
            <span className="flex items-center gap-2 text-text-secondary">
              <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>تسویه نقد فردا و مسکوکات</span>
            </span>
            <strong className="font-bold text-text-primary">روز چهارشنبه</strong>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-primary/80 px-3 py-2.5 text-xs">
            <span className="flex items-center gap-2 text-text-secondary">
              <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>تسویه نقد پس{"\u200c"}فردا</span>
            </span>
            <strong className="font-bold text-text-primary">روز شنبه</strong>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-gold/30 bg-gold-soft/45 px-3 py-2.5 text-xs">
            <span className="flex items-center gap-2 text-gold-t90">
              <Landmark className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>مهلت ارسال شماره حساب بانکی</span>
            </span>
            <strong className="tabular-nums-fa font-extrabold text-gold">
              حداکثر تا ساعت ۱۰:۰۰
            </strong>
          </div>
        </div>

        {/* Single wide gold dismiss button — no X button */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-2xl bg-gold py-3 text-sm font-extrabold text-bg-primary transition-opacity hover:opacity-90 cursor-pointer"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
