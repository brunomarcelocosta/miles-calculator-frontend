import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/config/routes'
import { TravionLogo } from '@/shared/components/TravionLogo'

/**
 * O aviso de consentimento do formulario de lead aponta para ca. Captar
 * contato para abordagem comercial sem base legal declarada e exposicao LGPD
 * desnecessaria numa pagina que roda anuncio.
 *
 * O texto abaixo e uma base tecnica, nao peca juridica revisada: vale passar
 * por advogado antes de rodar campanha.
 */
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex min-h-24 w-[min(100%-2rem,45rem)] items-center">
          <Link to={ROUTES.ROOT} aria-label="Voltar para a calculadora">
            <TravionLogo />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-[min(100%-2rem,45rem)] py-16">
        <h1 className="mb-6 text-[clamp(2rem,6vw,3rem)] leading-tight">
          Política de privacidade
        </h1>

        <div className="space-y-6 text-travion-muted">
          <section>
            <h2 className="mb-2 text-xl text-foreground">Quais dados coletamos</h2>
            <p>
              Nome, email e telefone informados por você no formulário da calculadora, o
              Instagram quando preenchido, as respostas do questionário e a estimativa
              calculada. Registramos também a origem da visita (parâmetros de campanha e
              página de referência) e uma versão irreversível do seu endereço IP.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl text-foreground">Para que usamos</h2>
            <p>
              Para entrar em contato com a proposta de gestão de milhas da Travion e para
              entender quais campanhas trazem pessoas com o perfil certo. Não vendemos nem
              compartilhamos seus dados com terceiros para fins publicitários.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl text-foreground">Base legal</h2>
            <p>
              O tratamento se dá pelo seu consentimento, registrado no momento do envio do
              formulário, conforme o art. 7º, I da Lei 13.709/2018 (LGPD).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl text-foreground">Seus direitos</h2>
            <p>
              Você pode pedir acesso, correção ou exclusão dos seus dados, e revogar o
              consentimento a qualquer momento. Para isso, fale com a gente pelo WhatsApp ou
              pelo email de contato da Travion.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl text-foreground">Por quanto tempo guardamos</h2>
            <p>
              Mantemos os dados enquanto houver relação comercial ou interesse ativo, e os
              eliminamos após a revogação do consentimento.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link to={ROUTES.ROOT} className="underline underline-offset-4">
            Voltar para a calculadora
          </Link>
        </p>
      </main>
    </div>
  )
}
