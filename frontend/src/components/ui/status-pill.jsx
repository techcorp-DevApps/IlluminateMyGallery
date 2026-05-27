import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * StatusPill — small editorial status chip.
 * Covers booking and invoice statuses used across admin + client pages.
 *
 * status values:
 *   bookings  — pending | approved | rejected | completed
 *   invoices  — paid | unpaid
 *   generic   — active | inactive | draft | sent
 */
const STATUS_STYLES = {
  pending:   "border-border text-muted-foreground",
  approved:  "border-foreground bg-foreground text-background",
  confirmed: "border-foreground bg-foreground text-background",
  completed: "border-muted-foreground text-muted-foreground",
  rejected:  "border-destructive text-destructive",
  cancelled: "border-destructive text-destructive",
  paid:      "border-foreground bg-foreground text-background",
  unpaid:    "border-border text-muted-foreground",
  overdue:   "border-destructive text-destructive",
  sent:      "border-muted-foreground text-muted-foreground",
  draft:     "border-border text-muted-foreground",
  active:    "border-foreground bg-foreground text-background",
  inactive:  "border-border text-muted-foreground",
}

const StatusPill = React.forwardRef(
  ({ status, className, children, ...props }, ref) => {
    const statusKey = (status || "").toLowerCase()
    const styles = STATUS_STYLES[statusKey] ?? "border-border text-muted-foreground"
    return (
      <span
        ref={ref}
        className={cn(
          "label-caps border px-2 py-1 inline-flex items-center",
          styles,
          className
        )}
        {...props}
      >
        {children ?? status}
      </span>
    )
  }
)
StatusPill.displayName = "StatusPill"

export { StatusPill }
