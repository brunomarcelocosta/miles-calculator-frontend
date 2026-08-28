import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/app/config/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TravionLogo } from '@/shared/components/TravionLogo'
import { FormField } from '@/shared/components/FormField'
import { useLogin, useMe } from '../hooks/useAuth'

export function AdminLoginPage() {
  const me = useMe()
  const loginMutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Se já autenticado, redireciona
  if (me.data) {
    return <Navigate to={ROUTES.ADMIN_LEADS} replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    loginMutation.mutate({ email, password })
  }

  return (
    <main className="mx-auto flex min-h-screen w-[min(100%-2rem,25rem)] flex-col justify-center py-12">
      <TravionLogo className="mb-10" />
      <h1 className="mb-6 text-2xl font-medium">Portal de leads</h1>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <FormField label="Email" error={undefined}>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
        </FormField>

        <FormField label="Senha" error={undefined}>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
        </FormField>

        {loginMutation.error ? (
          <p className="text-sm text-destructive" role="alert">
            {(loginMutation.error as any)?.response?.data?.message || 'Credenciais inválidas.'}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </main>
  )
}
