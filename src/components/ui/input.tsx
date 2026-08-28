import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Campo de texto na medida do site da Travion: 52px de altura, raio de 18px e
 * foco marcado pela tinta da marca.
 */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex min-h-13 w-full rounded-lg border border-input bg-card px-4 py-3.5',
        'font-sans text-base text-foreground placeholder:text-travion-muted/70',
        'transition-[border-color,box-shadow] duration-200 outline-none',
        'focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}
