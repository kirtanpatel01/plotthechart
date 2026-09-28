import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Code2,
  Download,
  FilePlus2,
  FolderKanban,
  GitBranch,
  Layers,
  LineChart,
  PieChart,
  Play,
  Radar,
  Save,
  ScatterChart,
  Sparkles,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import {
  CHART_TYPES_LIST,
  getChartDefinition,
} from '#/lib/charts/registry'
import { saveChartProjectFn } from '#/lib/charts/projects.functions'
import type { SerializedChartProject } from '#/lib/charts/projects.functions'
import type {
  AnyChartData,
  ChartConfig,
  ChartTypeId,
  DataSchemaKind,
} from '#/lib/charts/types'
import { ChartCanvas } from './ChartCanvas'
import { ChartConfigPanel } from './ChartConfigPanel'
import { SaveProjectModal } from './SaveProjectModal'
import { CoordinatePointsInput } from './inputs/CoordinatePointsInput'
import { HierarchicalTreeInput } from './inputs/HierarchicalTreeInput'
import { ProportionalSlicesInput } from './inputs/ProportionalSlicesInput'
import { TabularSeriesInput } from './inputs/TabularSeriesInput'

const CHART_ICONS: Record<ChartTypeId, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: LineChart,
  area: Layers,
  pie: PieChart,
  scatter: ScatterChart,
  radar: Radar,
  treemap: GitBranch,
}

const DRAFT_STORAGE_KEY = 'plotthechart.studio.draft.v1'

interface ChartStudioProps {
  initialProject?: SerializedChartProject | null
}

export function ChartStudio({ initialProject }: ChartStudioProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const saveProjectServerFn = useServerFn(saveChartProjectFn)
  const { data: session } = authClient.useSession()
  const svgRef = useRef<SVGSVGElement | null>(null)

  const initialType: ChartTypeId = initialProject?.chartType ?? 'bar'
  const initialDef = getChartDefinition(initialType)

  const [chartType, setChartType] = useState<ChartTypeId>(initialType)
  const [data, setData] = useState<AnyChartData>(
    () => initialProject?.dataPayload ?? initialDef.defaultData(),
  )
  const [config, setConfig] = useState<ChartConfig>(
    () => initialProject?.configPayload ?? initialDef.defaultConfig(),
  )
  const [projectName, setProjectName] = useState<string>(
    initialProject?.name ?? '',
  )
  const [projectDescription, setProjectDescription] = useState<string>(
    initialProject?.description ?? '',
  )
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    initialProject?.id,
  )

  // Cache per-schema-kind data in memory so switching between schemas preserves user edits
  const [schemaDrafts, setSchemaDrafts] = useState<
    Partial<Record<DataSchemaKind, AnyChartData>>
  >(() => ({
    [data.schemaKind]: data,
  }))

  // Track whether the user has explicitly generated the chart (unlocking Save)
  const [hasGenerated, setHasGenerated] = useState<boolean>(
    Boolean(initialProject?.id),
  )
  const [generationCount, setGenerationCount] = useState<number>(
    initialProject?.id ? 1 : 0,
  )
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<{
    projectId: string
    name: string
  } | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)

  // Synchronize state when navigating to a different ?projectId=...
  useEffect(() => {
    if (initialProject) {
      setChartType(initialProject.chartType)
      setData(initialProject.dataPayload)
      setConfig(initialProject.configPayload)
      setProjectName(initialProject.name)
      setProjectDescription(initialProject.description)
      setActiveProjectId(initialProject.id)
      setHasGenerated(true)
      setGenerationCount((c) => Math.max(1, c))
      setSchemaDrafts((prev) => ({
        ...prev,
        [initialProject.dataPayload.schemaKind]: initialProject.dataPayload,
      }))
    }
  }, [initialProject?.id])

  // Persist current draft in localStorage so signing in/up never loses work
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          chartType,
          data,
          config,
          projectName,
          projectDescription,
          hasGenerated,
        }),
      )
    } catch {
      // Ignore storage quota errors
    }
  }, [chartType, data, config, projectName, projectDescription, hasGenerated])

  const currentDef = getChartDefinition(chartType)

  const handleSelectChartType = (nextType: ChartTypeId) => {
    if (nextType === chartType) return
    const nextDef = getChartDefinition(nextType)

    // Save current data into schemaDrafts
    const updatedDrafts: Partial<Record<DataSchemaKind, AnyChartData>> = {
      ...schemaDrafts,
      [data.schemaKind]: data,
    }
    setSchemaDrafts(updatedDrafts)

    const nextSchemaKind = nextDef.schemaKind as DataSchemaKind
    let nextData: AnyChartData
    if (nextSchemaKind === data.schemaKind) {
      // Same schema family (e.g. Bar <-> Line <-> Area): preserve current data!
      nextData = data
    } else if (updatedDrafts[nextSchemaKind]) {
      nextData = updatedDrafts[nextSchemaKind]!
    } else {
      nextData = nextDef.defaultData()
    }

    const nextDefaultCfg = nextDef.defaultConfig()
    setChartType(nextType)
    setData(nextData)
    setConfig((prev) => ({
      ...prev,
      // Update title/axes only if they still match the previous chart type's default
      title:
        prev.title === currentDef.defaultConfig().title
          ? nextDefaultCfg.title
          : prev.title,
      subtitle:
        prev.subtitle === currentDef.defaultConfig().subtitle
          ? nextDefaultCfg.subtitle
          : prev.subtitle,
      xAxisLabel: nextDef.supportsAxes
        ? prev.xAxisLabel || nextDefaultCfg.xAxisLabel
        : '',
      yAxisLabel: nextDef.supportsAxes
        ? prev.yAxisLabel || nextDefaultCfg.yAxisLabel
        : '',
      options: {
        ...nextDefaultCfg.options,
        ...prev.options,
      },
    }))
    setSaveSuccessBanner(null)
  }

  const handleDataChange = (nextData: AnyChartData) => {
    setData(nextData)
    setSchemaDrafts((prev) => ({
      ...prev,
      [nextData.schemaKind]: nextData,
    }))
    setSaveSuccessBanner(null)
  }

  const handleLoadPreset = (presetId: string) => {
    const preset = currentDef.presets.find((p) => p.id === presetId)
    if (!preset) return
    handleDataChange(structuredClone(preset.data))
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
    }))
  }

  const handleGenerateChart = () => {
    setHasGenerated(true)
    setGenerationCount((c) => c + 1)
    setSaveSuccessBanner(null)
  }

  const handleNewBlankChart = () => {
    const def = getChartDefinition('bar')
    setActiveProjectId(undefined)
    setChartType('bar')
    setData(def.defaultData())
    setConfig(def.defaultConfig())
    setProjectName('')
    setProjectDescription('')
    setHasGenerated(false)
    setGenerationCount(0)
    setSaveSuccessBanner(null)
    void navigate({ to: '/', search: {} })
  }

  const handleExportSvg = () => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgRef.current)
    const blob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(config.title || chartType).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSaveConfirmed = async (details: {
    name: string
    description: string
  }) => {
    const saved = await saveProjectServerFn({
      data: {
        id: activeProjectId,
        name: details.name,
        description: details.description,
        chartType,
        dataPayload: data,
        configPayload: config,
      },
    })
    setActiveProjectId(saved.id)
    setProjectName(saved.name)
    setProjectDescription(saved.description)
    setSaveSuccessBanner({ projectId: saved.id, name: saved.name })
    await queryClient.invalidateQueries({ queryKey: ['chart-projects'] })
    await router.invalidate()
    void navigate({
      to: '/',
      search: { projectId: saved.id },
      replace: true,
    })
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 space-y-5">
      {/* Top Studio Workflow Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 px-5 py-3.5 shadow-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">
                  {activeProjectId
                    ? projectName || config.title
                    : 'PlotTheChart Studio'}
                </h1>
                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {currentDef.schemaBadgeLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter data → Generate &amp; Preview → Configure → Save to
                Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeProjectId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleNewBlankChart}
              data-testid="new-chart-project-btn"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              New Project
            </Button>
          )}

          <Button
            type="button"
            variant={hasGenerated ? 'secondary' : 'default'}
            size="sm"
            className="gap-1.5 text-xs font-semibold"
            onClick={handleGenerateChart}
            data-testid="toolbar-generate-chart-btn"
          >
            <Play className="h-3.5 w-3.5" />
            {hasGenerated ? 'Regenerate / Refresh Chart' : 'Generate Chart'}
          </Button>

          {hasGenerated ? (
            <Button
              type="button"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              onClick={() => setSaveModalOpen(true)}
              data-testid="save-project-btn"
            >
              <Save className="h-3.5 w-3.5" />
              {activeProjectId ? 'Update Project' : 'Save Project'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Click 'Generate Chart' first to unlock saving"
              className="gap-1.5 text-xs opacity-60"
              data-testid="save-project-btn-disabled"
            >
              <Save className="h-3.5 w-3.5" />
              Save Project (Generate First)
            </Button>
          )}

          {session?.user && (
            <Link
              to="/dashboard"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground no-underline hover:bg-muted transition-colors"
              data-testid="go-to-dashboard-link"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              My Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Save Confirmation Banner */}
      {saveSuccessBanner && (
        <div
          className="surface-enter flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-950 dark:text-emerald-200"
          data-testid="save-success-banner"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Saved project <strong>{saveSuccessBanner.name}</strong> to your
              account database.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="font-bold underline hover:opacity-80"
            >
              Open Saved Projects Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* Main Side-by-Side Workspace: Data/Input Panel (Left) & Chart/Visualization Panel (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: DATA / INPUT PANEL */}
        <section
          className="lg:col-span-6 rounded-2xl border border-border bg-card/85 p-5 shadow-xs space-y-5"
          aria-label="Data and Input Panel"
          data-testid="data-input-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Step 1 • Data &amp; Schema Input
              </span>
              <h2 className="text-base font-bold tracking-tight">
                Data / Input Panel
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowRawJson((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Code2 className="h-3.5 w-3.5" />
              {showRawJson ? 'Hide Schema JSON' : 'Inspect Schema JSON'}
            </button>
          </div>

          {/* Chart Type Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                Select Visualization Type
              </span>
              <span className="text-[11px] text-muted-foreground">
                Input UI adapts automatically to chart schema
              </span>
            </div>

            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Chart Type"
            >
              {CHART_TYPES_LIST.map((item) => {
                const Icon = CHART_ICONS[item.type] || BarChart3
                const isSelected = chartType === item.type
                return (
                  <button
                    key={item.type}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`chart-type-btn-${item.type}`}
                    onClick={() => handleSelectChartType(item.type)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-[transform,background-color,border-color,color,box-shadow] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97] ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground shadow-xs ring-1 ring-primary'
                        : 'border-border bg-background/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Icon
                        className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`}
                      />
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-tight">
                        {item.schemaKind === 'tabular-series'
                          ? 'Grid'
                          : item.schemaKind === 'proportional-slices'
                            ? 'Slices'
                            : item.schemaKind === 'coordinate-points'
                              ? 'XY/Z'
                              : 'Tree'}
                      </span>
                    </div>
                    <span className="text-xs font-bold leading-tight mt-0.5">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              {currentDef.shortDescription}
            </p>
          </div>

          {/* Sample Presets Loader */}
          {currentDef.presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Sample Datasets:
              </span>
              {currentDef.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}

          {/* Raw JSON Schema Inspector (Optional Toggle) */}
          {showRawJson && (
            <div className="surface-enter rounded-xl border border-border bg-muted/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">
                  Polymorphic Payload (<code>schemaKind: &quot;{data.schemaKind}&quot;</code>)
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  Persisted in Prisma Json column
                </span>
              </div>
              <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100 font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}

          {/* Adaptive Data Input Component based on schemaKind */}
          <div className="pt-1">
            {data.schemaKind === 'tabular-series' && (
              <TabularSeriesInput
                data={data}
                palette={config.palette}
                onChange={handleDataChange}
              />
            )}
            {data.schemaKind === 'proportional-slices' && (
              <ProportionalSlicesInput
                data={data}
                palette={config.palette}
                onChange={handleDataChange}
              />
            )}
            {data.schemaKind === 'coordinate-points' && (
              <CoordinatePointsInput
                data={data}
                palette={config.palette}
                onChange={handleDataChange}
              />
            )}
            {data.schemaKind === 'hierarchical-tree' && (
              <HierarchicalTreeInput
                data={data}
                palette={config.palette}
                onChange={handleDataChange}
              />
            )}
          </div>

          {/* Data Input Footer: Generate Chart CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div className="text-xs text-muted-foreground">
              {hasGenerated ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Chart generated ({generationCount}x) — Save action unlocked
                </span>
              ) : (
                <span>
                  Click <strong>Generate Chart</strong> to finalize preview and
                  enable saving.
                </span>
              )}
            </div>

            <Button
              type="button"
              onClick={handleGenerateChart}
              className="gap-1.5 font-semibold"
              data-testid="generate-chart-btn"
            >
              <Play className="h-4 w-4" />
              Generate Chart
            </Button>
          </div>
        </section>

        {/* RIGHT COLUMN: CHART / VISUALIZATION & CONFIGURATION PANEL */}
        <section
          className="lg:col-span-6 space-y-5"
          aria-label="Chart and Visualization Panel"
          data-testid="chart-visualization-panel"
        >
          <div className="rounded-2xl border border-border bg-card/85 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Step 2 • Interactive Visualization
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight">
                    Chart / Visualization Panel
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      hasGenerated
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                    data-testid="chart-generation-status"
                  >
                    {hasGenerated ? 'Generated & Ready to Save' : 'Live Draft Preview'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleExportSvg}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export SVG
                </Button>

                {hasGenerated && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs gap-1.5 font-semibold"
                    onClick={() => setSaveModalOpen(true)}
                    data-testid="panel-save-project-btn"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {activeProjectId ? 'Update Project' : 'Save Chart'}
                  </Button>
                )}
              </div>
            </div>

            {/* Interactive SVG Chart Canvas */}
            <ChartCanvas
              chartType={chartType}
              data={data}
              config={config}
              svgRef={svgRef}
            />
          </div>

          {/* Configuration Panel */}
          <ChartConfigPanel
            chartType={chartType}
            config={config}
            onChange={(nextCfg) => {
              setConfig(nextCfg)
              setSaveSuccessBanner(null)
            }}
          />
        </section>
      </div>

      {/* Save Project & Auth Modal */}
      <SaveProjectModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        initialName={projectName || config.title}
        initialDescription={projectDescription || config.subtitle}
        isUpdatingExisting={Boolean(activeProjectId)}
        onSaveConfirmed={handleSaveConfirmed}
      />
    </div>
  )
}
