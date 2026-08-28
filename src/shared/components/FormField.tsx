import type { ReactNode } from 'react'
import { useId } from 'react'

import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  /** Mensagem de erro; presente significa campo invalido. */
  error?: string
  hint?: string
  optional?: boolean
  /**
   * Recebe os atributos que precisam chegar ao controle para o rotulo, a dica e o
   * erro serem anunciados corretamente.
   */
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
}

/**
 * Rotulo, controle, dica e erro amarrados pelos ids corretos.
 *
 * Concentrar essa amarracao num lugar e o que garante que nenhum campo do
 * produto saia com erro visivel na tela mas invisivel para leitor de tela.
 */
export function FormField({ label, error, hint, optional, children }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-travion-muted">(opcional)</span>
        ) : null}
      </Label>

      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}

      {hint ? (
        <p id={hintId} className="text-sm text-travion-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
