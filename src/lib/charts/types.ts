import { z } from 'zod'

export const PALETTES = {
  ocean: {
    name: 'Ocean Lagoon',
    colors: ['#0ea5e9', '#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'],
  },
  emerald: {
    name: 'Forest & Mint',
    colors: ['#10b981', '#059669', '#0d9488', '#84cc16', '#eab308', '#0284c7'],
  },
  sunset: {
    name: 'Warm Sunset',
    colors: ['#f97316', '#ef4444', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4'],
  },
  vivid: {
    name: 'Studio Vivid',
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  },
  monochrome: {
    name: 'Slate Ink',
    colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#0f766e'],
  },
} as const

export type PaletteId = keyof typeof PALETTES

export const TabularSeriesDataSchema = z.object({
  schemaKind: z.literal('tabular-series'),
  categoryLabel: z.string().default('Category'),
  series: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        color: z.string().optional(),
      }),
    )
    .min(1),
  rows: z
    .array(
      z.object({
        id: z.string(),
        category: z.string(),
        values: z.record(z.string(), z.number()),
      }),
    )
    .min(1),
})

export type TabularSeriesData = z.infer<typeof TabularSeriesDataSchema>

export const ProportionalSlicesDataSchema = z.object({
  schemaKind: z.literal('proportional-slices'),
  unitLabel: z.string().default('Units'),
  slices: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.number().min(0),
        color: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
})

export type ProportionalSlicesData = z.infer<
  typeof ProportionalSlicesDataSchema
>

export const CoordinatePointsDataSchema = z.object({
  schemaKind: z.literal('coordinate-points'),
  groups: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().optional(),
      }),
    )
    .min(1),
  points: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        groupId: z.string(),
        x: z.number(),
        y: z.number(),
        size: z.number().min(1).max(100).default(12),
      }),
    )
    .min(1),
})

export type CoordinatePointsData = z.infer<typeof CoordinatePointsDataSchema>

export const HierarchicalTreeDataSchema = z.object({
  schemaKind: z.literal('hierarchical-tree'),
  rootLabel: z.string().default('All Segments'),
  branches: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().optional(),
        children: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              value: z.number().min(0),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
})

export type HierarchicalTreeData = z.infer<typeof HierarchicalTreeDataSchema>

export const AnyChartDataSchema = z.discriminatedUnion('schemaKind', [
  TabularSeriesDataSchema,
  ProportionalSlicesDataSchema,
  CoordinatePointsDataSchema,
  HierarchicalTreeDataSchema,
])

export type AnyChartData = z.infer<typeof AnyChartDataSchema>
export type DataSchemaKind = AnyChartData['schemaKind']

export const ChartSpecificOptionsSchema = z.object({
  barLayout: z.enum(['grouped', 'stacked']).default('grouped'),
  barOrientation: z.enum(['vertical', 'horizontal']).default('vertical'),
  barRadius: z.number().min(0).max(16).default(6),
  curveType: z.enum(['smooth', 'linear', 'step']).default('smooth'),
  strokeWidth: z.number().min(1).max(6).default(3),
  showDots: z.boolean().default(true),
  areaOpacity: z.number().min(10).max(90).default(35),
  innerRadius: z.number().min(0).max(75).default(45),
  padAngle: z.number().min(0).max(8).default(2),
  showTrendline: z.boolean().default(true),
  enableBubbleSize: z.boolean().default(true),
  radarGridShape: z.enum(['polygon', 'circle']).default('polygon'),
  treemapShowPercentages: z.boolean().default(true),
})

export type ChartSpecificOptions = z.infer<typeof ChartSpecificOptionsSchema>

export const ChartConfigSchema = z.object({
  title: z.string().min(1, 'Chart title is required'),
  subtitle: z.string().default(''),
  xAxisLabel: z.string().default(''),
  yAxisLabel: z.string().default(''),
  showLegend: z.boolean().default(true),
  legendPosition: z.enum(['top', 'bottom', 'right']).default('top'),
  showGrid: z.boolean().default(true),
  showValueLabels: z.boolean().default(false),
  palette: z
    .enum(['ocean', 'emerald', 'sunset', 'vivid', 'monochrome'])
    .default('ocean'),
  options: ChartSpecificOptionsSchema.default({
    barLayout: 'grouped',
    barOrientation: 'vertical',
    barRadius: 6,
    curveType: 'smooth',
    strokeWidth: 3,
    showDots: true,
    areaOpacity: 35,
    innerRadius: 45,
    padAngle: 2,
    showTrendline: true,
    enableBubbleSize: true,
    radarGridShape: 'polygon',
    treemapShowPercentages: true,
  }),
})

export type ChartConfig = z.infer<typeof ChartConfigSchema>

export type ChartTypeId =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'radar'
  | 'treemap'

export type ChartOptionFieldDescriptor =
  | {
      key: keyof ChartSpecificOptions
      label: string
      kind: 'select'
      choices: Array<{ value: string; label: string }>
    }
  | {
      key: keyof ChartSpecificOptions
      label: string
      kind: 'slider'
      min: number
      max: number
      step: number
      unit?: string
    }
  | {
      key: keyof ChartSpecificOptions
      label: string
      kind: 'switch'
      description?: string
    }

export interface ChartPreset<TData extends AnyChartData = AnyChartData> {
  id: string
  name: string
  description: string
  data: TData
  config: Partial<ChartConfig>
}

export interface ChartTypeDefinition<
  TData extends AnyChartData = AnyChartData,
> {
  type: ChartTypeId
  label: string
  shortDescription: string
  schemaKind: TData['schemaKind']
  schemaBadgeLabel: string
  supportsAxes: boolean
  dataSchema: z.ZodType<TData>
  defaultData: () => TData
  defaultConfig: () => ChartConfig
  presets: Array<ChartPreset<TData>>
  specificOptionFields: Array<ChartOptionFieldDescriptor>
}
