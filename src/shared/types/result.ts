/**
 * Envelope de resposta da API, no mesmo formato do Tripflow para que o
 * `httpClient` e o `apiErrorHandler` sejam identicos nos dois projetos.
 */
export interface Result<T> {
  success: boolean
  data?: T
  error?: string | null
  isForbidden?: boolean
}

export type ApiResponse<T> = Result<T>

export function isSuccessResult<T>(
  result: Result<T>,
): result is Result<T> & { success: true; data: T } {
  return result.success && result.data !== undefined
}

export function isForbiddenResult<T>(
  result: Result<T>,
): result is Result<T> & { isForbidden: true } {
  return Boolean(result.isForbidden)
}
