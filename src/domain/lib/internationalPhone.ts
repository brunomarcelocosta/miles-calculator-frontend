import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

/** Numbers without a country code keep the Brazilian default used by the site. */
export function normalizePhone(value: string): string | null {
  const input = value.trim()
  if (!/^[+\d\s().-]+$/.test(input)) return null

  const phone = parsePhoneNumberFromString(input.replace(/^00/, '+'), {
    defaultCountry: 'BR',
    extract: false,
  })

  if (!phone?.isValid() || phone.ext || !/^\+[1-9]\d{1,14}$/.test(phone.number)) {
    return null
  }

  return phone.number
}

export function isValidPhone(value: string): boolean {
  return normalizePhone(value) !== null
}
