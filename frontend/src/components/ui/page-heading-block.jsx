import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeadingBlock — eyebrow + title + optional subtitle.
 * Matches the editorial heading pattern used across Landing, Portfolio, etc.
 *
 * Props:
 *   eyebrow    — small caps label above the title
 *   title      — main heading (rendered as h2 by default)
 *   subtitle   — optional body text below the title
 *   headingAs  — heading element tag (default "h2")
 *   align      — "left" | "center" (default "left")
 *   className  — applied to the outer wrapper
 */
const PageHeadingBlock = React.forwardRef(
  (
    {
      eyebrow,
      title,
      subtitle,
      headingAs: Heading = "h2",
      align = "left",
      className,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow && (
        <p className="label-caps text-muted-foreground">{eyebrow}</p>
      )}
      {title && (
        <Heading className="font-display text-3xl md:text-4xl font-light leading-tight">
          {title}
        </Heading>
      )}
      {subtitle && (
        <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
          {subtitle}
        </p>
      )}
    </div>
  )
)
PageHeadingBlock.displayName = "PageHeadingBlock"

export { PageHeadingBlock }
