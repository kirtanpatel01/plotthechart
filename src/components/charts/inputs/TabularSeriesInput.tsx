import { useMemo, useRef, useState } from 'react'
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
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
import type { PaletteId, TabularSeriesData } from '#/lib/charts/types'

const gridFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})

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

    onChange({
      ...data,
      series: [...data.series, { id: newSeriesId, name: '' }],
      rows: data.rows.map((row) => ({
        ...row,
        values: {
          ...row.values,
          [newSeriesId]: 0,
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
      defaultValues[s.id] = 0
    }
    onChange({
      ...data,
      rows: [
        ...data.rows,
        {
          id: `row-${Date.now()}-${nextIndex}`,
          category: '',
          date: getTodayIsoDate(),
          values: defaultValues,
        },
      ],
    })
    table.setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(0, Math.ceil(nextIndex / prev.pageSize) - 1),
    }))
  }

  const handleRemoveRow = (rowId: string) => {
    if (data.rows.length <= 1) return
    const nextCount = data.rows.length - 1
    onChange({
      ...data,
      rows: data.rows.filter((r) => r.id !== rowId),
    })
    table.setPagination((prev) => ({
      ...prev,
      pageIndex: Math.min(
        prev.pageIndex,
        Math.max(0, Math.ceil(nextCount / prev.pageSize) - 1),
      ),
    }))
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

    const today = getTodayIsoDate()
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
        date: today,
        values,
      }
    })

    onChange({
      schemaKind: 'tabular-series',
      categoryLabel,
      series: newSeries,
      rows: newRows,
    })
    table.setPagination((prev) => ({ ...prev, pageIndex: 0 }))
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
          <div className="w-24">
            <Input
              value={cur.data.categoryLabel}
              onChange={(e) => cur.handleCategoryLabelChange(e.target.value)}
              placeholder="Category"
              aria-label="Category dimension label"
              className="h-8 border-transparent bg-transparent px-2 font-semibold text-muted-foreground hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
            />
          </div>
        )
      },
      cell: (info) => {
        const cur = latestRef.current
        const rowId = info.row.original.id
        const globalIdx = cur.data.rows.findIndex((r) => r.id === rowId)
        const displayRowNum = (globalIdx >= 0 ? globalIdx : info.row.index) + 1
        const row =
          globalIdx >= 0 ? cur.data.rows[globalIdx] : info.row.original
        return (
          <div className="w-24">
            <Input
              value={row.category}
              onChange={(e) => cur.handleRowCategoryChange(row.id, e.target.value)}
              placeholder={`Row ${displayRowNum}`}
              aria-label={`Category name for row ${displayRowNum}`}
              className="h-8 border-transparent bg-transparent px-2 font-medium hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
            />
          </div>
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
            <div className="group/col flex w-28 items-center gap-1">
              <div className="relative flex flex-1 items-center">
                <span
                  className="pointer-events-none absolute left-2 h-2 w-2 rounded-full ring-1 ring-background shadow-xs shrink-0"
                  style={{ backgroundColor: seriesColor }}
                />
                <Input
                  value={s.name}
                  onChange={(e) =>
                    cur.handleSeriesNameChange(s.id, e.target.value)
                  }
                  placeholder={`Series ${idx + 1}`}
                  aria-label={`Series ${idx + 1} name`}
                  className="h-8 pl-5 pr-1.5 text-xs font-semibold text-foreground border-transparent bg-transparent hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none transition-colors"
                />
              </div>
              {cur.data.series.length > 1 && (
                <button
                  type="button"
                  onClick={() => cur.handleRemoveSeries(s.id)}
                  title={`Remove ${s.name || `Series ${idx + 1}`}`}
                  className="cursor-pointer opacity-0 group-hover/col:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5 rounded shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        },
        cell: (info) => {
          const cur = latestRef.current
          const rowId = info.row.original.id
          const globalIdx = cur.data.rows.findIndex((r) => r.id === rowId)
          const displayRowNum = (globalIdx >= 0 ? globalIdx : info.row.index) + 1
          const row =
            globalIdx >= 0 ? cur.data.rows[globalIdx] : info.row.original
          const s = cur.data.series.find((item) => item.id === seriesId)
          const currentVal = row.values[seriesId] ?? 0
          return (
            <div className="w-28">
              <Input
                type="number"
                step="any"
                placeholder="0"
                value={currentVal === 0 ? '' : currentVal}
                onChange={(e) =>
                  cur.handleCellValueChange(row.id, seriesId, e.target.value)
                }
                aria-label={`${s?.name || `Series ${idx + 1}`} value for ${row.category || `Row ${displayRowNum}`}`}
                className="h-8 border-transparent bg-transparent px-2 font-mono tabular-nums text-xs hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
              />
            </div>
          )
        },
      })
    })

    const actionsCol = columnHelper.display({
      id: '__actions__',
      header: () => null,
      cell: (info) => {
        const cur = latestRef.current
        const rowId = info.row.original.id
        return (
          <button
            type="button"
            disabled={cur.data.rows.length <= 1}
            onClick={() => cur.handleRemoveRow(rowId)}
            title="Delete row"
            aria-label="Delete row"
            className="cursor-pointer p-1.5 text-muted-foreground/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-20 transition-colors rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )
      },
    })

    return columnHelper.columns([categoryCol, ...seriesCols, actionsCol])
  }, [seriesStructureKey])

  const table = useTable(
    {
      features: gridFeatures,
      data: data.rows,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 8,
        },
      },
      autoResetPageIndex: false,
    },
    (state) => ({ pagination: state.pagination }),
  )

  const pagination = table.state.pagination
  const totalRows = data.rows.length
  const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize))
  const safePageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const startRow = totalRows === 0 ? 0 : safePageIndex * pagination.pageSize + 1
  const endRow = Math.min(totalRows, (safePageIndex + 1) * pagination.pageSize)

  return (
    <div className="space-y-3.5 sm:space-y-4 min-w-0" data-testid="tabular-series-input">
      {/* Primary Data Table */}
      <ScrollArea className="w-full max-w-full rounded-xl border border-border/70 bg-card">
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
                    className="px-2.5 sm:px-3 py-2.5 align-middle font-medium"
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
                  <td key={cell.id} className="px-2.5 sm:px-3 py-2 align-middle">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Compact Pagination Footer */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 sm:px-3 py-1.5 text-xs text-muted-foreground"
        data-testid="tabular-pagination-bar"
      >
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            <span className="hidden sm:inline">Showing </span>
            <strong className="font-medium text-foreground">
              {startRow}–{endRow}
            </strong>{' '}
            of{' '}
            <strong className="font-medium text-foreground">{totalRows}</strong>
          </span>

          <Select
            value={String(pagination.pageSize)}
            onValueChange={(val) => {
              const nextSize = Number(val) || 8
              table.setPagination({
                pageIndex: 0,
                pageSize: nextSize,
              })
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Rows per page"
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
            onClick={() => table.firstPage()}
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
            onClick={() => table.previousPage()}
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
            onClick={() => table.nextPage()}
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
            onClick={() => table.lastPage()}
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
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
        <div className="animate-in fade-in zoom-in-95 duration-200 rounded-xl border border-border/70 bg-muted/25 p-4 space-y-3">
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
