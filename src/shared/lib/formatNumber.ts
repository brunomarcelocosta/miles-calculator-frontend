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

export function formatBrl(value: number): string {
  return currencyFormatter.format(value)
}
