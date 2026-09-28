import { useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
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
          label: '',
          groupId: defaultGroup.id,
          x: 0,
          y: 0,
          size: 0,
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

  const [showClusters, setShowClusters] = useState(false)

  return (
    <div className="space-y-4" data-testid="coordinate-points-input">
      {/* Primary Coordinate Points Table */}
      <ScrollArea className="w-full rounded-xl border border-border/70 bg-card">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/30 font-semibold text-muted-foreground">
              <th className="px-3.5 py-2.5">Label</th>
              <th className="px-3.5 py-2.5 w-44">Cluster</th>
              <th className="px-3.5 py-2.5 w-24">X</th>
              <th className="px-3.5 py-2.5 w-24">Y</th>
              <th className="px-3.5 py-2.5 w-24">Size</th>
              <th className="px-2 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.points.map((pt, idx) => {
              const groupIdx = Math.max(
                0,
                data.groups.findIndex((g) => g.id === pt.groupId),
              )
              const color =
                paletteColors[groupIdx % paletteColors.length] || '#0ea5e9'

              return (
                <tr
                  key={pt.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3.5 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <Input
                        value={pt.label}
                        onChange={(e) =>
                          handlePointChange(pt.id, { label: e.target.value })
                        }
                        placeholder={`Point ${idx + 1}`}
                        aria-label={`Point ${idx + 1} label`}
                        className="border-transparent bg-transparent px-2 font-medium hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                      />
                    </div>
                  </td>

                  <td className="px-3.5 py-2 align-middle">
                    <Select
                      value={pt.groupId}
                      onValueChange={(val) =>
                        handlePointChange(pt.id, { groupId: val })
                      }
                    >
                      <SelectTrigger
                        aria-label={`Point ${idx + 1} cluster`}
                        className="w-full border-transparent bg-transparent px-2 shadow-none hover:border-border/60 focus:border-ring focus:bg-background dark:bg-transparent dark:hover:bg-transparent"
                      >
                        <SelectValue placeholder="Select cluster" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="px-3.5 py-2 align-middle">
                    <Input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={pt.x === 0 ? '' : pt.x}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        handlePointChange(pt.id, {
                          x:
                            e.target.value === ''
                              ? 0
                              : Number.isFinite(n)
                                ? n
                                : 0,
                        })
                      }}
                      aria-label={`Point ${idx + 1} X coordinate`}
                      className="border-transparent bg-transparent px-2 font-mono tabular-nums hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                    />
                  </td>

                  <td className="px-3.5 py-2 align-middle">
                    <Input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={pt.y === 0 ? '' : pt.y}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        handlePointChange(pt.id, {
                          y:
                            e.target.value === ''
                              ? 0
                              : Number.isFinite(n)
                                ? n
                                : 0,
                        })
                      }}
                      aria-label={`Point ${idx + 1} Y coordinate`}
                      className="border-transparent bg-transparent px-2 font-mono tabular-nums hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                    />
                  </td>

                  <td className="px-3.5 py-2 align-middle">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={pt.size === 0 ? '' : pt.size}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        handlePointChange(pt.id, {
                          size:
                            e.target.value === ''
                              ? 0
                              : Number.isFinite(n)
                                ? Math.min(100, Math.max(0, n))
                                : 0,
                        })
                      }}
                      aria-label={`Point ${idx + 1} bubble size`}
                      className="border-transparent bg-transparent px-2 font-mono tabular-nums hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                    />
                  </td>

                  <td className="px-2 py-2 align-middle text-right">
                    <button
                      type="button"
                      disabled={data.points.length <= 1}
                      onClick={() => handleRemovePoint(pt.id)}
                      title="Remove coordinate point"
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
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleAddPoint}
          >
            <Plus className="h-4 w-4" />
            Add Point
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowClusters((v) => !v)}
          >
            {showClusters
              ? 'Hide Clusters'
              : `Manage Clusters (${data.groups.length})`}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleGenerateCorrelatedCluster}
        >
          <Sparkles className="h-4 w-4" />
          Synthesize Sample
        </Button>
      </div>

      {/* Collapsible Cluster / Cohort Manager */}
      {showClusters && (
        <div className="animate-in fade-in zoom-in-95 duration-200 rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-muted-foreground">
              Clusters / Cohorts
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New cluster name..."
                className="w-48 bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddGroup}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.groups.map((grp, idx) => {
              const color =
                grp.color ||
                paletteColors[idx % paletteColors.length] ||
                '#0ea5e9'
              return (
                <div
                  key={grp.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-1.5"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="text"
                    value={grp.name}
                    onChange={(e) =>
                      handleGroupNameChange(grp.id, e.target.value)
                    }
                    aria-label={`Cluster ${idx + 1} name`}
                    className="w-32 bg-transparent font-medium focus:outline-none"
                  />
                  {data.groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(grp.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete cluster"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
