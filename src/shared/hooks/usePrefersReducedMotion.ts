import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function readPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(QUERY).matches
}

/**
 * Acompanha `prefers-reduced-motion`.
 *
 * A preferencia pode mudar durante a sessao, então o hook assina a mudanca em vez
 * de ler uma vez. Quem desliga animacao no sistema costuma ter motivo de saude,
 * e um contador subindo na tela e exatamente o tipo de movimento que incomoda.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(readPreference)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches)

    mediaQuery.addEventListener?.('change', handleChange)

    return () => mediaQuery.removeEventListener?.('change', handleChange)
  }, [])

  return prefersReduced
}
