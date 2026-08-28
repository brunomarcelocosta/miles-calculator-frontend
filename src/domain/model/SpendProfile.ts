import type { SpendBucketId, TravelStyle } from '@/domain/model/QuizAnswers'

/**
 * Volume de gasto em R$ por balde, dentro de **um** cenario.
 *
 * O sufixo do nome fixa a periodicidade e evita o erro classico de somar um
 * valor mensal com um anual: `cardPfMonthly` e por mes, `retailAnnual` e por ano.
 */
export interface SpendBuckets {
  cardPfMonthly: number
  cardPjMonthly: number
  uberMonthly: number
  ifoodMonthly: number
  retailAnnual: number
  travelAnnual: number
}

/**
 * Os dois cenarios derivados das respostas.
 *
 * Como o quiz pergunta faixas, e nao valores exatos, cada resposta carrega um
 * intervalo. O piso de todos os intervalos forma o cenario conservador e o teto
 * forma o otimista — e isso, e nao um percentual fixo, que produz a faixa larga
 * do resultado.
 */
export interface SpendProfile {
  floor: SpendBuckets
  ceiling: SpendBuckets
  travelStyle: TravelStyle
}

/** Mapeia o id do balde para o campo correspondente em `SpendBuckets`. */
export const SPEND_BUCKET_FIELD: Record<SpendBucketId, keyof SpendBuckets> = {
  cardPf: 'cardPfMonthly',
  cardPj: 'cardPjMonthly',
  uber: 'uberMonthly',
  ifood: 'ifoodMonthly',
  retailAnnual: 'retailAnnual',
  travelAnnual: 'travelAnnual',
}

export function emptySpendBuckets(): SpendBuckets {
  return {
    cardPfMonthly: 0,
    cardPjMonthly: 0,
    uberMonthly: 0,
    ifoodMonthly: 0,
    retailAnnual: 0,
    travelAnnual: 0,
  }
}
