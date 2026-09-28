import axios from 'axios'
import { env } from '@/app/config/env'
import type { Answer, Contact, DiagnosticResult } from './model'
const api = axios.create({ baseURL: env.VITE_API_BASE_URL, timeout: 15000 })
export async function createDiagnostic(
  id: string,
  contact: Contact,
  tracking: Record<string, unknown>,
) {
  const { data } = await api.post<{ id: string }>('/leads', {
    ...tracking,
    submissionId: id,
    quizVersion: 2,
    preferredChannel: contact.channel,
    fullName: contact.fullName,
    email: contact.channel === 'email' ? contact.email : null,
    phone: contact.channel === 'whatsapp' ? contact.phone : null,
    consentAt: new Date().toISOString(),
    honeypot: '',
  })
  return data
}
export async function saveAnswer(id: string, step: string, answer: Answer) {
  await api.patch(`/leads/${id}/step`, { quizVersion: 2, step, answer })
}
export async function finishDiagnostic(id: string) {
  const { data } = await api.post<DiagnosticResult>(`/leads/${id}/complete`)
  return data
}
