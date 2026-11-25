import { Crown, ShieldCheck } from "lucide-react";

export function CustomLevel3Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gold/25 bg-bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-buy">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>احراز هویت شده</span>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold text-text-secondary">
            حساب معاملاتی سطح ۳
          </p>
        </div>

        <div className="flex items-center gap-2 text-left min-w-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-gold">
              رویال شمش
            </p>
            <p
              dir="ltr"
              className="truncate text-[9px] font-bold tracking-wider text-text-secondary"
            >
              ROYAL SHEMSH
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-gold-soft text-gold">
            <Crown className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </header>
  );
}
