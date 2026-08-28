import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CalculatorPage } from '@/features/miles-calculator/pages/CalculatorPage'

/**
 * A pagina cria e atualiza o lead na API conforme o funil avanca. Estes testes
 * cobrem navegacao e formulario, não a integracao — o cliente HTTP fica
 * interceptado para a suite nao depender de rede.
 */
vi.mock('@/features/miles-calculator/api/leadsApi', () => ({
  createLead: vi.fn().mockResolvedValue({ id: 'lead-de-teste' }),
  updateLeadStep: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  window.localStorage.clear()
})

/**
 * A etapa de lead usa `Link` para a politica, então precisa de um Router; a
 * criacao do lead usa `useMutation`, então precisa de um QueryClient.
 *
 * O cliente e criado por render para que cache de um teste nao vaze no outro, e
 * com `retry: false` para a falha aparecer na hora em vez de depois de esperas.
 */
function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Simula recarregar a pagina: desmonta e monta de novo. */
function reload(view: { unmount: () => void }) {
  view.unmount()
  return renderPage()
}

type User = ReturnType<typeof userEvent.setup>

async function fillLeadForm(user: User, overrides: Partial<Record<string, string>> = {}) {
  await user.type(screen.getByLabelText('Nome completo'), overrides.fullName ?? 'Ana Souza')
  await user.type(screen.getByLabelText('Email'), overrides.email ?? 'ana@travion.com.br')
  await user.type(screen.getByLabelText('WhatsApp'), overrides.phone ?? '12997643952')
  await user.click(screen.getByRole('checkbox'))
}

/** Vai de boas-vindas ate a primeira pergunta, passando pelo lead. */
async function goToFirstQuestion(user: User) {
  await user.click(screen.getByRole('button', { name: 'Começar agora' }))
  await fillLeadForm(user)
  await user.click(screen.getByRole('button', { name: 'Continuar' }))

  await waitFor(() =>
    expect(screen.getByRole('heading', { name: /cartão de crédito pessoal/i })).toBeInTheDocument(),
  )
}

describe('CalculatorPage', () => {
  it('abre em boas-vindas, sem progresso nem botao de voltar', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: /Quantos pontos você deveria estar acumulando/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument()
  })

  it('navega de boas-vindas para a etapa de lead', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Começar agora' }))

    expect(
      screen.getByRole('heading', { name: /Para onde enviamos o seu resultado/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('mostra o progresso só nas perguntas', async () => {
    const user = userEvent.setup()
    renderPage()
    await goToFirstQuestion(user)

    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Pergunta 1 de 10')
    expect(screen.getByText('Pergunta 1 de 10')).toBeInTheDocument()
  })

  it('avanca sozinho ao selecionar uma opcao', async () => {
    const user = userEvent.setup()
    renderPage()
    await goToFirstQuestion(user)

    await user.click(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /cartão da sua empresa/i })).toBeInTheDocument(),
    )
    expect(screen.getByText('Pergunta 2 de 10')).toBeInTheDocument()
  })

  it('volta para a pergunta anterior mantendo a resposta marcada', async () => {
    const user = userEvent.setup()
    renderPage()
    await goToFirstQuestion(user)

    await user.click(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /cartão da sua empresa/i })).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(screen.getByRole('heading', { name: /cartão de crédito pessoal/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' })).toBeChecked()
  })

  describe('etapa de lead', () => {
    async function goToLead(user: User) {
      renderPage()
      await user.click(screen.getByRole('button', { name: 'Começar agora' }))
    }

    it('mantem o botao habilitado antes do preenchimento', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
    })

    it('nao avanca e lista os erros ao enviar vazio', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      await user.click(screen.getByRole('button', { name: 'Continuar' }))

      expect(await screen.findByText('Informe o seu nome.')).toBeInTheDocument()
      expect(screen.getByText('Informe o seu email.')).toBeInTheDocument()
      expect(screen.getByText('Informe o seu WhatsApp.')).toBeInTheDocument()
      expect(
        screen.getByText('Precisamos do seu consentimento para entrar em contato.'),
      ).toBeInTheDocument()

      // Continua na etapa de lead.
      expect(
        screen.getByRole('heading', { name: /Para onde enviamos o seu resultado/i }),
      ).toBeInTheDocument()
    })

    it('valida no blur, sem acusar erro durante a digitacao', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      const email = screen.getByLabelText('Email')
      await user.type(email, 'ana@')

      expect(screen.queryByText('Esse email não parece válido.')).not.toBeInTheDocument()

      await user.tab()

      expect(await screen.findByText('Esse email não parece válido.')).toBeInTheDocument()
    })

    it('liga o erro ao campo pelo aria-describedby', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      await user.click(screen.getByRole('button', { name: 'Continuar' }))
      await screen.findByText('Informe o seu nome.')

      const name = screen.getByLabelText('Nome completo')

      expect(name).toHaveAttribute('aria-invalid', 'true')
      expect(name).toHaveAccessibleDescription(/Informe o seu nome/)
    })

    it('exige sobrenome', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      await user.type(screen.getByLabelText('Nome completo'), 'Ana')
      await user.tab()

      expect(await screen.findByText('Informe nome e sobrenome.')).toBeInTheDocument()
    })

    it('aplica a mascara brasileira no telefone enquanto digita', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      const phone = screen.getByLabelText('WhatsApp')

      await user.type(phone, '12')
      expect(phone).toHaveValue('(12')

      await user.type(phone, '9976')
      expect(phone).toHaveValue('(12) 9976')

      await user.type(phone, '43952')
      expect(phone).toHaveValue('(12) 99764-3952')
    })

    it('descarta digito excedente no telefone', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      const phone = screen.getByLabelText('WhatsApp')
      await user.type(phone, '129976439529999')

      expect(phone).toHaveValue('(12) 99764-3952')
    })

    it('recusa telefone incompleto', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      await user.type(screen.getByLabelText('WhatsApp'), '1299')
      await user.tab()

      expect(
        await screen.findByText('Informe DDD e número, como (12) 99764-3952.'),
      ).toBeInTheDocument()
    })

    it('trata o Instagram como opcional', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      expect(screen.getByLabelText(/Instagram/)).toBeInTheDocument()
      expect(screen.getByText('(opcional)')).toBeInTheDocument()

      await fillLeadForm(user)
      await user.click(screen.getByRole('button', { name: 'Continuar' }))

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: /cartão de crédito pessoal/i }),
        ).toBeInTheDocument(),
      )
    })

    it('oferece o consentimento com link para a politica', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      const link = screen.getByRole('link', { name: 'política de privacidade' })

      expect(link).toHaveAttribute('href', '/privacidade')
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('nao avanca sem consentimento, mesmo com o resto preenchido', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
      await user.type(screen.getByLabelText('Email'), 'ana@travion.com.br')
      await user.type(screen.getByLabelText('WhatsApp'), '12997643952')
      await user.click(screen.getByRole('button', { name: 'Continuar' }))

      expect(
        await screen.findByText('Precisamos do seu consentimento para entrar em contato.'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: /Para onde enviamos o seu resultado/i }),
      ).toBeInTheDocument()
    })

    it('mantem o honeypot fora da ordem de tabulacao', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      const honeypot = screen.getByLabelText('Site', { selector: 'input' })

      expect(honeypot).toHaveAttribute('tabindex', '-1')
      expect(honeypot).toHaveValue('')
    })

    it('recusa o envio quando o honeypot vem preenchido', async () => {
      const user = userEvent.setup()
      await goToLead(user)

      await fillLeadForm(user)
      // Robo de preenchimento automatico cairia exatamente aqui.
      await user.type(screen.getByLabelText('Site', { selector: 'input' }), 'http://spam.example')
      await user.click(screen.getByRole('button', { name: 'Continuar' }))

      expect(
        screen.getByRole('heading', { name: /Para onde enviamos o seu resultado/i }),
      ).toBeInTheDocument()
    })

    it('preserva o que foi digitado depois de recarregar', async () => {
      const user = userEvent.setup()
      const view = renderPage()

      await user.click(screen.getByRole('button', { name: 'Começar agora' }))
      await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
      await user.type(screen.getByLabelText('Email'), 'ana@travion.com.br')
      // Sair do campo e o que grava o rascunho.
      await user.tab()

      reload(view)

      expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza')
      expect(screen.getByLabelText('Email')).toHaveValue('ana@travion.com.br')
    })

    it('preserva o preenchimento ao voltar da primeira pergunta', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      await user.click(screen.getByRole('button', { name: 'Anterior' }))

      expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza')
      expect(screen.getByLabelText('WhatsApp')).toHaveValue('(12) 99764-3952')
      expect(screen.getByRole('checkbox')).toBeChecked()
    })
  })

  it('retoma no passo onde parou depois de recarregar', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await goToFirstQuestion(user)

    await user.click(screen.getByRole('radio', { name: 'Acima de R$ 26 mil' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /cartão da sua empresa/i })).toBeInTheDocument(),
    )

    reload(view)

    // Cai direto na segunda pergunta, sem passar por boas-vindas nem pelo lead.
    expect(screen.getByRole('heading', { name: /cartão da sua empresa/i })).toBeInTheDocument()
    expect(screen.getByText('Pergunta 2 de 10')).toBeInTheDocument()
  })

  it('preserva a resposta anterior depois de recarregar', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await goToFirstQuestion(user)

    await user.click(screen.getByRole('radio', { name: 'Acima de R$ 26 mil' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /cartão da sua empresa/i })).toBeInTheDocument(),
    )

    reload(view)
    await user.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(screen.getByRole('radio', { name: 'Acima de R$ 26 mil' })).toBeChecked()
  })

  describe('acessibilidade do grupo de opcoes', () => {
    it('expoe as opcoes como radiogroup nomeado pela pergunta', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      expect(screen.getByRole('radiogroup')).toHaveAccessibleName(
        /cartão de crédito pessoal/i,
      )
      expect(screen.getAllByRole('radio')).toHaveLength(4)
    })

    it('nao marca nenhuma opcao antes da escolha', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).not.toBeChecked()
      }
    })

    it('o grupo inteiro e um unico ponto de parada do Tab', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      const radios = screen.getAllByRole('radio')

      expect(radios[0]).toHaveAttribute('tabindex', '0')
      expect(radios[1]).toHaveAttribute('tabindex', '-1')
      expect(radios[3]).toHaveAttribute('tabindex', '-1')
    })

    it('a seta move o foco sem selecionar, para nao avancar sem querer', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      const radios = screen.getAllByRole('radio')
      radios[0]!.focus()

      await user.keyboard('{ArrowDown}')

      expect(radios[1]).toHaveFocus()
      expect(radios[1]).not.toBeChecked()
      expect(screen.getByText('Pergunta 1 de 10')).toBeInTheDocument()
    })

    it('a seta circula nas pontas do grupo', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      const radios = screen.getAllByRole('radio')
      radios[0]!.focus()

      await user.keyboard('{ArrowUp}')
      expect(radios[3]).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(radios[0]).toHaveFocus()
    })

    it('Home e End vao para a primeira e a ultima opcao', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      const radios = screen.getAllByRole('radio')
      radios[1]!.focus()

      await user.keyboard('{End}')
      expect(radios[3]).toHaveFocus()

      await user.keyboard('{Home}')
      expect(radios[0]).toHaveFocus()
    })

    it('ao voltar, o Tab cai direto na opcao ja escolhida', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      await user.click(screen.getByRole('radio', { name: 'Acima de R$ 26 mil' }))
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: /cartão da sua empresa/i }),
        ).toBeInTheDocument(),
      )

      await user.click(screen.getByRole('button', { name: 'Anterior' }))

      const radios = screen.getAllByRole('radio')
      expect(radios[3]).toHaveAttribute('tabindex', '0')
      expect(radios[0]).toHaveAttribute('tabindex', '-1')
    })

    it('Enter seleciona e avanca', async () => {
      const user = userEvent.setup()
      renderPage()
      await goToFirstQuestion(user)

      screen.getAllByRole('radio')[2]!.focus()
      await user.keyboard('{Enter}')

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: /cartão da sua empresa/i }),
        ).toBeInTheDocument(),
      )
    })
  })

  // Estes dois exercitam o funil inteiro com temporizadores reais: dez avancos de
  // 250ms mais a pausa de calculo. O limite padrao de 5s nao cabe.
  it('percorre as treze telas do funil de ponta a ponta', { timeout: 30_000 }, async () => {
    const user = userEvent.setup()
    renderPage()
    await goToFirstQuestion(user)

    for (let question = 1; question <= 10; question += 1) {
      expect(screen.getByText(`Pergunta ${question} de 10`)).toBeInTheDocument()

      await user.click(screen.getAllByRole('radio')[0]!)

      // Esperar o contador virar e o que garante que o avanco automatico
      // aconteceu antes do proximo clique.
      if (question < 10) {
        await waitFor(() =>
          expect(screen.getByText(`Pergunta ${question + 1} de 10`)).toBeInTheDocument(),
        )
      }
    }

    // A ultima resposta cai na tela de resultado, que abre no estado de calculo.
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    // A pausa deliberada antes de revelar e maior que o padrao do waitFor.
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { name: /você deveria estar acumulando/i }),
        ).toBeInTheDocument(),
      { timeout: 4_000 },
    )

    expect(screen.getByText('pontos por ano')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Falar com um especialista/ }),
    ).toBeInTheDocument()
  })

  it('refazer o quiz volta para boas-vindas e limpa as respostas', { timeout: 30_000 }, async () => {
    const user = userEvent.setup()
    renderPage()
    await goToFirstQuestion(user)

    for (let question = 1; question <= 10; question += 1) {
      await user.click(screen.getAllByRole('radio')[0]!)

      if (question < 10) {
        await waitFor(() =>
          expect(screen.getByText(`Pergunta ${question + 1} de 10`)).toBeInTheDocument(),
        )
      }
    }

    await waitFor(
      () => expect(screen.getAllByRole('button', { name: 'Refazer o quiz' })[0]).toBeInTheDocument(),
      { timeout: 4_000 },
    )

    await user.click(screen.getAllByRole('button', { name: 'Refazer o quiz' })[0]!)

    expect(
      screen.getByRole('heading', { name: /Quantos pontos você deveria estar acumulando/i }),
    ).toBeInTheDocument()

    // O rascunho do lead tambem foi descartado.
    await user.click(screen.getByRole('button', { name: 'Começar agora' }))
    expect(screen.getByLabelText('Nome completo')).toHaveValue('')
  })
})
