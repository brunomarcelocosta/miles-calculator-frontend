import { useEffect, useRef } from 'react'

import { LeadStep } from '@/features/miles-calculator/components/LeadStep'
import { QuizLayout } from '@/features/miles-calculator/components/QuizLayout'
import { ResultStep } from '@/features/miles-calculator/components/ResultStep'
import { SingleChoiceStep } from '@/features/miles-calculator/components/SingleChoiceStep'
import { WelcomeStep } from '@/features/miles-calculator/components/WelcomeStep'
import { useQuizMachine } from '@/features/miles-calculator/hooks/useQuizMachine'
import { useLeadApi } from '@/features/miles-calculator/hooks/useSubmitLead'
import { useTrackingParams } from '@/features/miles-calculator/hooks/useTrackingParams'
import { useMilesEstimate } from '@/features/miles-calculator/hooks/useMilesEstimate'
import { phoneDigits } from '@/domain/lib/brazilianPhone'
import { normalizeInstagram } from '@/domain/schemas/leadSubmission'
import { trackLeadSubmitted, trackQuizComplete } from '@/shared/lib/analytics'
import type { LeadFormValues } from '@/domain/schemas/leadSubmission'

/**
 * Tela unica do funil.
 *
 * Fluxo de integração com a API:
 * 1. Formulário de contato preenchido → POST /api/leads (cria lead)
 * 2. Cada pergunta respondida → PATCH /api/leads/:id/step (atualiza step + resposta)
 * 3. Resultado computado → PATCH com step='result' + estimativas
 */
export function CalculatorPage() {
  const quiz = useQuizMachine()
  const leadApi = useLeadApi()
  const tracking = useTrackingParams()
  const result = useMilesEstimate(quiz.answers)
  const resultSentRef = useRef(false)
  const lastStepSentRef = useRef<string>('')

  /**
   * Quando o formulário de contato é submetido, cria o lead na API
   * e avança para a próxima tela.
   */
  function handleLeadSubmit(values: LeadFormValues) {
    leadApi.create({
      fullName: values.fullName.trim().replace(/\s+/g, ' '),
      email: values.email.trim().toLowerCase(),
      phone: phoneDigits(values.phone),
      instagram: normalizeInstagram(values.instagram),
      consentAt: new Date().toISOString(),
      utmSource: tracking.utmSource,
      utmMedium: tracking.utmMedium,
      utmCampaign: tracking.utmCampaign,
      utmContent: tracking.utmContent,
      utmTerm: tracking.utmTerm,
      fbclid: tracking.fbclid,
      referrer: tracking.referrer,
      honeypot: '',
    })

    trackLeadSubmitted({ estimateMin: 0, estimateMax: 0 })
    quiz.next()
  }

  // A cada mudança de step de pergunta, envia a resposta para a API
  useEffect(() => {
    if (quiz.step.kind !== 'question') return

    const questionId = quiz.step.id
    const answer = quiz.answers[questionId]
    if (!answer) return

    // Evita enviar o mesmo step duas vezes
    const key = `${questionId}:${answer}`
    if (lastStepSentRef.current === key) return
    lastStepSentRef.current = key

    leadApi.updateStep({ step: questionId, answer })
  })

  // Quando chega no resultado, envia step='result' com estimativas
  useEffect(() => {
    if (quiz.step.kind !== 'result') return
    if (resultSentRef.current) return
    if (!result) return

    resultSentRef.current = true

    leadApi.updateStep({
      step: 'result',
      estimateMin: result.estimate.min.annualPoints,
      estimateMax: result.estimate.max.annualPoints,
      destinations: result.recommendations.map((r) => r.destination.id),
    })

    trackQuizComplete({
      estimateMin: result.estimate.min.annualPoints,
      estimateMax: result.estimate.max.annualPoints,
      travelStyle: result.profile.travelStyle,
    })
  })

  return (
    <QuizLayout
      stepKey={quiz.step.id}
      questionNumber={quiz.questionNumber}
      questionCount={quiz.questionCount}
      canGoBack={quiz.canGoBack}
      onBack={quiz.back}
      wide={quiz.step.kind === 'result'}
    >
      {quiz.step.kind === 'welcome' ? <WelcomeStep onStart={quiz.next} /> : null}

      {quiz.step.kind === 'lead' ? (
        <LeadStep lead={quiz.lead} onChange={quiz.updateLead} onSubmit={handleLeadSubmit} />
      ) : null}

      {quiz.step.kind === 'question' ? (
        <SingleChoiceStep
          question={quiz.step.question}
          selectedOptionId={quiz.answers[quiz.step.id]}
          onSelect={(optionId) => {
            if (quiz.step.kind !== 'question') return
            quiz.select(quiz.step.id, optionId)
          }}
        />
      ) : null}

      {quiz.step.kind === 'result' ? (
        <ResultStep answers={quiz.answers} onRestart={quiz.restart} />
      ) : null}
    </QuizLayout>
  )
}
