import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/config/routes'
import * as api from '../api/adminApi'

const AUTH_KEY = ['admin', 'me'] as const

export function useMe() {
  return useQuery({
    queryKey: AUTH_KEY,
    queryFn: api.fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: api.login,
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_KEY, user)
      navigate(ROUTES.ADMIN_LEADS)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_KEY })
      navigate(ROUTES.ADMIN_LOGIN)
    },
  })
}
