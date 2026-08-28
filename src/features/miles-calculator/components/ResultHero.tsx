import type { PointsEstimate } from '@/domain/model/PointsEstimate'
import { useCountUp } from '@/shared/hooks/useCountUp'
import { formatPoints } from '@/shared/lib/formatNumber'

interface ResultHeroProps {
  estimate: PointsEstimate
  /** Zero desliga a contagem, usado em teste. */
  countUpDurationMs?: number
}

/**
 * A faixa de pontos, que e o momento de impacto da pagina.
 *
 * Duas escolhas deliberadas. O numero grande vai em Cormorant Garamond, na tinta
 * da marca, com filete no acento marrom — mantem o peso visual do print de
 * referencia sem o amarelo de infoproduto, que brigaria com o posicionamento do
 * site atual.
 *
 * E o detalhamento por regra fica visivel logo abaixo, somando exatamente o total
 * exibido. Numero grande sem origem verificavel e promessa; com a soma ao lado,
 * vira estimativa que a pessoa pode conferir.
 */
export function ResultHero({ estimate, countUpDurationMs }: ResultHeroProps) {
  const min = useCountUp(estimate.min.annualPoints, { durationMs: countUpDurationMs })
  const max = useCountUp(estimate.max.annualPoints, { durationMs: countUpDurationMs })

  return (
    <section className="text-center">
      <p className="eyebrow mb-5">Sua estimativa</p>

      <h2 className="mb-8 text-[clamp(1.6rem,4.5vw,2.4rem)] leading-[1.15]">
        Com os gastos que você já tem hoje, você deveria estar acumulando
      </h2>

      {/*
        O texto acessivel traz o valor final direto, sem depender da animacao:
        leitor de tela nao deve narrar um contador subindo.
      */}
      <p className="sr-only">
        Entre {formatPoints(estimate.min.annualPoints)} e{' '}
        {formatPoints(estimate.max.annualPoints)} pontos por ano.
      </p>

      <div aria-hidden="true" className="mx-auto max-w-[42rem]">
        <p
          data-slot="estimate-range"
          className="font-serif text-[clamp(2.6rem,11vw,5.5rem)] leading-[1.02] font-medium tracking-[-0.04em]"
        >
          {formatPoints(min)}
          <span className="mx-3 align-middle text-travion-accent">a</span>
          {formatPoints(max)}
        </p>

        <div className="mx-auto mt-6 h-px w-24 bg-travion-accent" />

        <p className="mt-5 font-sans text-sm tracking-[0.18em] text-travion-muted uppercase">
          pontos por ano
        </p>
      </div>

      <details className="group mx-auto mt-10 max-w-[34rem] text-left">
        <summary className="cursor-pointer list-none rounded-full px-4 py-3 text-center font-sans text-sm text-travion-muted transition-colors hover:text-foreground">
          <span className="underline underline-offset-4">Como chegamos nesse número</span>
        </summary>

        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-travion">
          <p className="mb-4 text-sm text-travion-muted">
            O piso considera o menor valor de cada faixa que você respondeu, sem bônus de
            transferência. O teto considera o maior valor, já com os 25% de bônus.
          </p>

          <table className="w-full text-sm">
            <caption className="sr-only">Detalhamento dos pontos por ano</caption>
            <thead>
              <tr className="text-travion-muted">
                <th scope="col" className="pb-2 text-left font-medium">
                  Origem
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Mínimo
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Máximo
                </th>
              </tr>
            </thead>
            <tbody>
              {estimate.min.contributions.map((contribution, index) => (
                <tr key={contribution.ruleId} className="border-t border-border">
                  <th scope="row" className="py-2 text-left font-normal">
                    {contribution.label}
                  </th>
                  <td className="py-2 text-right tabular-nums">
                    {formatPoints(contribution.annualPoints)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatPoints(estimate.max.contributions[index]?.annualPoints ?? 0)}
                  </td>
                </tr>
              ))}

              <tr className="border-t border-border">
                <th scope="row" className="py-2 text-left font-normal">
                  Bônus de transferência
                </th>
                <td className="py-2 text-right text-travion-muted tabular-nums">—</td>
                <td className="py-2 text-right tabular-nums">
                  {formatPoints(estimate.max.transferBonusPoints)}
                </td>
              </tr>

              <tr className="border-t-2 border-travion-accent/40 font-medium">
                <th scope="row" className="py-2 text-left">
                  Total
                </th>
                <td className="py-2 text-right tabular-nums">
                  {formatPoints(estimate.min.annualPoints)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatPoints(estimate.max.annualPoints)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
