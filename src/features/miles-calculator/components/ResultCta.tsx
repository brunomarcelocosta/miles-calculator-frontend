import { MessageCircle } from 'lucide-react'

import { env } from '@/app/config/env'
import { Button } from '@/components/ui/button'
import type { DestinationRecommendation } from '@/domain/model/Destination'
import type { PointsEstimate } from '@/domain/model/PointsEstimate'
import { formatPointsRounded } from '@/shared/lib/formatNumber'
import { trackWhatsAppClick } from '@/shared/lib/analytics'

interface ResultCtaProps {
  estimate: PointsEstimate
  recommendations: DestinationRecommendation[]
  onClick?: () => void
}

/**
 * Monta a mensagem que ja vai preenchida no WhatsApp.
 *
 * Levar a faixa e o destino de topo na primeira mensagem poupa a pessoa de
 * repetir o resultado e entrega contexto de venda antes de alguem responder.
 */
export function buildWhatsAppMessage(
  estimate: PointsEstimate,
  recommendations: DestinationRecommendation[],
): string {
  const reachable = recommendations.filter((item) => item.withinMaximum)
  const topDestination = reachable.at(-1)?.destination.name

  const range = `entre ${formatPointsRounded(estimate.min.annualPoints)} e ${formatPointsRounded(
    estimate.max.annualPoints,
  )} milhas por ano`

  const destinationPart = topDestination
    ? ` Fiquei interessado em ${topDestination}.`
    : ''

  return (
    `Olá Travion, fiz a calculadora de milhas e meu resultado foi ${range}.` +
    `${destinationPart} Quero falar com um especialista.`
  )
}

export function buildWhatsAppUrl(
  estimate: PointsEstimate,
  recommendations: DestinationRecommendation[],
): string {
  const message = buildWhatsAppMessage(estimate, recommendations)

  return `https://wa.me/${env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

/**
 * Bloco de conversao.
 *
 * Um CTA principal, sem redirecionamento automatico. O contador que joga a pessoa
 * para outra pagina sozinho existe na referencia, mas queima quem quer reler o
 * resultado e e hostil para leitor de tela — quem quiser sair, clica.
 */
export function ResultCta({ estimate, recommendations, onClick }: ResultCtaProps) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#1a1816] to-[#0d0c0b] px-7 py-10 text-center text-travion-white shadow-[0_12px_40px_rgb(20_18_15/15%)]">
      <p className="eyebrow mb-4 text-travion-white/70">Próximo passo</p>

      <h2 className="mx-auto mb-4 max-w-[30rem] text-[clamp(1.7rem,5vw,2.6rem)] leading-[1.1] text-travion-white">
        Essas milhas não se acumulam sozinhas
      </h2>

      <p className="mx-auto mb-8 max-w-[34rem] text-travion-white/75">
        A diferença entre o piso e o teto da sua faixa está em quais cartões você usa, em que
        ordem transfere e quando aproveita bonificação. É isso que a gestão da Travion cuida
        para você.
      </p>

      <Button
        variant="default"
        size="lg"
        className="border-travion-white bg-travion-white text-foreground hover:bg-travion-white sm:w-auto sm:min-w-72"
        onClick={() => { trackWhatsAppClick(); onClick?.() }}
        render={
          <a
            href={buildWhatsAppUrl(estimate, recommendations)}
            target="_blank"
            rel="noreferrer noopener"
          />
        }
      >
        <MessageCircle aria-hidden="true" />
        Falar com um especialista
      </Button>

      <p className="mt-5 text-sm text-travion-white/60">
        Sem compromisso. A conversa começa no WhatsApp.
      </p>
    </section>
  )
}
