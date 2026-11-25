import { Inbox } from "lucide-react";

export type EmptyStateMessage =
  | "هیچ داده ای یافت نشد"
  | "کالایی جهت معامله یافت نشد"
  | (string & {});

interface EmptyStateProps {
  title?: EmptyStateMessage;
  description?: string;
}

export function EmptyState({
  title = "هیچ داده ای یافت نشد",
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-card/60 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-primary text-text-muted">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-text-primary">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
