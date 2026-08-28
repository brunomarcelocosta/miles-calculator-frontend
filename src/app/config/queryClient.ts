import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A landing quase nao le dados; o portal admin le pouco e tolera cache.
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
