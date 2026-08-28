import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  STEP_TRANSITION_MS,
  useQuizMachine,
} from '@/features/miles-calculator/hooks/useQuizMachine'
import { loadQuizState, saveQuizState } from '@/features/miles-calculator/state/quizStorage'
import { RESULT_STEP_INDEX, TOTAL_STEPS } from '@/features/miles-calculator/types/quizStep'

/** Avanco automatico desligado: cada teste controla a navegacao. */
function renderMachine(advanceDelayMs = 0) {
  return renderHook(() => useQuizMachine({ advanceDelayMs }))
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useQuizMachine', () => {
  it('comeca em boas-vindas', () => {
    const { result } = renderMachine()

    expect(result.current.step.kind).toBe('welcome')
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.canGoBack).toBe(false)
  })

  it('anuncia doze telas e nove perguntas', () => {
    const { result } = renderMachine()

    expect(result.current.totalSteps).toBe(12)
    expect(result.current.totalSteps).toBe(TOTAL_STEPS)
    expect(result.current.questionCount).toBe(9)
  })

  it('avanca de boas-vindas para lead e depois para a primeira pergunta', () => {
    const { result } = renderMachine()

    act(() => result.current.next())
    expect(result.current.step.kind).toBe('lead')

    act(() => result.current.next())
    expect(result.current.step).toMatchObject({ kind: 'question', id: 'cardPf' })
  })

  it('percorre as perguntas na ordem do catalogo', () => {
    const { result } = renderMachine()

    act(() => result.current.goTo(2))

    const visited: string[] = []
    for (let i = 0; i < 9; i += 1) {
      visited.push(result.current.step.id)
      act(() => result.current.next())
    }

    expect(visited).toEqual([
      'cardPf',
      'cardPj',
      'ifood',
      'retailAnnual',
      'travelAnnual',
      'travelStyle',
      'knowledgeLevel',
      'freeTripsPerYear',
      'managerInterest',
    ])
    expect(result.current.step.kind).toBe('result')
  })

  it('volta um passo e libera o "Anterior" só depois de sair do inicio', () => {
    const { result } = renderMachine()

    act(() => result.current.next())
    expect(result.current.canGoBack).toBe(true)

    act(() => result.current.back())
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.canGoBack).toBe(false)
  })

  it('nao passa do primeiro nem do ultimo passo', () => {
    const { result } = renderMachine()

    act(() => result.current.back())
    expect(result.current.stepIndex).toBe(0)

    act(() => result.current.goTo(RESULT_STEP_INDEX))
    act(() => result.current.next())
    expect(result.current.stepIndex).toBe(RESULT_STEP_INDEX)
  })

  it('prende goTo dentro da sequencia', () => {
    const { result } = renderMachine()

    act(() => result.current.goTo(999))
    expect(result.current.stepIndex).toBe(RESULT_STEP_INDEX)

    act(() => result.current.goTo(-3))
    expect(result.current.stepIndex).toBe(0)
  })

  it('numera a pergunta atual e nao numera as outras telas', () => {
    const { result } = renderMachine()

    expect(result.current.questionNumber).toBeNull()

    act(() => result.current.goTo(1))
    expect(result.current.questionNumber).toBeNull()

    act(() => result.current.goTo(2))
    expect(result.current.questionNumber).toBe(1)

    act(() => result.current.goTo(4))
    expect(result.current.questionNumber).toBe(3)

    act(() => result.current.goTo(10))
    expect(result.current.questionNumber).toBe(9)

    act(() => result.current.goTo(RESULT_STEP_INDEX))
    expect(result.current.questionNumber).toBeNull()
  })

  describe('respostas', () => {
    it('registra sem sair da tela', () => {
      const { result } = renderMachine()

      act(() => result.current.goTo(2))
      act(() => result.current.answer('cardPf', 'pf_16_25k'))

      expect(result.current.answers.cardPf).toBe('pf_16_25k')
      expect(result.current.stepIndex).toBe(2)
    })

    it('substitui a resposta quando a pessoa volta e troca', () => {
      const { result } = renderMachine()

      act(() => result.current.answer('cardPf', 'pf_16_25k'))
      act(() => result.current.answer('cardPf', 'pf_above_26k'))

      expect(result.current.answers.cardPf).toBe('pf_above_26k')
    })

    it('preserva as outras respostas', () => {
      const { result } = renderMachine()

      act(() => result.current.answer('cardPf', 'pf_16_25k'))
      act(() => result.current.answer('ifood', 'ifood_zero'))

      expect(result.current.answers).toEqual({ cardPf: 'pf_16_25k', ifood: 'ifood_zero' })
    })

    it('só fica completo com as nove perguntas respondidas', () => {
      const { result } = renderMachine()

      expect(result.current.isComplete).toBe(false)

      act(() => {
        result.current.answer('cardPf', 'pf_16_25k')
        result.current.answer('cardPj', 'pj_none')
        result.current.answer('ifood', 'ifood_zero')
        result.current.answer('retailAnnual', 'retail_2_5k')
        result.current.answer('travelAnnual', 'travel_2_5k')
        result.current.answer('travelStyle', 'style_beach')
        result.current.answer('knowledgeLevel', 'knowledge_basic')
        result.current.answer('freeTripsPerYear', 'free_one')
      })

      expect(result.current.isComplete).toBe(false)

      act(() => result.current.answer('managerInterest', 'manager_yes'))

      expect(result.current.isComplete).toBe(true)
    })
  })

  describe('avanco automatico na selecao', () => {
    it('avanca depois da transicao', () => {
      vi.useFakeTimers()
      const { result } = renderMachine(STEP_TRANSITION_MS)

      act(() => result.current.goTo(2))
      act(() => result.current.select('cardPf', 'pf_16_25k'))

      // A resposta entra na hora; a troca de tela espera a transicao.
      expect(result.current.answers.cardPf).toBe('pf_16_25k')
      expect(result.current.stepIndex).toBe(2)

      act(() => vi.advanceTimersByTime(STEP_TRANSITION_MS))

      expect(result.current.stepIndex).toBe(3)
    })

    it('trocar de opcao antes da transicao avanca uma vez só', () => {
      vi.useFakeTimers()
      const { result } = renderMachine(STEP_TRANSITION_MS)

      act(() => result.current.goTo(2))
      act(() => result.current.select('cardPf', 'pf_16_25k'))
      act(() => vi.advanceTimersByTime(STEP_TRANSITION_MS / 2))
      act(() => result.current.select('cardPf', 'pf_above_26k'))
      act(() => vi.advanceTimersByTime(STEP_TRANSITION_MS))

      expect(result.current.answers.cardPf).toBe('pf_above_26k')
      expect(result.current.stepIndex).toBe(3)
    })

    it('voltar cancela um avanco pendente', () => {
      vi.useFakeTimers()
      const { result } = renderMachine(STEP_TRANSITION_MS)

      act(() => result.current.goTo(3))
      act(() => result.current.select('cardPj', 'pj_none'))
      act(() => result.current.back())
      act(() => vi.advanceTimersByTime(STEP_TRANSITION_MS * 2))

      // Sem o cancelamento, o avanco pendente jogaria de volta para a frente.
      expect(result.current.stepIndex).toBe(2)
    })

    it('avanca na hora quando a transicao esta desligada', () => {
      const { result } = renderMachine(0)

      act(() => result.current.goTo(2))
      act(() => result.current.select('cardPf', 'pf_16_25k'))

      expect(result.current.stepIndex).toBe(3)
    })
  })

  describe('persistencia', () => {
    it('salva passo e respostas', () => {
      const { result } = renderMachine()

      act(() => result.current.goTo(2))
      act(() => result.current.answer('cardPf', 'pf_16_25k'))

      const saved = loadQuizState()
      expect(saved?.stepIndex).toBe(2)
      expect(saved?.answers.cardPf).toBe('pf_16_25k')
    })

    it('retoma no passo onde parou', () => {
      const first = renderMachine()

      act(() => first.result.current.goTo(2))
      act(() => first.result.current.answer('cardPf', 'pf_above_26k'))
      first.unmount()

      // Simula recarregar a pagina.
      const second = renderMachine()

      expect(second.result.current.stepIndex).toBe(2)
      expect(second.result.current.answers.cardPf).toBe('pf_above_26k')
    })

    it('retoma na primeira renderizacao, sem passar por boas-vindas', () => {
      saveQuizState({
        stepIndex: 3,
        answers: { cardPf: 'pf_16_25k' },
        lead: { fullName: '', email: '', phone: '', instagram: '' },
        savedAt: Date.now(),
      })

      const { result } = renderMachine()

      expect(result.current.step.id).toBe('cardPj')
    })

    it('ignora estado salvo em formato desconhecido', () => {
      window.localStorage.setItem('travion:miles-calculator:v1', '{"stepIndex":"tres"}')

      const { result } = renderMachine()

      expect(result.current.stepIndex).toBe(0)
    })

    it('restart limpa o estado e volta ao inicio', () => {
      const { result } = renderMachine()

      act(() => result.current.goTo(4))
      act(() => result.current.answer('cardPf', 'pf_16_25k'))
      act(() => result.current.restart())

      expect(result.current.stepIndex).toBe(0)
      expect(result.current.answers).toEqual({})
    })

    it('depois do restart uma nova sessao nao recupera as respostas antigas', () => {
      const first = renderMachine()

      act(() => first.result.current.answer('cardPf', 'pf_16_25k'))
      act(() => first.result.current.restart())
      first.unmount()

      const second = renderMachine()

      expect(second.result.current.answers).toEqual({})
      expect(second.result.current.stepIndex).toBe(0)
    })
  })

  describe('lead', () => {
    it('comeca vazio', () => {
      const { result } = renderMachine()

      expect(result.current.lead).toEqual({
        fullName: '',
        email: '',
        phone: '',
        instagram: '',
      })
    })

    it('atualiza por campo, sem apagar os outros', () => {
      const { result } = renderMachine()

      act(() => result.current.updateLead({ fullName: 'Ana Souza' }))
      act(() => result.current.updateLead({ email: 'ana@travion.com.br' }))

      expect(result.current.lead.fullName).toBe('Ana Souza')
      expect(result.current.lead.email).toBe('ana@travion.com.br')
    })

    it('persiste o lead entre sessoes', () => {
      const first = renderMachine()

      act(() => first.result.current.updateLead({ phone: '(12) 99764-3952' }))
      first.unmount()

      const second = renderMachine()

      expect(second.result.current.lead.phone).toBe('(12) 99764-3952')
    })
  })
})
