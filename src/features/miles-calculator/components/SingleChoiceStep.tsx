import { useRef, useState } from 'react'
import { Check } from 'lucide-react'

import type { Question } from '@/domain/config/questionCatalog'
import { cn } from '@/lib/utils'

interface SingleChoiceStepProps {
  question: Question
  selectedOptionId: string | undefined
  onSelect: (optionId: string) => void
}

/**
 * Uma pergunta de escolha unica.
 *
 * Semantica de `radiogroup` construida com botoes, e nao com `<input
 * type="radio">`, por um motivo concreto: em radio nativo a seta do teclado
 * **seleciona** ao mover, e como a selecao aqui avanca de tela, quem navega por
 * teclado seria arrastado para a proxima pergunta antes de terminar de ler as
 * opcoes. Com botoes, a seta move so o foco (roving tabindex) e a selecao exige
 * Enter, Espaco ou toque.
 */
export function SingleChoiceStep({
  question,
  selectedOptionId,
  onSelect,
}: SingleChoiceStepProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = question.options.findIndex((option) => option.id === selectedOptionId)

  // O foco comeca na opcao ja escolhida, para quem voltou nao ter de percorrer a
  // lista de novo.
  //
  // Basta o inicializador, sem efeito de sincronizacao: a `QuizLayout` monta a
  // tela com `key` por passo, então trocar de pergunta remonta este componente e
  // o estado nasce ja correto.
  const [focusedIndex, setFocusedIndex] = useState(() =>
    selectedIndex >= 0 ? selectedIndex : 0,
  )

  function moveFocus(nextIndex: number) {
    const total = question.options.length
    const wrapped = (nextIndex + total) % total

    setFocusedIndex(wrapped)
    optionRefs.current[wrapped]?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        moveFocus(index + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        moveFocus(index - 1)
        break
      case 'Home':
        event.preventDefault()
        moveFocus(0)
        break
      case 'End':
        event.preventDefault()
        moveFocus(question.options.length - 1)
        break
      default:
        break
    }
  }

  const titleId = `question-${question.id}-title`
  const helperId = question.helper ? `question-${question.id}-helper` : undefined

  return (
    <div>
      <h2
        id={titleId}
        className="mb-3 text-[clamp(1.7rem,5.5vw,2.6rem)] leading-[1.1] tracking-[-0.02em]"
      >
        {question.title}
      </h2>

      {question.helper ? (
        <p id={helperId} className="mb-8 text-travion-muted">
          {question.helper}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      <div
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={helperId}
        className="grid gap-3"
      >
        {question.options.map((option, index) => {
          const isSelected = option.id === selectedOptionId

          return (
            <button
              key={option.id}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              // Roving tabindex: o grupo inteiro e um unico ponto de parada do
              // Tab, como manda o padrao de radiogroup.
              tabIndex={index === focusedIndex ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => onSelect(option.id)}
              className={cn(
                'flex min-h-touch w-full items-center justify-between gap-4 rounded-2xl border px-5 text-left',
                'font-sans text-base transition-all duration-300 ease-travion',
                'hover:border-travion-accent hover:bg-travion-accent-soft',
                'focus-visible:ring-3 focus-visible:ring-ring/40',
                isSelected
                  ? 'border-travion-accent bg-travion-accent-soft font-medium'
                  : 'border-border bg-card',
              )}
            >
              <span>{option.label}</span>

              <span
                aria-hidden="true"
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-travion-accent bg-travion-accent text-travion-white'
                    : 'border-travion-line',
                )}
              >
                {isSelected ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
