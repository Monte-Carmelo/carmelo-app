import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Chips do Monte Carmelo DS — pill, fundo soft + texto forte.
 * Tons semânticos: success / warn / danger / info / neutral / sage / clay.
 */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-brand-soft text-brand-soft-fg",
        secondary: "bg-paper-deep text-slate-700",
        destructive: "bg-danger-soft text-danger",
        outline: "border border-border bg-white text-foreground",
        success: "bg-success-soft text-success",
        warn: "bg-warn-soft text-warn-fg",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        neutral: "bg-paper-deep text-slate-700",
        sage: "bg-sage/35 text-forest",
        clay: "bg-clay/[0.18] text-[#8A4A2C]",
        brand: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Exibe um ponto de status na cor do texto (chip.dot do DS) */
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
