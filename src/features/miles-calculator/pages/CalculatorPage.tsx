import { lazy, Suspense, useState } from 'react'
import { DiagnosticPage } from '@/features/diagnostic/DiagnosticPage'
const LegacyCalculatorPage = lazy(() =>
  import('./LegacyCalculatorPage').then((m) => ({
    default: m.LegacyCalculatorPage,
  })),
)
export function CalculatorPage() {
  const [legacy] = useState(() => {
    try {
      const state = JSON.parse(
        localStorage.getItem('travion:miles-calculator:v1') ?? 'null',
      )
      const session = JSON.parse(
        localStorage.getItem('travion:miles-calculator:lead:v1') ?? 'null',
      )
      const ttl = 7 * 24 * 60 * 60 * 1000
      return (
        !!state &&
        state.stepIndex > 0 &&
        Date.now() - state.savedAt < ttl &&
        !!session?.id &&
        Date.now() - session.savedAt < ttl
      )
    } catch {
      return false
    }
  })
  return legacy ? (
    <Suspense fallback={<p>Retomando sua calculadora…</p>}>
      <LegacyCalculatorPage />
    </Suspense>
  ) : (
    <DiagnosticPage />
  )
}
