import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DestinationCard } from '@/features/miles-calculator/components/DestinationCard'
import { ResultCta } from '@/features/miles-calculator/components/ResultCta'
import { ResultHero } from '@/features/miles-calculator/components/ResultHero'
import { ResultSkeleton } from '@/features/miles-calculator/components/ResultSkeleton'
import type { CalculatorResult } from '@/features/miles-calculator/api/leadsApi'

/** Pausa deliberada antes de revelar o resultado. Ver `ResultSkeleton`. */
export const CALCULATION_DELAY_MS = 1_400

const STYLE_LABEL = {
  beach: 'praia',
  city: 'cidade',
  snow: 'neve',
} as const

interface ResultStepProps {
  serverResult: CalculatorResult
  onRestart: () => void
  /** Zero revela na hora, usado em teste. */
  calculationDelayMs?: number
  countUpDurationMs?: number
}

export function ResultStep({
  serverResult,
  onRestart,
  calculationDelayMs = CALCULATION_DELAY_MS,
  countUpDurationMs,
}: ResultStepProps) {
  const result = serverResult
  const [revealed, setRevealed] = useState(calculationDelayMs <= 0)

  useEffect(() => {
    if (calculationDelayMs <= 0) return

    const timer = setTimeout(() => setRevealed(true), calculationDelayMs)

    return () => clearTimeout(timer)
  }, [calculationDelayMs])

  if (!revealed) {
    return <ResultSkeleton destinationCount={result.recommendations.length} />
  }

  const { estimate, recommendations } = result
  const travelStyle = result.travelStyle

  return (
    <div className="grid gap-10">
      <ResultHero estimate={estimate} countUpDurationMs={countUpDurationMs} />

      <section>
        <h2 className="mb-2 text-center text-[clamp(1.5rem,4vw,2.1rem)] leading-tight">
          Para onde essas milhas levam
        </h2>
        <p className="mx-auto mb-8 max-w-[34rem] text-center text-travion-muted">
          Cinco destinos de {STYLE_LABEL[travelStyle]}, do que você já alcança ao que
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
