import { findOption, getQuestion } from '@/domain/config/questionCatalog'
import type { QuestionId, QuizAnswers } from '@/domain/model/QuizAnswers'
import { emptyLeadDraft, type LeadDraft } from '@/features/miles-calculator/types/lead'
import {
  QUIZ_STEPS,
  RESULT_STEP_INDEX,
  isQuestionStep,
} from '@/features/miles-calculator/types/quizStep'

/**
 * Persistencia do quiz em `localStorage`.
 *
 * Por que persistir: em mobile a aba morre com facilidade — troca de app,
 * notificacao, memoria baixa. Sem isso, quem veio de anuncio e voltou pelo mesmo
 * link recomeca da primeira pergunta e simplesmente desiste.
 *
 * A versao esta na chave de proposito. Mudar o formato do estado passa a ser
 * trocar a chave, e o estado antigo e ignorado em vez de quebrar a tela.
 */
export const QUIZ_STORAGE_KEY = 'travion:miles-calculator:v1'

/** Retomada faz sentido por alguns dias; depois disso o contexto se perdeu. */
export const QUIZ_STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface PersistedQuizState {
  stepIndex: number
  answers: QuizAnswers
  lead: LeadDraft
  savedAt: number
}

export function initialQuizState(): PersistedQuizState {
  return {
    stepIndex: 0,
    answers: {},
    lead: emptyLeadDraft(),
    savedAt: Date.now(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Mantem apenas respostas que ainda existem no catalogo.
 *
 * Um deploy pode renomear opcao ou pergunta, e o `localStorage` do visitante
 * continua com o formato antigo. Descartar o que nao reconhecemos e melhor que
 * levar um id invalido ate o motor de calculo.
 */
function sanitizeAnswers(raw: unknown): QuizAnswers {
  if (!isRecord(raw)) return {}

  const answers: QuizAnswers = {}

  for (const step of QUIZ_STEPS) {
    if (!isQuestionStep(step)) continue

    const value = raw[step.id]
    if (typeof value !== 'string') continue

    if (findOption(getQuestion(step.id), value)) {
      answers[step.id] = value
    }
  }

  return answers
}

function sanitizeLead(raw: unknown): LeadDraft {
  const lead = emptyLeadDraft()

  if (!isRecord(raw)) return lead

  for (const key of ['fullName', 'email', 'phone', 'instagram'] as const) {
    const value = raw[key]
    if (typeof value === 'string') lead[key] = value
  }

  lead.consent = raw.consent === true

  return lead
}

/**
 * Impede que o passo salvo aponte para uma tela que o estado nao sustenta.
 *
 * O caso concreto: alguem chegou ao resultado, o catalogo mudou, uma resposta
 * foi descartada na limpeza acima e o passo continuou em 12. Sem este recuo, a
 * tela de resultado tentaria calcular com resposta faltando.
 */
function clampStepIndex(rawIndex: unknown, answers: QuizAnswers): number {
  const index =
    typeof rawIndex === 'number' && Number.isInteger(rawIndex)
      ? Math.min(Math.max(rawIndex, 0), RESULT_STEP_INDEX)
      : 0

  const firstUnanswered = QUIZ_STEPS.findIndex(
    (step) => isQuestionStep(step) && !answers[step.id],
  )

  if (firstUnanswered === -1) return index

  return Math.min(index, firstUnanswered)
}

export function sanitizePersistedState(raw: unknown): PersistedQuizState | null {
  if (!isRecord(raw)) return null

  const savedAt = typeof raw.savedAt === 'number' ? raw.savedAt : 0

  if (!savedAt || Date.now() - savedAt > QUIZ_STORAGE_TTL_MS) return null

  const answers = sanitizeAnswers(raw.answers)

  return {
    stepIndex: clampStepIndex(raw.stepIndex, answers),
    answers,
    lead: sanitizeLead(raw.lead),
    savedAt,
  }
}

/** Le o estado salvo. Nunca lanca: falha de storage nao pode derrubar a landing. */
export function loadQuizState(): PersistedQuizState | null {
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY)

    if (!raw) return null

    return sanitizePersistedState(JSON.parse(raw))
  } catch {
    // Modo privado do Safari, storage cheio ou JSON corrompido. Em todos, o
    // certo e comecar do zero em silencio.
    return null
  }
}

export function saveQuizState(state: PersistedQuizState): void {
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Sem persistencia o quiz continua funcionando; so nao retoma.
  }
}

export function clearQuizState(): void {
  try {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY)
  } catch {
    // Nada a fazer.
  }
}

export function questionIdsInOrder(): QuestionId[] {
  return QUIZ_STEPS.filter(isQuestionStep).map((step) => step.id)
}
