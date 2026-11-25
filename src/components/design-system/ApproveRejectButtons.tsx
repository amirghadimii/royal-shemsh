"use client";

import { Check, X } from "lucide-react";

interface ApproveRejectButtonsProps {
  onApprove?: () => void;
  onReject?: () => void;
  approveLabel?: string;
  rejectLabel?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function ApproveRejectButtons({
  onApprove,
  onReject,
  approveLabel = "تایید",
  rejectLabel = "رد",
  disabled = false,
  size = "md",
}: ApproveRejectButtonsProps) {
  const paddingClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs sm:text-sm";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={disabled}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-buy font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${paddingClass}`}
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        <span>{approveLabel}</span>
      </button>

      <button
        type="button"
        onClick={onReject}
        disabled={disabled}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sell/40 bg-sell-soft font-semibold text-sell transition-colors hover:bg-sell hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${paddingClass}`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
        <span>{rejectLabel}</span>
      </button>
    </div>
  );
}
