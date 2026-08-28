/**
 * Inspecao manual do motor de calculo, sem abrir navegador.
 *
 * O objetivo e conferir premissa contra realidade: os testes provam que a conta
 * fecha, este script mostra se o numero que ela produz e cre­divel.
 *
 *   npm run estimate
 *   npm run estimate -- --answers cli/fixtures/high-spender.json
 *   npm run estimate -- --usd 6.10
 */
import { readFileSync } from 'node:fs'

import { LocalCalculatorConfigProvider } from '../src/domain/config/CalculatorConfigProvider'
import { QUESTIONS, findOption, getQuestion } from '../src/domain/config/questionCatalog'
import type { QuizAnswers, QuestionId } from '../src/domain/model/QuizAnswers'
import type { SpendBuckets } from '../src/domain/model/SpendProfile'
import { DestinationRecommender } from '../src/domain/services/DestinationRecommender'
import { MilesEstimator } from '../src/domain/services/MilesEstimator'
import { resolveSpendProfile } from '../src/domain/services/SpendProfileResolver'

/** Perfil usado quando nenhum arquivo e informado. */
const DEFAULT_ANSWERS: QuizAnswers = {
  cardPf: 'pf_above_26k',
  cardPj: 'pj_above_20k',
  ifood: 'ifood_above_500',
  retailAnnual: 'retail_above_10k',
  travelAnnual: 'travel_above_10k',
  travelStyle: 'style_beach',
  knowledgeLevel: 'knowledge_basic',
  freeTripsPerYear: 'free_zero',
  managerInterest: 'manager_yes',
}

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)

  if (index === -1) return undefined

  return process.argv[index + 1]
}

function loadAnswers(): { answers: QuizAnswers; source: string } {
  const file = readFlag('answers')

  if (!file) {
    return { answers: DEFAULT_ANSWERS, source: 'perfil de exemplo embutido' }
  }

  const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`${file} nao contem um objeto de respostas.`)
  }

  return { answers: parsed as QuizAnswers, source: file }
}

const points = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
/** A cotacao precisa dos centavos: arredondar 5,40 para 5 esconde a premissa. */
const rate = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function pad(label: string, width = 38): string {
  return label.padEnd(width, '.')
}

function printBuckets(title: string, buckets: SpendBuckets): void {
  console.log(`\n  ${title}`)
  console.log(`    ${pad('cartão PF / mês', 26)} ${brl.format(buckets.cardPfMonthly)}`)
  console.log(`    ${pad('cartão PJ / mês', 26)} ${brl.format(buckets.cardPjMonthly)}`)
  console.log(`    ${pad('transporte app / mês', 26)} ${brl.format(buckets.uberMonthly)}`)
  console.log(`    ${pad('delivery / mês', 26)} ${brl.format(buckets.ifoodMonthly)}`)
  console.log(`    ${pad('varejo / ano', 26)} ${brl.format(buckets.retailAnnual)}`)
  console.log(`    ${pad('viagens / ano', 26)} ${brl.format(buckets.travelAnnual)}`)
}

function main(): void {
  const { answers, source } = loadAnswers()

  const usdOverride = readFlag('usd')
  const configProvider = new LocalCalculatorConfigProvider(
    usdOverride ? { usdRate: Number(usdOverride) } : {},
  )
  const config = configProvider.getConfig()

  const profile = resolveSpendProfile(answers, configProvider)
  const estimate = new MilesEstimator({ configProvider }).estimate(profile)

  console.log('\nEstimativa de pontos — Travion')
  console.log(`  fonte das respostas: ${source}`)
  console.log(`  dólar: ${rate.format(config.usdRate)}   escopo de faixa: ${config.tierScope}`)

  console.log('\n  Respostas')
  for (const question of QUESTIONS) {
    const optionId = answers[question.id as QuestionId]
    const label = optionId
      ? (findOption(getQuestion(question.id), optionId)?.label ?? `? ${optionId}`)
      : '(sem resposta)'

    console.log(`    ${pad(question.id, 18)} ${label}`)
  }

  printBuckets('Cenário mínimo (piso dos intervalos)', profile.floor)
  printBuckets('Cenário máximo (teto dos intervalos)', profile.ceiling)

  for (const [title, scenario, applied] of [
    ['Mínimo', estimate.min, false],
    ['Máximo', estimate.max, true],
  ] as const) {
    console.log(`\n  ${title}`)
    for (const contribution of scenario.contributions) {
      console.log(
        `    ${pad(contribution.label)} ${points.format(contribution.annualPoints).padStart(10)} pts/ano`,
      )
    }
    console.log(`    ${pad('subtotal')} ${points.format(scenario.basePoints).padStart(10)}`)
    console.log(
      `    ${pad(`bônus de transferência${applied ? '' : ' (não aplicado)'}`)} ${points
        .format(scenario.transferBonusPoints)
        .padStart(10)}`,
    )
    console.log(`    ${pad('TOTAL')} ${points.format(scenario.annualPoints).padStart(10)}`)
  }

  const ratio = estimate.min.annualPoints
    ? estimate.max.annualPoints / estimate.min.annualPoints
    : 0

  console.log(
    `\n  Faixa: ${points.format(estimate.min.annualPoints)} a ${points.format(
      estimate.max.annualPoints,
    )} pontos por ano  (${ratio.toFixed(2)}x)`,
  )

  const cabinLabel = { economy: 'econômica', business: 'executiva' } as const
  const recommendations = new DestinationRecommender().recommend(estimate, profile.travelStyle)

  console.log(`\n  Destinos para o estilo "${profile.travelStyle}"`)
  for (const item of recommendations) {
    const status = item.withinMinimum
      ? 'garantido'
      : item.withinMaximum
        ? 'no cenário máximo'
        : 'ainda fora de alcance'

    console.log(
      `    ${pad(`${item.destination.name} (${item.destination.country})`, 34)} ` +
        `${points.format(item.requiredMiles).padStart(8)} milhas  ` +
        `${cabinLabel[item.cabin].padEnd(10)} ${status}`,
    )
  }
  console.log('')
}

try {
  main()
} catch (error) {
  console.error(`\n  ${(error as Error).message}\n`)
  process.exitCode = 1
}
