import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  Calendar,
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
  Radar,
  Save,
  ScatterChart,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  CHART_TYPES_LIST,
  filterChartDataByTimeRange,
   formatLocalIsoDate,
  getChartDefinition,
  getNextUntitledName,
  getTodayIsoDate,
} from '#/lib/charts/registry'
import { authClient } from '#/lib/auth-client'
import { saveChartProjectFn } from '#/lib/charts/projects.functions'
import type { SerializedChartProject } from '#/lib/charts/projects.functions'
import { PALETTES } from '#/lib/charts/types'
import type {
  AnyChartData,
  ChartConfig,
  ChartTypeId,
  DataSchemaKind,
  PaletteId,
  TimeRangePreset,
} from '#/lib/charts/types'
import { ScrollArea } from '#/components/ui/scroll-area'
import { ChartCanvas } from './ChartCanvas'
import { ChartConfigPanel } from './ChartConfigPanel'
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
  const customizePopoverRef = useRef<HTMLDivElement | null>(null)

  const getCachedProjectNames = (): Array<string> => {
    const entries = queryClient.getQueriesData<Array<SerializedChartProject>>({
      queryKey: ['chart-projects'],
    })
    const names: Array<string> = []
    for (const [, list] of entries) {
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item?.name) names.push(item.name)
        }
      }
    }
    return names
  }

  const initialType: ChartTypeId =
    initialProject?.chartType ?? initialChartType ?? 'bar'
  const initialDef = getChartDefinition(initialType)

  const [chartType, setChartType] = useState<ChartTypeId>(initialType)
  const [data, setData] = useState<AnyChartData>(
    () => initialProject?.dataPayload ?? initialDef.defaultData(),
  )
  const [config, setConfig] = useState<ChartConfig>(() => {
    if (initialProject?.configPayload) {
      return {
        ...initialProject.configPayload,
        title: initialProject.name || initialProject.configPayload.title || '',
        subtitle:
          initialProject.description ||
          initialProject.configPayload.subtitle ||
          '',
      }
    }
    return initialDef.defaultConfig()
  })
  const [projectName, setProjectName] = useState<string>(
    initialProject?.name ?? '',
  )
  const [projectDescription, setProjectDescription] = useState<string>(
    initialProject?.description ?? '',
  )
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    initialProject?.id,
  )
  const [defaultUntitledTitle, setDefaultUntitledTitle] = useState<string>(
    () => getNextUntitledName(getCachedProjectNames(), false),
  )

  // Cache per-schema-kind data in memory so switching between schemas preserves user edits
  const [schemaDrafts, setSchemaDrafts] = useState<
    Partial<Record<DataSchemaKind, AnyChartData>>
  >(() => ({
    [data.schemaKind]: data,
  }))

  const { data: session } = authClient.useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<{
    projectId: string
    name: string
  } | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [showChartSettings, setShowChartSettings] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('all')
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return formatLocalIsoDate(d)
  })
  const [customEndDate, setCustomEndDate] = useState<string>(() =>
    getTodayIsoDate(),
  )

  // Close floating Customize popover on outside click or Escape
  useEffect(() => {
    if (!showChartSettings) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (customizePopoverRef.current?.contains(target)) return
      // Ignore clicks inside Radix Select portaled poppers
      if (
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-slot^="select-"]')
      ) {
        return
      }
      setShowChartSettings(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowChartSettings(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showChartSettings])

  // Synchronize state when navigating to a different ?projectId=...
  useEffect(() => {
    if (initialProject) {
      setChartType(initialProject.chartType)
      setData(initialProject.dataPayload)
      setConfig({
        ...initialProject.configPayload,
        title: initialProject.name || initialProject.configPayload.title || '',
        subtitle:
          initialProject.description ||
          initialProject.configPayload.subtitle ||
          '',
      })
      setProjectName(initialProject.name)
      setProjectDescription(initialProject.description)
      setActiveProjectId(initialProject.id)
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
        }),
      )
    } catch {
      // Ignore storage quota errors
    }
  }, [chartType, data, config, projectName, projectDescription])

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
      xAxisLabel: nextDef.supportsAxes ? prev.xAxisLabel : '',
      yAxisLabel: nextDef.supportsAxes ? prev.yAxisLabel : '',
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

  const handleNewBlankChart = () => {
    const def = getChartDefinition('bar')
    const freshData = def.defaultData()
    const nextUntitled = getNextUntitledName(getCachedProjectNames(), false)
    setActiveProjectId(undefined)
    setChartType('bar')
    setData(freshData)
    setSchemaDrafts({ [freshData.schemaKind]: freshData })
    setConfig(def.defaultConfig())
    setProjectName('')
    setProjectDescription('')
    setDefaultUntitledTitle(nextUntitled)
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
    const exportTitle =
      config.title.trim() || projectName.trim() || defaultUntitledTitle
    link.download = `${exportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSaveConfirmed = async (details: {
    name: string
    description: string
  }) => {
    const resolvedName =
      details.name.trim() ||
      config.title.trim() ||
      getNextUntitledName(getCachedProjectNames(), true)
    const resolvedDescription = details.description.trim()
    const updatedConfig: ChartConfig = {
      ...config,
      title: resolvedName,
      subtitle: resolvedDescription,
    }
    const saved = await saveProjectServerFn({
      data: {
        id: activeProjectId,
        name: resolvedName,
        description: resolvedDescription,
        chartType,
        dataPayload: data,
        configPayload: updatedConfig,
      },
    })
    setActiveProjectId(saved.id)
    setProjectName(saved.name)
    setProjectDescription(saved.description)
    setConfig(updatedConfig)
    setSaveSuccessBanner({ projectId: saved.id, name: saved.name })
    await queryClient.invalidateQueries({ queryKey: ['chart-projects'] })
    await router.invalidate()
    void navigate({
      to: '/studio',
      search: { projectId: saved.id },
      replace: true,
    })
  }

  const handleSaveAction = async () => {
    if (!session?.user) {
      void navigate({ to: '/signin' })
      return
    }
    setIsSaving(true)
    try {
      await handleSaveConfirmed({
        name: config.title.trim() || projectName.trim() || defaultUntitledTitle,
        description: config.subtitle.trim() || projectDescription.trim(),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full min-w-0 p-3 sm:p-4 space-y-5 sm:space-y-8">
      {/* Top Workspace Header with Direct Inline Title & Description Inputs */}
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 w-full sm:flex-1 max-w-2xl space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={config.title}
              onChange={(e) => {
                const val = e.target.value
                setProjectName(val)
                setConfig((prev) => ({ ...prev, title: val }))
                setSaveSuccessBanner(null)
              }}
              placeholder={defaultUntitledTitle}
              aria-label="Chart Title"
              data-testid="chart-title-input"
              className="w-full rounded-lg border border-transparent bg-transparent px-2 py-0.5 -ml-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/45 hover:border-border/60 hover:bg-muted/25 focus:border-ring focus:bg-background focus:outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={config.subtitle}
              onChange={(e) => {
                const val = e.target.value
                setProjectDescription(val)
                setConfig((prev) => ({ ...prev, subtitle: val }))
                setSaveSuccessBanner(null)
              }}
              placeholder="Add a description..."
              aria-label="Chart Description"
              data-testid="chart-subtitle-input"
              className="w-full rounded-md border border-transparent bg-transparent px-2 py-0.5 -ml-2 text-sm text-muted-foreground placeholder:text-muted-foreground/45 hover:border-border/60 hover:bg-muted/25 focus:border-ring focus:bg-background focus:text-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Primary Workflow Actions */}
        <div className="flex items-center gap-2 sm:pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground sm:h-9 sm:px-3"
            onClick={handleNewBlankChart}
            data-testid="new-chart-project-btn"
          >
            <FilePlus2 className="h-4 w-4" />
            New
          </Button>

          <Button
            type="button"
            size="sm"
            className="sm:h-9 sm:px-3.5"
            disabled={isSaving}
            onClick={handleSaveAction}
            data-testid="save-project-btn"
          >
            <Save className="h-4 w-4" />
            {isSaving
              ? activeProjectId
                ? 'Updating...'
                : 'Saving...'
              : activeProjectId
                ? 'Update Project'
                : 'Save Project'}
          </Button>
        </div>
      </div>

      {/* Save Confirmation Banner */}
      {saveSuccessBanner && (
        <div
          className="animate-in fade-in zoom-in-95 duration-200 relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-emerald-950 dark:text-emerald-200"
          data-testid="save-success-banner"
        >
          <button
            type="button"
            onClick={() => setSaveSuccessBanner(null)}
            aria-label="Dismiss save notification"
            title="Dismiss"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-background text-emerald-700 shadow-xs hover:bg-emerald-50 hover:text-emerald-950 dark:border-emerald-500/50 dark:bg-card dark:text-emerald-300 dark:hover:bg-emerald-950 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              Saved <strong>{saveSuccessBanner.name}</strong> to your projects.
            </span>
          </div>
          <Link
            to="/dashboard"
            className="font-semibold underline hover:opacity-80 text-xs sm:text-sm shrink-0"
          >
            View in Saved Projects →
          </Link>
        </div>
      )}

      {/* Main Side-by-Side Workspace with Generous Breathing Room */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-12">
        {/* LEFT COLUMN: DATA / INPUT PANEL */}
        <section
          className="lg:col-span-5 min-w-0 space-y-4 sm:space-y-5"
          aria-label="Data and Input Panel"
          data-testid="data-input-panel"
        >
          {/* Data Header & Chart Type Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Data
            </h2>

            {/* Data Toolbar: Chart Type Selector + Schema JSON */}
            <div className="relative flex flex-wrap items-center gap-2">
              <Select
                value={chartType}
                onValueChange={(val) =>
                  handleSelectChartType(val as ChartTypeId)
                }
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Chart Type"
                  data-testid="chart-type-select-trigger"
                  className="h-8 gap-2 px-2.5 text-xs"
                >
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent align="end">
                  {CHART_TYPES_LIST.map((item) => {
                    const Icon = CHART_ICONS[item.type] || BarChart3
                    return (
                      <SelectItem
                        key={item.type}
                        value={item.type}
                        data-testid={`chart-type-option-${item.type}`}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{SHORT_CHART_LABELS[item.type] ?? item.label}</span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

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

          {/* Raw JSON Schema Inspector (Progressive Disclosure) */}
          {showRawJson && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm">
                <span className="truncate">
                  Schema: <code className="text-foreground font-mono">{data.schemaKind}</code>
                </span>
                <div className="flex items-center gap-1 shrink-0">
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
          <div className="min-w-0">
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
        </section>

        {/* RIGHT COLUMN: CHART / VISUALIZATION PANEL (Visual Centerpiece) */}
        <section
          className="lg:col-span-7 min-w-0 space-y-4 sm:space-y-5"
          aria-label="Chart and Visualization Panel"
          data-testid="chart-visualization-panel"
        >
          {/* Quiet Visualization Header & Secondary Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Preview
            </h2>

            {/* Secondary Chart Controls: Time Range + Palette Dropdown + Floating Customize Popover + Export */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Select
                value={timeRange}
                onValueChange={(val) => setTimeRange(val as TimeRangePreset)}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Time Range Filter"
                  data-testid="time-range-select-trigger"
                  className="h-8 gap-1.5 sm:gap-2 px-2 sm:px-2.5 text-xs"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last Week</SelectItem>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range...</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={config.palette}
                onValueChange={(val) => {
                  setConfig((prev) => ({
                    ...prev,
                    palette: val as PaletteId,
                  }))
                  setSaveSuccessBanner(null)
                }}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Color Palette"
                  data-testid="palette-select-trigger"
                  className="h-8 gap-1.5 sm:gap-2 px-2 sm:px-2.5 text-xs"
                >
                  <SelectValue placeholder="Color Palette" />
                </SelectTrigger>
                <SelectContent align="end">
                  {(Object.keys(PALETTES) as Array<PaletteId>).map((pid) => {
                    const p = PALETTES[pid]
                    return (
                      <SelectItem key={pid} value={pid}>
                        <span className="flex items-center -space-x-1">
                          {p.colors.slice(0, 4).map((hex) => (
                            <span
                              key={hex}
                              className="h-2.5 w-2.5 rounded-full ring-1 ring-background"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                        <span>{p.name}</span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <div ref={customizePopoverRef} className="relative">
                <Button
                  type="button"
                  variant={showChartSettings ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-2 sm:px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowChartSettings((v) => !v)}
                  aria-expanded={showChartSettings}
                  data-testid="toggle-chart-settings-btn"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Customize</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 opacity-60 transition-transform duration-150 ${
                      showChartSettings ? 'rotate-180' : ''
                    }`}
                  />
                </Button>

                {showChartSettings && (
                  <div
                    className="animate-in fade-in zoom-in-95 duration-150 fixed inset-x-3 top-20 z-50 max-h-[80dvh] overflow-y-auto rounded-2xl border border-border/80 bg-popover p-4 text-popover-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:z-30 sm:w-[460px] sm:p-5"
                    role="dialog"
                    aria-label="Customize Chart Options"
                  >
                    <div className="mb-3.5 flex items-center justify-between border-b border-border/50 pb-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Chart Options
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChartSettings(false)}
                        aria-label="Close chart options"
                        className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
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
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-2 sm:px-2.5 text-muted-foreground hover:text-foreground"
                onClick={handleExportSvg}
              >
                <Download className="h-4 w-4" />
                <span>Export SVG</span>
              </Button>
            </div>
          </div>

          {(() => {
            const { filteredData, matchedCount, totalCount } =
              filterChartDataByTimeRange(
                data,
                timeRange,
                customStartDate,
                customEndDate,
              )

            return (
              <>
                {timeRange === 'custom' && (
                  <div
                    className="animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-xl border border-border/60 bg-muted/20 px-3 sm:px-3.5 py-2.5 text-xs"
                    data-testid="custom-date-range-bar"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-muted-foreground">
                        From
                      </span>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        aria-label="Custom range start date"
                        className="h-7 flex-1 sm:flex-initial sm:w-auto bg-background px-2 text-xs font-mono"
                      />
                      <span className="font-medium text-muted-foreground">
                        to
                      </span>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        aria-label="Custom range end date"
                        className="h-7 flex-1 sm:flex-initial sm:w-auto bg-background px-2 text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="tabular-nums">
                        Showing <strong className="text-foreground">{matchedCount}</strong> of{' '}
                        <strong className="text-foreground">{totalCount}</strong> entries
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setTimeRange('all')}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}

                {timeRange !== 'all' && matchedCount === 0 ? (
                  <div
                    className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card p-8 text-center"
                    data-testid="empty-time-range-state"
                  >
                    <Calendar className="h-8 w-8 text-muted-foreground/60" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        No entries in the selected time range
                      </p>
                      <p className="text-xs text-muted-foreground">
                        None of your {totalCount} entries fall within this date window.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTimeRange('all')}
                    >
                      Show All Time
                    </Button>
                  </div>
                ) : (
                  <ChartCanvas
                    chartType={chartType}
                    data={filteredData}
                    config={config}
                    svgRef={svgRef}
                    supportsAxes={currentDef.supportsAxes}
                    onAxisLabelChange={(axis, value) => {
                      setConfig((prev) => ({
                        ...prev,
                        [axis]: value,
                      }))
                      setSaveSuccessBanner(null)
                    }}
                  />
                )}
              </>
            )
          })()}
        </section>
      </div>
    </div>
  )
}

