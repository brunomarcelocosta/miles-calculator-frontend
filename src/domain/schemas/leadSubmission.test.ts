import { describe, expect, it } from 'vitest'

import {
  leadContactSchema,
  leadFormSchema,
  normalizeInstagram,
  toLeadContact,
  type LeadFormValues,
} from '@/domain/schemas/leadSubmission'

function validForm(overrides: Partial<LeadFormValues> = {}): LeadFormValues {
  return {
    fullName: 'Ana Souza',
    email: 'ana@travion.com.br',
    phone: '(12) 99764-3952',
    instagram: '',
    honeypot: '',
    ...overrides,
  }
}

/** Primeira mensagem de erro de um campo, ou undefined se ele passou. */
function errorFor(values: unknown, field: string): string | undefined {
  const result = leadFormSchema.safeParse(values)

  if (result.success) return undefined

  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('leadFormSchema', () => {
  it('aceita o preenchimento minimo valido', () => {
    expect(leadFormSchema.safeParse(validForm()).success).toBe(true)
  })

  describe('nome', () => {
    it('exige preenchimento', () => {
      expect(errorFor(validForm({ fullName: '' }), 'fullName')).toBe('Informe o seu nome.')
    })

    it('exige sobrenome', () => {
      expect(errorFor(validForm({ fullName: 'Ana' }), 'fullName')).toBe(
        'Informe nome e sobrenome.',
      )
    })

    it('nao aceita inicial solta como sobrenome', () => {
      expect(errorFor(validForm({ fullName: 'Ana S' }), 'fullName')).toBe(
        'Informe nome e sobrenome.',
      )
    })

    it('aceita nome com acento e com mais de duas partes', () => {
      expect(leadFormSchema.safeParse(validForm({ fullName: 'João da Conceição' })).success).toBe(
        true,
      )
    })

    it('recusa nome absurdamente longo', () => {
      expect(errorFor(validForm({ fullName: 'Ana '.repeat(60) }), 'fullName')).toBe(
        'Nome muito longo.',
      )
    })
  })

  describe('email', () => {
    it('exige preenchimento', () => {
      expect(errorFor(validForm({ email: '' }), 'email')).toBe('Informe o seu email.')
    })

    it.each(['ana', 'ana@', '@travion.com.br', 'ana travion.com.br', 'ana@travion'])(
      'recusa "%s"',
      (email) => {
        expect(errorFor(validForm({ email }), 'email')).toBe('Esse email não parece válido.')
      },
    )

    it('aceita email com ponto e subdominio', () => {
      expect(
        leadFormSchema.safeParse(validForm({ email: 'ana.souza@mail.travion.com.br' })).success,
      ).toBe(true)
    })
  })

  describe('telefone', () => {
    it('exige preenchimento', () => {
      expect(errorFor(validForm({ phone: '' }), 'phone')).toBe('Informe o seu WhatsApp.')
    })

    it('recusa numero incompleto', () => {
      expect(errorFor(validForm({ phone: '(12) 9976' }), 'phone')).toBe(
        'Informe DDD e número, como (12) 99764-3952.',
      )
    })

    it('recusa DDD inexistente', () => {
      expect(errorFor(validForm({ phone: '(20) 99764-3952' }), 'phone')).toBeDefined()
    })

    it('aceita fixo', () => {
      expect(leadFormSchema.safeParse(validForm({ phone: '(11) 3333-4444' })).success).toBe(true)
    })
  })

  describe('instagram', () => {
    it('e opcional', () => {
      expect(leadFormSchema.safeParse(validForm({ instagram: '' })).success).toBe(true)
    })

    it('aceita usuario preenchido', () => {
      expect(leadFormSchema.safeParse(validForm({ instagram: '@travion' })).success).toBe(true)
    })

    it('recusa valor longo demais', () => {
      expect(errorFor(validForm({ instagram: 'a'.repeat(61) }), 'instagram')).toBe(
        'Usuário muito longo.',
      )
    })
  })

  describe('honeypot', () => {
    it('recusa o envio quando vem preenchido', () => {
      expect(errorFor(validForm({ honeypot: 'http://spam.example' }), 'honeypot')).toBe(
        'Envio inválido.',
      )
    })

    it('aceita vazio, que e o caso de quem e humano', () => {
      expect(leadFormSchema.safeParse(validForm({ honeypot: '' })).success).toBe(true)
    })
  })
})

describe('normalizeInstagram', () => {
  it.each([
    ['@travion', 'travion'],
    ['travion', 'travion'],
    ['  @travion  ', 'travion'],
    ['https://instagram.com/travion', 'travion'],
    ['https://www.instagram.com/travion/', 'travion'],
    ['http://instagram.com/travion', 'travion'],
  ])('normaliza "%s" para "%s"', (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected)
  })

  it('devolve null quando nao ha usuario', () => {
    expect(normalizeInstagram('')).toBeNull()
    expect(normalizeInstagram('   ')).toBeNull()
    expect(normalizeInstagram('@')).toBeNull()
  })
})

describe('toLeadContact', () => {
  const consentAt = new Date('2026-08-25T18:00:00.000Z')

  it('converte o formulario na forma canonica', () => {
    const contact = toLeadContact(
      validForm({
        fullName: '  Ana   Souza  ',
        email: '  ANA@Travion.com.BR ',
        phone: '+55 (12) 99764-3952',
        instagram: 'https://instagram.com/travion/',
      }),
      consentAt,
    )

    expect(contact).toEqual({
      fullName: 'Ana Souza',
      email: 'ana@travion.com.br',
      phone: '12997643952',
      instagram: 'travion',
      consentAt: '2026-08-25T18:00:00.000Z',
    })
  })

  it('guarda o instagram como null quando nao informado', () => {
    expect(toLeadContact(validForm(), consentAt).instagram).toBeNull()
  })

  it('registra o consentimento como data, nao como booleano', () => {
    const contact = toLeadContact(validForm(), consentAt)

    expect(contact).not.toHaveProperty('consent')
    expect(contact.consentAt).toBe(consentAt.toISOString())
  })

  it('produz saida que o schema canonico aceita', () => {
    const contact = toLeadContact(validForm(), consentAt)

    expect(leadContactSchema.safeParse(contact).success).toBe(true)
  })
})

describe('leadContactSchema', () => {
  const contact = {
    fullName: 'Ana Souza',
    email: 'ana@travion.com.br',
    phone: '12997643952',
    instagram: null,
    consentAt: '2026-08-25T18:00:00.000Z',
  }

  it('aceita a forma canonica', () => {
    expect(leadContactSchema.safeParse(contact).success).toBe(true)
  })

  it('recusa telefone ainda mascarado', () => {
    expect(leadContactSchema.safeParse({ ...contact, phone: '(12) 99764-3952' }).success).toBe(
      false,
    )
  })

  it('recusa telefone com codigo do pais', () => {
    expect(leadContactSchema.safeParse({ ...contact, phone: '5512997643952' }).success).toBe(
      false,
    )
  })

  it('recusa data de consentimento fora do formato ISO', () => {
    expect(leadContactSchema.safeParse({ ...contact, consentAt: '25/08/2026' }).success).toBe(
      false,
    )
  })

  it('exige a data de consentimento', () => {
    const { consentAt: _omitted, ...withoutConsent } = contact

    expect(leadContactSchema.safeParse(withoutConsent).success).toBe(false)
  })
})
