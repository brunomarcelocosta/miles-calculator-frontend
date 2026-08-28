import { describe, expect, it } from 'vitest'

import { DESTINATIONS } from '@/domain/catalog/destinations'
import { DESTINATION_REGIONS } from '@/domain/model/Destination'
import { TRAVEL_STYLES } from '@/domain/model/QuizAnswers'
import { RECOMMENDATION_COUNT } from '@/domain/services/DestinationRecommender'

describe('catalogo de destinos', () => {
  it('tem volume suficiente para montar escadas variadas', () => {
    expect(DESTINATIONS.length).toBeGreaterThanOrEqual(24)
  })

  it('nao repete id', () => {
    const ids = DESTINATIONS.map((destination) => destination.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('preenche todos os campos exibidos no card', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.id.trim(), destination.id).not.toBe('')
      expect(destination.name.trim(), destination.id).not.toBe('')
      expect(destination.country.trim(), destination.id).not.toBe('')
      expect(destination.blurb.trim(), destination.id).not.toBe('')
      expect(destination.image, destination.id).toMatch(/^\/destinations\/.+\.png$/)
    }
  })

  it('usa apenas regioes conhecidas', () => {
    for (const destination of DESTINATIONS) {
      expect(DESTINATION_REGIONS, destination.id).toContain(destination.region)
    }
  })

  it('marca ao menos um estilo, e apenas estilos conhecidos', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.styles.length, destination.id).toBeGreaterThanOrEqual(1)

      for (const style of destination.styles) {
        expect(TRAVEL_STYLES, destination.id).toContain(style)
      }
    }
  })

  it('nao repete estilo no mesmo destino', () => {
    for (const destination of DESTINATIONS) {
      expect(new Set(destination.styles).size, destination.id).toBe(destination.styles.length)
    }
  })

  it('cobre cada estilo com destinos suficientes para uma escada de cinco', () => {
    for (const style of TRAVEL_STYLES) {
      const matching = DESTINATIONS.filter((destination) => destination.styles.includes(style))

      expect(matching.length, style).toBeGreaterThanOrEqual(RECOMMENDATION_COUNT)
    }
  })

  it('cobra mais em executiva que em economica', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.miles.business, destination.id).toBeGreaterThan(
        destination.miles.economy,
      )
    }
  })

  it('usa milhagem positiva e plausivel', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.miles.economy, destination.id).toBeGreaterThan(0)
      // Acima disso deixaria de ser referencia de mercado para virar outlier.
      expect(destination.miles.business, destination.id).toBeLessThanOrEqual(400_000)
    }
  })

  it('espalha o preco por estilo, do acessivel ao aspiracional', () => {
    for (const style of TRAVEL_STYLES) {
      const economy = DESTINATIONS.filter((destination) =>
        destination.styles.includes(style),
      ).map((destination) => destination.miles.economy)

      const cheapest = Math.min(...economy)
      const priciest = Math.max(...economy)

      // Sem espalhamento, a escada do recomendador viraria degrau unico.
      expect(priciest / cheapest, style).toBeGreaterThanOrEqual(2)
    }
  })

  it('inclui os destinos que a referencia mostrava', () => {
    const ids = DESTINATIONS.map((destination) => destination.id)

    expect(ids).toEqual(
      expect.arrayContaining([
        'jericoacoara',
        'cancun',
        'miami',
        'montevideu',
        'fernando-de-noronha',
        'nova-york',
        'bariloche',
        'toronto',
        'santiago',
        'gramado',
      ]),
    )
  })
})
