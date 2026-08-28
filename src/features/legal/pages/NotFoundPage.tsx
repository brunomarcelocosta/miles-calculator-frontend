import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/config/routes'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-[min(100%-2rem,35rem)] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-4">Erro 404</p>
      <h1 className="mb-4 text-[clamp(2rem,7vw,3.5rem)] leading-tight">
        Essa página não existe
      </h1>
      <p className="mb-8 text-travion-muted">
        O link pode ter mudado. A calculadora continua no lugar de sempre.
      </p>
      <Button render={<Link to={ROUTES.ROOT} />}>Ir para a calculadora</Button>
    </main>
  )
}
