/**
 * Dados de contato digitados na tela de lead.
 *
 * Fica separado de `QuizAnswers` porque tem natureza diferente: resposta de quiz
 * e id de opcao, lead e texto livre com validacao e consentimento. O schema Zod
 * que valida isso entra no Task 7, em `src/domain/schemas`.
 */
export interface LeadDraft {
  fullName: string
  email: string
  phone: string
  instagram: string
  consent: boolean
}

export function emptyLeadDraft(): LeadDraft {
  return {
    fullName: '',
    email: '',
    phone: '',
    instagram: '',
    consent: false,
  }
}
