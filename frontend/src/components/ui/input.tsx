import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[var(--text-primary)] placeholder:text-[var(--text-muted)] selection:bg-primary selection:text-primary-foreground border-[0.5px] border-white/65 bg-white/26 backdrop-blur-2xl h-9 w-full min-w-0 rounded-xl px-3 py-1 text-base text-[var(--text-primary)] shadow-[var(--shadow-glass)] transition-[color,box-shadow,background] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/34 md:text-sm",
        "focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
