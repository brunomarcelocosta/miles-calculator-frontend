import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PhoneInput } from './PhoneInput'

function Example() {
  const [value, setValue] = useState('')
  return <><PhoneInput aria-label="WhatsApp" value={value} onChange={setValue} /><output data-testid="phone">{value}</output></>
}

describe('busca de países do telefone', () => {
  it.each(['Brasil', 'brasil', '55', '+55', 'BR'])('encontra o Brasil por %s', async query => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('combobox', { name: 'País do WhatsApp' }))
    const search = await screen.findByRole('combobox', { name: 'Pesquisar país ou código' })
    expect(search).toHaveFocus()
    await user.type(search, query)
    expect(screen.getByRole('option', { name: 'Brasil (+55)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Portugal (+351)' })).not.toBeInTheDocument()
  })

  it('busca sem acentos e seleciona pelo teclado mantendo o número', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.type(screen.getByLabelText('WhatsApp'), '4165550123')
    await user.click(screen.getByRole('combobox', { name: 'País do WhatsApp' }))
    await user.type(await screen.findByRole('combobox', { name: 'Pesquisar país ou código' }), 'canada')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.queryByRole('combobox', { name: 'Pesquisar país ou código' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('WhatsApp')).toHaveValue('(416) 555-0123')
    expect(screen.getByTestId('phone')).toHaveTextContent('+14165550123')
  })

  it('mostra busca vazia, fecha com Escape e limpa a busca ao reabrir', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const trigger = screen.getByRole('combobox', { name: 'País do WhatsApp' })
    await user.click(trigger)
    await user.type(await screen.findByRole('combobox', { name: 'Pesquisar país ou código' }), 'zzzz')
    expect(screen.getByText('Nenhum país encontrado.')).toBeVisible()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    expect(await screen.findByRole('combobox', { name: 'Pesquisar país ou código' })).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Brasil (+55)' })).toBeInTheDocument()
  })
})
