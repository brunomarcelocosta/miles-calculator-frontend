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
      <p className="eyebrow mb-5">Calculadora de milhas</p>

      <h1 className="mb-5 text-[clamp(2.4rem,8vw,4rem)] leading-[1.02] tracking-[-0.03em]">
        Quantos pontos você deveria estar acumulando?
      </h1>

      <p className="mx-auto mb-4 max-w-[32rem] text-travion-muted">
        Em menos de 3 minutos, a partir dos gastos que você já tem hoje, uma estimativa de
        quantos pontos cabem no seu ano e para onde eles levam.
      </p>

      <p className="mb-9 text-sm text-travion-muted">
        São 10 perguntas rápidas, sem nenhuma pegadinha.
      </p>

      <Button size="lg" className="sm:w-auto sm:min-w-64" onClick={handleStart}>
        Começar agora
      </Button>
    </div>
  )
}
