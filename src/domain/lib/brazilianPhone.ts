/**
 * Telefone brasileiro: normalizacao, mascara e validacao.
 *
 * Vive no dominio porque a mesma regra precisa valer no formulario e no schema
 * que a API tambem valida. Mascara divergindo do validador e como um lead entra
 * no banco com numero que ninguem consegue discar.
 */

/** Codigos de area em operacao no Brasil. */
const AREA_CODES = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
])

export const BRAZIL_COUNTRY_CODE = '55'

/**
 * Reduz a entrada aos digitos nacionais (DDD + numero).
 *
 * O `55` inicial e descartado quando o resultado tem tamanho de numero
 * internacional: gente que copia do WhatsApp cola `+55 12 99764-3952`, e sem
 * isso o DDD passaria a ser "55".
 */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length > 11 && digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    return digits.slice(BRAZIL_COUNTRY_CODE.length, BRAZIL_COUNTRY_CODE.length + 11)
  }

  return digits.slice(0, 11)
}

/**
 * Mascara progressiva, aplicada enquanto a pessoa digita.
 *
 * Formata o que existe e nao exige numero completo: `(12) 9976` e um estado
 * intermediario legitimo.
 */
export function formatBrazilianPhone(value: string): string {
  const digits = phoneDigits(value)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function isValidAreaCode(digits: string): boolean {
  return AREA_CODES.has(Number(digits.slice(0, 2)))
}

/**
 * Aceita celular de 11 digitos e fixo de 10.
 *
 * As duas checagens que pegam erro de digitacao de verdade: DDD que nao existe e
 * celular sem o nono digito.
 */
export function isValidBrazilianPhone(value: string): boolean {
  const digits = phoneDigits(value)

  if (digits.length !== 10 && digits.length !== 11) return false
  if (!isValidAreaCode(digits)) return false

  const subscriber = digits.slice(2)

  // Celular: onze digitos, sempre comecando em 9.
  if (digits.length === 11) return subscriber.startsWith('9')

  // Fixo: a primeira casa fica entre 2 e 5.
  return /^[2-5]/.test(subscriber)
}

export function isMobilePhone(value: string): boolean {
  const digits = phoneDigits(value)

  return digits.length === 11 && digits.startsWith('9', 2)
}

/** Formato aceito pelo `wa.me` e pela coluna do banco: `5512997643952`. */
export function toWhatsAppNumber(value: string): string {
  return `${BRAZIL_COUNTRY_CODE}${phoneDigits(value)}`
}
