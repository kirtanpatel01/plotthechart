import { ArrowDownWideNarrow, Percent, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PALETTES } from '#/lib/charts/types'
import type { PaletteId, ProportionalSlicesData } from '#/lib/charts/types'

interface ProportionalSlicesInputProps {
  data: ProportionalSlicesData
  palette: PaletteId
  onChange: (next: ProportionalSlicesData) => void
}

export function ProportionalSlicesInput({
  data,
  palette,
  onChange,
}: ProportionalSlicesInputProps) {
  const paletteColors = PALETTES[palette]?.colors ?? PALETTES.ocean.colors
  const totalValue = data.slices.reduce(
    (sum, s) => sum + Math.max(0, Number(s.value) || 0),
    0,
  )

  const handleUnitChange = (unitLabel: string) => {
    onChange({ ...data, unitLabel })
  }

  const handleSliceChange = (
    sliceId: string,
    patch: Partial<ProportionalSlicesData['slices'][number]>,
  ) => {
    onChange({
      ...data,
      slices: data.slices.map((s) =>
        s.id === sliceId ? { ...s, ...patch } : s,
      ),
    })
  }

  const handleAddSlice = () => {
    const idx = data.slices.length + 1
    onChange({
      ...data,
      slices: [
        ...data.slices,
        {
          id: `slice-${Date.now()}-${idx}`,
          label: `Segment ${idx}`,
          value: 100,
          note: '',
        },
      ],
    })
  }

  const handleRemoveSlice = (sliceId: string) => {
    if (data.slices.length <= 1) return
    onChange({
      ...data,
      slices: data.slices.filter((s) => s.id !== sliceId),
    })
  }

  const handleSortDescending = () => {
    onChange({
      ...data,
      slices: [...data.slices].sort((a, b) => b.value - a.value),
    })
  }

  const handleNormalizeTo100 = () => {
    if (totalValue <= 0) return
    onChange({
      ...data,
      unitLabel: '%',
      slices: data.slices.map((s) => ({
        ...s,
        value: Number(((s.value / totalValue) * 100).toFixed(1)),
      })),
    })
  }

  return (
    <div className="space-y-4" data-testid="proportional-slices-input">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Measurement Unit
            </Label>
            <Input
              value={data.unitLabel}
              onChange={(e) => handleUnitChange(e.target.value)}
              placeholder="e.g. GWh, $K, %"
              className="mt-1 h-7 w-28 text-xs font-semibold"
            />
          </div>
          <div className="border-l border-border pl-3">
            <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
              Total Sum
            </span>
            <span className="text-sm font-bold tabular-nums">
              {totalValue.toLocaleString()} {data.unitLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleSortDescending}
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            Sort High → Low
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleNormalizeTo100}
          >
            <Percent className="h-3.5 w-3.5" />
            Normalize to 100%
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAddSlice}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Slice
          </Button>
        </div>
      </div>

      {/* Live proportional strip preview */}
      <div className="space-y-1.5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {data.slices.map((s, idx) => {
            const pct =
              totalValue > 0 ? Math.max(0, (s.value / totalValue) * 100) : 0
            const color =
              s.color || paletteColors[idx % paletteColors.length] || '#0ea5e9'
            return (
              <div
                key={s.id}
                style={{ width: `${pct}%`, backgroundColor: color }}
                title={`${s.label}: ${pct.toFixed(1)}%`}
                className="transition-[background-color,opacity] duration-[180ms] ease-[var(--ease-out)]"
              />
            )
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        {data.slices.map((slice, idx) => {
          const sharePct =
            totalValue > 0
              ? ((Math.max(0, slice.value) / totalValue) * 100).toFixed(1)
              : '0.0'
          const sliceColor =
            slice.color ||
            paletteColors[idx % paletteColors.length] ||
            '#0ea5e9'

          return (
            <div
              key={slice.id}
              className="rounded-xl border border-border bg-card/70 p-3 transition-colors hover:border-foreground/20"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-center">
                <div className="flex items-center gap-2 sm:col-span-5">
                  <input
                    type="color"
                    value={sliceColor}
                    onChange={(e) =>
                      handleSliceChange(slice.id, { color: e.target.value })
                    }
                    title="Choose custom slice color"
                    className="h-7 w-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                  />
                  <Input
                    value={slice.label}
                    onChange={(e) =>
                      handleSliceChange(slice.id, { label: e.target.value })
                    }
                    placeholder="Slice label"
                    aria-label={`Slice ${idx + 1} label`}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 sm:col-span-3">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={slice.value}
                    onChange={(e) => {
                      const parsed = Number(e.target.value)
                      handleSliceChange(slice.id, {
                        value: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
                      })
                    }}
                    aria-label={`Slice ${idx + 1} value`}
                    className="h-8 text-xs font-mono tabular-nums"
                  />
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0">
                    {sharePct}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:col-span-4">
                  <Input
                    value={slice.note ?? ''}
                    onChange={(e) =>
                      handleSliceChange(slice.id, { note: e.target.value })
                    }
                    placeholder="Annotation / note (optional)"
                    aria-label={`Slice ${idx + 1} annotation`}
                    className="h-8 text-xs text-muted-foreground"
                  />
                  <button
                    type="button"
                    disabled={data.slices.length <= 1}
                    onClick={() => handleRemoveSlice(slice.id)}
                    title="Remove slice"
                    className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors rounded shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
