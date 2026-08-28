import { describe, expect, it } from 'vitest'

import {
  formatBrazilianPhone,
  isMobilePhone,
  isValidAreaCode,
  isValidBrazilianPhone,
  phoneDigits,
  toWhatsAppNumber,
} from '@/domain/lib/brazilianPhone'

describe('phoneDigits', () => {
  it('remove tudo que nao e digito', () => {
    expect(phoneDigits('(12) 99764-3952')).toBe('12997643952')
  })

  it('descarta o codigo do pais colado do WhatsApp', () => {
    expect(phoneDigits('+55 12 99764-3952')).toBe('12997643952')
    expect(phoneDigits('5512997643952')).toBe('12997643952')
  })

  it('nao confunde DDD 55 com codigo do pais em numero de tamanho nacional', () => {
    // Onze digitos comecando em 55 e Rio Grande do Sul, nao Brasil + DDD.
    expect(phoneDigits('55997643952')).toBe('55997643952')
  })

  it('corta o excesso em onze digitos', () => {
    expect(phoneDigits('129976439529999')).toBe('12997643952')
  })

  it('devolve vazio para entrada sem digito', () => {
    expect(phoneDigits('abc')).toBe('')
    expect(phoneDigits('')).toBe('')
  })
})

describe('formatBrazilianPhone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['12', '(12'],
    ['129', '(12) 9'],
    ['129976', '(12) 9976'],
    ['1299764', '(12) 9976-4'],
    ['1233334444', '(12) 3333-4444'],
    ['12997643952', '(12) 99764-3952'],
  ])('formata "%s" como "%s"', (input, expected) => {
    expect(formatBrazilianPhone(input)).toBe(expected)
  })

  it('e idempotente sobre o proprio resultado', () => {
    const once = formatBrazilianPhone('12997643952')

    expect(formatBrazilianPhone(once)).toBe(once)
  })

  it('reformata entrada ja mascarada de forma diferente', () => {
    expect(formatBrazilianPhone('+55 (12) 99764 3952')).toBe('(12) 99764-3952')
  })
})

describe('isValidAreaCode', () => {
  it('aceita codigos em operacao', () => {
    for (const ddd of ['11', '12', '21', '48', '61', '85', '98']) {
      expect(isValidAreaCode(`${ddd}999999999`), ddd).toBe(true)
    }
  })

  it('rejeita codigos que nao existem', () => {
    for (const ddd of ['10', '20', '23', '25', '26', '29', '39', '52', '76', '90']) {
      expect(isValidAreaCode(`${ddd}999999999`), ddd).toBe(false)
    }
  })
})

describe('isValidBrazilianPhone', () => {
  it('aceita celular de onze digitos comecando em 9', () => {
    expect(isValidBrazilianPhone('(12) 99764-3952')).toBe(true)
    expect(isValidBrazilianPhone('11987654321')).toBe(true)
  })

  it('aceita fixo de dez digitos', () => {
    expect(isValidBrazilianPhone('(11) 3333-4444')).toBe(true)
    expect(isValidBrazilianPhone('1123456789')).toBe(true)
  })

  it('rejeita celular de onze digitos sem o nono digito', () => {
    // Onze digitos, mas o numero comeca em 8: nao existe.
    expect(isValidBrazilianPhone('11887654321')).toBe(false)
  })

  it('rejeita fixo que comeca em 1, 6, 7, 8 ou 9', () => {
    expect(isValidBrazilianPhone('1112345678')).toBe(false)
    expect(isValidBrazilianPhone('1162345678')).toBe(false)
    expect(isValidBrazilianPhone('1192345678')).toBe(false)
  })

  it('rejeita DDD inexistente', () => {
    expect(isValidBrazilianPhone('(20) 99764-3952')).toBe(false)
  })

  it('rejeita numero curto ou longo demais', () => {
    expect(isValidBrazilianPhone('129976439')).toBe(false)
    expect(isValidBrazilianPhone('12')).toBe(false)
    expect(isValidBrazilianPhone('')).toBe(false)
  })

  it('aceita numero com codigo do pais na frente', () => {
    expect(isValidBrazilianPhone('+55 (12) 99764-3952')).toBe(true)
  })
})

describe('isMobilePhone', () => {
  it('distingue celular de fixo', () => {
    expect(isMobilePhone('(12) 99764-3952')).toBe(true)
    expect(isMobilePhone('(11) 3333-4444')).toBe(false)
  })
})

describe('toWhatsAppNumber', () => {
  it('monta o formato aceito pelo wa.me', () => {
    expect(toWhatsAppNumber('(12) 99764-3952')).toBe('5512997643952')
  })

  it('nao duplica o codigo do pais', () => {
    expect(toWhatsAppNumber('+55 12 99764-3952')).toBe('5512997643952')
  })
})
