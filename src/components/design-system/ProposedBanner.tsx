import { Sparkles } from "lucide-react";

interface ProposedBannerProps {
  subBadge: string;
}

export function ProposedBanner({ subBadge }: ProposedBannerProps) {
  return (
    <div className="rounded-2xl border border-gold/35 bg-gold-soft/55 px-3.5 py-2.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-extrabold text-bg-primary">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          طرح پیشنهادی
        </span>
        <span className="rounded-full border border-gold/35 bg-bg-card px-2.5 py-0.5 text-[10px] font-bold text-gold">
          {subBadge}
        </span>
      </div>
      <p className="text-[10px] font-medium text-gold-t90">
        نسخه پیشنهادی — فرم/محتوای اصلی مشاهده نشده است
      </p>
    </div>
  );
}
