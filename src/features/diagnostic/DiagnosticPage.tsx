import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { TravionLogo } from '@/shared/components/TravionLogo'
import { env } from '@/app/config/env'
import { useTrackingParams } from '@/features/miles-calculator/hooks/useTrackingParams'
import {
  trackDiagnosticEvent,
  trackQuizStart,
  trackWhatsAppClick,
} from '@/shared/lib/analytics'
import { ContactStep } from './ContactStep'
import { QuestionStep } from './QuestionStep'
import {
  catalog,
  cleanAnswers,
  sanitizeAnswers,
  visibleQuestions,
  type Answers,
  type Contact,
} from './model'
import { createDiagnostic, saveAnswer, finishDiagnostic } from './api'

const KEY = 'travion:diagnostic:v2'
const TTL = 7 * 24 * 60 * 60 * 1000
interface Session {
  version: 2
  savedAt: number
  cursor: string
  id: string | null
  submissionId: string
  submittedContact?: Contact
  contact: Contact
  answers: Answers
  trackedComplete?: boolean
}
const initial = (): Session => ({
  version: 2,
  savedAt: Date.now(),
  cursor: 'welcome',
  id: null,
  submissionId: crypto.randomUUID(),
  contact: { fullName: '', channel: 'whatsapp', email: '', phone: '' },
  answers: {},
})
function load(): Session {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null
    if (
      s &&
      s.version === 2 &&
      Date.now() - s.savedAt < TTL &&
      s.contact &&
      ['whatsapp', 'email'].includes(s.contact.channel) &&
      typeof s.contact.fullName === 'string' &&
      typeof s.contact.phone === 'string' && typeof s.contact.email === 'string' &&
      (s.id == null || typeof s.id === 'string') &&
      s.answers &&
      typeof s.answers === 'object' &&
      typeof s.submissionId === 'string' &&
      (s.cursor === 'welcome' ||
        s.cursor === 'lead' ||
        s.cursor === 'result' ||
        catalog.questions.some((q) => q.id === s.cursor))
    )
      return {
        ...s,
        answers: sanitizeAnswers(s.answers),
        cursor:
          !s.id && !['welcome', 'lead'].includes(s.cursor) ? 'lead' : !['welcome','lead'].includes(s.cursor) && (!visibleQuestions(sanitizeAnswers(s.answers)).some(q=>q.id === s.cursor) || s.cursor === 'result') ? visibleQuestions(sanitizeAnswers(s.answers)).find(q=>!Object.hasOwn(sanitizeAnswers(s.answers),q.id))?.id ?? 'result' : s.cursor,
      }
  } catch {
    /* Missing or unavailable storage starts a fresh diagnostic. */
  }
  return initial()
}
export function DiagnosticPage() {
  const [s, set] = useState(load)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tracking = useTrackingParams()
  const questions = visibleQuestions(s.answers)
  const question = questions.find((q) => q.id === s.cursor)
  const result = useQuery({
    queryKey: ['diagnostic', s.id],
    queryFn: () => finishDiagnostic(s.id!),
    enabled: s.cursor === 'result' && !!s.id,
    retry: false,
  })
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch {
      /* Quiz remains usable. */
    }
  }, [s])
  useEffect(() => {
    if (question)
      trackDiagnosticEvent('quiz_step_view', {
        quizVersion: 2,
        questionId: question.id,
      })
  }, [s.cursor, question])
  useEffect(() => {
    if (!result.data) return
    const marker = s.id + JSON.stringify(s.answers)
    try {
      if (localStorage.getItem(KEY + ':completed-event') === marker) return
      localStorage.setItem(KEY + ':completed-event', marker)
    } catch {
      /* Tracking can run without storage. */
    }
    trackDiagnosticEvent('quiz_complete', {
      quizVersion: 2,
      segment: result.data.segment,
      spendBand: s.answers.monthlySpend,
    })
  }, [result.data, s.id, s.answers])
  const change = (patch: Partial<Session>) => {
    set((current) => ({ ...current, ...patch, savedAt: Date.now() }))
    setError('')
  }
  async function contactSubmit(contact: Contact) {
    if (busy) return
    setBusy(true)
    setError('')
    const same =
      s.submittedContact &&
      JSON.stringify(s.submittedContact) === JSON.stringify(contact)
    const submissionId = same ? s.submissionId : crypto.randomUUID()
    change({ contact, submissionId, submittedContact: contact })
    try {
      const lead = await createDiagnostic(submissionId, contact, {
        ...tracking,
      })
      change({ id: lead.id, cursor: catalog.questions[0]!.id })
      trackDiagnosticEvent('lead_submitted', {
        quizVersion: 2,
        preferredChannel: contact.channel,
      })
    } catch {
      setError('Não foi possível salvar seu contato. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  async function submit(answer: import('./model').Answer) {
    if (busy || !s.id || !question) return
    setBusy(true)
    setError('')
    try {
      await saveAnswer(s.id, question.id, answer)
      const answers = cleanAnswers({ ...s.answers, [question.id]: answer })
      const visible = visibleQuestions(answers)
      const index = visible.findIndex((q) => q.id === question.id)
      change({
        answers,
        cursor: visible[index + 1]?.id ?? 'result',
        trackedComplete: false,
      })
      trackDiagnosticEvent('quiz_step', {
        quizVersion: 2,
        questionId: question.id,
      })
    } catch {
      setError('Não foi possível salvar a resposta. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  function back() {
    const index = questions.findIndex((q) => q.id === s.cursor)
    change({
      cursor:
        s.cursor === 'lead'
          ? 'welcome'
          : s.cursor === 'result'
            ? questions.at(-1)!.id
            : index > 0
              ? questions[index - 1]!.id
              : 'lead',
    })
  }
  const index = catalog.questions.findIndex((q) => q.id === s.cursor)
  const progress =
    s.cursor === 'result'
      ? 100
      : index >= 0
        ? Math.round(((index + 1) / 10) * 100)
        : 0
  const whatsapp = `https://wa.me/${env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá Travion, terminei o diagnóstico de viagem e quero conversar com a equipe.')}`
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex min-h-16 w-[min(100%-2rem,40rem)] items-center justify-between">
          <TravionLogo />
          {s.cursor !== 'welcome' && (
            <button
              type="button"
              disabled={busy}
              onClick={back}
              className="min-h-11 px-3 text-sm"
            >
              Anterior
            </button>
          )}
        </div>
      </header>
      {progress > 0 && (
        <div
          className="mx-auto mt-5 w-[min(100%-2rem,40rem)]"
          role="progressbar"
          aria-label="Progresso do diagnóstico"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-travion-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <main className="mx-auto w-[min(100%-2rem,40rem)] py-10">
        <div key={s.cursor} className="animate-in fade-in duration-300">
          {s.cursor === 'welcome' && (
            <div className="grid gap-6 text-center">
              <p className="eyebrow">Diagnóstico de viagem</p>
              <h1 className="text-[clamp(2.4rem,8vw,4rem)] leading-tight">
                Descubra o potencial das suas próximas viagens
              </h1>
              <p className="text-travion-muted">
                Conheça seu perfil e os próximos passos para aproveitar melhor
                pontos e milhas. São 7 perguntas principais, com detalhes
                opcionais.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  trackQuizStart()
                  change({ cursor: 'lead' })
                }}
              >
                Descobrir meu potencial
              </Button>
            </div>
          )}
          {s.cursor === 'lead' && (
            <ContactStep
              value={s.contact}
              onChange={(contact) => change({ contact })}
              onSubmit={contactSubmit}
              busy={busy}
            />
          )}
          {question && (
            <QuestionStep
              question={question}
              value={s.answers[question.id]}
              submit={submit}
              busy={busy}
            />
          )}
          {s.cursor === 'result' &&
            (result.data ? (
              <div className="grid gap-6">
                <p className="eyebrow">Seu diagnóstico de viagem</p>
                <h2 className="text-3xl">Um próximo passo para suas viagens</h2>
                <p className="text-lg">{result.data.conclusion}</p>
                <dl className="grid gap-3">
                  {result.data.indicators.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <dt className="text-sm text-travion-muted">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-lg">{item.value}</dd>
                      <p className="mt-1 text-sm text-travion-muted">
                        {item.level}
                      </p>
                    </div>
                  ))}
                </dl>
                <p>
                  Nossa equipe entrará em contato pelo{' '}
                  {s.contact.channel === 'whatsapp'
                    ? `WhatsApp informado (final ${s.contact.phone.slice(-4)})`
                    : 'e-mail informado'}{' '}
                  para conversar sobre seu perfil e os próximos passos.
                </p>
                <Button
                  nativeButton={false}
                  render={
                    <a href={whatsapp} target="_blank" rel="noreferrer" />
                  }
                  onClick={trackWhatsAppClick}
                >
                  Falar agora no WhatsApp
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href="https://travion.com.br"
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  Conhecer a Travion
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    set(initial())
                  }}
                >
                  Refazer diagnóstico
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                <p>
                  {result.isError
                    ? 'Não foi possível concluir agora. Tente novamente.'
                    : 'Preparando seu diagnóstico…'}
                </p>
                {result.isError && (
                  <Button onClick={() => result.refetch()}>
                    Tentar novamente
                  </Button>
                )}
              </div>
            ))}
          {error && (
            <p role="alert" className="mt-4 text-red-700">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
