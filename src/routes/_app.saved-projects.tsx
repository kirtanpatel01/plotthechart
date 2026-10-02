import React, { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Copy,
  FilePlus2,
  Layers,
  LayoutGrid,
  LineChart,
  PieChart,
  Radar,
  ScatterChart,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { ChartCanvas } from '#/components/charts/ChartCanvas'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { authClient } from '#/lib/auth-client'
import {
  deleteChartProjectFn,
  duplicateChartProjectFn,
  getServerSessionFn,
  listMyChartProjectsFn,
} from '#/lib/charts/projects.functions'
import { CHART_TYPES_LIST, getChartDefinition } from '#/lib/charts/registry'
import type { ChartTypeId } from '#/lib/charts/types'

const CHART_ICONS: Record<
  ChartTypeId,
  React.ComponentType<{ className?: string }>
> = {
  bar: BarChart3,
  line: LineChart,
  area: Activity,
  pie: PieChart,
  scatter: ScatterChart,
  radar: Radar,
  treemap: LayoutGrid,
}

type SortOption = 'updated-desc' | 'created-desc' | 'name-asc'

export const Route = createFileRoute('/_app/saved-projects')({
  beforeLoad: async () => {
    const session = await getServerSessionFn()
    if (!session?.user) {
      throw redirect({ to: '/signin' })
    }
    if (!session.user.emailVerified) {
      throw redirect({ to: '/verify-email' })
    }
    return { user: session.user }
  },
  loader: async () => {
    const projects = await listMyChartProjectsFn()
    return {
      initialProjects: projects,
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { user: initialUser } = Route.useRouteContext()
  const { initialProjects } = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: clientSession, isPending: sessionPending } =
    authClient.useSession()

  const activeUser = clientSession?.user ?? initialUser

  useEffect(() => {
    if (!sessionPending && clientSession === null) {
      void navigate({ to: '/signin', replace: true })
    }
  }, [sessionPending, clientSession, navigate])

  const listFn = useServerFn(listMyChartProjectsFn)
  const deleteFn = useServerFn(deleteChartProjectFn)
  const duplicateFn = useServerFn(duplicateChartProjectFn)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc')

  const projectsQuery = useQuery({
    queryKey: ['chart-projects', activeUser.id],
    queryFn: () => listFn(),
    initialData: initialProjects,
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

  const projects = projectsQuery.data ?? []

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const matchesType = filterType === 'all' || p.chartType === filterType
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.configPayload.title.toLowerCase().includes(q)
      return matchesType && matchesSearch
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'created-desc') {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    })
  }, [projects, filterType, searchQuery, sortBy])

  return (
    <main
      className="w-full min-w-0 p-3 sm:p-6 space-y-5 sm:space-y-6"
      data-testid="projects-dashboard"
    >
      {/* Minimal Dashboard Header + Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
              Saved Projects
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {projects.length}
            </span>
          </div>

          <Button asChild size="sm" className="h-8 lg:hidden">
            <Link
              to="/workspace"
              search={{}}
              className="no-underline"
              data-testid="create-new-project-link-mobile"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              New Chart
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="h-8 pl-8 pr-7 text-xs"
              data-testid="dashboard-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="cursor-pointer absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Chart Type Filter Select */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                size="sm"
                aria-label="Filter by chart type"
                data-testid="dashboard-type-filter-trigger"
                className="h-8 flex-1 sm:flex-initial gap-1.5 px-2.5 text-xs min-w-0"
              >
                <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">
                  <span>All Types ({projects.length})</span>
                </SelectItem>
                {CHART_TYPES_LIST.map((ct) => {
                  const count = projects.filter(
                    (p) => p.chartType === ct.type,
                  ).length
                  const Icon = CHART_ICONS[ct.type] || BarChart3
                  return (
                    <SelectItem key={ct.type} value={ct.type}>
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {ct.label} ({count})
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Sort Select */}
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortOption)}
            >
              <SelectTrigger
                size="sm"
                aria-label="Sort projects"
                data-testid="dashboard-sort-trigger"
                className="h-8 flex-1 sm:flex-initial gap-1.5 px-2.5 text-xs min-w-0"
              >
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="updated-desc">Recently Updated</SelectItem>
                <SelectItem value="created-desc">Newest Created</SelectItem>
                <SelectItem value="name-asc">Alphabetical (A–Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button asChild size="sm" className="hidden h-8 lg:inline-flex">
              <Link
                to="/workspace"
                search={{}}
                className="no-underline"
                data-testid="create-new-project-link"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                New Chart
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Thumbnail-First Gallery Grid */}
      {filteredProjects.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3"
          data-testid="empty-projects-state"
        >
          <p className="text-base font-semibold">
            {projects.length === 0
              ? 'No saved chart projects yet'
              : 'No projects match your current filter'}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {projects.length === 0
              ? 'Head to the Studio to enter data, generate a visualization, configure chart options, and save it to your dashboard.'
              : 'Try clearing your search query or selecting All Types.'}
          </p>
          <div className="pt-2">
            {projects.length === 0 ? (
              <Button asChild size="sm">
                <Link to="/workspace" search={{}} className="no-underline">
                  <FilePlus2 className="h-4 w-4" />
                  Open Chart Studio
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="saved-projects-grid"
        >
          {filteredProjects.map((project) => {
            const def = getChartDefinition(project.chartType)
            const Icon = CHART_ICONS[project.chartType] || BarChart3

            return (
              <article
                key={project.id}
                className="group animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs transition-[border-color,box-shadow] duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-primary/40 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md"
                data-testid={`project-card-${project.id}`}
              >
                {/* Top Half: Flush Hero Thumbnail Stage */}
                <Link
                  to="/workspace"
                  search={{ projectId: project.id }}
                  data-testid={`open-project-btn-${project.id}`}
                  className="relative block border-b border-border/60 bg-muted/20 p-3 no-underline transition-colors group-hover:bg-muted/35"
                >
                  {/* Top Overlay Badges */}
                  <div className="mb-1 flex items-center justify-between gap-2 px-1">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/85 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-xs">
                      <Icon className="h-3 w-3 text-primary" />
                      {def.label}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      Open Studio
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>

                  {/* Live SVG Chart Thumbnail */}
                  <div className="pointer-events-none overflow-hidden">
                    <ChartCanvas
                      compact
                      chartType={project.chartType}
                      data={project.dataPayload}
                      config={project.configPayload}
                    />
                  </div>
                </Link>

                {/* Bottom Half: Compact Metadata & Actions Footer */}
                <div className="flex flex-1 items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <Link
                      to="/workspace"
                      search={{ projectId: project.id }}
                      className="block truncate text-sm font-semibold text-foreground no-underline transition-colors hover:text-primary"
                    >
                      {project.name}
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                      {project.description && (
                        <>
                          <span className="truncate max-w-[220px]">
                            {project.description}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span suppressHydrationWarning className="shrink-0">
                        {new Date(project.updatedAt).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Duplicate project"
                      disabled={duplicateMutation.isPending}
                      onClick={() => duplicateMutation.mutate(project.id)}
                      data-testid={`duplicate-project-btn-${project.id}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
