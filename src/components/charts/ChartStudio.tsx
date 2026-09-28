import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Download,
  FilePlus2,
  GitBranch,
  Layers,
  LineChart,
  PieChart,
  Play,
  Radar,
  Save,
  ScatterChart,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
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
import { ScrollArea } from '#/components/ui/scroll-area'
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

const SHORT_CHART_LABELS: Record<ChartTypeId, string> = {
  bar: 'Bar',
  line: 'Line',
  area: 'Area',
  pie: 'Pie / Donut',
  scatter: 'Scatter',
  radar: 'Radar',
  treemap: 'Treemap',
}

const DRAFT_STORAGE_KEY = 'plotthechart.studio.draft.v1'

interface ChartStudioProps {
  initialProject?: SerializedChartProject | null
  initialChartType?: ChartTypeId
}

export function ChartStudio({
  initialProject,
  initialChartType,
}: ChartStudioProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const saveProjectServerFn = useServerFn(saveChartProjectFn)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const initialType: ChartTypeId =
    initialProject?.chartType ?? initialChartType ?? 'bar'
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
  const [copiedJson, setCopiedJson] = useState(false)
  const [showChartSettings, setShowChartSettings] = useState(false)

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

  const handleGenerateChart = () => {
    setHasGenerated(true)
    setGenerationCount((c) => c + 1)
    setSaveSuccessBanner(null)
  }

  const handleNewBlankChart = () => {
    const def = getChartDefinition('bar')
    const freshData = def.defaultData()
    setActiveProjectId(undefined)
    setChartType('bar')
    setData(freshData)
    setSchemaDrafts({ [freshData.schemaKind]: freshData })
    setConfig(def.defaultConfig())
    setProjectName('')
    setProjectDescription('')
    setHasGenerated(false)
    setGenerationCount(0)
    setSaveSuccessBanner(null)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }
    }
    void navigate({ to: '/studio', search: {} })
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
      to: '/studio',
      search: { projectId: saved.id },
      replace: true,
    })
  }

  return (
    <div className="w-full p-4 space-y-8">
      {/* Simplified Top Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
            {activeProjectId
              ? projectName || config.title
              : config.title || 'Untitled Chart'}
          </h1>
          <p className="text-muted-foreground mt-0.5">
            {currentDef.label}
          </p>
        </div>

        {/* Primary Workflow Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeProjectId && (
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleNewBlankChart}
              data-testid="new-chart-project-btn"
            >
              <FilePlus2 className="h-4 w-4" />
              New
            </Button>
          )}

          {hasGenerated ? (
            <Button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              data-testid="save-project-btn"
            >
              <Save className="h-4 w-4" />
              {activeProjectId ? 'Update Project' : 'Save Project'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              title="Click 'Generate Chart' first to unlock saving"
              className="opacity-50"
              data-testid="save-project-btn-disabled"
            >
              <Save className="h-4 w-4" />
              Save Project
            </Button>
          )}
        </div>
      </div>

      {/* Save Confirmation Banner */}
      {saveSuccessBanner && (
        <div
          className="animate-in fade-in zoom-in-95 duration-200 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-950 dark:text-emerald-200"
          data-testid="save-success-banner"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Saved <strong>{saveSuccessBanner.name}</strong> to your projects.
            </span>
          </div>
          <Link
            to="/dashboard"
            className="font-semibold underline hover:opacity-80"
          >
            View in Saved Projects →
          </Link>
        </div>
      )}

      {/* Main Side-by-Side Workspace with Generous Breathing Room */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start xl:gap-12">
        {/* LEFT COLUMN: DATA / INPUT PANEL */}
        <section
          className="lg:col-span-5 space-y-5"
          aria-label="Data and Input Panel"
          data-testid="data-input-panel"
        >
          {/* Compact Chart Type Pill Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Data
              </h2>

              {/* Secondary Data Toolbar: Schema JSON */}
              <div className="relative flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={showRawJson ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowRawJson((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Inspect raw data schema JSON"
                >
                  <Code2 className="h-4 w-4" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Segmented Pill Bar for Chart Types */}
            <div
              className="flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-muted/25 p-1.5"
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
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all duration-150 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-background text-foreground shadow-2xs ring-1 ring-border/80'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? 'text-primary' : 'opacity-70'
                      }`}
                    />
                    <span>{SHORT_CHART_LABELS[item.type] ?? item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Raw JSON Schema Inspector (Progressive Disclosure) */}
          {showRawJson && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span>
                  Schema: <code className="text-foreground font-mono">{data.schemaKind}</code>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                      setCopiedJson(true)
                      setTimeout(() => setCopiedJson(false), 2000)
                    }}
                    title="Copy JSON to clipboard"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowRawJson(false)}
                    aria-label="Close JSON inspector"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-48 w-full rounded-lg bg-slate-950 p-3">
                <pre className="text-xs text-slate-100 font-mono pr-2">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}

          {/* Primary Focus: Adaptive Data Input Table / Editor */}
          <div>
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

          {/* Quiet Data Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-muted-foreground">
              {hasGenerated ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to save ({generationCount}x)
                </span>
              ) : (
                'Preview updates live as you edit.'
              )}
            </span>

            <Button
              type="button"
              variant={hasGenerated ? 'secondary' : 'default'}
              onClick={handleGenerateChart}
              data-testid="generate-chart-btn"
            >
              <Play className="h-4 w-4" />
              {hasGenerated ? 'Regenerate Chart' : 'Generate Chart'}
            </Button>
          </div>
        </section>

        {/* RIGHT COLUMN: CHART / VISUALIZATION PANEL (Visual Centerpiece) */}
        <section
          className="lg:col-span-7 space-y-5"
          aria-label="Chart and Visualization Panel"
          data-testid="chart-visualization-panel"
        >
          {/* Quiet Visualization Header & Secondary Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Preview
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  hasGenerated
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground'
                }`}
                data-testid="chart-generation-status"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasGenerated ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                  }`}
                />
                {hasGenerated ? 'Generated' : 'Live Draft'}
              </span>
            </div>

            {/* Unobtrusive Secondary Chart Controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showChartSettings ? 'secondary' : 'ghost'}
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowChartSettings((v) => !v)}
                data-testid="toggle-chart-settings-btn"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Customize
                <ChevronDown
                  className={`h-3.5 w-3.5 opacity-60 transition-transform duration-150 ${
                    showChartSettings ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleExportSvg}
              >
                <Download className="h-4 w-4" />
                Export SVG
              </Button>

              {hasGenerated && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveModalOpen(true)}
                  data-testid="panel-save-project-btn"
                >
                  <Save className="h-4 w-4" />
                  {activeProjectId ? 'Update' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          {/* Dominant Interactive SVG Chart Canvas */}
          <ChartCanvas
            chartType={chartType}
            data={data}
            config={config}
            svgRef={svgRef}
          />

          {/* Collapsible Chart Configuration Drawer / Section (Progressive Disclosure) */}
          {showChartSettings && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Chart Settings &amp; Styling
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChartSettings(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Done
                </Button>
              </div>
              <ChartConfigPanel
                chartType={chartType}
                config={config}
                onChange={(nextCfg) => {
                  setConfig(nextCfg)
                  setSaveSuccessBanner(null)
                }}
              />
            </div>
          )}
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

