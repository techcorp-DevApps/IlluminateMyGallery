import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SectionShell — responsive container matching the app's standard shell.
 * Replaces: max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16
 *
 * Props:
 *   as       — element tag (default "div")
 *   className — merged via cn / tailwind-merge
 */
const SectionShell = React.forwardRef(
  ({ as: Tag = "div", className, children, ...props }, ref) => (
    <Tag ref={ref} className={cn("container-shell", className)} {...props}>
      {children}
    </Tag>
  )
)
SectionShell.displayName = "SectionShell"

export { SectionShell }
