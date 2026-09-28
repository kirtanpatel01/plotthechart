import { FolderTree, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PALETTES } from '#/lib/charts/types'
import type { HierarchicalTreeData, PaletteId } from '#/lib/charts/types'

interface HierarchicalTreeInputProps {
  data: HierarchicalTreeData
  palette: PaletteId
  onChange: (next: HierarchicalTreeData) => void
}

export function HierarchicalTreeInput({
  data,
  palette,
  onChange,
}: HierarchicalTreeInputProps) {
  const paletteColors = PALETTES[palette]?.colors ?? PALETTES.ocean.colors

  const grandTotal = data.branches.reduce(
    (acc, branch) =>
      acc +
      branch.children.reduce(
        (bSum, leaf) => bSum + Math.max(0, Number(leaf.value) || 0),
        0,
      ),
    0,
  )

  const handleRootLabelChange = (rootLabel: string) => {
    onChange({ ...data, rootLabel })
  }

  const handleBranchNameChange = (branchId: string, name: string) => {
    onChange({
      ...data,
      branches: data.branches.map((b) =>
        b.id === branchId ? { ...b, name } : b,
      ),
    })
  }

  const handleAddBranch = () => {
    const idx = data.branches.length + 1
    onChange({
      ...data,
      branches: [
        ...data.branches,
        {
          id: `branch-${Date.now()}-${idx}`,
          name: `Group ${idx}`,
          children: [
            {
              id: `leaf-${Date.now()}-1`,
              name: `Sub-item ${idx}.1`,
              value: 150,
            },
          ],
        },
      ],
    })
  }

  const handleRemoveBranch = (branchId: string) => {
    if (data.branches.length <= 1) return
    onChange({
      ...data,
      branches: data.branches.filter((b) => b.id !== branchId),
    })
  }

  const handleAddLeaf = (branchId: string) => {
    onChange({
      ...data,
      branches: data.branches.map((b) => {
        if (b.id !== branchId) return b
        const nextIdx = b.children.length + 1
        return {
          ...b,
          children: [
            ...b.children,
            {
              id: `leaf-${Date.now()}-${nextIdx}`,
              name: `${b.name.split(' ')[0]} Node ${nextIdx}`,
              value: 120,
            },
          ],
        }
      }),
    })
  }

  const handleLeafChange = (
    branchId: string,
    leafId: string,
    patch: Partial<{ name: string; value: number }>,
  ) => {
    onChange({
      ...data,
      branches: data.branches.map((b) => {
        if (b.id !== branchId) return b
        return {
          ...b,
          children: b.children.map((leaf) =>
            leaf.id === leafId ? { ...leaf, ...patch } : leaf,
          ),
        }
      }),
    })
  }

  const handleRemoveLeaf = (branchId: string, leafId: string) => {
    onChange({
      ...data,
      branches: data.branches.map((b) => {
        if (b.id !== branchId || b.children.length <= 1) return b
        return {
          ...b,
          children: b.children.filter((l) => l.id !== leafId),
        }
      }),
    })
  }

  return (
    <div className="space-y-4" data-testid="hierarchical-tree-input">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Root Hierarchy Name
            </Label>
            <Input
              value={data.rootLabel}
              onChange={(e) => handleRootLabelChange(e.target.value)}
              className="mt-1 h-7 w-56 text-xs font-semibold"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Tree Sum
            </span>
            <span className="text-sm font-bold tabular-nums">
              {grandTotal.toLocaleString()}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAddBranch}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Parent Branch
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {data.branches.map((branch, bIdx) => {
          const branchColor =
            branch.color ||
            paletteColors[bIdx % paletteColors.length] ||
            '#10b981'
          const branchSum = branch.children.reduce(
            (sum, l) => sum + Math.max(0, Number(l.value) || 0),
            0,
          )
          const branchShare =
            grandTotal > 0 ? ((branchSum / grandTotal) * 100).toFixed(1) : '0.0'

          return (
            <div
              key={branch.id}
              className="rounded-xl border border-border bg-card/70 p-3 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: branchColor }}
                  />
                  <Input
                    value={branch.name}
                    onChange={(e) =>
                      handleBranchNameChange(branch.id, e.target.value)
                    }
                    aria-label={`Branch ${bIdx + 1} name`}
                    className="h-7 text-xs font-bold max-w-xs"
                  />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({branchSum.toLocaleString()} • {branchShare}%)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleAddLeaf(branch.id)}
                  >
                    <Plus className="h-3 w-3" />
                    Add Child Leaf
                  </Button>
                  {data.branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(branch.id)}
                      title="Remove branch"
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pl-4 border-l-2 border-border/70">
                {branch.children.map((leaf, lIdx) => {
                  const leafPct =
                    grandTotal > 0
                      ? ((Math.max(0, leaf.value) / grandTotal) * 100).toFixed(1)
                      : '0.0'
                  return (
                    <div
                      key={leaf.id}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={leaf.name}
                        onChange={(e) =>
                          handleLeafChange(branch.id, leaf.id, {
                            name: e.target.value,
                          })
                        }
                        aria-label={`Branch ${bIdx + 1} Leaf ${lIdx + 1} name`}
                        className="h-7 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={leaf.value}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          handleLeafChange(branch.id, leaf.id, {
                            value: Number.isFinite(n) ? Math.max(0, n) : 0,
                          })
                        }}
                        aria-label={`Branch ${bIdx + 1} Leaf ${lIdx + 1} value`}
                        className="h-7 w-28 text-xs font-mono tabular-nums"
                      />
                      <span className="w-12 text-right text-[11px] font-mono text-muted-foreground tabular-nums">
                        {leafPct}%
                      </span>
                      <button
                        type="button"
                        disabled={branch.children.length <= 1}
                        onClick={() => handleRemoveLeaf(branch.id, leaf.id)}
                        title="Remove leaf node"
                        className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
