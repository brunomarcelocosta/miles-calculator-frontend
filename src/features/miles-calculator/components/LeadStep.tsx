import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/config/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  LEAD_LIMITS,
  leadFormSchema,
  type LeadFormValues,
} from '@/domain/schemas/leadSubmission'
import type { LeadDraft } from '@/features/miles-calculator/types/lead'
import { FormField } from '@/shared/components/FormField'
import { PhoneInput } from '@/shared/components/PhoneInput'

interface LeadStepProps {
  lead: LeadDraft
  onChange: (patch: Partial<LeadDraft>) => void
  onSubmit: (values: LeadFormValues) => void
  busy?: boolean
  error?: string | null
}

/**
 * Captura de contato, na entrada do funil.
 *
 * Tres decisoes de UX que valem explicitar:
 *
 *  - validacao no blur, e nao a cada tecla: apontar "email invalido" enquanto a
 *    pessoa digita a terceira letra e ruido, nao ajuda;
 *  - botao **sempre habilitado**. Botao desabilitado sem explicacao e o padrao
 *    que mais gera abandono em formulario: a pessoa nao descobre o que falta.
 *    Clicar valida, mostra todos os erros e joga o foco no primeiro;
 *  - consentimento **implicito** no clique de "Continuar", com aviso e link
 *    para a politica logo acima do botao. O momento do consentimento fica
 *    registrado como `consentAt` no envio — o que a LGPD exige e **quando** ele
 *    foi dado, e reduzir um passo no funil de anuncio derruba menos gente.
 */
export function LeadStep({ lead, onChange, onSubmit, busy = false, error }: LeadStepProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      instagram: lead.instagram,
      honeypot: '',
    },
  })

  const { errors } = form.formState

  /**
   * Persiste o rascunho quando o campo perde o foco.
   *
   * Nao a cada tecla: gravar em `localStorage` a cada letra e desperdicio. No
   * blur, quem sai da aba no meio do formulario volta com o que ja tinha escrito.
   */
  function persistDraft() {
    const values = form.getValues()

    onChange({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      instagram: values.instagram,
    })
  }

  return (
    <div>
      <p className="eyebrow mb-4">Antes de começar</p>

      <h2 className="mb-3 text-[clamp(1.7rem,5.5vw,2.6rem)] leading-[1.1] tracking-[-0.02em]">
        Vamos calcular seu potencial?
      </h2>

      <p className="mb-8 text-travion-muted">
        Precisamos do contato para conversar sobre a estimativa. Leva 20
        segundos.
      </p>

      <form
        noValidate
        onBlur={persistDraft}
        onSubmit={form.handleSubmit((values) => {
          persistDraft()
          onSubmit(values)
        })}
        className="grid gap-5"
      >
        <FormField label="Nome completo" error={errors.fullName?.message}>
          {(field) => (
            <Input
              {...field}
              {...form.register('fullName')}
              autoComplete="name"
              maxLength={LEAD_LIMITS.fullName}
              placeholder="Como podemos te chamar"
            />
          )}
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          {(field) => (
            <Input
              {...field}
              {...form.register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={LEAD_LIMITS.email}
              placeholder="voce@email.com"
            />
          )}
        </FormField>

        <FormField
          label="WhatsApp"
          error={errors.phone?.message}
          hint="Selecione o país e informe seu número com o código de área."
        >
          {(field) => (
            <Controller
              name="phone"
              control={form.control}
              render={({ field: phone }) => (
                <PhoneInput {...field} {...phone} maxLength={LEAD_LIMITS.phone} />
              )}
            />
          )}
        </FormField>

        <FormField label="Instagram" optional error={errors.instagram?.message}>
          {(field) => (
            <Input
              {...field}
              {...form.register('instagram')}
              autoComplete="off"
              maxLength={LEAD_LIMITS.instagram}
              placeholder="@seuperfil"
            />
          )}
        </FormField>

        {/*
          Honeypot: fora da tela e fora da ordem de tabulacao, mas presente no
          HTML. Preenchimento automatico de robo cai aqui e o envio e recusado
          pelo schema, sem CAPTCHA no caminho de quem e humano.
        */}
        <div aria-hidden="true" className="absolute size-px overflow-hidden opacity-0">
          <label htmlFor="lead-website">Site</label>
          <input
            id="lead-website"
            tabIndex={-1}
            autoComplete="off"
            {...form.register('honeypot')}
          />
        </div>

        <div className="grid gap-2">
          <p className="font-sans text-sm text-travion-muted">
            Ao continuar, você autoriza a Travion a usar seus dados para entrar em contato,
            conforme a{' '}
            <Link
              to={ROUTES.PRIVACY}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              política de privacidade
            </Link>
            .
          </p>
        </div>

        {error && <p role="alert" className="text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="mt-2" disabled={busy}>
          {busy ? 'Salvando…' : 'Continuar'}
        </Button>
      </form>
    </div>
  )
}
