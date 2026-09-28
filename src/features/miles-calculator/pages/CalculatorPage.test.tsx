import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QUESTIONS } from '@/domain/config/questionCatalog'
import { LegacyCalculatorPage as CalculatorPage } from '@/features/miles-calculator/pages/LegacyCalculatorPage'
import { createLead, updateLeadStep, completeLead } from '@/features/miles-calculator/api/leadsApi'

vi.mock('@/features/miles-calculator/api/leadsApi', () => ({
  getQuiz: vi.fn().mockResolvedValue({ version: 1, questions: QUESTIONS }),
  createLead: vi.fn().mockResolvedValue({ id: 'lead-de-teste' }),
  updateLeadStep: vi.fn().mockResolvedValue(undefined),
  completeLead: vi.fn().mockResolvedValue({
    estimate: {
      min: { annualPoints: 10000, basePoints: 10000, transferBonusPoints: 0, contributions: [] },
      max: { annualPoints: 20000, basePoints: 16000, transferBonusPoints: 4000, contributions: [] },
    },
    recommendations: [],
    travelStyle: 'beach',
  }),
}))

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
})

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><CalculatorPage /></MemoryRouter></QueryClientProvider>)
}

async function selectCountry(user: ReturnType<typeof userEvent.setup>, country: string) {
  await user.click(screen.getByRole('combobox', { name: 'País do WhatsApp' }))
  const names: Record<string, string> = { BR: 'Brasil', CA: 'Canadá', PT: 'Portugal' }
  await user.type(await screen.findByRole('combobox', { name: 'Pesquisar país ou código' }), names[country]!)
  await user.click(screen.getByRole('option', { name: new RegExp(names[country]!) }))
}

async function enterLead(user: ReturnType<typeof userEvent.setup>, phone = '12997643952', country = 'BR') {
  await screen.findByRole('button', { name: 'Começar agora' })
  await user.click(screen.getByRole('button', { name: 'Começar agora' }))
  await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
  await user.type(screen.getByLabelText('Email'), 'ana@travion.com.br')
  await selectCountry(user, country)
  await user.type(screen.getByLabelText('WhatsApp'), phone)
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByRole('heading', { name: /cartão de crédito pessoal/i })
}

describe('CalculatorPage com backend como fonte do resultado', () => {
  it('abre o catálogo remoto e registra o lead antes das perguntas', async () => {
    const user = userEvent.setup()
    renderPage()
    await enterLead(user)
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({
      email: 'ana@travion.com.br',
      phone: '+5512997643952',
      submissionId: expect.any(String),
    }))
    expect(screen.getByText('Pergunta 1 de 9')).toBeInTheDocument()
  })

  it.each([
    ['+1 (416) 555-0123', '+14165550123'],
    ['+44 7911 123456', '+447911123456'],
    ['+351 912 345 678', '+351912345678'],
  ])('envia o número internacional %s completo', async (phone, expected) => {
    const user = userEvent.setup()
    renderPage()
    await enterLead(user, phone)
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ phone: expected }))
    expect(JSON.parse(window.localStorage.getItem('travion:miles-calculator:lead:v1')!))
      .toEqual(expect.objectContaining({ phone: expected }))
  })

  it.each([
    ['BR', '12997643952', '(12) 99764-3952', '+5512997643952'],
    ['CA', '4165550123', '(416) 555-0123', '+14165550123'],
    ['PT', '912345678', '912 345 678', '+351912345678'],
  ])('formata e envia o número nacional com o país %s', async (country, phone, formatted, expected) => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Começar agora' }))
    await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
    await user.type(screen.getByLabelText('Email'), 'ana@travion.com.br')
    await selectCountry(user, country)
    await user.type(screen.getByLabelText('WhatsApp'), phone)
    expect(screen.getByLabelText('WhatsApp')).toHaveValue(formatted)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('heading', { name: /cartão de crédito pessoal/i })
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ phone: expected }))
  })

  it('mantém o número internacional e o identificador ao repetir um envio que falhou', async () => {
    vi.mocked(createLead).mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Começar agora' }))
    await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
    await user.type(screen.getByLabelText('Email'), 'ana@travion.com.br')
    await user.type(screen.getByLabelText('WhatsApp'), '+1 (416) 555-0123')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('alert')
    const firstSubmission = vi.mocked(createLead).mock.calls[0]![0]
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('heading', { name: /cartão de crédito pessoal/i })
    expect(createLead).toHaveBeenLastCalledWith(expect.objectContaining({
      phone: '+14165550123', submissionId: firstSubmission.submissionId,
    }))
  })

  it('só avança quando a resposta foi salva', async () => {
    const user = userEvent.setup()
    renderPage()
    await enterLead(user)
    await user.click(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' }))
    await waitFor(() => expect(updateLeadStep).toHaveBeenCalledWith('lead-de-teste', { step: 'cardPf', answer: 'pf_16_25k' }))
    await screen.findByRole('heading', { name: /cartão da sua empresa/i })
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' })).toBeChecked()
  })

  it('mantém a pergunta e permite repetir uma resposta que falhou', async () => {
    vi.mocked(updateLeadStep).mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderPage()
    await enterLead(user)
    await user.click(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('heading', { name: /cartão de crédito pessoal/i })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'R$ 16 mil a R$ 25 mil' }))
    await screen.findByRole('heading', { name: /cartão da sua empresa/i })
  })

  it('envia as nove respostas e mostra o resultado retornado pela API', { timeout: 20000 }, async () => {
    const user = userEvent.setup()
    renderPage()
    await enterLead(user)
    for (let index = 0; index < QUESTIONS.length; index++) {
      await user.click(screen.getAllByRole('radio')[0]!)
      if (index < QUESTIONS.length - 1) await screen.findByText(`Pergunta ${index + 2} de 9`)
    }
    await waitFor(() => expect(completeLead).toHaveBeenCalledWith('lead-de-teste'))
    await screen.findByText('milhas por ano', {}, { timeout: 4000 })
    expect(screen.getByRole('link', { name: /Falar com um especialista/ })).toBeInTheDocument()
  })
})
