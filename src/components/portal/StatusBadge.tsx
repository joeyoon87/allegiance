const STYLES: Record<string, string> = {
  DRAFT: "bg-slate/10 text-slate",
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  CHANGES_REQUESTED: "bg-gold/20 text-gold-dark",
  CONFIRMED: "bg-green-50 text-green-700",
  DECLINED: "bg-red-50 text-red-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELED: "bg-slate/10 text-slate",
  UNABLE_TO_COMPLETE: "bg-red-50 text-red-700",
};

const LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CHANGES_REQUESTED: "Changes Requested",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
  UNABLE_TO_COMPLETE: "Unable to Complete",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] ?? "bg-slate/10 text-slate"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
