import { describe, expect, it } from 'vitest'

import { normalizePhone } from './internationalPhone'
import { leadContactSchema, leadFormSchema, toLeadContact } from '@/domain/schemas/leadSubmission'

const form = {
  fullName: 'Ana Souza', email: 'ana@example.com', instagram: '', honeypot: '',
}

describe('telefones internacionais', () => {
  it.each([
    ['(12) 99764-3952', '+5512997643952'],
    ['+55 (12) 99764-3952', '+5512997643952'],
    ['+1 (416) 555-0123', '+14165550123'],
    ['+44 7911 123456', '+447911123456'],
    ['00 351 912 345 678', '+351912345678'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['+81 90 1234 5678', '+819012345678'],
    ['+61 412 345 678', '+61412345678'],
    ['+27 82 123 4567', '+27821234567'],
    ['+91 98765 43210', '+919876543210'],
    ['+677 7471234', '+6777471234'],
    ['+49 30 12345678901', '+493012345678901'],
  ])('normaliza %s sem perder dígitos', (phone, expected) => {
    expect(normalizePhone(phone)).toBe(expected)
    expect(leadFormSchema.safeParse({ ...form, phone }).success).toBe(true)
    const contact = toLeadContact({ ...form, phone })
    expect(contact.phone).toBe(expected)
    expect(leadContactSchema.safeParse(contact).success).toBe(true)
  })

  it.each([
    '', 'abc', '+999 123456789', '+1 416 555', '+1 416 555 0123 99999',
    '+55 12 99764-3952 9999', '(20) 99764-3952',
    '+1 416 555 0123 ext. 12', 'Ligue para +1 416 555 0123', '++14165550123',
  ])('recusa %s sem truncar para um número válido', (phone) => {
    expect(normalizePhone(phone)).toBeNull()
    expect(leadFormSchema.safeParse({ ...form, phone }).success).toBe(false)
  })
})
