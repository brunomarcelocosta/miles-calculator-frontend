import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Answer, DiagnosticQuestion, Option } from './model'

export function QuestionStep({
  question: q,
  value,
  submit,
  busy,
}: {
  question: DiagnosticQuestion
  value?: Answer
  submit: (v: Answer) => void
  busy: boolean
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    typeof value === 'object' ? value : {},
  )
  const [error, setError] = useState('')
  const patch = (key: string, v: unknown) =>
    setDraft((d) => ({ ...d, [key]: v }))
  const select = (label: string, key: string, options: Option[] = []) => (
    <label className="grid gap-2 text-sm">
      {label}
      <select
        aria-label={label}
        className="min-h-13 rounded-lg border border-input bg-card px-3 text-base"
        value={String(draft[key] ?? '')}
        onChange={(e) => patch(key, e.target.value || null)}
      >
        <option value="">Ainda não sei / pular</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
  return (
    <div className="grid gap-5">
      <h2 className="text-3xl leading-tight">{q.title}</h2>
      {q.helper && <p className="text-travion-muted">{q.helper}</p>}
      {q.kind === 'single' && (
        <div className="grid gap-3" role="group" aria-label={q.title}>
          {q.options?.map((o) => (
            <Button
              key={o.id}
              variant={value === o.id ? 'accent' : 'outline'}
              className="h-auto min-h-13 justify-start whitespace-normal text-left"
              disabled={busy}
              onClick={() => submit(o.id)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      )}
      {q.kind === 'card' && (
        <>
          <fieldset className="grid gap-3">
            <legend className="sr-only">Concentração dos gastos</legend>
            {q.options?.map((o) => (
              <label
                key={o.id}
                className="flex min-h-13 items-center gap-3 rounded-lg border border-input p-3"
              >
                <input
                  type="radio"
                  name="concentration"
                  checked={draft.concentration === o.id}
                  disabled={busy}
                  onChange={() =>
                    setDraft({
                      ...draft,
                      concentration: o.id,
                      issuer: o.id === 'none' ? null : draft.issuer,
                    })
                  }
                />
                {o.label}
              </label>
            ))}
          </fieldset>
          {draft.concentration && draft.concentration !== 'none'
            ? select('Banco do cartão principal (opcional)', 'issuer', q.banks)
            : null}
          <Button
            disabled={busy}
            onClick={() => {
              if (!draft.concentration) {
                setError('Escolha como usa seus cartões.')
                return
              }
              submit({
                concentration: String(draft.concentration),
                issuer: draft.issuer ? String(draft.issuer) : null,
              })
            }}
          >
            Continuar
          </Button>
        </>
      )}
      {q.kind === 'points' && (
        <>
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Programas de pontos</legend>
            {q.options?.map((o) => {
              const selected = (draft.programs ?? []) as string[]
              return (
                <label
                  key={o.id}
                  className="flex min-h-13 items-center gap-2 rounded-lg border border-input p-3"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    disabled={busy}
                    onChange={(e) =>
                      patch(
                        'programs',
                        e.target.checked
                          ? o.id === 'Não sei o programa'
                            ? [o.id]
                            : [
                                ...selected.filter(
                                  (v) => v !== 'Não sei o programa',
                                ),
                                o.id,
                              ]
                          : selected.filter((v) => v !== o.id),
                      )
                    }
                  />
                  {o.label}
                </label>
              )
            })}
          </fieldset>
          {select('Saldo total aproximado (opcional)', 'amount', q.amounts)}
          <Button
            disabled={busy}
            onClick={() =>
              submit({
                programs: (draft.programs ?? []) as string[],
                amount: draft.amount ? String(draft.amount) : null,
              })
            }
          >
            Continuar
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => submit({ programs: [], amount: null })}
          >
            Pular
          </Button>
        </>
      )}
      {q.kind === 'trip' && (
        <>
          {select('Destino', 'destination', q.destinations)}
          {draft.destination === 'Outro' && (
            <label className="grid gap-2 text-sm">
              Qual destino?
              <Input
                maxLength={120}
                value={String(draft.other ?? '')}
                onChange={(e) => patch('other', e.target.value)}
              />
            </label>
          )}
          {select('Quando pretende viajar?', 'when', q.timings)}
          {select('Quantas pessoas?', 'travelers', q.travelers)}
          {select('Classe desejada', 'cabin', q.cabins)}
          <Button
            disabled={busy}
            onClick={() =>
              submit({
                destination: draft.destination
                  ? String(draft.destination)
                  : null,
                other:
                  draft.destination === 'Outro'
                    ? String(draft.other ?? '') || null
                    : null,
                when: draft.when ? String(draft.when) : null,
                travelers: draft.travelers ? String(draft.travelers) : null,
                cabin: draft.cabin ? String(draft.cabin) : null,
              })
            }
          >
            Continuar
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              submit({
                destination: null,
                other: null,
                when: null,
                travelers: null,
                cabin: null,
              })
            }
          >
            Pular
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
