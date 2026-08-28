import { beforeEach, describe, expect, it } from 'vitest'

import {
  QUIZ_STORAGE_KEY,
  QUIZ_STORAGE_TTL_MS,
  clearQuizState,
  initialQuizState,
  loadQuizState,
  sanitizePersistedState,
  saveQuizState,
} from '@/features/miles-calculator/state/quizStorage'
import { RESULT_STEP_INDEX } from '@/features/miles-calculator/types/quizStep'

/** Respostas completas, para exercitar o passo de resultado. */
const completeAnswers = {
  cardPf: 'pf_16_25k',
  cardPj: 'pj_none',
  ifood: 'ifood_zero',
  retailAnnual: 'retail_2_5k',
  travelAnnual: 'travel_2_5k',
  travelStyle: 'style_beach',
  knowledgeLevel: 'knowledge_basic',
  freeTripsPerYear: 'free_one',
  managerInterest: 'manager_yes',
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('sanitizePersistedState', () => {
  it('rejeita valor que nao e objeto', () => {
    expect(sanitizePersistedState(null)).toBeNull()
    expect(sanitizePersistedState('texto')).toBeNull()
    expect(sanitizePersistedState([])).toBeNull()
  })

  it('rejeita estado sem marca de tempo', () => {
    expect(sanitizePersistedState({ stepIndex: 3, answers: {} })).toBeNull()
  })

  it('rejeita estado mais velho que o prazo de retomada', () => {
    const stale = {
      stepIndex: 3,
      answers: {},
      savedAt: Date.now() - QUIZ_STORAGE_TTL_MS - 1,
    }

    expect(sanitizePersistedState(stale)).toBeNull()
  })

  it('aceita estado dentro do prazo', () => {
    const fresh = {
      stepIndex: 0,
      answers: {},
      savedAt: Date.now() - 1_000,
    }

    expect(sanitizePersistedState(fresh)).not.toBeNull()
  })

  it('descarta resposta cujo id de opcao nao existe mais no catalogo', () => {
    const state = sanitizePersistedState({
      stepIndex: 2,
      answers: { cardPf: 'opcao_de_um_deploy_antigo', cardPj: 'pj_none' },
      savedAt: Date.now(),
    })

    expect(state?.answers.cardPf).toBeUndefined()
    expect(state?.answers.cardPj).toBe('pj_none')
  })

  it('descarta resposta cuja opcao pertence a outra pergunta', () => {
    const state = sanitizePersistedState({
      stepIndex: 2,
      answers: { cardPf: 'pj_none' },
      savedAt: Date.now(),
    })

    expect(state?.answers.cardPf).toBeUndefined()
  })

  it('ignora chave que nao e pergunta', () => {
    const state = sanitizePersistedState({
      stepIndex: 0,
      answers: { inventada: 'x', cardPf: 'pf_16_25k' },
      savedAt: Date.now(),
    })

    expect(state?.answers).toEqual({ cardPf: 'pf_16_25k' })
  })

  it('ignora resposta que nao e string', () => {
    const state = sanitizePersistedState({
      stepIndex: 0,
      answers: { cardPf: 42 },
      savedAt: Date.now(),
    })

    expect(state?.answers).toEqual({})
  })

  it('recua o passo para a primeira pergunta sem resposta', () => {
    // Passo salvo no resultado, mas so a primeira pergunta respondida.
    const state = sanitizePersistedState({
      stepIndex: RESULT_STEP_INDEX,
      answers: { cardPf: 'pf_16_25k' },
      savedAt: Date.now(),
    })

    // Passos: 0 boas-vindas, 1 lead, 2 cardPf, 3 cardPj -> recua para 3.
    expect(state?.stepIndex).toBe(3)
  })

  it('mantem o passo de resultado quando todas as perguntas foram respondidas', () => {
    const state = sanitizePersistedState({
      stepIndex: RESULT_STEP_INDEX,
      answers: completeAnswers,
      savedAt: Date.now(),
    })

    expect(state?.stepIndex).toBe(RESULT_STEP_INDEX)
  })

  it('nao avanca o passo salvo mesmo com tudo respondido', () => {
    const state = sanitizePersistedState({
      stepIndex: 1,
      answers: completeAnswers,
      savedAt: Date.now(),
    })

    expect(state?.stepIndex).toBe(1)
  })

  it('prende o passo dentro da sequencia', () => {
    expect(
      sanitizePersistedState({
        stepIndex: 999,
        answers: completeAnswers,
        savedAt: Date.now(),
      })?.stepIndex,
    ).toBe(RESULT_STEP_INDEX)

    expect(
      sanitizePersistedState({ stepIndex: -5, answers: {}, savedAt: Date.now() })?.stepIndex,
    ).toBe(0)
  })

  it('trata passo nao inteiro como inicio', () => {
    expect(
      sanitizePersistedState({ stepIndex: 2.7, answers: {}, savedAt: Date.now() })?.stepIndex,
    ).toBe(0)
  })

  it('normaliza o lead, mantendo texto e descartando tipo invalido', () => {
    const state = sanitizePersistedState({
      stepIndex: 1,
      answers: {},
      savedAt: Date.now(),
      lead: { fullName: 'Ana', email: 'ana@travion.com.br', phone: 5 },
    })

    expect(state?.lead).toEqual({
      fullName: 'Ana',
      email: 'ana@travion.com.br',
      phone: '',
      instagram: '',
    })
  })

  it('devolve lead vazio quando nao ha lead salvo', () => {
    const state = sanitizePersistedState({ stepIndex: 0, answers: {}, savedAt: Date.now() })

    expect(state?.lead.fullName).toBe('')
  })
})

describe('loadQuizState', () => {
  it('devolve null sem nada salvo', () => {
    expect(loadQuizState()).toBeNull()
  })

  it('le de volta o que foi salvo', () => {
    const state = { ...initialQuizState(), stepIndex: 3, answers: { cardPf: 'pf_16_25k' } }
    saveQuizState(state)

    const loaded = loadQuizState()

    expect(loaded?.stepIndex).toBe(3)
    expect(loaded?.answers.cardPf).toBe('pf_16_25k')
  })

  it('devolve null, em vez de lancar, com JSON corrompido', () => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, '{isso nao e json')

    expect(loadQuizState()).toBeNull()
  })

  it('devolve null com JSON valido mas de outro formato', () => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, '"apenas um texto"')

    expect(loadQuizState()).toBeNull()
  })
})

describe('clearQuizState', () => {
  it('apaga o estado salvo', () => {
    saveQuizState(initialQuizState())
    expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).not.toBeNull()

    clearQuizState()

    expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toBeNull()
    expect(loadQuizState()).toBeNull()
  })
})
