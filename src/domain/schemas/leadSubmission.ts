import { z } from 'zod'

import { isValidPhone, normalizePhone } from '@/domain/lib/internationalPhone'

/**
 * Contrato do lead, compartilhado entre o formulario e a API.
 *
 * Sao dois schemas de proposito:
 *
 *  - `leadFormSchema` valida **o que a pessoa digitou**, com o telefone ainda
 *    mascarado e mensagens escritas para aparecer embaixo do campo;
 *  - `leadContactSchema` valida a **forma canonica**, com telefone internacional
 *    e Instagram normalizado, e e esse que o DTO da API espelha.
 *
 * Separar os dois evita transformacao dentro do schema do formulario, que faria o
 * tipo de entrada divergir do de saida e complicaria o react-hook-form sem
 * ganho nenhum.
 */

export const LEAD_LIMITS = {
  fullName: 160,
  email: 180,
  phone: 40,
  instagram: 60,
} as const

/** Aceita o formato do proprio Zod, sem duplicar expressao regular de email. */
function looksLikeEmail(value: string): boolean {
  return z.email().safeParse(value).success
}

/** Duas palavras: nome sem sobrenome inviabiliza a abordagem comercial. */
function hasGivenAndFamilyName(value: string): boolean {
  return value.trim().split(/\s+/).filter((part) => part.length >= 2).length >= 2
}

export const leadFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Informe o seu nome.' })
    .max(LEAD_LIMITS.fullName, { message: 'Nome muito longo.' })
    .refine(hasGivenAndFamilyName, { message: 'Informe nome e sobrenome.' }),

  email: z
    .string()
    .trim()
    .min(1, { message: 'Informe o seu email.' })
    .max(LEAD_LIMITS.email, { message: 'Email muito longo.' })
    .refine(looksLikeEmail, { message: 'Esse email não parece válido.' }),

  phone: z
    .string()
    .trim()
    .min(1, { message: 'Informe o seu WhatsApp.' })
    .max(LEAD_LIMITS.phone, { message: 'Telefone muito longo.' })
    .refine(isValidPhone, {
      message: 'Informe um telefone válido. Fora do Brasil, inclua + e o código do país.',
    }),

  // Opcional de verdade: string vazia e resposta valida.
  instagram: z
    .string()
    .trim()
    .max(LEAD_LIMITS.instagram, { message: 'Usuário muito longo.' }),

  /**
   * Honeypot. Fica escondido do usuario e visivel para robo de preenchimento
   * automatico; qualquer conteudo aqui denuncia envio automatizado.
   */
  honeypot: z.string().max(0, { message: 'Envio inválido.' }),
})

export type LeadFormValues = z.input<typeof leadFormSchema>

/** Deixa `@usuario`, `usuario` e a URL do perfil no mesmo formato. */
export function normalizeInstagram(value: string): string | null {
  const handle = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '')
    .trim()

  return handle.length > 0 ? handle : null
}

export const leadContactSchema = z.object({
  fullName: z.string().trim().min(1).max(LEAD_LIMITS.fullName),
  email: z.string().trim().max(LEAD_LIMITS.email).refine(looksLikeEmail),
  /** E.164: sinal +, codigo do pais e numero completo. */
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: 'Telefone deve estar no formato internacional.' })
    .refine(isValidPhone),
  instagram: z.string().trim().max(LEAD_LIMITS.instagram).nullable(),
  /** Momento em que o consentimento foi dado, em ISO 8601. */
  consentAt: z.iso.datetime(),
})

export type LeadContact = z.infer<typeof leadContactSchema>

/**
 * Converte o formulario na forma canonica.
 *
 * O consentimento deixa de ser booleano e passa a ser data: para efeito de LGPD,
 * o que importa registrar e **quando** ele foi dado.
 */
export function toLeadContact(
  values: LeadFormValues,
  consentAt: Date = new Date(),
): LeadContact {
  const phone = normalizePhone(values.phone)
  if (!phone) throw new Error('Telefone inválido.')

  return {
    fullName: values.fullName.trim().replace(/\s+/g, ' '),
    email: values.email.trim().toLowerCase(),
    phone,
    instagram: normalizeInstagram(values.instagram),
    consentAt: consentAt.toISOString(),
  }
}
