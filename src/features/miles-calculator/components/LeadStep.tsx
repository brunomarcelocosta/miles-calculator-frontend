import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/config/routes'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatBrazilianPhone } from '@/domain/lib/brazilianPhone'
import {
  LEAD_LIMITS,
  leadFormSchema,
  type LeadFormValues,
} from '@/domain/schemas/leadSubmission'
import type { LeadDraft } from '@/features/miles-calculator/types/lead'
import { FormField } from '@/shared/components/FormField'

interface LeadStepProps {
  lead: LeadDraft
  onChange: (patch: Partial<LeadDraft>) => void
  onSubmit: (values: LeadFormValues) => void
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
 *  - consentimento explicito com link para a politica. Captar contato para
 *    abordagem comercial sem base legal registrada e exposicao LGPD
 *    desnecessaria numa pagina que vai rodar anuncio.
 */
export function LeadStep({ lead, onChange, onSubmit }: LeadStepProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      instagram: lead.instagram,
      consent: lead.consent,
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
      consent: values.consent === true,
    })
  }

  return (
    <div>
      <p className="eyebrow mb-4">Antes de começar</p>

      <h2 className="mb-3 text-[clamp(1.7rem,5.5vw,2.6rem)] leading-[1.1] tracking-[-0.02em]">
        Para onde enviamos o seu resultado?
      </h2>

      <p className="mb-8 text-travion-muted">
        Precisamos do contato para te mandar a estimativa e conversar sobre ela. Leva 20
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
          hint="É por aqui que um especialista fala com você."
        >
          {(field) => (
            <Input
              {...field}
              {...form.register('phone', {
                // A mascara e aplicada na propria mudanca, para o campo nunca
                // exibir digito solto sem formato.
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  form.setValue('phone', formatBrazilianPhone(event.target.value), {
                    shouldValidate: form.formState.isSubmitted,
                  })
                },
              })}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={LEAD_LIMITS.phone}
              placeholder="(12) 99764-3952"
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
          <div className="flex items-start gap-3">
            <Checkbox
              id="lead-consent"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? 'lead-consent-error' : undefined}
              {...form.register('consent')}
            />

            <label htmlFor="lead-consent" className="font-sans text-sm text-travion-muted">
              Autorizo a Travion a usar meus dados para entrar em contato, conforme a{' '}
              <Link
                to={ROUTES.PRIVACY}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                política de privacidade
              </Link>
              .
            </label>
          </div>

          {errors.consent ? (
            <p id="lead-consent-error" className="text-sm text-destructive">
              {errors.consent.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="mt-2">
          Continuar
        </Button>
      </form>
    </div>
  )
}
