import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SectionLabel — micro-caps eyebrow label.
 * Replaces: text-[10px] uppercase tracking-[0.3em] text-muted-foreground
 *
 * Props:
 *   as        — element tag (default "p")
 *   className — merged via cn / tailwind-merge
 */
const SectionLabel = React.forwardRef(
  ({ as: Tag = "p", className, children, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("label-caps text-muted-foreground", className)}
      {...props}
    >
      {children}
    </Tag>
  )
)
SectionLabel.displayName = "SectionLabel"

export { SectionLabel }
