import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Botao no formato pill da Travion (`radius: 999px`), com o preto tinta como
 * primario — o mesmo desenho do site que hoje converte no WhatsApp.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border bg-clip-padding font-sans text-sm font-medium tracking-[0.02em] whitespace-nowrap transition-all duration-300 ease-travion outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:-translate-y-px hover:shadow-[0_6px_20px_rgb(20_18_15/18%)]',
        secondary:
          'border-primary bg-transparent text-primary hover:border-travion-accent hover:bg-travion-accent-soft',
        outline:
          'border-border bg-card text-foreground hover:border-travion-accent hover:bg-travion-surface',
        accent:
          'border-travion-accent bg-travion-accent text-travion-white hover:-translate-y-px hover:shadow-[0_6px_20px_rgb(92_77_61/28%)]',
        ghost: 'border-transparent bg-transparent hover:bg-travion-surface',
        destructive:
          'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/25',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        /** 52px, a altura do `.btn` do site. */
        default: 'h-13 px-6.5',
        /** 56px, alvo de toque minimo das opcoes do quiz em mobile. */
        lg: 'h-touch w-full px-7 text-base',
        sm: 'h-11 px-5 text-[0.85rem]',
        icon: 'size-13',
        'icon-sm': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
