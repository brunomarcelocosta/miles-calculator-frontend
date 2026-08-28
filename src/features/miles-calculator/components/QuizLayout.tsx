import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

import { QuizProgress } from '@/features/miles-calculator/components/QuizProgress'
import { TravionLogo } from '@/shared/components/TravionLogo'
import { cn } from '@/lib/utils'

interface QuizLayoutProps {
  children: ReactNode
  /** Chave da tela atual: troca dispara a animacao de entrada. */
  stepKey: string
  questionNumber: number | null
  questionCount: number
  canGoBack: boolean
  onBack: () => void
  /** Telas largas, como o resultado, dispensam a coluna estreita do funil. */
  wide?: boolean
}

/**
 * Moldura do funil: marca, progresso, botao de voltar e a tela atual.
 *
 * O "Anterior" fica sempre visivel quando existe para onde voltar. Com avanco
 * automatico na selecao, um toque errado e inevitavel — sem saida de volta
 * evidente, o erro vira abandono.
 */
export function QuizLayout({
  children,
  stepKey,
  questionNumber,
  questionCount,
  canGoBack,
  onBack,
  wide = false,
}: QuizLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div
          className={cn(
            'mx-auto flex min-h-20 items-center justify-between gap-4',
            wide ? 'w-[min(100%-2rem,75rem)]' : 'w-[min(100%-2rem,40rem)]',
          )}
        >
          <TravionLogo />

          {canGoBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-sans text-sm text-travion-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Anterior
            </button>
          ) : null}
        </div>
      </header>

      {questionNumber !== null ? (
        <div className="border-b border-border/60 py-4">
          <div className="mx-auto w-[min(100%-2rem,40rem)]">
            <QuizProgress current={questionNumber} total={questionCount} />
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          'mx-auto flex w-[min(100%-2rem,40rem)] flex-1 flex-col justify-center py-10',
          wide && 'w-[min(100%-2rem,75rem)]',
        )}
      >
        {/*
          A chave por passo faz o React remontar o bloco, o que reinicia a
          animacao de entrada. Sob `prefers-reduced-motion` o globals.css zera a
          duracao e a troca fica instantanea.
        */}
        <div key={stepKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  )
}
