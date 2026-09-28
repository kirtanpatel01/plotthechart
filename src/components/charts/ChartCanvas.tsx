import React, { useState } from 'react'
import { PALETTES } from '#/lib/charts/types'
import type {
  AnyChartData,
  ChartConfig,
  ChartTypeId,
  CoordinatePointsData,
  HierarchicalTreeData,
  ProportionalSlicesData,
  TabularSeriesData,
} from '#/lib/charts/types'

interface ChartCanvasProps {
  chartType: ChartTypeId
  data: AnyChartData
  config: ChartConfig
  svgRef?: React.RefObject<SVGSVGElement | null>
  compact?: boolean
}

interface TooltipState {
  title: string
  subtitle?: string
  value: string
  color: string
}

function buildCurvePath(
  points: Array<{ x: number; y: number }>,
  curveType: 'smooth' | 'linear' | 'step',
): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  if (curveType === 'linear') {
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')
  }

  if (curveType === 'step') {
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const midX = ((prev.x + curr.x) / 2).toFixed(1)
      d += ` L ${midX} ${prev.y.toFixed(1)} L ${midX} ${curr.y.toFixed(1)} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
    }
    return d
  }

  // Smooth cubic bezier
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cpx1 = p0.x + (p1.x - p0.x) * 0.42
    const cpy1 = p0.y
    const cpx2 = p1.x - (p1.x - p0.x) * 0.42
    const cpy2 = p1.y
    d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
  }
  return d
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArcSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const clampedSpan = Math.min(359.99, Math.max(0.01, endAngle - startAngle))
  const actualEnd = startAngle + clampedSpan
  const largeArc = clampedSpan > 180 ? 1 : 0

  const outerStart = polarToCartesian(cx, cy, outerR, actualEnd)
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle)

  if (innerR <= 0.5) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      'Z',
    ].join(' ')
  }

  const innerStart = polarToCartesian(cx, cy, innerR, startAngle)
  const innerEnd = polarToCartesian(cx, cy, innerR, actualEnd)

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export function ChartCanvas({
  chartType,
  data,
  config,
  svgRef,
  compact = false,
}: ChartCanvasProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const paletteColors =
    PALETTES[config.palette]?.colors ?? PALETTES.ocean.colors

  const width = 820
  const height = compact ? 320 : 460

  // Compute Legend Items based on schemaKind
  const legendItems: Array<{ id: string; label: string; color: string }> = []
  if (data.schemaKind === 'tabular-series') {
    data.series.forEach((s, idx) => {
      legendItems.push({
        id: s.id,
        label: s.name || `Series ${idx + 1}`,
        color: s.color || paletteColors[idx % paletteColors.length],
      })
    })
  } else if (data.schemaKind === 'proportional-slices') {
    data.slices.forEach((s, idx) => {
      legendItems.push({
        id: s.id,
        label: s.label || `Segment ${idx + 1}`,
        color: s.color || paletteColors[idx % paletteColors.length],
      })
    })
  } else if (data.schemaKind === 'coordinate-points') {
    data.groups.forEach((g, idx) => {
      legendItems.push({
        id: g.id,
        label: g.name || `Cluster ${idx + 1}`,
        color: g.color || paletteColors[idx % paletteColors.length],
      })
    })
  } else if (data.schemaKind === 'hierarchical-tree') {
    data.branches.forEach((b, idx) => {
      legendItems.push({
        id: b.id,
        label: b.name || `Group ${idx + 1}`,
        color: b.color || paletteColors[idx % paletteColors.length],
      })
    })
  }

  const renderCartesianOrRadialSvg = () => {
    const padLeft = 68
    const padRight = 32
    const padTop = 26
    const padBottom = 56
    const plotW = width - padLeft - padRight
    const plotH = height - padTop - padBottom

    // 1. TABULAR SERIES: BAR, LINE, AREA, RADAR
    if (data.schemaKind === 'tabular-series') {
      const tabData = data as TabularSeriesData
      const rows = tabData.rows
      const series = tabData.series

      if (chartType === 'radar') {
        const cx = width / 2
        const cy = height / 2 + 6
        const maxR = Math.min(plotW, plotH) * 0.42
        const allVals = rows.flatMap((r) =>
          series.map((s) => Math.max(0, Number(r.values[s.id]) || 0)),
        )
        const maxVal = Math.max(10, ...allVals)
        const rings = [0.25, 0.5, 0.75, 1]
        const nAxes = Math.max(3, rows.length)

        return (
          <g>
            {/* Concentric rings or polygons */}
            {config.showGrid &&
              rings.map((ratio) => {
                const r = maxR * ratio
                if (config.options.radarGridShape === 'circle') {
                  return (
                    <circle
                      key={ratio}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={0.14}
                      strokeDasharray="3 3"
                    />
                  )
                }
                const pts = rows
                  .map((_, idx) => {
                    const angle = (idx * 360) / nAxes
                    const p = polarToCartesian(cx, cy, r, angle)
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
                  })
                  .join(' ')
                return (
                  <polygon
                    key={ratio}
                    points={pts}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.14}
                  />
                )
              })}

            {/* Spokes & Axis labels */}
            {rows.map((row, idx) => {
              const angle = (idx * 360) / nAxes
              const endPt = polarToCartesian(cx, cy, maxR, angle)
              const labelPt = polarToCartesian(cx, cy, maxR + 22, angle)
              return (
                <g key={row.id}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={endPt.x}
                    y2={endPt.y}
                    stroke="currentColor"
                    strokeOpacity={0.18}
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-current text-[11px] font-medium opacity-80"
                  >
                    {row.category || `Row ${idx + 1}`}
                  </text>
                </g>
              )
            })}

            {/* Radar Series Polygons */}
            {series.map((s, sIdx) => {
              const color =
                s.color || paletteColors[sIdx % paletteColors.length]
              const vertices = rows.map((row, rIdx) => {
                const val = Math.max(0, Number(row.values[s.id]) || 0)
                const r = (val / maxVal) * maxR
                const angle = (rIdx * 360) / nAxes
                return {
                  ...polarToCartesian(cx, cy, r, angle),
                  val,
                  category: row.category || `Row ${rIdx + 1}`,
                }
              })
              const polyPoints = vertices
                .map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`)
                .join(' ')

              return (
                <g key={s.id}>
                  <polygon
                    points={polyPoints}
                    fill={color}
                    fillOpacity={(config.options.areaOpacity ?? 30) / 100}
                    stroke={color}
                    strokeWidth={2.5}
                  />
                  {vertices.map((v, vIdx) => (
                    <g key={vIdx}>
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r={4.5}
                        fill={color}
                        stroke="#fff"
                        strokeWidth={1.5}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onMouseEnter={() =>
                          setTooltip({
                            title: v.category,
                            subtitle: s.name || `Series ${sIdx + 1}`,
                            value: v.val.toLocaleString(),
                            color,
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                      />
                      {config.showValueLabels && (
                        <text
                          x={v.x}
                          y={v.y - 8}
                          textAnchor="middle"
                          className="fill-current text-[10px] font-semibold opacity-80"
                        >
                          {v.val}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              )
            })}
          </g>
        )
      }

      // Compute max value for Bar / Line / Area
      const isStackedBar =
        chartType === 'bar' && config.options.barLayout === 'stacked'
      const isHorizontalBar =
        chartType === 'bar' && config.options.barOrientation === 'horizontal'

      let maxVal = 10
      if (isStackedBar) {
        for (const r of rows) {
          const rowSum = series.reduce(
            (acc, s) => acc + Math.max(0, Number(r.values[s.id]) || 0),
            0,
          )
          if (rowSum > maxVal) maxVal = rowSum
        }
      } else {
        for (const r of rows) {
          for (const s of series) {
            const v = Math.max(0, Number(r.values[s.id]) || 0)
            if (v > maxVal) maxVal = v
          }
        }
      }
      const niceMax = Math.ceil(maxVal * 1.12) || 10
      const ticks = [0, 0.25, 0.5, 0.75, 1]

      // Horizontal Bar layout
      if (isHorizontalBar) {
        const bandH = plotH / Math.max(1, rows.length)
        return (
          <g>
            {config.showGrid &&
              ticks.map((t) => {
                const x = padLeft + t * plotW
                return (
                  <g key={t}>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotH}
                      stroke="currentColor"
                      strokeOpacity={0.12}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={x}
                      y={padTop + plotH + 18}
                      textAnchor="middle"
                      className="fill-current text-[10px] opacity-65"
                    >
                      {Math.round(t * niceMax).toLocaleString()}
                    </text>
                  </g>
                )
              })}

            {rows.map((row, rIdx) => {
              const groupTop = padTop + rIdx * bandH + bandH * 0.16
              const groupH = bandH * 0.68
              let stackedOffset = 0

              return (
                <g key={row.id}>
                  <text
                    x={padLeft - 10}
                    y={padTop + rIdx * bandH + bandH / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-current text-[11px] font-medium opacity-80"
                  >
                    {row.category}
                  </text>
                  {series.map((s, sIdx) => {
                    const color =
                      s.color || paletteColors[sIdx % paletteColors.length]
                    const val = Math.max(0, Number(row.values[s.id]) || 0)
                    const barW = (val / niceMax) * plotW

                    if (isStackedBar) {
                      const x = padLeft + stackedOffset
                      stackedOffset += barW
                      return (
                        <rect
                          key={s.id}
                          x={x}
                          y={groupTop}
                          width={Math.max(0, barW)}
                          height={groupH}
                          rx={config.options.barRadius}
                          fill={color}
                          className="cursor-pointer transition-opacity hover:opacity-85"
                          onMouseEnter={() =>
                            setTooltip({
                              title: row.category,
                              subtitle: s.name,
                              value: val.toLocaleString(),
                              color,
                            })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        />
                      )
                    }

                    const singleH = groupH / Math.max(1, series.length)
                    const y = groupTop + sIdx * singleH
                    return (
                      <g key={s.id}>
                        <rect
                          x={padLeft}
                          y={y + 1}
                          width={Math.max(0, barW)}
                          height={Math.max(2, singleH - 2)}
                          rx={Math.min(
                            config.options.barRadius,
                            (singleH - 2) / 2,
                          )}
                          fill={color}
                          className="cursor-pointer transition-opacity hover:opacity-85"
                          onMouseEnter={() =>
                            setTooltip({
                              title: row.category,
                              subtitle: s.name,
                              value: val.toLocaleString(),
                              color,
                            })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        />
                        {config.showValueLabels && (
                          <text
                            x={padLeft + barW + 6}
                            y={y + singleH / 2}
                            dominantBaseline="middle"
                            className="fill-current text-[10px] font-semibold opacity-75"
                          >
                            {val.toLocaleString()}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </g>
        )
      }

      // Vertical Cartesian Grid (Vertical Bar, Line, Area)
      return (
        <g>
          {/* Y-Axis Gridlines & Ticks */}
          {ticks.map((t) => {
            const y = padTop + plotH - t * plotH
            const val = Math.round(t * niceMax)
            return (
              <g key={t}>
                {config.showGrid && (
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + plotW}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={t === 0 ? 0.25 : 0.12}
                    strokeDasharray={t === 0 ? undefined : '4 4'}
                  />
                )}
                <text
                  x={padLeft - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-current text-[10px] font-mono opacity-65"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Axis Labels */}
          {config.xAxisLabel && (
            <text
              x={padLeft + plotW / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-current text-[11px] font-semibold opacity-75"
            >
              {config.xAxisLabel}
            </text>
          )}
          {config.yAxisLabel && (
            <text
              x={16}
              y={padTop + plotH / 2}
              textAnchor="middle"
              transform={`rotate(-90, 16, ${padTop + plotH / 2})`}
              className="fill-current text-[11px] font-semibold opacity-75"
            >
              {config.yAxisLabel}
            </text>
          )}

          {/* BAR RENDERER */}
          {chartType === 'bar' &&
            rows.map((row, rIdx) => {
              const bandW = plotW / Math.max(1, rows.length)
              const groupLeft = padLeft + rIdx * bandW + bandW * 0.16
              const groupW = bandW * 0.68
              let stackBottom = padTop + plotH

              return (
                <g key={row.id}>
                  <text
                    x={padLeft + rIdx * bandW + bandW / 2}
                    y={padTop + plotH + 20}
                    textAnchor="middle"
                    className="fill-current text-[11px] font-medium opacity-80"
                  >
                    {row.category}
                  </text>

                  {series.map((s, sIdx) => {
                    const color =
                      s.color || paletteColors[sIdx % paletteColors.length]
                    const val = Math.max(0, Number(row.values[s.id]) || 0)
                    const barH = (val / niceMax) * plotH

                    if (isStackedBar) {
                      const y = stackBottom - barH
                      stackBottom = y
                      return (
                        <g key={s.id}>
                          <rect
                            x={groupLeft}
                            y={y}
                            width={groupW}
                            height={Math.max(0, barH)}
                            rx={config.options.barRadius}
                            fill={color}
                            className="cursor-pointer transition-opacity hover:opacity-85"
                            onMouseEnter={() =>
                              setTooltip({
                                title: row.category,
                                subtitle: s.name,
                                value: val.toLocaleString(),
                                color,
                              })
                            }
                            onMouseLeave={() => setTooltip(null)}
                          />
                        </g>
                      )
                    }

                    const singleW = groupW / Math.max(1, series.length)
                    const x = groupLeft + sIdx * singleW + 1.5
                    const y = padTop + plotH - barH
                    return (
                      <g key={s.id}>
                        <rect
                          x={x}
                          y={y}
                          width={Math.max(3, singleW - 3)}
                          height={Math.max(0, barH)}
                          rx={Math.min(
                            config.options.barRadius,
                            (singleW - 3) / 2,
                          )}
                          fill={color}
                          className="cursor-pointer transition-opacity hover:opacity-85"
                          onMouseEnter={() =>
                            setTooltip({
                              title: row.category,
                              subtitle: s.name,
                              value: val.toLocaleString(),
                              color,
                            })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        />
                        {config.showValueLabels && barH > 12 && (
                          <text
                            x={x + (singleW - 3) / 2}
                            y={y - 6}
                            textAnchor="middle"
                            className="fill-current text-[10px] font-semibold opacity-75"
                          >
                            {val.toLocaleString()}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}

          {/* LINE & AREA RENDERER */}
          {(chartType === 'line' || chartType === 'area') && (
            <>
              {/* X-Axis Category Labels */}
              {rows.map((row, rIdx) => {
                const x =
                  rows.length === 1
                    ? padLeft + plotW / 2
                    : padLeft + (rIdx / (rows.length - 1)) * plotW
                return (
                  <text
                    key={row.id}
                    x={x}
                    y={padTop + plotH + 20}
                    textAnchor="middle"
                    className="fill-current text-[11px] font-medium opacity-80"
                  >
                    {row.category}
                  </text>
                )
              })}

              {series.map((s, sIdx) => {
                const color =
                  s.color || paletteColors[sIdx % paletteColors.length]
                const pts = rows.map((row, rIdx) => {
                  const val = Math.max(0, Number(row.values[s.id]) || 0)
                  const x =
                    rows.length === 1
                      ? padLeft + plotW / 2
                      : padLeft + (rIdx / (rows.length - 1)) * plotW
                  const y = padTop + plotH - (val / niceMax) * plotH
                  return { x, y, val, category: row.category }
                })

                const linePath = buildCurvePath(pts, config.options.curveType)
                const areaBaselineY = padTop + plotH
                const areaPath =
                  pts.length > 0
                    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${areaBaselineY} L ${pts[0].x.toFixed(1)} ${areaBaselineY} Z`
                    : ''
                const gradId = `area-grad-${s.id}`

                return (
                  <g key={s.id}>
                    {chartType === 'area' && (
                      <>
                        <defs>
                          <linearGradient
                            id={gradId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={color}
                              stopOpacity={
                                (config.options.areaOpacity ?? 35) / 100
                              }
                            />
                            <stop
                              offset="100%"
                              stopColor={color}
                              stopOpacity={0.03}
                            />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill={`url(#${gradId})`} />
                      </>
                    )}

                    <path
                      d={linePath}
                      fill="none"
                      stroke={color}
                      strokeWidth={config.options.strokeWidth ?? 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {(config.options.showDots ?? true) &&
                      pts.map((p, pIdx) => (
                        <g key={pIdx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={5}
                            fill={color}
                            stroke="#fff"
                            strokeWidth={1.75}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onMouseEnter={() =>
                              setTooltip({
                                title: p.category,
                                subtitle: s.name,
                                value: p.val.toLocaleString(),
                                color,
                              })
                            }
                            onMouseLeave={() => setTooltip(null)}
                          />
                          {config.showValueLabels && (
                            <text
                              x={p.x}
                              y={p.y - 10}
                              textAnchor="middle"
                              className="fill-current text-[10px] font-semibold opacity-80"
                            >
                              {p.val.toLocaleString()}
                            </text>
                          )}
                        </g>
                      ))}
                  </g>
                )
              })}
            </>
          )}
        </g>
      )
    }

    // 2. PROPORTIONAL SLICES: PIE / DONUT
    if (data.schemaKind === 'proportional-slices') {
      const sliceData = data as ProportionalSlicesData
      const total = sliceData.slices.reduce(
        (acc, s) => acc + Math.max(0, Number(s.value) || 0),
        0,
      )
      const cx = width / 2
      const cy = height / 2
      const outerR = Math.min(plotW, plotH) * 0.42
      const innerR = outerR * ((config.options.innerRadius ?? 45) / 100)
      const padAngle = config.options.padAngle ?? 2

      let cursorAngle = 0

      return (
        <g>
          {sliceData.slices.map((s, idx) => {
            const val = Math.max(0, Number(s.value) || 0)
            const actualShare = total > 0 ? val / total : 0
            const visualShare =
              total > 0 ? actualShare : 1 / Math.max(1, sliceData.slices.length)
            const sweep = visualShare * 360
            const startA = cursorAngle + padAngle / 2
            const endA = cursorAngle + Math.max(padAngle / 2 + 0.5, sweep - padAngle / 2)
            const midAngle = cursorAngle + sweep / 2
            cursorAngle += sweep

            const color =
              s.color || paletteColors[idx % paletteColors.length] || '#0ea5e9'
            const sliceLabel = s.label || `Segment ${idx + 1}`
            const d = describeArcSlice(cx, cy, outerR, innerR, startA, endA)
            const labelPos = polarToCartesian(
              cx,
              cy,
              outerR + 24,
              midAngle,
            )

            return (
              <g key={s.id}>
                <path
                  d={d}
                  fill={color}
                  fillOpacity={total > 0 ? 1 : 0.28}
                  className="cursor-pointer transition-opacity hover:opacity-85"
                  onMouseEnter={() =>
                    setTooltip({
                      title: sliceLabel,
                      subtitle:
                        s.note || `${(actualShare * 100).toFixed(1)}% share`,
                      value: `${val.toLocaleString()} ${sliceData.unitLabel}`.trim(),
                      color,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
                {config.showValueLabels && actualShare >= 0.04 && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor={labelPos.x >= cx ? 'start' : 'end'}
                    dominantBaseline="middle"
                    className="fill-current text-[11px] font-medium opacity-85"
                  >
                    {sliceLabel} ({(actualShare * 100).toFixed(1)}%)
                  </text>
                )}
              </g>
            )
          })}

          {innerR > 24 && (
            <g>
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                className="fill-current text-xs uppercase tracking-wider opacity-60"
              >
                Total
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                className="fill-current text-base font-bold"
              >
                {total.toLocaleString()} {sliceData.unitLabel}
              </text>
            </g>
          )}
        </g>
      )
    }

    // 3. COORDINATE POINTS: SCATTER / BUBBLE
    if (data.schemaKind === 'coordinate-points') {
      const coordData = data as CoordinatePointsData
      const pts = coordData.points
      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const minX = Math.min(0, ...xs)
      const maxX = Math.max(100, ...xs) * 1.08
      const minY = Math.min(0, ...ys)
      const maxY = Math.max(100, ...ys) * 1.08

      const scaleX = (x: number) =>
        padLeft + ((x - minX) / Math.max(1, maxX - minX)) * plotW
      const scaleY = (y: number) =>
        padTop + plotH - ((y - minY) / Math.max(1, maxY - minY)) * plotH

      // Compute Least-Squares Linear Regression Trendline
      let trendline: { x1: number; y1: number; x2: number; y2: number } | null =
        null
      if (config.options.showTrendline && pts.length >= 2) {
        const n = pts.length
        const meanX = xs.reduce((a, b) => a + b, 0) / n
        const meanY = ys.reduce((a, b) => a + b, 0) / n
        let num = 0
        let den = 0
        for (const p of pts) {
          num += (p.x - meanX) * (p.y - meanY)
          den += (p.x - meanX) ** 2
        }
        if (Math.abs(den) > 1e-6) {
          const slope = num / den
          const intercept = meanY - slope * meanX
          const startXVal = Math.min(...xs)
          const endXVal = Math.max(...xs)
          trendline = {
            x1: scaleX(startXVal),
            y1: scaleY(slope * startXVal + intercept),
            x2: scaleX(endXVal),
            y2: scaleY(slope * endXVal + intercept),
          }
        }
      }

      const ticks = [0, 0.25, 0.5, 0.75, 1]

      return (
        <g>
          {ticks.map((t) => {
            const y = padTop + plotH - t * plotH
            const x = padLeft + t * plotW
            const yVal = Math.round(minY + t * (maxY - minY))
            const xVal = Math.round(minX + t * (maxX - minX))
            return (
              <g key={t}>
                {config.showGrid && (
                  <>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={t === 0 ? 0.25 : 0.12}
                      strokeDasharray={t === 0 ? undefined : '4 4'}
                    />
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotH}
                      stroke="currentColor"
                      strokeOpacity={t === 0 ? 0.25 : 0.12}
                      strokeDasharray={t === 0 ? undefined : '4 4'}
                    />
                  </>
                )}
                <text
                  x={padLeft - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-current text-[10px] font-mono opacity-65"
                >
                  {yVal}
                </text>
                <text
                  x={x}
                  y={padTop + plotH + 18}
                  textAnchor="middle"
                  className="fill-current text-[10px] font-mono opacity-65"
                >
                  {xVal}
                </text>
              </g>
            )
          })}

          {config.xAxisLabel && (
            <text
              x={padLeft + plotW / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-current text-[11px] font-semibold opacity-75"
            >
              {config.xAxisLabel}
            </text>
          )}
          {config.yAxisLabel && (
            <text
              x={16}
              y={padTop + plotH / 2}
              textAnchor="middle"
              transform={`rotate(-90, 16, ${padTop + plotH / 2})`}
              className="fill-current text-[11px] font-semibold opacity-75"
            >
              {config.yAxisLabel}
            </text>
          )}

          {trendline && (
            <line
              x1={trendline.x1}
              y1={trendline.y1}
              x2={trendline.x2}
              y2={trendline.y2}
              stroke="currentColor"
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}

          {pts.map((pt, idx) => {
            const grpIdx = Math.max(
              0,
              coordData.groups.findIndex((g) => g.id === pt.groupId),
            )
            const grp = coordData.groups[grpIdx]
            const color =
              grp?.color ||
              paletteColors[grpIdx % paletteColors.length] ||
              '#3b82f6'
            const cx = scaleX(pt.x)
            const cy = scaleY(pt.y)
            const radius = config.options.enableBubbleSize
              ? Math.max(5, Math.min(28, (pt.size || 10) * 0.55))
              : 7
            const pointLabel = pt.label || `Point ${idx + 1}`

            return (
              <g key={pt.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={color}
                  fillOpacity={0.72}
                  stroke={color}
                  strokeWidth={2}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onMouseEnter={() =>
                    setTooltip({
                      title: pointLabel,
                      subtitle: grp?.name || 'Coordinate',
                      value: `X: ${pt.x}, Y: ${pt.y} (Weight: ${pt.size})`,
                      color,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
                {config.showValueLabels && pt.label && (
                  <text
                    x={cx}
                    y={cy - radius - 5}
                    textAnchor="middle"
                    className="fill-current text-[10px] font-medium opacity-80"
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      )
    }

    // 4. HIERARCHICAL TREE: TREEMAP
    if (data.schemaKind === 'hierarchical-tree') {
      const treeData = data as HierarchicalTreeData
      const branchesWithSums = treeData.branches.map((b, idx) => {
        const sum = b.children.reduce(
          (acc, c) => acc + Math.max(0, Number(c.value) || 0),
          0,
        )
        return {
          ...b,
          sum,
          color: b.color || paletteColors[idx % paletteColors.length],
        }
      })
      const rawGrandTotal = branchesWithSums.reduce((acc, b) => acc + b.sum, 0)

      const treemapX = 24
      const treemapY = 18
      const treemapW = width - 48
      const treemapH = height - 42

      let curX = treemapX

      return (
        <g>
          {branchesWithSums.map((branch, bIdx) => {
            const actualBranchShare =
              rawGrandTotal > 0 ? branch.sum / rawGrandTotal : 0
            const visualBranchShare =
              rawGrandTotal > 0
                ? actualBranchShare
                : 1 / Math.max(1, branchesWithSums.length)
            const branchW = Math.max(24, visualBranchShare * treemapW)
            const x0 = curX
            curX += branchW

            let curY = treemapY + 24
            const innerH = Math.max(20, treemapH - 24)
            const branchLabel = branch.name || `Group ${bIdx + 1}`

            return (
              <g key={branch.id}>
                {/* Branch Header Container */}
                <rect
                  x={x0 + 2}
                  y={treemapY}
                  width={Math.max(4, branchW - 4)}
                  height={treemapH}
                  rx={8}
                  fill={branch.color}
                  fillOpacity={0.12}
                  stroke={branch.color}
                  strokeOpacity={0.4}
                />
                <text
                  x={x0 + 10}
                  y={treemapY + 16}
                  className="fill-current text-[11px] font-bold"
                >
                  {branchLabel} ({Math.round(actualBranchShare * 100)}%)
                </text>

                {branch.children.map((leaf, lIdx) => {
                  const leafVal = Math.max(0, Number(leaf.value) || 0)
                  const visualLeafShare =
                    branch.sum > 0
                      ? leafVal / branch.sum
                      : 1 / Math.max(1, branch.children.length)
                  const leafShareOfTotal =
                    rawGrandTotal > 0 ? (leafVal / rawGrandTotal) * 100 : 0
                  const leafH = Math.max(18, visualLeafShare * innerH)
                  const y0 = curY
                  curY += leafH
                  const leafLabel = leaf.name || `Item ${bIdx + 1}.${lIdx + 1}`

                  return (
                    <g key={leaf.id}>
                      <rect
                        x={x0 + 6}
                        y={y0 + 2}
                        width={Math.max(4, branchW - 12)}
                        height={Math.max(4, leafH - 4)}
                        rx={6}
                        fill={branch.color}
                        fillOpacity={rawGrandTotal > 0 ? 0.78 : 0.25}
                        className="cursor-pointer transition-opacity hover:opacity-95"
                        onMouseEnter={() =>
                          setTooltip({
                            title: leafLabel,
                            subtitle: `${branchLabel} (${leafShareOfTotal.toFixed(1)}% of total)`,
                            value: leafVal.toLocaleString(),
                            color: branch.color,
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                      />
                      {branchW > 70 && leafH > 26 && (
                        <text
                          x={x0 + 14}
                          y={y0 + 18}
                          fill="#ffffff"
                          className="text-[11px] font-semibold pointer-events-none"
                        >
                          {leafLabel}
                        </text>
                      )}
                      {config.showValueLabels && branchW > 70 && leafH > 42 && (
                        <text
                          x={x0 + 14}
                          y={y0 + 33}
                          fill="#ffffff"
                          fillOpacity={0.9}
                          className="text-[10px] font-mono pointer-events-none"
                        >
                          {leafVal.toLocaleString()}
                          {config.options.treemapShowPercentages
                            ? ` (${leafShareOfTotal.toFixed(1)}%)`
                            : ''}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </g>
      )
    }

    return null
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-border/60 bg-card ${
        compact ? 'p-3' : 'p-6 sm:p-8'
      }`}
      data-testid="chart-visualization-container"
      data-chart-type={chartType}
    >
      {/* Header Title & Subtitle */}
      {!compact && (
        <div className="mb-6 flex flex-col justify-start">
          <h3
            className="text-xl font-semibold tracking-tight text-foreground pr-44"
            data-testid="chart-rendered-title"
          >
            {config.title || 'Untitled Visualization'}
          </h3>
          {config.subtitle && (
            <p className="text-muted-foreground pr-44">
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Floating Hover Tooltip (Absolute, Zero Layout Shift) */}
      {!compact && tooltip && (
        <div className="animate-in fade-in zoom-in-95 duration-150 pointer-events-none absolute right-6 sm:right-8 top-6 sm:top-8 z-10 flex items-center gap-2 rounded-lg border border-border/70 bg-popover/95 px-3 py-1.5 shadow-md backdrop-blur-xs">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: tooltip.color }}
          />
          <div className="text-xs sm:text-sm">
            <span className="font-medium">{tooltip.title}</span>
            {tooltip.subtitle && (
              <span className="text-muted-foreground">
                {' '}
                • {tooltip.subtitle}
              </span>
            )}
            <span className="ml-2 font-mono font-semibold">
              {tooltip.value}
            </span>
          </div>
        </div>
      )}

      {/* Top Legend */}
      {config.showLegend && config.legendPosition === 'top' && !compact && (
        <div className="mb-5 flex flex-wrap items-center justify-start gap-5">
          {legendItems.map((item) => (
            <div key={item.id} className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className={`flex items-center gap-6 ${
          config.showLegend && config.legendPosition === 'right' && !compact
            ? 'flex-col lg:flex-row'
            : 'flex-col'
        }`}
      >
        <div className="w-full flex-1 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={config.title || `${chartType} chart visualization`}
            className="w-full h-auto select-none text-foreground"
          >
            {renderCartesianOrRadialSvg()}
          </svg>
        </div>

        {/* Right Legend */}
        {config.showLegend && config.legendPosition === 'right' && !compact && (
          <div className="flex flex-wrap lg:flex-col gap-3 border-t lg:border-t-0 lg:border-l border-border/50 pt-4 lg:pt-0 lg:pl-6 min-w-[160px]">
            {legendItems.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-muted-foreground truncate">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      {config.showLegend && config.legendPosition === 'bottom' && !compact && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-5 border-t border-border/40 pt-4">
          {legendItems.map((item) => (
            <div key={item.id} className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
