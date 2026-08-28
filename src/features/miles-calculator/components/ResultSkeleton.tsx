import { RECOMMENDATION_COUNT } from '@/domain/services/DestinationRecommender'

/**
 * Estado de calculo.
 *
 * O motor roda no cliente e responde em milissegundos, então esta tela existe por
 * percepcao, nao por espera tecnica: um resultado que aparece instantaneamente
 * depois de dez perguntas parece pre-fabricado. O esqueleto tem a mesma forma do
 * resultado final, o que evita o salto de layout quando ele chega.
 */
export function ResultSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Calculando a sua estimativa de pontos.</span>

      <div className="text-center">
        <div className="mx-auto mb-6 h-3 w-40 rounded-full bg-travion-line" />
        <div className="mx-auto mb-3 h-6 w-[min(100%,32rem)] rounded-full bg-travion-line" />
        <div className="mx-auto mb-10 h-6 w-[min(100%,22rem)] rounded-full bg-travion-line" />
        <div className="mx-auto mb-6 h-20 w-[min(100%,34rem)] rounded-2xl bg-travion-line" />
        <div className="mx-auto h-3 w-28 rounded-full bg-travion-line" />
      </div>

      <div className="mt-16">
        <div className="mx-auto mb-8 h-5 w-56 rounded-full bg-travion-line" />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: RECOMMENDATION_COUNT }, (_, index) => (
            <li
              key={index}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="aspect-[4/3] bg-travion-line" />
              <div className="grid gap-3 p-5">
                <div className="h-5 w-32 rounded-full bg-travion-line" />
                <div className="h-3 w-20 rounded-full bg-travion-line" />
                <div className="h-3 w-full rounded-full bg-travion-line" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
