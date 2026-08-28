import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { QuizAnswers } from '@/domain/model/QuizAnswers'
import { DestinationCard } from '@/features/miles-calculator/components/DestinationCard'
import { ResultCta } from '@/features/miles-calculator/components/ResultCta'
import { ResultHero } from '@/features/miles-calculator/components/ResultHero'
import { ResultSkeleton } from '@/features/miles-calculator/components/ResultSkeleton'
import { useMilesEstimate } from '@/features/miles-calculator/hooks/useMilesEstimate'

/** Pausa deliberada antes de revelar o resultado. Ver `ResultSkeleton`. */
export const CALCULATION_DELAY_MS = 1_400

const STYLE_LABEL = {
  beach: 'praia',
  city: 'cidade',
  snow: 'neve',
} as const

interface ResultStepProps {
  answers: QuizAnswers
  onRestart: () => void
  /** Zero revela na hora, usado em teste. */
  calculationDelayMs?: number
  countUpDurationMs?: number
}

export function ResultStep({
  answers,
  onRestart,
  calculationDelayMs = CALCULATION_DELAY_MS,
  countUpDurationMs,
}: ResultStepProps) {
  const result = useMilesEstimate(answers)
  const [revealed, setRevealed] = useState(calculationDelayMs <= 0)

  useEffect(() => {
    if (calculationDelayMs <= 0) return

    const timer = setTimeout(() => setRevealed(true), calculationDelayMs)

    return () => clearTimeout(timer)
  }, [calculationDelayMs])

  // Passo de resultado sem respostas completas nao deveria acontecer, porque a
  // retomada recua para a primeira pergunta em branco. Se acontecer, o certo e
  // oferecer o caminho de volta em vez de estourar na cara de quem respondeu.
  if (!result) {
    return (
      <div className="mx-auto max-w-[34rem] text-center">
        <h2 className="mb-3 text-[clamp(1.7rem,5.5vw,2.6rem)] leading-[1.1]">
          Faltou alguma resposta
        </h2>
        <p className="mb-8 text-travion-muted">
          Não conseguimos montar a estimativa. Refazer o quiz leva menos de 3 minutos.
        </p>
        <Button onClick={onRestart}>Refazer o quiz</Button>
      </div>
    )
  }

  if (!revealed) {
    return <ResultSkeleton />
  }

  const { estimate, recommendations, profile } = result

  return (
    <div className="grid gap-16">
      <ResultHero estimate={estimate} countUpDurationMs={countUpDurationMs} />

      <section>
        <h2 className="mb-2 text-center text-[clamp(1.5rem,4vw,2.1rem)] leading-tight">
          Para onde esses pontos levam
        </h2>
        <p className="mx-auto mb-8 max-w-[34rem] text-center text-travion-muted">
          Cinco destinos de {STYLE_LABEL[profile.travelStyle]}, do que você já alcança ao que
          vale perseguir. Cada card mostra a milhagem de ida e volta.
        </p>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((recommendation, index) => (
            <DestinationCard
              key={recommendation.destination.id}
              recommendation={recommendation}
              index={index}
            />
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-travion-muted">
          Milhagens são médias de mercado de Latam Pass, Smiles e Azul em período sem promoção.
          Tarifa premiada varia por data e disponibilidade.
        </p>
      </section>

      <ResultCta estimate={estimate} recommendations={recommendations} />

      <div className="text-center">
        <Button variant="ghost" onClick={onRestart}>
          Refazer o quiz
        </Button>
      </div>
    </div>
  )
}
