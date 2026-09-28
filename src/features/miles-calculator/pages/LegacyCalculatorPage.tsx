import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { LeadStep } from '@/features/miles-calculator/components/LeadStep'
import { QuizLayout } from '@/features/miles-calculator/components/QuizLayout'
import { ResultStep } from '@/features/miles-calculator/components/ResultStep'
import { SingleChoiceStep } from '@/features/miles-calculator/components/SingleChoiceStep'
import { WelcomeStep } from '@/features/miles-calculator/components/WelcomeStep'
import { useQuizMachine } from '@/features/miles-calculator/hooks/useQuizMachine'
import { useTrackingParams } from '@/features/miles-calculator/hooks/useTrackingParams'
import { createLead, updateLeadStep, completeLead, getQuiz } from '@/features/miles-calculator/api/leadsApi'
import { toLeadContact } from '@/domain/schemas/leadSubmission'
import { trackLeadSubmitted, trackQuizComplete } from '@/shared/lib/analytics'
import type { LeadFormValues } from '@/domain/schemas/leadSubmission'
import type { Question } from '@/domain/config/questionCatalog'

const SESSION_KEY = 'travion:miles-calculator:lead:v1'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

interface LeadSession { id: string | null; submissionId: string; savedAt: number; email?: string; phone?: string }

function readSession(): LeadSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as LeadSession
    if (!value.submissionId || Date.now() - value.savedAt > SESSION_TTL) return null
    return value
  } catch { return null }
}

function saveSession(session: LeadSession | null) {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch { /* Browsers with disabled storage can still finish the quiz. */ }
}

export function LegacyCalculatorPage() {
  const quizQuery = useQuery({ queryKey: ['calculator', 'quiz'], queryFn: getQuiz })
  if (quizQuery.isPending) return <div className="grid min-h-screen place-items-center">Carregando calculadora…</div>
  if (quizQuery.isError) return <div className="grid min-h-screen place-items-center gap-4">Calculadora indisponível. <button onClick={() => quizQuery.refetch()}>Tentar novamente</button></div>
  return <CalculatorFlow questions={quizQuery.data.questions} />
}

function CalculatorFlow({ questions }: { questions: readonly Question[] }) {
  const quiz = useQuizMachine({ questions })
  const queryClient = useQueryClient()
  const tracking = useTrackingParams()
  const [session, setSession] = useState<LeadSession | null>(readSession)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultQuery = useQuery({
    queryKey: ['calculator', 'result', session?.id],
    queryFn: () => completeLead(session!.id!),
    enabled: quiz.step.kind === 'result' && !!session?.id,
    retry: false,
  })
  const stepKind = quiz.step.kind
  const goTo = quiz.goTo

  useEffect(() => {
    if (!session?.id && (stepKind === 'question' || stepKind === 'result')) goTo(1)
  }, [stepKind, goTo, session?.id])

  useEffect(() => {
    if (!resultQuery.data) return
    trackQuizComplete({
      estimateMin: resultQuery.data.estimate.min.annualPoints,
      estimateMax: resultQuery.data.estimate.max.annualPoints,
      travelStyle: resultQuery.data.travelStyle,
    })
  }, [resultQuery.data])

  async function handleLeadSubmit(values: LeadFormValues) {
    if (busy) return
    setBusy(true)
    setError(null)
    const contact = toLeadContact(values)
    const canonicalEmail = contact.email
    const canonicalPhone = contact.phone
    const submissionId = session?.email === canonicalEmail && session?.phone === canonicalPhone
      ? session.submissionId
      : crypto.randomUUID()
    const pending = { id: null, submissionId, savedAt: Date.now(), email: canonicalEmail, phone: canonicalPhone }
    saveSession(pending)
    setSession(pending)
    try {
      const response = await createLead({
        submissionId,
        ...contact,
        utmSource: tracking.utmSource,
        utmMedium: tracking.utmMedium,
        utmCampaign: tracking.utmCampaign,
        utmContent: tracking.utmContent,
        utmTerm: tracking.utmTerm,
        fbclid: tracking.fbclid,
        referrer: tracking.referrer,
        honeypot: '',
      })
      const created = { id: response.id, submissionId, savedAt: Date.now(), email: canonicalEmail, phone: canonicalPhone }
      saveSession(created)
      setSession(created)
      trackLeadSubmitted({ estimateMin: 0, estimateMax: 0 })
      quiz.next()
    } catch {
      setError('Não foi possível salvar seu contato. Tente novamente.')
    } finally { setBusy(false) }
  }

  async function handleSelect(questionId: string, optionId: string) {
    if (busy || !session?.id) return
    quiz.answer(questionId as Parameters<typeof quiz.answer>[0], optionId)
    setBusy(true)
    setError(null)
    try {
      await updateLeadStep(session.id, { step: questionId, answer: optionId })
      await queryClient.invalidateQueries({ queryKey: ['calculator', 'result', session.id] })
      quiz.next()
    } catch {
      setError('Não foi possível salvar a resposta. Toque na opção para tentar novamente.')
    } finally { setBusy(false) }
  }

  function restart() {
    saveSession(null)
    setSession(null)
    setError(null)
    quiz.restart()
  }

  return (
    <QuizLayout
      stepKey={quiz.step.id}
      questionNumber={quiz.questionNumber}
      questionCount={quiz.questionCount}
      canGoBack={!busy && quiz.canGoBack && !(quiz.step.kind === 'question' && quiz.questionNumber === 1)}
      onBack={() => { setError(null); quiz.back() }}
      wide={quiz.step.kind === 'result'}
    >
      {quiz.step.kind === 'welcome' && <WelcomeStep onStart={quiz.next} />}
      {quiz.step.kind === 'lead' && <LeadStep lead={quiz.lead} onChange={quiz.updateLead} onSubmit={handleLeadSubmit} busy={busy} error={error} />}
      {quiz.step.kind === 'question' && <>
        <SingleChoiceStep question={quiz.step.question} selectedOptionId={quiz.answers[quiz.step.id]} onSelect={(optionId) => handleSelect(quiz.step.id, optionId)} disabled={busy} />
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      </>}
      {quiz.step.kind === 'result' && (resultQuery.data
        ? <ResultStep serverResult={resultQuery.data} onRestart={restart} />
        : <div className="text-center"><p>{resultQuery.isError ? 'Não foi possível calcular agora. Tente novamente.' : 'Calculando seu resultado…'}</p>{resultQuery.isError && <button className="mt-4 underline" onClick={() => resultQuery.refetch()}>Tentar novamente</button>}</div>)}
    </QuizLayout>
  )
}
