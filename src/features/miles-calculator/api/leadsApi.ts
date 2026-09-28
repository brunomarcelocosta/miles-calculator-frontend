import axios from 'axios'
import { env } from '@/app/config/env'
import type { Question } from '@/domain/config/questionCatalog'
import type { PointsEstimate } from '@/domain/model/PointsEstimate'
import type { DestinationRecommendation } from '@/domain/model/Destination'
import type { TravelStyle } from '@/domain/model/QuizAnswers'

const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ---------- POST /leads — cria lead após formulário ----------

export interface CreateLeadPayload {
  submissionId?: string
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

export async function getQuiz(): Promise<{ version: number; questions: Question[] }> {
  const { data } = await api.get<{ version: number; questions: Question[] }>('/calculator/quiz')
  return data
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
  answer: string
}

export async function updateLeadStep(
  leadId: string,
  payload: UpdateLeadStepPayload,
): Promise<void> {
  await api.patch(`/leads/${leadId}/step`, payload)
}

export interface CalculatorResult {
  estimate: PointsEstimate
  recommendations: DestinationRecommendation[]
  travelStyle: TravelStyle
}

export async function completeLead(leadId: string): Promise<CalculatorResult> {
  const { data } = await api.post<CalculatorResult>(`/leads/${leadId}/complete`)
  return data
}
