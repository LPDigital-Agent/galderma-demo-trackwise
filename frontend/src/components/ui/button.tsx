import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-[220ms] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/45',
  {
    variants: {
      variant: {
        default:
          'text-white border-[0.5px] border-white/55 bg-[linear-gradient(135deg,#4f9fff_0%,#2b6fe5_100%)] shadow-[0_14px_30px_rgba(37,86,174,0.34)] hover:brightness-105 hover:-translate-y-[1px]',
        destructive:
          'text-white border-[0.5px] border-red-200/60 bg-[linear-gradient(135deg,#f87171_0%,#d93030_100%)] shadow-[0_12px_24px_rgba(188,34,34,0.3)] hover:brightness-105 hover:-translate-y-[1px]',
        outline:
          'glass-control text-[var(--lg-text-primary)] hover:bg-white/28',
        secondary:
          'border-[0.5px] border-white/25 bg-white/18 text-[var(--lg-text-secondary)] backdrop-blur-2xl shadow-[var(--shadow-control)] hover:bg-white/28 hover:text-[var(--lg-text-primary)]',
        ghost: 'text-[var(--lg-text-secondary)] hover:bg-white/18 hover:text-[var(--lg-text-primary)]',
        link: 'text-[var(--brand-accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-6 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*=size-])]:size-3',
        sm: 'h-8 gap-1.5 rounded-xl px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-2xl px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-2xl',
        'icon-xs': 'size-6 rounded-lg [&_svg:not([class*=size-])]:size-3',
        'icon-sm': 'size-8 rounded-xl',
        'icon-lg': 'size-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
