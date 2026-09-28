import { env } from '@/app/config/env'
import type { DestinationRecommendation } from '@/domain/model/Destination'
import type { PointsEstimate } from '@/domain/model/PointsEstimate'
import { formatPointsRounded } from '@/shared/lib/formatNumber'

export function buildWhatsAppMessage(
  estimate: PointsEstimate,
  recommendations: DestinationRecommendation[],
): string {
  const reachable = recommendations.filter((item) => item.withinMaximum)
  const topDestination = (reachable.at(-1) ?? recommendations[0])?.destination.name
  const range = `entre ${formatPointsRounded(estimate.min.annualPoints)} e ${formatPointsRounded(
    estimate.max.annualPoints,
  )} milhas por ano`
  const destinationPart = topDestination ? ` Fiquei interessado em ${topDestination}.` : ''
  return `Olá Travion, fiz a calculadora de milhas e meu resultado foi ${range}.${destinationPart} Quero falar com um especialista.`
}

export function buildWhatsAppUrl(
  estimate: PointsEstimate,
  recommendations: DestinationRecommendation[],
): string {
  return `https://wa.me/${env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(estimate, recommendations))}`
}
