interface QuizProgressProps {
  /** Posicao da pergunta atual, base 1. */
  current: number
  total: number
}

/**
 * Progresso do funil.
 *
 * Conta perguntas, nao telas: dar um fim visivel ao percurso reduz abandono no
 * meio, e "Pergunta 3 de 10" e uma promessa que a pessoa consegue avaliar.
 */
export function QuizProgress({ current, total }: QuizProgressProps) {
  const percent = Math.round((current / total) * 100)

  return (
    <div className="flex items-center gap-4">
      <span className="shrink-0 font-sans text-xs font-medium tracking-[0.18em] text-travion-muted uppercase">
        Pergunta {current} de {total}
      </span>

      <div
        className="h-px flex-1 bg-travion-line"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Pergunta ${current} de ${total}`}
      >
        <div
          className="h-px bg-travion-accent transition-[width] duration-500 ease-travion"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
