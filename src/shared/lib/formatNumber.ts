const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/** Pontos e milhas sempre com separador de milhar e sem decimal. */
export function formatPoints(value: number): string {
  return integerFormatter.format(Math.round(value))
}

/**
 * Arredonda para a centena mais proxima antes de formatar.
 *
 * A estimativa e uma faixa aproximada, nao um extrato: exibir "193.800 a
 * 405.200" comunica ordem de grandeza sem fingir precisao de unidade que o
 * calculo nao tem. Vendas pediu esse arredondamento no numero de destaque.
 */
export function formatPointsRounded(value: number): string {
  return integerFormatter.format(Math.round(value / 100) * 100)
}

export function formatBrl(value: number): string {
  return currencyFormatter.format(value)
}
