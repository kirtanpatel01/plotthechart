import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PALETTES } from '#/lib/charts/types'
import type { PaletteId, TabularSeriesData } from '#/lib/charts/types'

const gridFeatures = tableFeatures({})

type TabularRow = TabularSeriesData['rows'][number]

const columnHelper = createColumnHelper<typeof gridFeatures, TabularRow>()

interface TabularSeriesInputProps {
  data: TabularSeriesData
  palette: PaletteId
  onChange: (next: TabularSeriesData) => void
}

export function TabularSeriesInput({
  data,
  palette,
  onChange,
}: TabularSeriesInputProps) {
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvError, setCsvError] = useState('')

  const paletteColors = PALETTES[palette]?.colors ?? PALETTES.ocean.colors

  const handleCategoryLabelChange = (value: string) => {
    onChange({
      ...data,
      categoryLabel: value,
    })
  }

  const handleSeriesNameChange = (seriesId: string, name: string) => {
    onChange({
      ...data,
      series: data.series.map((s) => (s.id === seriesId ? { ...s, name } : s)),
    })
  }

  const handleAddSeries = () => {
    const nextIndex = data.series.length + 1
    const newSeriesId = `series-${Date.now()}-${nextIndex}`
    const newSeriesName = `Series ${nextIndex}`

    onChange({
      ...data,
      series: [...data.series, { id: newSeriesId, name: newSeriesName }],
      rows: data.rows.map((row, idx) => ({
        ...row,
        values: {
          ...row.values,
          [newSeriesId]: Math.round(50 + (idx + 1) * 20),
        },
      })),
    })
  }

  const handleRemoveSeries = (seriesId: string) => {
    if (data.series.length <= 1) return
    onChange({
      ...data,
      series: data.series.filter((s) => s.id !== seriesId),
      rows: data.rows.map((row) => {
        const nextValues = { ...row.values }
        delete nextValues[seriesId]
        return { ...row, values: nextValues }
      }),
    })
  }

  const handleRowCategoryChange = (rowId: string, category: string) => {
    onChange({
      ...data,
      rows: data.rows.map((r) => (r.id === rowId ? { ...r, category } : r)),
    })
  }

  const handleCellValueChange = (
    rowId: string,
    seriesId: string,
    raw: string,
  ) => {
    const num = raw === '' || raw === '-' ? 0 : Number(raw)
    const safeNum = Number.isFinite(num) ? num : 0
    onChange({
      ...data,
      rows: data.rows.map((r) =>
        r.id === rowId
          ? {
              ...r,
              values: {
                ...r.values,
                [seriesId]: safeNum,
              },
            }
          : r,
      ),
    })
  }

  const handleAddRow = () => {
    const nextIndex = data.rows.length + 1
    const defaultValues: Record<string, number> = {}
    for (const s of data.series) {
      defaultValues[s.id] = 100
    }
    onChange({
      ...data,
      rows: [
        ...data.rows,
        {
          id: `row-${Date.now()}-${nextIndex}`,
          category: `Item ${nextIndex}`,
          values: defaultValues,
        },
      ],
    })
  }

  const handleRemoveRow = (rowId: string) => {
    if (data.rows.length <= 1) return
    onChange({
      ...data,
      rows: data.rows.filter((r) => r.id !== rowId),
    })
  }

  const handleApplyCsv = () => {
    setCsvError('')
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length < 2) {
      setCsvError(
        'Enter at least a header row and one data row (e.g. Category, Series A, Series B).',
      )
      return
    }

    const splitLine = (line: string) =>
      line.split(/[,\t]/).map((cell) => cell.trim())

    const headers = splitLine(lines[0])
    if (headers.length < 2) {
      setCsvError('Header must include a category column and at least 1 series.')
      return
    }

    const categoryLabel = headers[0] || 'Category'
    const newSeries = headers.slice(1).map((name, idx) => ({
      id: `series-${idx + 1}`,
      name: name || `Series ${idx + 1}`,
    }))

    const newRows = lines.slice(1).map((line, rIdx) => {
      const cells = splitLine(line)
      const values: Record<string, number> = {}
      newSeries.forEach((s, sIdx) => {
        const parsed = Number(cells[sIdx + 1])
        values[s.id] = Number.isFinite(parsed) ? parsed : 0
      })
      return {
        id: `row-${rIdx + 1}`,
        category: cells[0] || `Row ${rIdx + 1}`,
        values,
      }
    })

    onChange({
      schemaKind: 'tabular-series',
      categoryLabel,
      series: newSeries,
      rows: newRows,
    })
    setShowCsvImport(false)
    setCsvText('')
  }

  const columns = useMemo(() => {
    const categoryCol = columnHelper.accessor('category', {
      id: '__category__',
      header: () => (
        <div className="min-w-[120px]">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Dimension Column
          </span>
          <Input
            value={data.categoryLabel}
            onChange={(e) => handleCategoryLabelChange(e.target.value)}
            aria-label="Category dimension label"
            className="h-7 text-xs font-semibold bg-background/80"
          />
        </div>
      ),
      cell: (info) => {
        const row = info.row.original
        return (
          <Input
            value={row.category}
            onChange={(e) => handleRowCategoryChange(row.id, e.target.value)}
            aria-label={`Category name for row ${info.row.index + 1}`}
            className="h-8 text-xs font-medium min-w-[110px]"
          />
        )
      },
    })

    const seriesCols = data.series.map((s, idx) => {
      const seriesColor =
        s.color || paletteColors[idx % paletteColors.length] || '#0ea5e9'
      return columnHelper.accessor((row) => row.values[s.id] ?? 0, {
        id: s.id,
        header: () => (
          <div className="min-w-[125px]">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seriesColor }}
                />
                Series {idx + 1}
              </span>
              {data.series.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSeries(s.id)}
                  title={`Remove ${s.name}`}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <Input
              value={s.name}
              onChange={(e) => handleSeriesNameChange(s.id, e.target.value)}
              aria-label={`Series ${idx + 1} name`}
              className="h-7 text-xs font-semibold bg-background/80"
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original
          const currentVal = row.values[s.id] ?? 0
          return (
            <Input
              type="number"
              step="any"
              value={currentVal}
              onChange={(e) =>
                handleCellValueChange(row.id, s.id, e.target.value)
              }
              aria-label={`${s.name} value for ${row.category}`}
              className="h-8 text-xs font-mono tabular-nums min-w-[95px]"
            />
          )
        },
      })
    })

    const actionsCol = columnHelper.display({
      id: '__actions__',
      header: () => <span className="sr-only">Row Actions</span>,
      cell: (info) => {
        const row = info.row.original
        return (
          <button
            type="button"
            disabled={data.rows.length <= 1}
            onClick={() => handleRemoveRow(row.id)}
            title="Delete row"
            className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )
      },
    })

    return columnHelper.columns([categoryCol, ...seriesCols, actionsCol])
  }, [data, paletteColors])

  const table = useTable({
    features: gridFeatures,
    data: data.rows,
    columns,
  })

  return (
    <div className="space-y-3" data-testid="tabular-series-input">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {data.rows.length}
          </span>{' '}
          categories ×{' '}
          <span className="font-semibold text-foreground">
            {data.series.length}
          </span>{' '}
          series (TanStack Table v9 Grid)
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowCsvImport((v) => !v)}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {showCsvImport ? 'Close CSV Paste' : 'Paste CSV'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAddSeries}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Series Column
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAddRow}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </Button>
        </div>
      </div>

      {showCsvImport && (
        <div className="surface-enter rounded-xl border border-border bg-muted/40 p-3 space-y-2">
          <Label className="text-xs font-semibold">
            Paste Comma or Tab Separated Values (First row = headers)
          </Label>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Quarter, North America, Europe\nQ1, 120, 95\nQ2, 150, 110`}
            className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
          />
          {csvError && <p className="text-xs text-destructive">{csvError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCsvImport(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={handleApplyCsv}
            >
              Import into Grid
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card/60">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-2.5 align-bottom font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/60">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/30 transition-colors"
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="p-2 align-middle">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
