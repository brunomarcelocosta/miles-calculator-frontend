import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { ROUTES } from '@/app/config/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TravionLogo } from '@/shared/components/TravionLogo'
import { useMe, useLogout } from '../hooks/useAuth'
import { useLeads } from '../hooks/useLeads'
import { bulkValidateLeads, type Lead } from '../api/adminApi'

// ---------- Traduções ----------

const STEP_LABELS: Record<string, string> = {
  lead: 'Cadastro',
  cardPf: 'Cartão PF',
  cardPj: 'Cartão PJ',
  uber: 'Uber',
  ifood: 'iFood',
  retailAnnual: 'Varejo',
  travelAnnual: 'Viagens',
  travelStyle: 'Estilo',
  knowledgeLevel: 'Conhecimento',
  freeTripsPerYear: 'Viagens grátis',
  managerInterest: 'Gestor',
  result: 'Finalizado',
}

const STYLE_LABELS: Record<string, string> = {
  style_beach: 'Calor e praia',
  style_city: 'Cidade e cultura',
  style_snow: 'Frio e neve',
  beach: 'Calor e praia',
  city: 'Cidade e cultura',
  snow: 'Frio e neve',
}

const MANAGER_LABELS: Record<string, string> = {
  manager_yes: 'Sim, quer saber',
  manager_maybe: 'Talvez',
  manager_no: 'Prefere sozinho',
}

function translateStep(step: string): string {
  return STEP_LABELS[step] ?? step
}

function translateStyle(value: string | null): string {
  if (!value) return '—'
  return STYLE_LABELS[value] ?? value
}

function translateManager(value: string | null): string {
  if (!value) return '—'
  return MANAGER_LABELS[value] ?? value
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatK(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

// ---------- Componente ----------

export function AdminLeadsPage() {
  const me = useMe()
  const logoutMutation = useLogout()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const leads = useLeads({ page, pageSize: 20, search, from: from || undefined, to: to || undefined })

  const bulkMutation = useMutation({
    mutationFn: ({ ids, validated }: { ids: string[]; validated: boolean }) =>
      bulkValidateLeads(ids, validated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
      setSelected(new Set())
    },
  })

  // Auth guard
  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-travion-muted">Verificando sessão...</p>
      </main>
    )
  }

  if (me.isError || !me.data) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (!leads.data) return
    const allIds = leads.data.data.map((l) => l.id)
    const allSelected = allIds.every((id) => selected.has(id))

    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function handleBulkValidate() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    bulkMutation.mutate({ ids, validated: true })
  }

  function handleBulkUnvalidate() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    bulkMutation.mutate({ ids, validated: false })
  }

  const allOnPageSelected =
    leads.data?.data.length
      ? leads.data.data.every((l) => selected.has(l.id))
      : false

  return (
    <main className="mx-auto w-[min(100%-2rem,80rem)] py-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <TravionLogo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-travion-muted sm:inline">{me.data.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Sair
          </Button>
        </div>
      </header>

      <h1 className="mb-6 text-2xl font-medium">Leads</h1>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex grow gap-2 sm:max-w-sm">
          <Input
            type="search"
            placeholder="Buscar nome, email ou telefone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Buscar leads"
          />
          <Button type="submit" size="sm" variant="secondary">
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1) }}
            aria-label="Data inicial"
            className="w-36"
          />
          <span className="text-travion-muted">—</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1) }}
            aria-label="Data final"
            className="w-36"
          />
        </div>
      </div>

      {/* Barra de ações em lote */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selected.size} selecionado{selected.size > 1 ? 's' : ''}
          </span>
          <Button size="sm" onClick={handleBulkValidate} disabled={bulkMutation.isPending}>
            <CheckCircle2 className="size-4" />
            Validar selecionados
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkUnvalidate} disabled={bulkMutation.isPending}>
            Marcar como novo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Tabela */}
      {leads.isLoading ? (
        <p className="py-10 text-center text-travion-muted">Carregando...</p>
      ) : leads.isError ? (
        <p className="py-10 text-center text-destructive">Erro ao carregar leads.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b bg-travion-surface text-left">
                  <th className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      className="size-4 cursor-pointer accent-emerald-600"
                      aria-label="Selecionar todos da página"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Nome</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Telefone</th>
                  <th className="px-3 py-2.5 font-medium">Etapa</th>
                  <th className="px-3 py-2.5 font-medium text-right">Estimativa</th>
                  <th className="px-3 py-2.5 font-medium">Estilo</th>
                  <th className="px-3 py-2.5 font-medium">Gestor</th>
                  <th className="px-3 py-2.5 font-medium">Origem</th>
                  <th className="px-3 py-2.5 font-medium">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {leads.data!.data.map((lead: Lead) => (
                  <tr
                    key={lead.id}
                    className={`border-b last:border-0 hover:bg-travion-surface/50 ${
                      selected.has(lead.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="size-4 cursor-pointer accent-emerald-600"
                        aria-label={`Selecionar ${lead.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      {lead.validated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          Validado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Novo
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{lead.fullName}</td>
                    <td className="px-3 py-2.5">{lead.email}</td>
                    <td className="px-3 py-2.5">{lead.phone}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-travion-surface px-1.5 py-0.5 text-xs">
                        {translateStep(lead.step)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {lead.estimateMin != null && lead.estimateMax != null
                        ? `${formatK(lead.estimateMin)}–${formatK(lead.estimateMax)}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">{translateStyle(lead.travelStyle)}</td>
                    <td className="px-3 py-2.5">{translateManager(lead.managerInterest)}</td>
                    <td className="px-3 py-2.5 text-travion-muted">
                      {lead.utmSource || '(direto)'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatDateTime(lead.createdAt)}
                    </td>
                  </tr>
                ))}
                {leads.data!.data.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-10 text-center text-travion-muted">
                      Nenhum lead encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {leads.data!.meta.totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-between" aria-label="Paginação">
              <p className="text-sm text-travion-muted">
                {leads.data!.meta.total} lead{leads.data!.meta.total !== 1 ? 's' : ''} ·
                Página {page} de {leads.data!.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= leads.data!.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </main>
  )
}
