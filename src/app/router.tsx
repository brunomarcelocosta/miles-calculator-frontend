import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ROUTES } from '@/app/config/routes'
import { RouteFallback } from '@/shared/components/RouteFallback'
import { CalculatorPage } from '@/features/miles-calculator/pages/CalculatorPage'

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
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
