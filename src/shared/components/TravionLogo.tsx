import { cn } from '@/lib/utils'

interface TravionLogoProps {
  className?: string
  /** Some para leitores de tela quando o nome da marca ja aparece ao lado. */
  decorative?: boolean
}

/**
 * Assinatura da marca: o simbolo mais o wordmark espacado, do mesmo jeito que o
 * header do site da Travion.
 */
export function TravionLogo({ className, decorative = false }: TravionLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3.5', className)}>
      <img
        src="/logo-travion.svg"
        alt={decorative ? '' : 'Travion'}
        aria-hidden={decorative || undefined}
        width={44}
        height={44}
        className="size-11 shrink-0 object-contain"
      />
      <span className="font-sans text-[1.05rem] leading-none font-medium tracking-[0.28em] uppercase">
        Travion
      </span>
    </span>
  )
}
