import axios from 'axios'
import { env } from '@/app/config/env'

const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ---------- POST /leads — cria lead após formulário ----------

export interface CreateLeadPayload {
  fullName: string
  email: string
  phone: string
  instagram: string | null
  consentAt: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  fbclid?: string | null
  referrer?: string | null
  honeypot?: string
}

export interface CreateLeadResponse {
  id: string
}

export async function createLead(payload: CreateLeadPayload): Promise<CreateLeadResponse> {
  const { data } = await api.post<CreateLeadResponse>('/leads', payload)
  return data
}

// ---------- PATCH /leads/:id/step — atualiza step + resposta ----------

export interface UpdateLeadStepPayload {
  step: string
  answer?: string | null
  estimateMin?: number | null
  estimateMax?: number | null
  destinations?: string[] | null
}

export async function updateLeadStep(
  leadId: string,
  payload: UpdateLeadStepPayload,
): Promise<void> {
  await api.patch(`/leads/${leadId}/step`, payload)
}
