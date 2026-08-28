import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ROUTES } from '@/app/config/routes'
import { RouteFallback } from '@/shared/components/RouteFallback'
import { CalculatorPage } from '@/features/miles-calculator/pages/CalculatorPage'

/**
 * O portal admin entra por `lazy` de proposito: ele nao pode aparecer no bundle
 * inicial da landing, que e a pagina que recebe trafego pago. A calculadora, ao
 * contrario, e importada de forma estatica — ela e o caminho critico.
 */
const AdminLoginPage = lazy(() =>
  import('@/features/admin/pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
)
const AdminLeadsPage = lazy(() =>
  import('@/features/admin/pages/AdminLeadsPage').then((m) => ({ default: m.AdminLeadsPage })),
)
const PrivacyPage = lazy(() =>
  import('@/features/legal/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const NotFoundPage = lazy(() =>
  import('@/features/legal/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={ROUTES.ROOT} element={<CalculatorPage />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        <Route path={ROUTES.ADMIN_LEADS} element={<AdminLeadsPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
