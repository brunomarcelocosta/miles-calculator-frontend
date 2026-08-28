import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { QuizAnswers } from '@/domain/model/QuizAnswers'
import { ResultStep } from '@/features/miles-calculator/components/ResultStep'
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from '@/features/miles-calculator/components/ResultCta'
import { defaultConfigProvider } from '@/domain/config/CalculatorConfigProvider'
import { DestinationRecommender } from '@/domain/services/DestinationRecommender'
import { MilesEstimator } from '@/domain/services/MilesEstimator'
import { resolveSpendProfile } from '@/domain/services/SpendProfileResolver'

/** Mesmo perfil usado nos testes do motor: faixa de 358.000 a 816.111. */
const highSpender: QuizAnswers = {
  cardPf: 'pf_above_26k',
  cardPj: 'pj_above_20k',
  uber: 'uber_above_300',
  ifood: 'ifood_above_500',
  retailAnnual: 'retail_above_10k',
  travelAnnual: 'travel_above_10k',
  travelStyle: 'style_beach',
  knowledgeLevel: 'knowledge_basic',
  freeTripsPerYear: 'free_zero',
  managerInterest: 'manager_yes',
}

const entryLevel: QuizAnswers = {
  cardPf: 'pf_upto_10k',
  cardPj: 'pj_none',
  uber: 'uber_zero',
  ifood: 'ifood_zero',
  retailAnnual: 'retail_upto_2k',
  travelAnnual: 'travel_upto_2k',
  travelStyle: 'style_snow',
  knowledgeLevel: 'knowledge_none',
  freeTripsPerYear: 'free_zero',
  managerInterest: 'manager_maybe',
}

/** Recalcula pelo dominio, para o teste nao repetir numero na mao. */
function expected(answers: QuizAnswers) {
  const profile = resolveSpendProfile(answers, defaultConfigProvider)
  const estimate = new MilesEstimator({ configProvider: defaultConfigProvider }).estimate(profile)

  return {
    profile,
    estimate,
    recommendations: new DestinationRecommender().recommend(estimate, profile.travelStyle),
  }
}

/** Sem atraso de calculo nem contagem animada: o teste checa o valor final. */
function renderResult(answers: QuizAnswers, onRestart = vi.fn()) {
  return {
    onRestart,
    ...render(
      <ResultStep
        answers={answers}
        onRestart={onRestart}
        calculationDelayMs={0}
        countUpDurationMs={0}
      />,
    ),
  }
}

describe('ResultStep', () => {
  describe('estado de calculo', () => {
    it('mostra o esqueleto antes de revelar', () => {
      render(<ResultStep answers={highSpender} onRestart={vi.fn()} calculationDelayMs={50} />)

      // Regiao viva, para o leitor de tela saber que algo esta em andamento.
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Calculando a sua estimativa de pontos.')).toBeInTheDocument()
      expect(screen.queryByText('pontos por ano')).not.toBeInTheDocument()
    })

    it('revela o resultado depois do atraso', async () => {
      render(
        <ResultStep
          answers={highSpender}
          onRestart={vi.fn()}
          calculationDelayMs={50}
          countUpDurationMs={0}
        />,
      )

      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
      expect(screen.getByText('pontos por ano')).toBeInTheDocument()
    })
  })

  describe('faixa de pontos', () => {
    it('anuncia a faixa em texto acessivel, sem depender da animacao', () => {
      renderResult(highSpender)

      expect(
        screen.getByText('Entre 358.000 e 816.111 pontos por ano.'),
      ).toBeInTheDocument()
    })

    it('exibe o numero grande com os dois extremos', () => {
      const { container } = renderResult(highSpender)

      // O bloco visual e `aria-hidden`, então nao tem papel nem nome acessivel:
      // a ancora e o `data-slot`, na mesma convencao dos componentes de UI.
      const range = container.querySelector('[data-slot="estimate-range"]')

      expect(range?.textContent).toBe('358.000a816.111')
    })

    it('termina a contagem no valor final, sem parar no meio', () => {
      const { container } = renderResult(entryLevel)
      const { estimate } = expected(entryLevel)

      const range = container.querySelector('[data-slot="estimate-range"]')

      expect(range?.textContent).toBe(
        `${estimate.min.annualPoints.toLocaleString('pt-BR')}a${estimate.max.annualPoints.toLocaleString('pt-BR')}`,
      )
    })

    it('acompanha o perfil de gasto informado', () => {
      const { estimate } = expected(entryLevel)

      renderResult(entryLevel)

      expect(
        screen.getByText(
          `Entre ${estimate.min.annualPoints.toLocaleString('pt-BR')} e ${estimate.max.annualPoints.toLocaleString('pt-BR')} pontos por ano.`,
        ),
      ).toBeInTheDocument()
    })
  })

  describe('detalhamento', () => {
    it('lista as tres regras e o bonus de transferencia', async () => {
      const user = userEvent.setup()
      renderResult(highSpender)

      await user.click(screen.getByText('Como chegamos nesse número'))

      expect(screen.getByRole('rowheader', { name: 'Cartão de crédito' })).toBeInTheDocument()
      expect(
        screen.getByRole('rowheader', { name: 'Parcerias de transporte e delivery' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: 'Compras bonificadas' })).toBeInTheDocument()
      expect(
        screen.getByRole('rowheader', { name: 'Bônus de transferência' }),
      ).toBeInTheDocument()
    })

    it('fecha a soma: as linhas somam o total exibido', async () => {
      const user = userEvent.setup()
      const { estimate } = expected(highSpender)
      renderResult(highSpender)

      await user.click(screen.getByText('Como chegamos nesse número'))

      const totalRow = screen.getByRole('rowheader', { name: 'Total' }).closest('tr')
      const cells = totalRow?.querySelectorAll('td')

      expect(cells?.[0]?.textContent).toBe(
        estimate.min.annualPoints.toLocaleString('pt-BR'),
      )
      expect(cells?.[1]?.textContent).toBe(
        estimate.max.annualPoints.toLocaleString('pt-BR'),
      )
    })

    it('nao aplica bonus de transferencia no minimo', async () => {
      const user = userEvent.setup()
      renderResult(highSpender)

      await user.click(screen.getByText('Como chegamos nesse número'))

      const row = screen.getByRole('rowheader', { name: 'Bônus de transferência' }).closest('tr')

      expect(row?.querySelectorAll('td')[0]?.textContent).toBe('—')
    })
  })

  describe('destinos', () => {
    it('mostra cinco cards', () => {
      renderResult(highSpender)

      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })

    it('usa os destinos que o recomendador escolheu, na ordem', () => {
      const { recommendations } = expected(highSpender)
      renderResult(highSpender)

      const headings = screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)

      expect(headings).toEqual(recommendations.map((item) => item.destination.name))
    })

    it('mostra milhagem e classe em cada card', () => {
      const { recommendations } = expected(highSpender)
      renderResult(highSpender)

      const first = recommendations[0]!
      const cabin = first.cabin === 'business' ? 'Executiva' : 'Econômica'

      expect(
        screen.getByText(first.requiredMiles.toLocaleString('pt-BR')),
      ).toBeInTheDocument()
      expect(screen.getAllByText(new RegExp(`milhas · ${cabin}`)).length).toBeGreaterThan(0)
    })

    it('marca como "Já dá" o que cabe no cenario conservador', () => {
      const { recommendations } = expected(highSpender)
      renderResult(highSpender)

      const guaranteed = recommendations.filter((item) => item.withinMinimum).length

      expect(screen.getAllByText('Já dá')).toHaveLength(guaranteed)
    })

    it('sinaliza destino ainda fora de alcance como proxima meta', () => {
      const { recommendations } = expected(entryLevel)
      const outOfReach = recommendations.filter((item) => !item.withinMaximum).length

      renderResult(entryLevel)

      if (outOfReach > 0) {
        expect(screen.getAllByText('Próxima meta')).toHaveLength(outOfReach)
      }
    })

    it('adapta o texto ao estilo escolhido', () => {
      renderResult(entryLevel)

      expect(screen.getByText(/Cinco destinos de neve/)).toBeInTheDocument()
    })

    it('da a cada destino uma imagem que o nomeia', () => {
      renderResult(highSpender)

      // Destino com foto renderiza `<img>`; sem foto, a arte vetorial. O card
      // marca a arte como decorativa quando a foto esta na frente, então em
      // ambos os casos sobra exatamente uma imagem anunciada por destino.
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(5)

      for (const image of images) {
        expect(image).toHaveAccessibleName(/.+/)
      }
    })

    it('mantem uma imagem por destino mesmo quando a foto existe', () => {
      // O risco concreto: foto e arte anunciadas juntas fariam o leitor de tela
      // repetir o destino. A contagem acima ja cobriria isso, mas so por acidente
      // — aqui a intencao fica explicita.
      renderResult(highSpender)

      const cards = screen.getAllByRole('listitem')

      for (const card of cards) {
        const announced = card.querySelectorAll('[role="img"], img:not([aria-hidden="true"])')
        expect(announced).toHaveLength(1)
      }
    })

    it('declara a milhagem como media de mercado, nao como cotacao', () => {
      renderResult(highSpender)

      expect(screen.getByText(/médias de mercado/)).toBeInTheDocument()
    })
  })

  describe('CTA', () => {
    it('oferece um unico CTA principal, apontando para o WhatsApp', () => {
      renderResult(highSpender)

      const cta = screen.getByRole('link', { name: /Falar com um especialista/ })

      expect(cta).toHaveAttribute('target', '_blank')
      expect(cta.getAttribute('href')).toContain('https://wa.me/5512997643952')
    })

    it('leva a faixa estimada na mensagem pre-preenchida', () => {
      const { estimate, recommendations } = expected(highSpender)
      renderResult(highSpender)

      const cta = screen.getByRole('link', { name: /Falar com um especialista/ })
      const message = decodeURIComponent(cta.getAttribute('href')!.split('?text=')[1]!)

      expect(message).toBe(buildWhatsAppMessage(estimate, recommendations))
      expect(message).toContain('358.000')
      expect(message).toContain('816.111')
    })

    it('nao redireciona sozinho: nao ha contador na tela', () => {
      renderResult(highSpender)

      expect(screen.queryByText(/segundos/)).not.toBeInTheDocument()
      expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    })
  })

  describe('refazer', () => {
    it('chama onRestart', async () => {
      const user = userEvent.setup()
      const { onRestart } = renderResult(highSpender)

      await user.click(screen.getAllByRole('button', { name: 'Refazer o quiz' })[0]!)

      expect(onRestart).toHaveBeenCalledTimes(1)
    })
  })

  describe('respostas incompletas', () => {
    it('oferece o caminho de volta em vez de estourar', () => {
      const { cardPf: _omitted, ...incomplete } = highSpender

      renderResult(incomplete)

      expect(screen.getByRole('heading', { name: 'Faltou alguma resposta' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Refazer o quiz' })).toBeInTheDocument()
    })

    it('nao mostra faixa nem destinos', () => {
      const { travelStyle: _omitted, ...incomplete } = highSpender

      renderResult(incomplete)

      expect(screen.queryByText('pontos por ano')).not.toBeInTheDocument()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    })
  })
})

describe('buildWhatsAppMessage', () => {
  it('inclui o destino de topo alcancavel', () => {
    const { estimate, recommendations } = expected(highSpender)

    const message = buildWhatsAppMessage(estimate, recommendations)
    const topReachable = recommendations.filter((item) => item.withinMaximum).at(-1)!

    expect(message).toContain(topReachable.destination.name)
    expect(message).toContain('Quero falar com um especialista.')
  })

  it('omite o destino quando nada esta ao alcance', () => {
    const { estimate } = expected(highSpender)

    const message = buildWhatsAppMessage(estimate, [])

    expect(message).toContain('Quero falar com um especialista.')
    expect(message).not.toContain('Fiquei interessado')
  })
})

describe('buildWhatsAppUrl', () => {
  it('codifica a mensagem na query', () => {
    const { estimate, recommendations } = expected(highSpender)

    const url = buildWhatsAppUrl(estimate, recommendations)

    expect(url.startsWith('https://wa.me/5512997643952?text=')).toBe(true)
    // Espaco cru na URL quebraria o link no WhatsApp.
    expect(url).not.toContain(' ')
  })
})
