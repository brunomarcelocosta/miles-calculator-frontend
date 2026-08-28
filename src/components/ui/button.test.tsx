import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renderiza o rotulo como botao acessivel', () => {
    render(<Button>Começar agora</Button>)

    expect(screen.getByRole('button', { name: 'Começar agora' })).toBeInTheDocument()
  })

  it('usa o formato pill da marca e a altura de 52px por padrao', () => {
    render(<Button>Começar agora</Button>)

    const button = screen.getByRole('button', { name: 'Começar agora' })

    expect(button).toHaveClass('rounded-full')
    expect(button).toHaveClass('h-13')
  })

  it('aplica a altura de alvo de toque de 56px no tamanho lg', () => {
    render(
      <Button size="lg">
        Até R$ 10 mil
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Até R$ 10 mil' })).toHaveClass('h-touch')
  })

  it('dispara onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Avançar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('nao dispara onClick quando desabilitado', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
