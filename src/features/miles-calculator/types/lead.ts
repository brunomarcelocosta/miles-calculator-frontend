/**
 * Dados de contato digitados na tela de lead.
 *
 * Fica separado de `QuizAnswers` porque tem natureza diferente: resposta de quiz
 * e id de opcao, lead e texto livre com validacao. O consentimento e implicito
 * no envio (registrado como `consentAt` na submissao), entao nao vive no draft.
 */
export interface LeadDraft {
  fullName: string
  email: string
  phone: string
  instagram: string
}

export function emptyLeadDraft(): LeadDraft {
  return {
    fullName: '',
    email: '',
    phone: '',
    instagram: '',
  }
}
