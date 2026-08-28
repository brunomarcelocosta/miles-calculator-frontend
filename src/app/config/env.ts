import { z } from 'zod'

/**
 * Validacao das variaveis de ambiente na subida do app. Falhar aqui, alto e
 * claro, e melhor que descobrir um `undefined` no meio do funil de um anuncio
 * pago rodando.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .optional()
    .transform((value) => value?.trim() || '/api'),

  /** Numero do WhatsApp no formato wa.me, so digitos com pais e DDD. */
  VITE_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{12,13}$/, 'VITE_WHATSAPP_NUMBER deve ter 12 ou 13 digitos (55 + DDD + numero)'),

  VITE_PUBLIC_APP_URL: z.url({ message: 'VITE_PUBLIC_APP_URL deve ser uma URL valida' }),

  /** Vazios por ora: o dataLayer fica pronto e os IDs entram depois. */
  VITE_GTM_ID: z
    .string()
    .optional()
    .transform((value) => value?.trim() || ''),
  VITE_META_PIXEL_ID: z
    .string()
    .optional()
    .transform((value) => value?.trim() || ''),
})

function parseEnv() {
  const result = envSchema.safeParse(import.meta.env)

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`Variaveis de ambiente invalidas:\n${formatted}`)
  }

  return result.data
}

export const env = parseEnv()

export type Env = z.infer<typeof envSchema>
