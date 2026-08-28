/**
 * Fallback do `Suspense` das rotas em chunk separado. Sem texto animado nem
 * spinner giratorio: em conexao lenta o chunk chega rapido e um spinner que
 * pisca por 80ms e mais ruido que informacao.
 */
export function RouteFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Carregando</span>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-travion-line">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-travion-accent" />
      </div>
    </div>
  )
}
