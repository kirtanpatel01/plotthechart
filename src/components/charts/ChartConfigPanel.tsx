import { useForm } from '@tanstack/react-form'
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
import type {
  ChartConfig,
  ChartSpecificOptions,
  ChartTypeId,
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

  const hasSpecificOptions = chartDef.specificOptionFields.length > 0

  return (
    <div
      className={`grid grid-cols-1 gap-5 ${
        hasSpecificOptions ? 'sm:grid-cols-2' : ''
      }`}
      data-testid="chart-config-panel"
    >
      {/* Column 1: Display Toggles (stacked in one vertical column) */}
      <div className="flex flex-col justify-between gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="toggle-legend" className="text-xs font-medium">
            Legend
          </Label>
          <Switch
            id="toggle-legend"
            checked={config.showLegend}
            onCheckedChange={(checked) => updateField('showLegend', checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="legend-pos-select" className="text-xs font-medium">
            Placement
          </Label>
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
            <SelectTrigger
              id="legend-pos-select"
              size="sm"
              className="w-[110px] text-xs"
            >
              <SelectValue placeholder="Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="toggle-grid" className="text-xs font-medium">
            Gridlines
          </Label>
          <Switch
            id="toggle-grid"
            checked={config.showGrid}
            onCheckedChange={(checked) => updateField('showGrid', checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="toggle-values" className="text-xs font-medium">
            Value Labels
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

      {/* Column 2: Registry-Driven Chart-Specific Options (stacked in one vertical column) */}
      {hasSpecificOptions && (
        <div className="flex flex-col justify-between gap-3.5 border-t border-border/50 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
          {chartDef.specificOptionFields.map((field) => {
            const currentValue = config.options[field.key]

            if (field.kind === 'select') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {field.label}
                  </Label>
                  <Select
                    value={String(currentValue)}
                    onValueChange={(val) =>
                      updateSpecificOption(field.key, val as any)
                    }
                  >
                    <SelectTrigger size="sm" className="w-full text-xs">
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
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      {field.label}
                    </Label>
                    <span className="font-mono text-xs text-muted-foreground">
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
                  className="flex items-center justify-between gap-3 py-0.5"
                >
                  <Label className="text-xs font-medium">{field.label}</Label>
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
