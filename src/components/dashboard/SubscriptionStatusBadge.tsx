import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/lib/dashboard/queries";

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  past_due: {
    label: "Past due",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  canceled: {
    label: "Canceled",
    className: "bg-muted text-muted-foreground border-border",
  },
  incomplete: {
    label: "Incomplete",
    className:
      "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
