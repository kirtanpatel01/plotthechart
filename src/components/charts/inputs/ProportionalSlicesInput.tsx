import { ArrowDownWideNarrow, Percent, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ScrollArea, ScrollBar } from '#/components/ui/scroll-area'
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
          label: '',
          value: 0,
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
      {/* Subtle proportional strip */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {data.slices.map((s, idx) => {
          const pct =
            totalValue > 0 ? Math.max(0, (s.value / totalValue) * 100) : 0
          const color =
            s.color || paletteColors[idx % paletteColors.length] || '#0ea5e9'
          return (
            <div
              key={s.id}
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${s.label || `Segment ${idx + 1}`}: ${pct.toFixed(1)}%`}
              className="transition-[background-color,opacity] duration-[180ms] ease-[var(--ease-out)]"
            />
          )
        })}
      </div>

      {/* Clean Unified Table of Slices */}
      <ScrollArea className="w-full rounded-xl border border-border/70 bg-card">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/30 font-semibold text-muted-foreground">
              <th className="px-3.5 py-2.5">Segment</th>
              <th className="px-3.5 py-2.5 w-40">
                <div className="flex items-center gap-1.5">
                  <span>Value</span>
                  <Input
                    value={data.unitLabel}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    placeholder="Unit"
                    aria-label="Measurement unit"
                    className="h-7 w-16 border-transparent bg-background/60 px-2 font-medium hover:border-border/60 focus-visible:border-ring shadow-none"
                  />
                </div>
              </th>
              <th className="px-3.5 py-2.5 w-20 text-right">Share</th>
              <th className="px-3.5 py-2.5">Note</th>
              <th className="px-2 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
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
                <tr
                  key={slice.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3.5 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sliceColor}
                        onChange={(e) =>
                          handleSliceChange(slice.id, { color: e.target.value })
                        }
                        title="Choose custom slice color"
                        className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 shrink-0"
                      />
                      <Input
                        value={slice.label}
                        onChange={(e) =>
                          handleSliceChange(slice.id, { label: e.target.value })
                        }
                        placeholder={`Segment ${idx + 1}`}
                        aria-label={`Slice ${idx + 1} label`}
                        className="border-transparent bg-transparent px-2 font-medium hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                      />
                    </div>
                  </td>

                  <td className="px-3.5 py-2 align-middle">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={slice.value === 0 ? '' : slice.value}
                      onChange={(e) => {
                        const parsed = Number(e.target.value)
                        handleSliceChange(slice.id, {
                          value:
                            e.target.value === ''
                              ? 0
                              : Number.isFinite(parsed)
                                ? Math.max(0, parsed)
                                : 0,
                        })
                      }}
                      aria-label={`Slice ${idx + 1} value`}
                      className="border-transparent bg-transparent px-2 font-mono tabular-nums hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                    />
                  </td>

                  <td className="px-3.5 py-2 align-middle text-right font-mono tabular-nums text-muted-foreground">
                    {sharePct}%
                  </td>

                  <td className="px-3.5 py-2 align-middle">
                    <Input
                      value={slice.note ?? ''}
                      onChange={(e) =>
                        handleSliceChange(slice.id, { note: e.target.value })
                      }
                      placeholder="Optional note..."
                      aria-label={`Slice ${idx + 1} annotation`}
                      className="border-transparent bg-transparent px-2 text-muted-foreground hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                    />
                  </td>

                  <td className="px-2 py-2 align-middle text-right">
                    <button
                      type="button"
                      disabled={data.slices.length <= 1}
                      onClick={() => handleRemoveSlice(slice.id)}
                      title="Remove slice"
                      className="p-1.5 text-muted-foreground/50 hover:text-destructive disabled:opacity-20 transition-colors rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Quiet Compact Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleAddSlice}
          >
            <Plus className="h-4 w-4" />
            Add Slice
          </Button>
          <span className="text-muted-foreground tabular-nums">
            Total: {totalValue.toLocaleString()} {data.unitLabel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleSortDescending}
          >
            <ArrowDownWideNarrow className="h-4 w-4" />
            Sort
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleNormalizeTo100}
          >
            <Percent className="h-4 w-4" />
            Normalize 100%
          </Button>
        </div>
      </div>
    </div>
  )
}
