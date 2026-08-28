import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { initGTM } from '@/shared/lib/gtm'
import '@/styles/globals.css'

// Injeta o script do GTM se o ID estiver configurado
initGTM()

const container = document.getElementById('root')

if (!container) {
  throw new Error('Elemento #root nao encontrado no index.html.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
