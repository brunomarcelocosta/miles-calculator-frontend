import { Button } from '@/components/ui/button'
import { trackQuizStart } from '@/shared/lib/analytics'

interface WelcomeStepProps {
  onStart: () => void
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  function handleStart() {
    trackQuizStart()
    onStart()
  }

  return (
    <div className="mx-auto max-w-[38rem] text-center">
      <p className="eyebrow mb-3">Calculadora de milhas</p>

      <h1 className="mb-4 text-[clamp(2.4rem,8vw,4rem)] leading-[1.02] tracking-[-0.03em]">
        Quantas milhas você deveria estar acumulando?
      </h1>

      <p className="mx-auto mb-3 max-w-[32rem] text-travion-muted">
        Em menos de 3 minutos, a partir dos gastos que você já tem hoje, uma estimativa de
        quantas milhas cabem no seu ano e para onde elas levam.
      </p>

      <p className="mb-6 text-sm text-travion-muted">
        São 9 perguntas rápidas, sem nenhuma pegadinha.
      </p>

      <Button size="lg" className="sm:w-auto sm:min-w-64" onClick={handleStart}>
        Começar agora
      </Button>
    </div>
  )
}
