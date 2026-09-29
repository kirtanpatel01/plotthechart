import { useState } from 'react'
import {
  ArrowDownWideNarrow,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Percent,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ScrollArea, ScrollBar } from '#/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { getTodayIsoDate } from '#/lib/charts/registry'
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
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(8)

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
          date: getTodayIsoDate(),
          value: 0,
          note: '',
        },
      ],
    })
    setPageIndex(Math.max(0, Math.ceil(idx / pageSize) - 1))
  }

  const handleRemoveSlice = (sliceId: string) => {
    if (data.slices.length <= 1) return
    const nextCount = data.slices.length - 1
    onChange({
      ...data,
      slices: data.slices.filter((s) => s.id !== sliceId),
    })
    setPageIndex((prev) =>
      Math.min(prev, Math.max(0, Math.ceil(nextCount / pageSize) - 1)),
    )
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

  const totalSlices = data.slices.length
  const pageCount = Math.max(1, Math.ceil(totalSlices / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const startIdx = safePageIndex * pageSize
  const visibleSlices = data.slices.slice(startIdx, startIdx + pageSize)
  const startRow = totalSlices === 0 ? 0 : startIdx + 1
  const endRow = Math.min(totalSlices, startIdx + pageSize)

  return (
    <div className="space-y-3.5 sm:space-y-4 min-w-0" data-testid="proportional-slices-input">
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
      <ScrollArea className="w-full max-w-full rounded-xl border border-border/70 bg-card">
        <table className="w-full min-w-[460px] border-collapse text-left">
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
            {visibleSlices.map((slice, localIdx) => {
              const idx = startIdx + localIdx
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
                      className="cursor-pointer p-1.5 text-muted-foreground/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-20 transition-colors rounded"
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

      {/* Compact Pagination Footer */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 sm:px-3 py-1.5 text-xs text-muted-foreground"
        data-testid="slices-pagination-bar"
      >
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            <span className="hidden sm:inline">Showing </span>
            <strong className="font-medium text-foreground">{startRow}–{endRow}</strong> of{' '}
            <strong className="font-medium text-foreground">{totalSlices}</strong>
          </span>

          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val) || 8)
              setPageIndex(0)
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Slices per page"
              className="h-7 gap-1 px-2 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="5">5 / page</SelectItem>
              <SelectItem value="8">8 / page</SelectItem>
              <SelectItem value="15">15 / page</SelectItem>
              <SelectItem value="30">30 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={safePageIndex <= 0}
            onClick={() => setPageIndex(0)}
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={safePageIndex <= 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-1.5 sm:px-2 tabular-nums font-medium text-foreground">
            <span className="hidden sm:inline">Page </span>
            {safePageIndex + 1}
            <span className="hidden sm:inline"> of </span>
            <span className="sm:hidden"> / </span>
            {pageCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() => setPageIndex(pageCount - 1)}
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

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
