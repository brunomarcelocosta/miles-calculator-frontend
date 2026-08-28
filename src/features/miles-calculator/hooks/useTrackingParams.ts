import { useMemo } from 'react'

/**
 * Extrai parâmetros UTM e fbclid da URL atual.
 *
 * Em landing paga, esses parâmetros chegam na URL pelo link do anúncio.
 * Precisam ser capturados antes que o React Router mude a URL.
 * Como a calculadora é SPA e não navega (o quiz é single-page), os
 * parâmetros ficam na URL o tempo todo.
 */
export interface TrackingParams {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
  fbclid: string | null
  referrer: string | null
}

export function useTrackingParams(): TrackingParams {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)

    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmContent: params.get('utm_content'),
      utmTerm: params.get('utm_term'),
      fbclid: params.get('fbclid'),
      referrer: document.referrer || null,
    }
  }, [])
}
