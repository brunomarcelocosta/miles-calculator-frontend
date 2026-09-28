import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'

interface UseCountUpOptions {
  durationMs?: number
  /** Falso mantem o valor em zero: util enquanto o resultado ainda nao apareceu. */
  enabled?: boolean
}

/** Desacelera no fim, o que faz o numero final parecer "assentar". */
function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

/**
 * Conta de zero ate o alvo.
 *
 * Quem tem `prefers-reduced-motion` recebe o valor final de imediato, sem
 * animacao nenhuma — e por isso a leitura da preferencia acontece aqui e nao no
 * CSS: nao existe como reduzir a animacao de um numero pela folha de estilo.
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { durationMs = 1_100, enabled = true } = options
  const prefersReducedMotion = usePrefersReducedMotion()

  const shouldAnimate = enabled && !prefersReducedMotion && durationMs > 0 && target > 0

  const [value, setValue] = useState(() => (shouldAnimate ? 0 : target))
  useEffect(() => {
    if (!shouldAnimate) return

    const startedAt = performance.now()
    let frame: number

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1)

      setValue(Math.round(target * easeOutCubic(progress)))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [durationMs, shouldAnimate, target])

  return !enabled ? 0 : shouldAnimate ? value : target
}
