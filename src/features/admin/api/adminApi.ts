import axios from 'axios'
import { env } from '@/app/config/env'

/**
 * Instância axios dedicada ao portal admin.
 * Cookies httpOnly são enviados automaticamente com `withCredentials`.
 */
export const adminApi = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ---------- Auth ----------

export interface AdminUser {
  id: string
  email: string
  name: string
}

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload): Promise<AdminUser> {
  const { data } = await adminApi.post<{ user: AdminUser }>('/auth/login', payload)
  return data.user
}

export async function fetchMe(): Promise<AdminUser> {
  const { data } = await adminApi.get<{ user: AdminUser }>('/auth/me')
  return data.user
}

export async function logout(): Promise<void> {
  await adminApi.post('/auth/logout')
}

// ---------- Leads ----------

export interface Lead {
  id: string
  fullName: string
  email: string
  phone: string
  instagram: string | null
  step: string
  cardPf: string | null
  cardPj: string | null
  uber: string | null
  ifood: string | null
  retailAnnual: string | null
  travelAnnual: string | null
  travelStyle: string | null
  knowledgeLevel: string | null
  freeTripsPerYear: string | null
  managerInterest: string | null
  estimateMin: number | null
  estimateMax: number | null
  validated: boolean
  validatedAt: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  createdAt: string
}

export interface LeadsMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface LeadsResponse {
  data: Lead[]
  meta: LeadsMeta
}

export interface LeadsParams {
  page?: number
  pageSize?: number
  search?: string
  from?: string
  to?: string
}

export async function fetchLeads(params: LeadsParams = {}): Promise<LeadsResponse> {
  const { data } = await adminApi.get<LeadsResponse>('/admin/leads', { params })
  return data
}

// ---------- Validação ----------

export async function toggleLeadValidation(
  leadId: string,
  validated: boolean,
): Promise<void> {
  await adminApi.patch(`/admin/leads/${leadId}/validate`, { validated })
}

export async function bulkValidateLeads(
  ids: string[],
  validated: boolean,
): Promise<void> {
  await adminApi.patch('/admin/leads/bulk-validate', { ids, validated })
}
