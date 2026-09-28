import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/shared/components/FormField'
import { PhoneInput } from '@/shared/components/PhoneInput'
import { normalizePhone } from '@/domain/lib/internationalPhone'
import type { Contact } from './model'

export function ContactStep({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: Contact
  onChange: (v: Contact) => void
  onSubmit: (v: Contact) => void
  busy: boolean
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const update = (patch: Partial<Contact>) => onChange({ ...value, ...patch })
  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (new FormData(e.currentTarget).get('website')) return
        const next: Record<string, string> = {}
        if (value.fullName.trim().length < 2)
          next.fullName = 'Informe como podemos te chamar.'
        const phone = normalizePhone(value.phone)
        if (value.channel === 'whatsapp' && !phone)
          next.phone = 'Informe um WhatsApp válido para o país selecionado.'
        if (
          value.channel === 'email' &&
          !z.email().safeParse(value.email.trim()).success
        )
          next.email = 'Informe um e-mail válido.'
        setErrors(next)
        if (!Object.keys(next).length)
          onSubmit({
            ...value,
            fullName: value.fullName.trim(),
            phone: value.channel === 'whatsapp' ? phone! : '',
            email:
              value.channel === 'email' ? value.email.trim().toLowerCase() : '',
          })
      }}
    >
      <h2 className="text-3xl">Vamos conhecer seu perfil?</h2>
      <p className="text-travion-muted">
        São 7 perguntas principais, com detalhes opcionais. Nossa equipe entrará
        em contato pelo canal que você escolher.
      </p>
      <FormField label="Como podemos te chamar?" error={errors.fullName}>
        {(field) => (
          <Input
            {...field}
            name="fullName"
            autoComplete="given-name"
            maxLength={160}
            value={value.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
          />
        )}
      </FormField>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm">Prefiro receber o contato por:</legend>
        <div className="flex gap-3">
          {(['whatsapp', 'email'] as const).map((channel) => (
            <label
              key={channel}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-4"
            >
              <input
                type="radio"
                name="channel"
                checked={value.channel === channel}
                onChange={() => update({ channel })}
              />
              {channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
            </label>
          ))}
        </div>
      </fieldset>
      {value.channel === 'whatsapp' ? (
        <FormField label="WhatsApp" error={errors.phone}>
          {(field) => (
            <PhoneInput
              {...field}
              value={value.phone}
              onChange={(phone) => update({ phone })}
              maxLength={40}
            />
          )}
        </FormField>
      ) : (
        <FormField label="E-mail" error={errors.email}>
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              maxLength={180}
              value={value.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          )}
        </FormField>
      )}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute size-px opacity-0"
      />
      <p className="text-sm text-travion-muted">
        Ao continuar, você autoriza a Travion a usar seus dados para entrar em
        contato, conforme a{' '}
        <Link to="/privacidade" target="_blank" className="underline">
          política de privacidade
        </Link>
        .
      </p>
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? 'Salvando…' : 'Continuar'}
      </Button>
    </form>
  )
}
