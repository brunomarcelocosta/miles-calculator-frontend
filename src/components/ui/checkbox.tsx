import type { ComponentProps } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Caixa de marcacao.
 *
 * Usa `<input type="checkbox">` de verdade, escondido visualmente mas presente na
 * arvore de acessibilidade: espaco, leitor de tela e envio de formulario
 * funcionam sem nenhuma reimplementacao. O quadrado visivel e um irmao com
 * `peer-*`, o que mantem estados de foco e marcacao ligados ao input real.
 */
export function Checkbox({ className, ...props }: ComponentProps<'input'>) {
  return (
    <span className="relative inline-flex shrink-0 items-center">
      <input
        type="checkbox"
        data-slot="checkbox"
        className={cn('peer size-5 cursor-pointer appearance-none rounded-md border border-input bg-card transition-colors', 'checked:border-travion-accent checked:bg-travion-accent', 'focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none', 'disabled:cursor-not-allowed disabled:opacity-50', 'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20', className)}
        {...props}
      />

      <Check
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-travion-white opacity-0 peer-checked:opacity-100"
      />
    </span>
  )
}
