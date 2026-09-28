import { useForm } from '@tanstack/react-form'
import { Palette, SlidersHorizontal } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { getChartDefinition } from '#/lib/charts/registry'
import { PALETTES } from '#/lib/charts/types'
import type {
  ChartConfig,
  ChartSpecificOptions,
  ChartTypeId,
  PaletteId,
} from '#/lib/charts/types'

interface ChartConfigPanelProps {
  chartType: ChartTypeId
  config: ChartConfig
  onChange: (next: ChartConfig) => void
}

export function ChartConfigPanel({
  chartType,
  config,
  onChange,
}: ChartConfigPanelProps) {
  const chartDef = getChartDefinition(chartType)

  // TanStack Form instance for managing configuration state & validation
  const form = useForm({
    defaultValues: config,
    onSubmit: async ({ value }) => {
      onChange(value)
    },
  })

  const updateField = <K extends keyof ChartConfig>(
    key: K,
    value: ChartConfig[K],
  ) => {
    form.setFieldValue(key as any, value as any)
    onChange({
      ...config,
      [key]: value,
    })
  }

  const updateSpecificOption = <K extends keyof ChartSpecificOptions>(
    key: K,
    value: ChartSpecificOptions[K],
  ) => {
    onChange({
      ...config,
      options: {
        ...config.options,
        [key]: value,
      },
    })
  }

  return (
    <div
      className="rounded-2xl border border-border bg-card/80 p-4 space-y-5"
      data-testid="chart-config-panel"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">
            Chart Properties & Appearance
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {chartDef.label} Options
        </span>
      </div>

      {/* General Labels: Title, Subtitle, Axes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="chart-title-input" className="text-xs font-semibold">
            Chart Title
          </Label>
          <Input
            id="chart-title-input"
            value={config.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter chart title..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="chart-subtitle-input"
            className="text-xs font-semibold"
          >
            Subtitle / Caption
          </Label>
          <Input
            id="chart-subtitle-input"
            value={config.subtitle}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Optional subtitle or context..."
            className="h-8 text-xs"
          />
        </div>

        {chartDef.supportsAxes && (
          <>
            <div className="space-y-1.5">
              <Label
                htmlFor="chart-xaxis-input"
                className="text-xs font-semibold"
              >
                X-Axis Label
              </Label>
              <Input
                id="chart-xaxis-input"
                value={config.xAxisLabel}
                onChange={(e) => updateField('xAxisLabel', e.target.value)}
                placeholder="Horizontal axis label..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="chart-yaxis-input"
                className="text-xs font-semibold"
              >
                Y-Axis Label
              </Label>
              <Input
                id="chart-yaxis-input"
                value={config.yAxisLabel}
                onChange={(e) => updateField('yAxisLabel', e.target.value)}
                placeholder="Vertical axis label..."
                className="h-8 text-xs"
              />
            </div>
          </>
        )}
      </div>

      {/* Palette Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          Color Palette
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(PALETTES) as Array<PaletteId>).map((pid) => {
            const p = PALETTES[pid]
            const active = config.palette === pid
            return (
              <button
                key={pid}
                type="button"
                onClick={() => updateField('palette', pid)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-2 text-left transition-[transform,background-color,border-color,color,box-shadow] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97] ${
                  active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background/60 hover:border-foreground/30'
                }`}
              >
                <span className="text-[11px] font-semibold truncate w-full">
                  {p.name}
                </span>
                <div className="flex items-center gap-1">
                  {p.colors.slice(0, 5).map((hex) => (
                    <span
                      key={hex}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend, Gridlines, Value Labels toggles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 rounded-xl border border-border/70 bg-muted/25 p-3">
        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
          <Label htmlFor="toggle-legend" className="text-xs font-medium">
            Show Legend
          </Label>
          <Switch
            id="toggle-legend"
            checked={config.showLegend}
            onCheckedChange={(checked) => updateField('showLegend', checked)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="legend-pos-select" className="text-xs font-medium">
            Legend Placement
          </Label>
          <select
            id="legend-pos-select"
            disabled={!config.showLegend}
            value={config.legendPosition}
            onChange={(e) =>
              updateField(
                'legendPosition',
                e.target.value as ChartConfig['legendPosition'],
              )
            }
            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
          >
            <option value="top">Top Bar</option>
            <option value="bottom">Bottom Bar</option>
            <option value="right">Right Sidebar</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
          <Label htmlFor="toggle-grid" className="text-xs font-medium">
            Reference Grid
          </Label>
          <Switch
            id="toggle-grid"
            checked={config.showGrid}
            onCheckedChange={(checked) => updateField('showGrid', checked)}
          />
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
          <Label htmlFor="toggle-values" className="text-xs font-medium">
            Data Value Labels
          </Label>
          <Switch
            id="toggle-values"
            checked={config.showValueLabels}
            onCheckedChange={(checked) =>
              updateField('showValueLabels', checked)
            }
          />
        </div>
      </div>

      {/* Registry-Driven Chart-Specific Options */}
      {chartDef.specificOptionFields.length > 0 && (
        <div className="space-y-2.5 border-t border-border/60 pt-3">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {chartDef.label} Specific Settings
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {chartDef.specificOptionFields.map((field) => {
              const currentValue = config.options[field.key]

              if (field.kind === 'select') {
                return (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs font-medium">{field.label}</Label>
                    <select
                      value={String(currentValue)}
                      onChange={(e) =>
                        updateSpecificOption(field.key, e.target.value as any)
                      }
                      className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                    >
                      {field.choices.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              }

              if (field.kind === 'slider') {
                return (
                  <div key={field.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">
                        {field.label}
                      </Label>
                      <span className="text-xs font-mono text-muted-foreground">
                        {currentValue}
                        {field.unit ?? ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={Number(currentValue)}
                      onChange={(e) =>
                        updateSpecificOption(
                          field.key,
                          Number(e.target.value) as any,
                        )
                      }
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                )
              }

              if (field.kind === 'switch') {
                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-2.5"
                  >
                    <div>
                      <Label className="text-xs font-medium block">
                        {field.label}
                      </Label>
                      {field.description && (
                        <span className="text-[10px] text-muted-foreground">
                          {field.description}
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={Boolean(currentValue)}
                      onCheckedChange={(checked) =>
                        updateSpecificOption(field.key, checked as any)
                      }
                    />
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
