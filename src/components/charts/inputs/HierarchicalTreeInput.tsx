import { FolderTree, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
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
          name: '',
          children: [
            {
              id: `leaf-${Date.now()}-1`,
              name: '',
              value: 0,
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
              name: '',
              value: 0,
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
    <div className="space-y-5" data-testid="hierarchical-tree-input">
      {/* Clean Tree Container */}
      <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/50">
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
            <div key={branch.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: branchColor }}
                  />
                  <Input
                    value={branch.name}
                    onChange={(e) =>
                      handleBranchNameChange(branch.id, e.target.value)
                    }
                    placeholder={`Group ${bIdx + 1}`}
                    aria-label={`Branch ${bIdx + 1} name`}
                    className="border-transparent bg-transparent px-2 font-semibold max-w-xs hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                  />
                  <span className="text-muted-foreground tabular-nums">
                    {branchSum.toLocaleString()} ({branchShare}%)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleAddLeaf(branch.id)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                  {data.branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(branch.id)}
                      title="Remove branch"
                      className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pl-5 border-l border-border/60 ml-1.5">
                {branch.children.map((leaf, lIdx) => {
                  const leafPct =
                    grandTotal > 0
                      ? ((Math.max(0, leaf.value) / grandTotal) * 100).toFixed(1)
                      : '0.0'
                  return (
                    <div
                      key={leaf.id}
                      className="flex items-center gap-3 py-0.5"
                    >
                      <Input
                        value={leaf.name}
                        onChange={(e) =>
                          handleLeafChange(branch.id, leaf.id, {
                            name: e.target.value,
                          })
                        }
                        placeholder={`Item ${bIdx + 1}.${lIdx + 1}`}
                        aria-label={`Branch ${bIdx + 1} Leaf ${lIdx + 1} name`}
                        className="flex-1 border-transparent bg-transparent px-2.5 hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={leaf.value === 0 ? '' : leaf.value}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          handleLeafChange(branch.id, leaf.id, {
                            value:
                              e.target.value === ''
                                ? 0
                                : Number.isFinite(n)
                                  ? Math.max(0, n)
                                  : 0,
                          })
                        }}
                        aria-label={`Branch ${bIdx + 1} Leaf ${lIdx + 1} value`}
                        className="w-28 border-transparent bg-transparent px-2.5 font-mono tabular-nums text-right hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
                      />
                      <span className="w-14 text-right font-mono text-muted-foreground tabular-nums">
                        {leafPct}%
                      </span>
                      <button
                        type="button"
                        disabled={branch.children.length <= 1}
                        onClick={() => handleRemoveLeaf(branch.id, leaf.id)}
                        title="Remove leaf node"
                        className="p-1 text-muted-foreground/50 hover:text-destructive disabled:opacity-20 transition-colors rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quiet Compact Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleAddBranch}
        >
          <Plus className="h-4 w-4" />
          Add Group
        </Button>

        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderTree className="h-4 w-4" />
          <Input
            value={data.rootLabel}
            onChange={(e) => handleRootLabelChange(e.target.value)}
            placeholder="Root hierarchy label"
            aria-label="Root hierarchy label"
            className="w-48 border-transparent bg-transparent px-2 font-medium text-right hover:border-border/60 focus-visible:border-ring focus-visible:bg-background shadow-none"
          />
          <span className="tabular-nums font-mono">
            • {grandTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
