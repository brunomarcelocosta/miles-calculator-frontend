import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O diagnóstico consulta o resultado no servidor e tolera cache breve.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // O envio de lead e a mutation critica: vale insistir em falha de rede.
      retry: 2,
    },
  },
})
