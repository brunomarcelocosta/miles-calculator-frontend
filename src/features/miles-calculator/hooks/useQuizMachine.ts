import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { QuestionId, QuizAnswers } from '@/domain/model/QuizAnswers'
import type { Question } from '@/domain/config/questionCatalog'
import {
  clearQuizState,
  initialQuizState,
  loadQuizState,
  saveQuizState,
  type PersistedQuizState,
} from '@/features/miles-calculator/state/quizStorage'
import type { LeadDraft } from '@/features/miles-calculator/types/lead'
import {
  QUIZ_STEPS,
  type QuizStepDescriptor,
} from '@/features/miles-calculator/types/quizStep'

/**
 * Transicao entre telas. 250ms e curto o bastante para nao parecer travamento e
 * longo o bastante para a pessoa registrar que a escolha foi aceita.
 */
export const STEP_TRANSITION_MS = 250

export interface UseQuizMachineOptions {
  /** Zero desliga o avanco automatico, util em teste. */
  advanceDelayMs?: number
  questions?: readonly Question[]
}

export interface QuizMachine {
  step: QuizStepDescriptor
  stepIndex: number
  totalSteps: number
  /** Posicao no bloco de perguntas, base 1, ou null fora de pergunta. */
  questionNumber: number | null
  questionCount: number
  answers: QuizAnswers
  lead: LeadDraft
  canGoBack: boolean
  isComplete: boolean
  /** Registra a resposta sem sair da tela. */
  answer: (questionId: QuestionId, optionId: string) => void
  /** Registra a resposta e avanca depois da transicao. */
  select: (questionId: QuestionId, optionId: string) => void
  updateLead: (patch: Partial<LeadDraft>) => void
  next: () => void
  back: () => void
  goTo: (stepIndex: number) => void
  restart: () => void
}

function stepAt(index: number): QuizStepDescriptor {
  const step = QUIZ_STEPS[index]

  if (!step) {
    throw new Error(`Passo ${index} fora da sequencia do quiz.`)
  }

  return step
}

/**
 * Estado e navegacao do quiz.
 *
 * Toda a logica de "onde estou, para onde vou, o que ja respondi" vive aqui, e
 * nenhum componente de tela guarda estado proprio. E isso que permite testar o
 * funil inteiro sem renderizar nada.
 */
export function useQuizMachine(options: UseQuizMachineOptions = {}): QuizMachine {
  const advanceDelayMs = options.advanceDelayMs ?? STEP_TRANSITION_MS
  const steps = useMemo<readonly QuizStepDescriptor[]>(
    () => options.questions
      ? [
          { kind: 'welcome', id: 'welcome' },
          { kind: 'lead', id: 'lead' },
          ...options.questions.map((question): QuizStepDescriptor => ({ kind: 'question', id: question.id, question })),
          { kind: 'result', id: 'result' },
        ]
      : QUIZ_STEPS,
    [options.questions],
  )
  const resultIndex = steps.length - 1

  // Retomada acontece na inicializacao, e nao num efeito, para nao haver um
  // primeiro quadro na tela de boas-vindas antes de pular para o passo salvo.
  const [state, setState] = useState<PersistedQuizState>(
    () => loadQuizState(options.questions) ?? initialQuizState(),
  )

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelPendingAdvance = useCallback(() => {
    if (advanceTimer.current !== null) {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
  }, [])

  useEffect(() => cancelPendingAdvance, [cancelPendingAdvance])

  useEffect(() => {
    saveQuizState(state)
  }, [state])

  const goTo = useCallback((stepIndex: number) => {
    cancelPendingAdvance()
    setState((current) => ({
      ...current,
      stepIndex: Math.min(Math.max(stepIndex, 0), resultIndex),
      savedAt: Date.now(),
    }))
  }, [cancelPendingAdvance, resultIndex])

  const next = useCallback(() => {
    cancelPendingAdvance()
    setState((current) => ({
      ...current,
      stepIndex: Math.min(current.stepIndex + 1, resultIndex),
      savedAt: Date.now(),
    }))
  }, [cancelPendingAdvance, resultIndex])

  const back = useCallback(() => {
    cancelPendingAdvance()
    setState((current) => ({
      ...current,
      stepIndex: Math.max(current.stepIndex - 1, 0),
      savedAt: Date.now(),
    }))
  }, [cancelPendingAdvance])

  const answer = useCallback((questionId: QuestionId, optionId: string) => {
    setState((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: optionId },
      savedAt: Date.now(),
    }))
  }, [])

  const select = useCallback(
    (questionId: QuestionId, optionId: string) => {
      answer(questionId, optionId)

      if (advanceDelayMs <= 0) {
        next()
        return
      }

      // Trocar de opcao antes da transicao terminar nao pode disparar dois
      // avancos: o anterior e cancelado.
      cancelPendingAdvance()
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null
        next()
      }, advanceDelayMs)
    },
    [advanceDelayMs, answer, cancelPendingAdvance, next],
  )

  const updateLead = useCallback((patch: Partial<LeadDraft>) => {
    setState((current) => ({
      ...current,
      lead: { ...current.lead, ...patch },
      savedAt: Date.now(),
    }))
  }, [])

  const restart = useCallback(() => {
    cancelPendingAdvance()
    clearQuizState()
    setState(initialQuizState())
  }, [cancelPendingAdvance])

  const step = steps[Math.min(state.stepIndex, resultIndex)] ?? stepAt(0)

  const isComplete = useMemo(
    () =>
      steps.every((candidate) =>
        candidate.kind === 'question' ? Boolean(state.answers[candidate.id]) : true,
      ),
    [state.answers, steps],
  )

  return {
    step,
    stepIndex: state.stepIndex,
    totalSteps: steps.length,
    questionNumber: step.kind === 'question'
      ? steps.slice(0, state.stepIndex + 1).filter((candidate) => candidate.kind === 'question').length
      : null,
    questionCount: steps.filter((candidate) => candidate.kind === 'question').length,
    answers: state.answers,
    lead: state.lead,
    canGoBack: state.stepIndex > 0,
    isComplete,
    answer,
    select,
    updateLead,
    next,
    back,
    goTo,
    restart,
  }
}
