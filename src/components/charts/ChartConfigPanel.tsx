import { useForm } from '@tanstack/react-form'
import { Palette } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
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
      className="animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-border/60 bg-card p-6 space-y-6"
      data-testid="chart-config-panel"
    >
      {/* General Labels: Title, Subtitle, Axes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="chart-title-input" className="text-muted-foreground">
            Title
          </Label>
          <Input
            id="chart-title-input"
            value={config.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Chart title..."
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="chart-subtitle-input"
            className="text-muted-foreground"
          >
            Subtitle
          </Label>
          <Input
            id="chart-subtitle-input"
            value={config.subtitle}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Optional subtitle..."
          />
        </div>

        {chartDef.supportsAxes && (
          <>
            <div className="space-y-2">
              <Label
                htmlFor="chart-xaxis-input"
                className="text-muted-foreground"
              >
                X-Axis Label
              </Label>
              <Input
                id="chart-xaxis-input"
                value={config.xAxisLabel}
                onChange={(e) => updateField('xAxisLabel', e.target.value)}
                placeholder="Horizontal axis..."
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="chart-yaxis-input"
                className="text-muted-foreground"
              >
                Y-Axis Label
              </Label>
              <Input
                id="chart-yaxis-input"
                value={config.yAxisLabel}
                onChange={(e) => updateField('yAxisLabel', e.target.value)}
                placeholder="Vertical axis..."
              />
            </div>
          </>
        )}
      </div>

      {/* Compact Palette Swatch Selector */}
      <div className="space-y-2.5 border-t border-border/40 pt-5">
        <Label className="text-muted-foreground flex items-center gap-1.5">
          <Palette className="h-4 w-4" />
          Color Palette
        </Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PALETTES) as Array<PaletteId>).map((pid) => {
            const p = PALETTES[pid]
            const active = config.palette === pid
            return (
              <button
                key={pid}
                type="button"
                onClick={() => updateField('palette', pid)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-[transform,background-color,border-color,color] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97] ${
                  active
                    ? 'border-foreground bg-muted/60 font-semibold text-foreground'
                    : 'border-border/60 bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center -space-x-1">
                  {p.colors.slice(0, 4).map((hex) => (
                    <span
                      key={hex}
                      className="h-3 w-3 rounded-full ring-1 ring-background"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span>{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Display Toggles & Chart-Specific Options */}
      <div className="grid grid-cols-1 gap-6 border-t border-border/40 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="toggle-legend">Legend</Label>
          <Switch
            id="toggle-legend"
            checked={config.showLegend}
            onCheckedChange={(checked) => updateField('showLegend', checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="legend-pos-select">Placement</Label>
          <Select
            disabled={!config.showLegend}
            value={config.legendPosition}
            onValueChange={(val) =>
              updateField(
                'legendPosition',
                val as ChartConfig['legendPosition'],
              )
            }
          >
            <SelectTrigger id="legend-pos-select" className="w-[110px]">
              <SelectValue placeholder="Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="toggle-grid">Gridlines</Label>
          <Switch
            id="toggle-grid"
            checked={config.showGrid}
            onCheckedChange={(checked) => updateField('showGrid', checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="toggle-values">Value Labels</Label>
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
        <div className="grid grid-cols-1 gap-5 border-t border-border/40 pt-5 sm:grid-cols-3">
          {chartDef.specificOptionFields.map((field) => {
            const currentValue = config.options[field.key]

            if (field.kind === 'select') {
              return (
                <div key={field.key} className="space-y-2">
                  <Label className="text-muted-foreground">{field.label}</Label>
                  <Select
                    value={String(currentValue)}
                    onValueChange={(val) =>
                      updateSpecificOption(field.key, val as any)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={field.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.choices.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            }

            if (field.kind === 'slider') {
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">
                      {field.label}
                    </Label>
                    <span className="font-mono text-muted-foreground">
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
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <Label>{field.label}</Label>
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
      )}
    </div>
  )
}
