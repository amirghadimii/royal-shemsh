import { ShieldAlert } from "lucide-react";

interface NoAccessBannerProps {
  message?: string;
  description?: string;
}

export function NoAccessBanner({
  message = "شما به این سرویس دسترسی ندارید",
  description,
}: NoAccessBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-sell/45 bg-sell-soft p-4 text-sell"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-bold">{message}</p>
        {description ? (
          <p className="mt-1 text-xs text-sell/85">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
