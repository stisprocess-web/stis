const colorMap: Record<string, string> = {
  // Case status
  ACTIVE: "bg-success/15 text-success",
  INTAKE: "bg-accent/15 text-accent",
  PENDING: "bg-warning/15 text-warning",
  CLOSED: "bg-text-muted/15 text-text-muted",
  // Priority
  URGENT: "bg-error/15 text-error",
  HIGH: "bg-warning/15 text-warning",
  MEDIUM: "bg-accent/15 text-accent",
  LOW: "bg-text-muted/15 text-text-muted",
  // Invoice status
  PAID: "bg-success/15 text-success",
  SENT: "bg-accent/15 text-accent",
  DRAFT: "bg-text-muted/15 text-text-muted",
  OVERDUE: "bg-error/15 text-error",
  // Expense status
  SUBMITTED: "bg-warning/15 text-warning",
  APPROVED: "bg-success/15 text-success",
  REIMBURSED: "bg-accent/15 text-accent",
  // Contract status
  signed: "bg-success/15 text-success",
  sent: "bg-accent/15 text-accent",
  draft: "bg-text-muted/15 text-text-muted",
  // Boolean
  Done: "bg-success/15 text-success",
  Open: "bg-warning/15 text-warning",
  // Contract type
  C1099: "bg-accent/15 text-accent",
  W2: "bg-success/15 text-success",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colors = colorMap[status] || "bg-text-muted/15 text-text-muted";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors} ${className}`}>
      {status}
    </span>
  );
}
