import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50",
  {
    variants: {
      variant: {
        default:
          "text-white border-[0.5px] border-white/45 bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] shadow-[0_14px_34px_rgba(56,96,190,0.26)] hover:brightness-110",
        destructive:
          "text-white border-[0.5px] border-red-200/60 bg-[linear-gradient(140deg,#dc2626,#b91c1c)] shadow-[0_12px_30px_rgba(220,38,38,0.25)] hover:brightness-110",
        outline:
          "border-[0.5px] border-white/65 bg-white/32 backdrop-blur-2xl shadow-[var(--shadow-glass)] text-[var(--text-primary)] hover:bg-white/46 hover:text-[var(--text-primary)]",
        secondary:
          "border-[0.5px] border-white/60 bg-white/26 backdrop-blur-2xl shadow-[var(--shadow-glass)] text-[var(--text-secondary)] hover:bg-white/40 hover:text-[var(--text-primary)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-white/35 hover:text-[var(--text-primary)]",
        link: "text-[var(--brand-secondary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
