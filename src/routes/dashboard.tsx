import React, { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Edit3,
  FilePlus2,
  FolderKanban,
  Lock,
  Search,
  Trash2,
} from 'lucide-react'
import { ChartCanvas } from '#/components/charts/ChartCanvas'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import {
  deleteChartProjectFn,
  duplicateChartProjectFn,
  getServerSessionFn,
  listMyChartProjectsFn,
} from '#/lib/charts/projects.functions'
import { CHART_TYPES_LIST, getChartDefinition } from '#/lib/charts/registry'
import type { SerializedChartProject } from '#/lib/charts/projects.functions'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const session = await getServerSessionFn()
    if (!session?.user) {
      return {
        initialUser: null,
        initialProjects: [] as Array<SerializedChartProject>,
      }
    }
    const projects = await listMyChartProjectsFn()
    return {
      initialUser: session.user,
      initialProjects: projects,
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { initialUser, initialProjects } = Route.useLoaderData()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: clientSession } = authClient.useSession()

  const activeUser = clientSession?.user ?? initialUser

  const listFn = useServerFn(listMyChartProjectsFn)
  const deleteFn = useServerFn(deleteChartProjectFn)
  const duplicateFn = useServerFn(duplicateChartProjectFn)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Inline auth state when unauthenticated
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const projectsQuery = useQuery({
    queryKey: ['chart-projects', activeUser?.id],
    queryFn: () => listFn(),
    initialData: initialProjects,
    enabled: Boolean(activeUser),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chart-projects'] })
      await router.invalidate()
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateFn({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chart-projects'] })
      await router.invalidate()
    },
  })

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSubmitting(true)
    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          name: name.trim() || email.split('@')[0] || 'User',
          email: email.trim(),
          password,
        })
        if (res.error) {
          setAuthError(res.error.message || 'Sign up failed')
          return
        }
      } else {
        const res = await authClient.signIn.email({
          email: email.trim(),
          password,
        })
        if (res.error) {
          setAuthError(res.error.message || 'Sign in failed')
          return
        }
      }
      await router.invalidate()
      await queryClient.invalidateQueries({ queryKey: ['chart-projects'] })
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error')
    } finally {
      setAuthSubmitting(false)
    }
  }

  if (!activeUser) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <section
          className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-5"
          data-testid="dashboard-auth-gate"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {isSignUp
                  ? 'Create an Account'
                  : 'Sign In to Your Projects Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground">
                View, reopen, edit, and manage all your saved charts.
              </p>
            </div>
          </div>

          <form onSubmit={handleInlineAuth} className="space-y-3">
            {isSignUp && (
              <div className="space-y-1">
                <Label htmlFor="dash-auth-name" className="text-xs">
                  Name
                </Label>
                <Input
                  id="dash-auth-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="dash-auth-email" className="text-xs">
                Email
              </Label>
              <Input
                id="dash-auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dash-auth-password" className="text-xs">
                Password
              </Label>
              <Input
                id="dash-auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-xs"
              />
            </div>

            {authError && (
              <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                {authError}
              </p>
            )}

            <Button
              type="submit"
              disabled={authSubmitting}
              className="w-full"
              data-testid="dashboard-auth-submit"
            >
              {authSubmitting
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp((v) => !v)
                setAuthError('')
              }}
              className="font-medium text-primary hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'}
            </button>
            <Link to="/" className="text-muted-foreground hover:underline">
              ← Back to Studio
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const projects = projectsQuery.data ?? []
  const filteredProjects = projects.filter((p) => {
    const matchesType = filterType === 'all' || p.chartType === filterType
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.configPayload.title.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  return (
    <main
      className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 space-y-6"
      data-testid="projects-dashboard"
    >
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Saved Charts &amp; Projects Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Signed in as{' '}
              <span className="font-semibold text-foreground">
                {activeUser?.email}
              </span>{' '}
              • {projects.length} saved{' '}
              {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>

        <Link
          to="/"
          search={{}}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground no-underline shadow-xs hover:opacity-90 transition-opacity"
          data-testid="create-new-project-link"
        >
          <FilePlus2 className="h-4 w-4" />
          Create New Chart Project
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved projects by name or title..."
            className="h-9 pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            All Types ({projects.length})
          </button>
          {CHART_TYPES_LIST.map((ct) => {
            const count = projects.filter((p) => p.chartType === ct.type).length
            return (
              <button
                key={ct.type}
                type="button"
                onClick={() => setFilterType(ct.type)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterType === ct.type
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {ct.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3"
          data-testid="empty-projects-state"
        >
          <p className="text-base font-bold">
            {projects.length === 0
              ? 'No saved chart projects yet'
              : 'No projects match your current filter'}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {projects.length === 0
              ? 'Head to the Studio to enter data, generate a visualization, configure chart options, and save it to your dashboard.'
              : 'Try clearing your search query or selecting All Types.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              search={{}}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground no-underline"
            >
              <FilePlus2 className="h-4 w-4" />
              Open Chart Studio
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          data-testid="saved-projects-grid"
        >
          {filteredProjects.map((project) => {
            const def = getChartDefinition(project.chartType)
            return (
              <article
                key={project.id}
                className="stagger-item flex flex-col justify-between rounded-2xl border border-border bg-card/90 p-4 shadow-xs transition-[transform,border-color,box-shadow,opacity] duration-[200ms] ease-[var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-primary/40 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md"
                data-testid={`project-card-${project.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {def.label}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {def.schemaBadgeLabel}
                        </span>
                      </div>
                      <h2 className="text-base font-bold truncate">
                        {project.name}
                      </h2>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reconstructed Live SVG Preview */}
                  <div className="pointer-events-none overflow-hidden rounded-xl border border-border/60 bg-background/40">
                    <ChartCanvas
                      compact
                      chartType={project.chartType}
                      data={project.dataPayload}
                      config={project.configPayload}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <span
                    suppressHydrationWarning
                    className="text-[11px] text-muted-foreground"
                  >
                    Updated{' '}
                    {new Date(project.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/"
                      search={{ projectId: project.id }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground no-underline hover:opacity-90 transition-opacity"
                      data-testid={`open-project-btn-${project.id}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Reopen &amp; Edit
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                      title="Duplicate project"
                      disabled={duplicateMutation.isPending}
                      onClick={() => duplicateMutation.mutate(project.id)}
                      data-testid={`duplicate-project-btn-${project.id}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                      title="Delete project"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(project.id)}
                      data-testid={`delete-project-btn-${project.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
