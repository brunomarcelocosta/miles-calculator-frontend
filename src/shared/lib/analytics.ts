import { env } from '@/app/config/env'

/**
 * Camada de abstração do dataLayer (GTM) e pixel do Meta.
 *
 * Centraliza todos os pushes num lugar só. Quando o GTM/Pixel estiver
 * configurado, basta preencher VITE_GTM_ID e VITE_META_PIXEL_ID no .env
 * que os eventos passam a disparar sem tocar em código.
 *
 * Se os IDs estiverem vazios, as funções são no-op.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    fbq?: (...args: unknown[]) => void
  }
}

// ---------- dataLayer (GTM) ----------

function pushToDataLayer(event: string, params?: Record<string, unknown>): void {
  if (!env.VITE_GTM_ID) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

// ---------- Meta Pixel ----------

function trackPixelEvent(event: string, params?: Record<string, unknown>): void {
  if (!env.VITE_META_PIXEL_ID) return
  window.fbq?.('track', event, params)
}

// ---------- Eventos da aplicação ----------

export function trackQuizStart(): void {
  pushToDataLayer('quiz_start')
  trackPixelEvent('InitiateCheckout')
}

export function trackLeadCaptured(): void {
  pushToDataLayer('lead_captured')
}

export function trackQuizComplete(params: {
  estimateMin: number
  estimateMax: number
  travelStyle: string
}): void {
  pushToDataLayer('quiz_complete', params)
  trackPixelEvent('CompleteRegistration', params)
}

export function trackLeadSubmitted(params: {
  estimateMin: number
  estimateMax: number
}): void {
  pushToDataLayer('lead_submitted', params)
  trackPixelEvent('Lead', params)
}

export function trackWhatsAppClick(): void {
  pushToDataLayer('whatsapp_click')
  trackPixelEvent('Contact')
}

export function trackAdminLogin(): void {
  pushToDataLayer('admin_login')
}
