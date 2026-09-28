import { useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PALETTES } from '#/lib/charts/types'
import type { CoordinatePointsData, PaletteId } from '#/lib/charts/types'

interface CoordinatePointsInputProps {
  data: CoordinatePointsData
  palette: PaletteId
  onChange: (next: CoordinatePointsData) => void
}

export function CoordinatePointsInput({
  data,
  palette,
  onChange,
}: CoordinatePointsInputProps) {
  const [newGroupName, setNewGroupName] = useState('')
  const paletteColors = PALETTES[palette]?.colors ?? PALETTES.ocean.colors

  const handleAddGroup = () => {
    const trimmed = newGroupName.trim() || `Cluster ${data.groups.length + 1}`
    const newId = `grp-${Date.now()}`
    onChange({
      ...data,
      groups: [...data.groups, { id: newId, name: trimmed }],
    })
    setNewGroupName('')
  }

  const handleGroupNameChange = (groupId: string, name: string) => {
    onChange({
      ...data,
      groups: data.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    })
  }

  const handleRemoveGroup = (groupId: string) => {
    if (data.groups.length <= 1) return
    const fallbackGroupId =
      data.groups.find((g) => g.id !== groupId)?.id || data.groups[0].id
    onChange({
      ...data,
      groups: data.groups.filter((g) => g.id !== groupId),
      points: data.points.map((pt) =>
        pt.groupId === groupId ? { ...pt, groupId: fallbackGroupId } : pt,
      ),
    })
  }

  const handlePointChange = (
    pointId: string,
    patch: Partial<CoordinatePointsData['points'][number]>,
  ) => {
    onChange({
      ...data,
      points: data.points.map((pt) =>
        pt.id === pointId ? { ...pt, ...patch } : pt,
      ),
    })
  }

  const handleAddPoint = () => {
    const idx = data.points.length + 1
    const defaultGroup = data.groups[idx % data.groups.length] || data.groups[0]
    onChange({
      ...data,
      points: [
        ...data.points,
        {
          id: `pt-${Date.now()}-${idx}`,
          label: `Point P${idx}`,
          groupId: defaultGroup.id,
          x: Math.round(20 + idx * 8),
          y: Math.round(50 + idx * 5),
          size: 18,
        },
      ],
    })
  }

  const handleRemovePoint = (pointId: string) => {
    if (data.points.length <= 1) return
    onChange({
      ...data,
      points: data.points.filter((pt) => pt.id !== pointId),
    })
  }

  const handleGenerateCorrelatedCluster = () => {
    const generated: CoordinatePointsData['points'] = []
    data.groups.forEach((grp, gIdx) => {
      for (let i = 0; i < 4; i++) {
        const baseX = 18 + gIdx * 28 + i * 6
        const baseY = 52 + gIdx * 15 + i * 4 + ((i % 2 === 0 ? 1 : -1) * 3)
        generated.push({
          id: `pt-gen-${gIdx}-${i}-${Date.now()}`,
          label: `${grp.name.split(' ')[0]} #${i + 1}`,
          groupId: grp.id,
          x: Math.min(100, Math.max(5, baseX)),
          y: Math.min(100, Math.max(10, baseY)),
          size: 14 + gIdx * 8 + i * 2,
        })
      }
    })
    onChange({
      ...data,
      points: generated,
    })
  }

  return (
    <div className="space-y-4" data-testid="coordinate-points-input">
      {/* Cluster / Cohort Definitions */}
      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs font-semibold">
            Coordinate Clusters / Cohorts ({data.groups.length})
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New cluster name..."
              className="h-7 w-40 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAddGroup}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cluster
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.groups.map((grp, idx) => {
            const color =
              grp.color || paletteColors[idx % paletteColors.length] || '#0ea5e9'
            return (
              <div
                key={grp.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <input
                  type="text"
                  value={grp.name}
                  onChange={(e) => handleGroupNameChange(grp.id, e.target.value)}
                  aria-label={`Cluster ${idx + 1} name`}
                  className="w-28 bg-transparent text-xs font-medium focus:outline-none"
                />
                {data.groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(grp.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete cluster"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Coordinate Points Tuple Editor */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          <strong className="text-foreground">{data.points.length}</strong>{' '}
          (X, Y, Size) coordinate tuples
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleGenerateCorrelatedCluster}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Synthesize Clusters
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAddPoint}
          >
            <Plus className="h-3.5 w-3.5" />
            Add (X, Y) Point
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {data.points.map((pt, idx) => {
          const groupIdx = Math.max(
            0,
            data.groups.findIndex((g) => g.id === pt.groupId),
          )
          const color =
            paletteColors[groupIdx % paletteColors.length] || '#0ea5e9'

          return (
            <div
              key={pt.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card/70 p-2.5 sm:grid-cols-12 sm:items-center"
            >
              <div className="flex items-center gap-2 sm:col-span-3">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={pt.label}
                  onChange={(e) =>
                    handlePointChange(pt.id, { label: e.target.value })
                  }
                  placeholder="Point label"
                  aria-label={`Point ${idx + 1} label`}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={pt.groupId}
                  onChange={(e) =>
                    handlePointChange(pt.id, { groupId: e.target.value })
                  }
                  aria-label={`Point ${idx + 1} cluster`}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  {data.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  X:
                </span>
                <Input
                  type="number"
                  step="any"
                  value={pt.x}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    handlePointChange(pt.id, { x: Number.isFinite(n) ? n : 0 })
                  }}
                  aria-label={`Point ${idx + 1} X coordinate`}
                  className="h-8 text-xs font-mono tabular-nums"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  Y:
                </span>
                <Input
                  type="number"
                  step="any"
                  value={pt.y}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    handlePointChange(pt.id, { y: Number.isFinite(n) ? n : 0 })
                  }}
                  aria-label={`Point ${idx + 1} Y coordinate`}
                  className="h-8 text-xs font-mono tabular-nums"
                />
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:col-span-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    R:
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={pt.size}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      handlePointChange(pt.id, {
                        size: Number.isFinite(n)
                          ? Math.min(100, Math.max(1, n))
                          : 10,
                      })
                    }}
                    aria-label={`Point ${idx + 1} bubble size`}
                    className="h-8 text-xs font-mono tabular-nums"
                  />
                </div>
                <button
                  type="button"
                  disabled={data.points.length <= 1}
                  onClick={() => handleRemovePoint(pt.id)}
                  title="Remove coordinate point"
                  className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors rounded shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
