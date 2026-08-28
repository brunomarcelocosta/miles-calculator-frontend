import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DESTINATIONS } from '@/domain/catalog/destinations'
import type { Destination } from '@/domain/model/Destination'
import { DestinationArtwork } from '@/features/miles-calculator/components/DestinationArtwork'

function find(id: string): Destination {
  const destination = DESTINATIONS.find((candidate) => candidate.id === id)

  if (!destination) {
    throw new Error(`Destino ${id} saiu do catalogo; o teste precisa acompanhar.`)
  }

  return destination
}

function renderArtwork(destination: Destination, decorative = false) {
  const view = render(<DestinationArtwork destination={destination} decorative={decorative} />)
  const svg = view.container.querySelector('svg')

  if (!svg) {
    throw new Error('A arte nao renderizou nenhum svg.')
  }

  return { ...view, svg }
}

describe('DestinationArtwork', () => {
  it('desenha o mesmo destino sempre igual', () => {
    // A arte sai de um hash do id. Se ela variasse entre renders, o card mudaria
    // de cor a cada re-render e pareceria defeito de carregamento.
    const rio = find('rio-de-janeiro')

    const first = renderArtwork(rio)
    const before = first.svg.innerHTML
    first.unmount()

    const second = renderArtwork(rio)

    expect(second.svg.innerHTML).toBe(before)
  })

  it('desenha destinos diferentes de formas diferentes', () => {
    const paris = renderArtwork(find('paris'))
    const parisMarkup = paris.svg.innerHTML
    paris.unmount()

    const roma = renderArtwork(find('roma'))

    // Paris e Roma sao as duas cidades de mesmo custo em milhas: se a variacao
    // dependesse do preco em vez do id, sairiam identicas.
    expect(roma.svg.innerHTML).not.toBe(parisMarkup)
  })

  it('cobre todo o catalogo sem estourar', () => {
    // Cena e paleta saem de indices calculados; um destino com estilo novo ou id
    // inesperado nao pode derrubar a tela de resultado.
    for (const destination of DESTINATIONS) {
      const view = renderArtwork(destination)

      expect(view.svg.innerHTML.length).toBeGreaterThan(0)
      view.unmount()
    }
  })

  it('da a cada destino um gradiente proprio', () => {
    // `defs` e global no documento: com id fixo, o segundo card em diante
    // reusaria o gradiente do primeiro e todos sairiam com o mesmo ceu.
    const view = render(
      <>
        <DestinationArtwork destination={find('maceio')} />
        <DestinationArtwork destination={find('jericoacoara')} />
      </>,
    )

    const ids = Array.from(view.container.querySelectorAll('linearGradient')).map((node) =>
      node.getAttribute('id'),
    )

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('nomeia o destino para leitor de tela', () => {
    const { svg } = renderArtwork(find('zermatt'))

    expect(svg).toHaveAttribute('role', 'img')
    expect(svg.getAttribute('aria-label')).toMatch(/Zermatt/)
  })

  it('cala a arte quando ela e so pano de fundo da foto', () => {
    // Com a foto na frente carregando o `alt`, a arte anunciada faria o leitor
    // de tela repetir o mesmo destino duas vezes.
    const { svg } = renderArtwork(find('rio-de-janeiro'), true)

    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('aria-label')
  })
})
