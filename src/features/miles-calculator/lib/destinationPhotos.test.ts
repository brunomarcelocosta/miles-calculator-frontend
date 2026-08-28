import { describe, expect, it } from 'vitest'

import { DESTINATIONS } from '@/domain/catalog/destinations'
import { hasDestinationPhoto } from '@/features/miles-calculator/lib/destinationPhotos'

describe('destinationPhotos', () => {
  it('so lista ids que existem no catalogo', () => {
    // Id com erro de digitacao nunca mostraria a foto, e o card cairia na arte
    // sem nenhum aviso. E o tipo de erro que so aparece quando alguem repara que
    // um destino especifico esta diferente dos outros.
    const catalogIds = new Set(DESTINATIONS.map((destination) => destination.id))
    const withPhoto = DESTINATIONS.filter((destination) => hasDestinationPhoto(destination.id))

    // Toda entrada do manifesto precisa casar com um destino; se alguma nao
    // casasse, a contagem abaixo ficaria menor que a do manifesto.
    expect(withPhoto.length).toBe(31)

    for (const destination of withPhoto) {
      expect(catalogIds.has(destination.id)).toBe(true)
    }
  })

  it('aponta para arquivo dentro de public/destinations', () => {
    const withPhoto = DESTINATIONS.filter((destination) => hasDestinationPhoto(destination.id))

    for (const destination of withPhoto) {
      expect(destination.image).toMatch(/^\/destinations\/[a-z-]+\.png$/)
    }
  })

  it('nao reconhece destino fora do manifesto', () => {
    expect(hasDestinationPhoto('id-que-nao-existe')).toBe(false)
  })
})
