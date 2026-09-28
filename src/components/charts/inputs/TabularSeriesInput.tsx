import { useMemo, useRef, useState } from 'react'
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

  // Keep latest data & callbacks in a ref so TanStack Table column definitions
  // stay referentially stable across keystrokes (preventing FlexRender from
  // unmounting and remounting <Input> cells on every character typed).
  const latestRef = useRef({
    data,
    paletteColors,
    handleCategoryLabelChange,
    handleSeriesNameChange,
    handleRemoveSeries,
    handleRowCategoryChange,
    handleCellValueChange,
    handleRemoveRow,
  })
  latestRef.current = {
    data,
    paletteColors,
    handleCategoryLabelChange,
    handleSeriesNameChange,
    handleRemoveSeries,
    handleRowCategoryChange,
    handleCellValueChange,
    handleRemoveRow,
  }

  const seriesStructureKey = data.series.map((s) => s.id).join('|')

  const columns = useMemo(() => {
    const categoryCol = columnHelper.accessor('category', {
      id: '__category__',
      header: () => {
        const cur = latestRef.current
        return (
          <div className="min-w-[120px]">
            <Input
              value={cur.data.categoryLabel}
              onChange={(e) => cur.handleCategoryLabelChange(e.target.value)}
              aria-label="Category dimension label"
              className="border-transparent bg-transparent px-2 font-semibold text-muted-foreground hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
            />
          </div>
        )
      },
      cell: (info) => {
        const cur = latestRef.current
        const rowId = info.row.original.id
        const row =
          cur.data.rows.find((r) => r.id === rowId) ?? info.row.original
        return (
          <Input
            value={row.category}
            onChange={(e) => cur.handleRowCategoryChange(row.id, e.target.value)}
            aria-label={`Category name for row ${info.row.index + 1}`}
            className="min-w-[110px] border-transparent bg-transparent px-2.5 font-medium hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
          />
        )
      },
    })

    const seriesIds = seriesStructureKey ? seriesStructureKey.split('|') : []
    const seriesCols = seriesIds.map((seriesId, idx) => {
      return columnHelper.accessor((row) => row.values[seriesId] ?? 0, {
        id: seriesId,
        header: () => {
          const cur = latestRef.current
          const s = cur.data.series.find((item) => item.id === seriesId)
          if (!s) return null
          const seriesColor =
            s.color ||
            cur.paletteColors[idx % cur.paletteColors.length] ||
            '#0ea5e9'
          return (
            <div className="group/col flex min-w-[155px] items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 ml-1.5"
                style={{ backgroundColor: seriesColor }}
              />
              <Input
                value={s.name}
                onChange={(e) =>
                  cur.handleSeriesNameChange(s.id, e.target.value)
                }
                aria-label={`Series ${idx + 1} name`}
                className="border-transparent bg-transparent px-2 font-semibold text-foreground hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
              />
              {cur.data.series.length > 1 && (
                <button
                  type="button"
                  onClick={() => cur.handleRemoveSeries(s.id)}
                  title={`Remove ${s.name}`}
                  className="opacity-0 group-hover/col:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1 rounded shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        },
        cell: (info) => {
          const cur = latestRef.current
          const rowId = info.row.original.id
          const row =
            cur.data.rows.find((r) => r.id === rowId) ?? info.row.original
          const s = cur.data.series.find((item) => item.id === seriesId)
          const currentVal = row.values[seriesId] ?? 0
          return (
            <Input
              type="number"
              step="any"
              value={currentVal}
              onChange={(e) =>
                cur.handleCellValueChange(row.id, seriesId, e.target.value)
              }
              aria-label={`${s?.name ?? seriesId} value for ${row.category}`}
              className="min-w-[100px] border-transparent bg-transparent px-2.5 font-mono tabular-nums hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
            />
          )
        },
      })
    })

    const actionsCol = columnHelper.display({
      id: '__actions__',
      header: () => <span className="sr-only">Row Actions</span>,
      cell: (info) => {
        const cur = latestRef.current
        const rowId = info.row.original.id
        return (
          <button
            type="button"
            disabled={cur.data.rows.length <= 1}
            onClick={() => cur.handleRemoveRow(rowId)}
            title="Delete row"
            className="p-1.5 text-muted-foreground/50 hover:text-destructive disabled:opacity-20 transition-colors rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )
      },
    })

    return columnHelper.columns([categoryCol, ...seriesCols, actionsCol])
  }, [seriesStructureKey])

  const table = useTable({
    features: gridFeatures,
    data: data.rows,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <div className="space-y-4" data-testid="tabular-series-input">
      {/* Primary Data Table */}
      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border/70 bg-muted/30"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 align-middle font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/40">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/20 transition-colors"
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quiet Compact Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleAddRow}
          >
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleAddSeries}
          >
            <Plus className="h-4 w-4" />
            Add Series
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setShowCsvImport((v) => !v)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          {showCsvImport ? 'Close CSV' : 'Paste CSV'}
        </Button>
      </div>

      {showCsvImport && (
        <div className="surface-enter rounded-xl border border-border/70 bg-muted/25 p-4 space-y-3">
          <Label className="text-muted-foreground">
            Paste comma or tab-separated values (first row as headers)
          </Label>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Quarter, North America, Europe\nQ1, 120, 95\nQ2, 150, 110`}
            className="w-full rounded-lg border border-input bg-background p-3 font-mono"
          />
          {csvError && <p className="text-destructive">{csvError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCsvImport(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyCsv}
            >
              Import Data
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
