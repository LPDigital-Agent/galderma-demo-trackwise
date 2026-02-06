import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[0.5px] border-white/65 placeholder:text-[var(--text-muted)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-xl bg-white/26 backdrop-blur-2xl px-3 py-2 text-base text-[var(--text-primary)] shadow-[var(--shadow-glass)] transition-[color,box-shadow,background] outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/34 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
