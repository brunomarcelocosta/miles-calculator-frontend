import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import {
  createLead,
  updateLeadStep,
  type CreateLeadPayload,
  type UpdateLeadStepPayload,
} from '../api/leadsApi'

/**
 * Hook que gerencia o ciclo de vida do lead na API:
 *
 * 1. `create()` — chamado após preenchimento do formulário de contato.
 *    Retorna o `id` do lead criado no banco.
 *
 * 2. `updateStep()` — chamado a cada mudança de tela do quiz.
 *    Envia o step atual e a resposta escolhida.
 *
 * O `leadId` é mantido internamente no hook. Se o create falhar, as
 * chamadas de updateStep são silenciosamente ignoradas (o lead não existe).
 */
export function useLeadApi() {
  const leadIdRef = useRef<string | null>(null)

  const createMutation = useMutation({
    mutationFn: createLead,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    onSuccess: (data) => {
      leadIdRef.current = data.id
    },
  })

  const stepMutation = useMutation({
    mutationFn: (payload: UpdateLeadStepPayload) => {
      const id = leadIdRef.current
      if (!id) return Promise.resolve()
      return updateLeadStep(id, payload)
    },
    retry: 1,
    retryDelay: 2000,
  })

  const create = useCallback(
    (payload: CreateLeadPayload) => {
      createMutation.mutate(payload)
    },
    [createMutation.mutate],
  )

  const updateStep = useCallback(
    (payload: UpdateLeadStepPayload) => {
      stepMutation.mutate(payload)
    },
    [stepMutation.mutate],
  )

  return {
    create,
    updateStep,
    leadId: leadIdRef,
    isCreating: createMutation.isPending,
    isCreated: createMutation.isSuccess,
  }
}
