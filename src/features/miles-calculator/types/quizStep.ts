import { QUESTIONS, type Question } from '@/domain/config/questionCatalog'
import type { QuestionId } from '@/domain/model/QuizAnswers'

/**
 * As telas do funil, na ordem: boas-vindas, lead, as perguntas do catalogo e
 * o resultado.
 *
 * A sequencia e dado, nao codigo espalhado por condicionais: a maquina do quiz
 * so sabe andar para frente e para tras num array. Inserir ou remover tela e
 * mexer nesta lista (ou no catalogo de perguntas).
 */
export interface WelcomeStepDescriptor {
  kind: 'welcome'
  id: 'welcome'
}

export interface LeadStepDescriptor {
  kind: 'lead'
  id: 'lead'
}

export interface QuestionStepDescriptor {
  kind: 'question'
  id: QuestionId
  question: Question
}

export interface ResultStepDescriptor {
  kind: 'result'
  id: 'result'
}

export type QuizStepDescriptor =
  | WelcomeStepDescriptor
  | LeadStepDescriptor
  | QuestionStepDescriptor
  | ResultStepDescriptor

export const QUIZ_STEPS: readonly QuizStepDescriptor[] = [
  { kind: 'welcome', id: 'welcome' },
  { kind: 'lead', id: 'lead' },
  ...QUESTIONS.map(
    (question): QuestionStepDescriptor => ({
      kind: 'question',
      id: question.id,
      question,
    }),
  ),
  { kind: 'result', id: 'result' },
]

export const TOTAL_STEPS = QUIZ_STEPS.length

/** Indice da tela de resultado, usada como limite superior da navegacao. */
export const RESULT_STEP_INDEX = TOTAL_STEPS - 1

/** Quantas perguntas o contador de progresso deve anunciar. */
export const QUESTION_STEP_COUNT = QUIZ_STEPS.filter((step) => step.kind === 'question').length

export function isQuestionStep(step: QuizStepDescriptor): step is QuestionStepDescriptor {
  return step.kind === 'question'
}

/**
 * Posicao da pergunta dentro do bloco de perguntas, base 1.
 *
 * O progresso conta perguntas, nao telas: "Pergunta 3 de 10" e legivel, enquanto
 * "Tela 5 de 13" inclui boas-vindas, lead e resultado e confunde.
 */
export function questionNumberAt(stepIndex: number): number | null {
  const step = QUIZ_STEPS[stepIndex]

  if (!step || !isQuestionStep(step)) return null

  const questionsBefore = QUIZ_STEPS.slice(0, stepIndex).filter(isQuestionStep).length

  return questionsBefore + 1
}
