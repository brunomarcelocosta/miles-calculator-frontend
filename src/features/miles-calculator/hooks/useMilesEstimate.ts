import { useMemo } from 'react'

import { defaultConfigProvider } from '@/domain/config/CalculatorConfigProvider'
import type { DestinationRecommendation } from '@/domain/model/Destination'
import type { PointsEstimate } from '@/domain/model/PointsEstimate'
import type { QuizAnswers } from '@/domain/model/QuizAnswers'
import type { SpendProfile } from '@/domain/model/SpendProfile'
import { DestinationRecommender } from '@/domain/services/DestinationRecommender'
import { MilesEstimator } from '@/domain/services/MilesEstimator'
import { resolveSpendProfile } from '@/domain/services/SpendProfileResolver'

export interface MilesResult {
  profile: SpendProfile
  estimate: PointsEstimate
  recommendations: DestinationRecommendation[]
}

// Instancias sem estado, criadas uma vez.
const estimator = new MilesEstimator({ configProvider: defaultConfigProvider })
const recommender = new DestinationRecommender()

/**
 * Ponte entre as respostas do quiz e o resultado.
 *
 * Este e o unico lugar do frontend que conhece o motor, e ele nao faz conta
 * nenhuma: apenas encadeia `resolveSpendProfile` -> `MilesEstimator` ->
 * `DestinationRecommender`. Toda a aritmetica fica em `src/domain`, testada sem
 * React.
 *
 * Devolve `null` quando falta resposta, em vez de lancar: a tela de resultado
 * precisa saber disso para oferecer o caminho de volta em vez de estourar.
 */
export function useMilesEstimate(answers: QuizAnswers): MilesResult | null {
  return useMemo(() => {
    try {
      const profile = resolveSpendProfile(answers, defaultConfigProvider)
      const estimate = estimator.estimate(profile)

      return {
        profile,
        estimate,
        recommendations: recommender.recommend(estimate, profile.travelStyle),
      }
    } catch {
      // `QuizAnswerError`: resposta faltando ou id de opcao desconhecido.
      return null
    }
  }, [answers])
}
