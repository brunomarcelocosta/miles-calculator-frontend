import catalog from './catalog.json'
export { catalog }
export interface Option {
  id: string
  label: string
}
export interface DiagnosticQuestion {
  id: string
  kind: string
  title: string
  helper?: string
  options?: Option[]
  banks?: Option[]
  amounts?: Option[]
  destinations?: Option[]
  timings?: Option[]
  travelers?: Option[]
  cabins?: Option[]
}
export type Answer =
  | string
  | { concentration: string; issuer: string | null }
  | { programs: string[]; amount: string | null }
  | {
      destination: string | null
      other: string | null
      when: string | null
      travelers: string | null
      cabin: string | null
    }
export type Answers = Record<string, Answer>
export interface Contact {
  fullName: string
  channel: 'whatsapp' | 'email'
  email: string
  phone: string
}
export interface DiagnosticResult {
  version: 2
  segment: string
  priority: string
  conclusion: string
  summary: string
  indicators: { label: string; value: string; level: string }[]
}
export function visibleQuestions(a: Answers): DiagnosticQuestion[] {
  return catalog.questions.filter(
    (q) =>
      (q.id !== 'pointsProfile' && q.id !== 'tripDetails') ||
      (q.id === 'pointsProfile' &&
        ['unused', 'sometimes', 'frequent'].includes(
          String(a.pointsRelationship),
        ) &&
        ['yes', 'maybe'].includes(String(a.hasPoints))) ||
      (q.id === 'tripDetails' && a.tripInMind === 'yes'),
  )
}
export function cleanAnswers(a: Answers): Answers {
  const next = { ...a }
  if (!visibleQuestions(next).some((q) => q.id === 'pointsProfile'))
    delete next.pointsProfile
  if (next.tripInMind !== 'yes') delete next.tripDetails
  return next
}

/** Ignore malformed or obsolete draft answers before restoring navigation. */
export function sanitizeAnswers(raw: unknown): Answers {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const input = raw as Record<string, unknown>
  const answers: Answers = {}
  const valid = (v: unknown, options: Option[] = [], optional = false) => optional && v == null || typeof v === 'string' && options.some(o => o.id === v)
  for (const q of catalog.questions as DiagnosticQuestion[]) {
    const value = input[q.id]
    if (q.kind === 'single' && valid(value,q.options)) answers[q.id] = value as string
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const v = value as Record<string,unknown>
    if (q.kind === 'card' && valid(v.concentration,q.options) && valid(v.issuer,q.banks,true)) answers[q.id] = v as Answer
    if (q.kind === 'points' && Array.isArray(v.programs) && v.programs.every(p=>valid(p,q.options)) && new Set(v.programs).size === v.programs.length && valid(v.amount,q.amounts,true)) answers[q.id] = v as Answer
    if (q.kind === 'trip' && valid(v.destination,q.destinations,true) && valid(v.when,q.timings,true) && valid(v.travelers,q.travelers,true) && valid(v.cabin,q.cabins,true) && (v.other == null || typeof v.other === 'string' && v.other.length <= 120)) answers[q.id] = v as Answer
  }
  return cleanAnswers(answers)
}
