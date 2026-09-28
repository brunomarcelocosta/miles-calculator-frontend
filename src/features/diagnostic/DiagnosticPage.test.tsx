import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { DiagnosticPage } from './DiagnosticPage'
import { createDiagnostic, saveAnswer, finishDiagnostic } from './api'
import { catalog, cleanAnswers, visibleQuestions } from './model'
vi.mock('./api', () => ({
  createDiagnostic: vi.fn().mockResolvedValue({ id: 'diagnostic-lead' }),
  saveAnswer: vi.fn().mockResolvedValue(undefined),
  finishDiagnostic: vi
    .fn()
    .mockResolvedValue({
      version: 2,
      segment: 'educate',
      priority: 'initial',
      summary: 'Perfil',
      conclusion: 'Seu primeiro passo é identificar onde pode acumular pontos.',
      indicators: [
        { label: 'Gastos', value: 'Até R$ 5 mil', level: 'Primeiros passos' },
      ],
    }),
}))
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
function show() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <DiagnosticPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
async function start() {
  const user = userEvent.setup()
  show()
  await user.click(
    screen.getByRole('button', { name: 'Descobrir meu potencial' }),
  )
  await user.type(screen.getByLabelText('Como podemos te chamar?'), 'Ana')
  await user.click(screen.getByLabelText('E-mail'))
  await user.type(
    screen.getByLabelText('E-mail', { selector: 'input[type=email]' }),
    'ana@example.com',
  )
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByRole('heading', { name: catalog.questions[0]!.title })
  return user
}
it('shows welcome instantly and captures only the preferred contact', async () => {
  await start()
  expect(createDiagnostic).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      fullName: 'Ana',
      channel: 'email',
      email: 'ana@example.com',
      phone: '',
    }),
    expect.any(Object),
  )
  expect(screen.queryByText(/Pergunta \d/)).toBeNull()
})
it('finishes the short path with useful conclusion and a team contact promise', async () => {
  const user = await start()
  await user.click(screen.getByRole('button', { name: '1 vez por ano' }))
  await user.click(
    screen.getByRole('button', { name: 'Direto com a companhia aérea' }),
  )
  await user.click(screen.getByRole('button', { name: 'Até R$ 5 mil' }))
  await user.click(screen.getByLabelText('Sim, quase tudo em um cartão'))
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(
    screen.getByRole('button', { name: 'Não sei como funciona' }),
  )
  await user.click(screen.getByRole('button', { name: 'Sim' }))
  expect(
    screen.queryByRole('heading', { name: 'Onde você possui pontos?' }),
  ).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Ainda não' }))
  await screen.findByText(
    'Seu primeiro passo é identificar onde pode acumular pontos.',
  )
  expect(
    screen.getByText(/Nossa equipe entrará em contato pelo e-mail/),
  ).toBeTruthy()
  expect(saveAnswer).toHaveBeenCalledTimes(7)
  expect(finishDiagnostic).toHaveBeenCalledWith('diagnostic-lead')
})
it('does not advance on failed save and retries without losing contact', async () => {
  vi.mocked(saveAnswer).mockRejectedValueOnce(new Error('offline'))
  const user = await start()
  await user.click(screen.getByRole('button', { name: '1 vez por ano' }))
  await screen.findByRole('alert')
  expect(
    screen.getByRole('heading', { name: catalog.questions[0]!.title }),
  ).toBeTruthy()
  await user.click(screen.getByRole('button', { name: '1 vez por ano' }))
  await screen.findByRole('heading', { name: catalog.questions[1]!.title })
  expect(saveAnswer).toHaveBeenCalledTimes(2)
})
it('keeps submission identity when contact saving fails', async () => {
  vi.mocked(createDiagnostic).mockRejectedValueOnce(new Error('offline'))
  const user = userEvent.setup()
  show()
  await user.click(
    screen.getByRole('button', { name: 'Descobrir meu potencial' }),
  )
  await user.type(screen.getByLabelText('Como podemos te chamar?'), 'Ana')
  await user.click(screen.getByLabelText('E-mail'))
  await user.type(
    screen.getByLabelText('E-mail', { selector: 'input[type=email]' }),
    'ana@example.com',
  )
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByRole('alert')
  const id = vi.mocked(createDiagnostic).mock.calls[0]![0]
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await waitFor(() =>
    expect(createDiagnostic).toHaveBeenLastCalledWith(
      id,
      expect.anything(),
      expect.anything(),
    ),
  )
})
it('clears hidden answers while retaining the valid branch', () => {
  const a = {
    pointsRelationship: 'none',
    hasPoints: 'yes',
    tripInMind: 'no',
    pointsProfile: { programs: ['Livelo'], amount: null },
    tripDetails: {
      destination: 'Europa',
      other: null,
      when: null,
      travelers: null,
      cabin: null,
    },
  }
  expect(cleanAnswers(a)).not.toHaveProperty('pointsProfile')
  expect(cleanAnswers(a)).not.toHaveProperty('tripDetails')
  expect(
    visibleQuestions({
      ...a,
      pointsRelationship: 'sometimes',
      tripInMind: 'yes',
    }),
  ).toHaveLength(9)
})
