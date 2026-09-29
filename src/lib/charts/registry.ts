import {
  ChartConfigSchema,
  CoordinatePointsDataSchema,
  HierarchicalTreeDataSchema,
  ProportionalSlicesDataSchema,
  TabularSeriesDataSchema,
} from './types'
import type {
  AnyChartData,
  ChartSpecificOptions,
  ChartTypeDefinition,
  ChartTypeId,
  CoordinatePointsData,
  HierarchicalTreeData,
  ProportionalSlicesData,
  TabularSeriesData,
  TimeRangePreset,
} from './types'

export function formatLocalIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayIsoDate(): string {
  return formatLocalIsoDate(new Date())
}

export const DEFAULT_OPTIONS: ChartSpecificOptions = {
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
}

export function createDefaultTabularData(): TabularSeriesData {
  const today = getTodayIsoDate()
  return {
    schemaKind: 'tabular-series',
    categoryLabel: '',
    series: [
      { id: 'series-1', name: '' },
      { id: 'series-2', name: '' },
      { id: 'series-3', name: '' },
    ],
    rows: [
      {
        id: 'row-1',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0, 'series-3': 0 },
      },
      {
        id: 'row-2',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0, 'series-3': 0 },
      },
      {
        id: 'row-3',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0, 'series-3': 0 },
      },
      {
        id: 'row-4',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0, 'series-3': 0 },
      },
    ],
  }
}

export function createDefaultRadarData(): TabularSeriesData {
  const today = getTodayIsoDate()
  return {
    schemaKind: 'tabular-series',
    categoryLabel: '',
    series: [
      { id: 'series-1', name: '' },
      { id: 'series-2', name: '' },
    ],
    rows: [
      {
        id: 'row-1',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0 },
      },
      {
        id: 'row-2',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0 },
      },
      {
        id: 'row-3',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0 },
      },
      {
        id: 'row-4',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0 },
      },
      {
        id: 'row-5',
        category: '',
        date: today,
        values: { 'series-1': 0, 'series-2': 0 },
      },
    ],
  }
}

export function createDefaultSlicesData(): ProportionalSlicesData {
  const today = getTodayIsoDate()
  return {
    schemaKind: 'proportional-slices',
    unitLabel: '',
    slices: [
      {
        id: 'slice-1',
        label: '',
        date: today,
        value: 0,
        note: '',
      },
      {
        id: 'slice-2',
        label: '',
        date: today,
        value: 0,
        note: '',
      },
      {
        id: 'slice-3',
        label: '',
        date: today,
        value: 0,
        note: '',
      },
      {
        id: 'slice-4',
        label: '',
        date: today,
        value: 0,
        note: '',
      },
    ],
  }
}

export function createDefaultCoordinateData(): CoordinatePointsData {
  const today = getTodayIsoDate()
  return {
    schemaKind: 'coordinate-points',
    groups: [
      { id: 'grp-1', name: 'Cluster 1' },
      { id: 'grp-2', name: 'Cluster 2' },
    ],
    points: [
      {
        id: 'pt-1',
        label: '',
        date: today,
        groupId: 'grp-1',
        x: 0,
        y: 0,
        size: 0,
      },
      {
        id: 'pt-2',
        label: '',
        date: today,
        groupId: 'grp-1',
        x: 0,
        y: 0,
        size: 0,
      },
      {
        id: 'pt-3',
        label: '',
        date: today,
        groupId: 'grp-2',
        x: 0,
        y: 0,
        size: 0,
      },
      {
        id: 'pt-4',
        label: '',
        date: today,
        groupId: 'grp-2',
        x: 0,
        y: 0,
        size: 0,
      },
    ],
  }
}

export function createDefaultTreeData(): HierarchicalTreeData {
  const today = getTodayIsoDate()
  return {
    schemaKind: 'hierarchical-tree',
    rootLabel: '',
    branches: [
      {
        id: 'branch-1',
        name: '',
        children: [
          { id: 'leaf-1', name: '', date: today, value: 0 },
          { id: 'leaf-2', name: '', date: today, value: 0 },
        ],
      },
      {
        id: 'branch-2',
        name: '',
        children: [
          { id: 'leaf-3', name: '', date: today, value: 0 },
          { id: 'leaf-4', name: '', date: today, value: 0 },
        ],
      },
    ],
  }
}

export const CHART_REGISTRY: Record<ChartTypeId, ChartTypeDefinition<any>> = {
  bar: {
    type: 'bar',
    label: 'Bar Chart',
    shortDescription:
      'Compare categorical values across single or multiple series (grouped or stacked).',
    schemaKind: 'tabular-series',
    schemaBadgeLabel: 'Tabular Grid Schema',
    supportsAxes: true,
    dataSchema: TabularSeriesDataSchema,
    defaultData: createDefaultTabularData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: true,
      palette: 'sandstone',
      options: {
        ...DEFAULT_OPTIONS,
        barLayout: 'grouped',
        barOrientation: 'vertical',
        barRadius: 6,
      },
    }),
    presets: [
      {
        id: 'bar-regional-revenue',
        name: 'Regional Quarterly Revenue',
        description: 'Multi-region quarterly revenue comparison in USD millions.',
        data: createDefaultTabularData(),
        config: {
          title: 'Regional Revenue Comparison ($M)',
          subtitle: 'Quarterly revenue performance across primary operating regions',
          xAxisLabel: 'Fiscal Quarter',
          yAxisLabel: 'Revenue ($M)',
        },
      },
      {
        id: 'bar-cloud-workloads',
        name: 'Cloud Compute Workloads',
        description: 'Monthly compute hours by environment tier.',
        data: {
          schemaKind: 'tabular-series',
          categoryLabel: 'Month',
          series: [
            { id: 's-prod', name: 'Production' },
            { id: 's-stage', name: 'Staging' },
            { id: 's-ci', name: 'CI / Testing' },
          ],
          rows: [
            {
              id: 'r1',
              category: 'Jan',
              values: { 's-prod': 420, 's-stage': 160, 's-ci': 110 },
            },
            {
              id: 'r2',
              category: 'Feb',
              values: { 's-prod': 445, 's-stage': 175, 's-ci': 128 },
            },
            {
              id: 'r3',
              category: 'Mar',
              values: { 's-prod': 490, 's-stage': 182, 's-ci': 142 },
            },
            {
              id: 'r4',
              category: 'Apr',
              values: { 's-prod': 530, 's-stage': 195, 's-ci': 155 },
            },
          ],
        },
        config: {
          title: 'Monthly Cloud Compute Utilization',
          subtitle: 'vCPU hours (thousands) across deployment environments',
          xAxisLabel: 'Month',
          yAxisLabel: 'vCPU Hours (k)',
          palette: 'emerald',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'barLayout',
        label: 'Bar Grouping Mode',
        kind: 'select',
        choices: [
          { value: 'grouped', label: 'Grouped (Side by Side)' },
          { value: 'stacked', label: 'Stacked (Cumulative)' },
        ],
      },
      {
        key: 'barOrientation',
        label: 'Bar Orientation',
        kind: 'select',
        choices: [
          { value: 'vertical', label: 'Vertical Columns' },
          { value: 'horizontal', label: 'Horizontal Bars' },
        ],
      },
      {
        key: 'barRadius',
        label: 'Corner Radius',
        kind: 'slider',
        min: 0,
        max: 16,
        step: 1,
        unit: 'px',
      },
    ],
  },

  line: {
    type: 'line',
    label: 'Line Chart',
    shortDescription:
      'Visualize continuous trends, trajectories, and rate-of-change over ordered intervals.',
    schemaKind: 'tabular-series',
    schemaBadgeLabel: 'Tabular Grid Schema',
    supportsAxes: true,
    dataSchema: TabularSeriesDataSchema,
    defaultData: createDefaultTabularData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: false,
      palette: 'sandstone',
      options: {
        ...DEFAULT_OPTIONS,
        curveType: 'smooth',
        strokeWidth: 3,
        showDots: true,
      },
    }),
    presets: [
      {
        id: 'line-growth',
        name: 'Quarterly Growth Trajectory',
        description: 'Four-quarter multi-series progression.',
        data: createDefaultTabularData(),
        config: {
          title: 'Quarterly Growth Trajectory ($M)',
          subtitle: 'Multi-region trend progression across four fiscal quarters',
          xAxisLabel: 'Fiscal Quarter',
          yAxisLabel: 'Revenue ($M)',
        },
      },
      {
        id: 'line-latency',
        name: 'API Latency Percentiles',
        description: 'p50, p95, and p99 response times across release weeks.',
        data: {
          schemaKind: 'tabular-series',
          categoryLabel: 'Release Week',
          series: [
            { id: 'p50', name: 'p50 Median (ms)' },
            { id: 'p95', name: 'p95 Tail (ms)' },
            { id: 'p99', name: 'p99 Extreme (ms)' },
          ],
          rows: [
            {
              id: 'w1',
              category: 'Wk 1',
              values: { p50: 28, p95: 85, p99: 142 },
            },
            {
              id: 'w2',
              category: 'Wk 2',
              values: { p50: 26, p95: 78, p99: 128 },
            },
            {
              id: 'w3',
              category: 'Wk 3',
              values: { p50: 24, p95: 69, p99: 112 },
            },
            {
              id: 'w4',
              category: 'Wk 4',
              values: { p50: 21, p95: 58, p99: 94 },
            },
            {
              id: 'w5',
              category: 'Wk 5',
              values: { p50: 19, p95: 52, p99: 86 },
            },
          ],
        },
        config: {
          title: 'API Gateway Latency Reduction',
          subtitle: 'Response latency percentiles following cache optimization',
          xAxisLabel: 'Release Week',
          yAxisLabel: 'Latency (ms)',
          palette: 'vivid',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'curveType',
        label: 'Line Interpolation',
        kind: 'select',
        choices: [
          { value: 'smooth', label: 'Smooth Spline (Monotone)' },
          { value: 'linear', label: 'Linear Segments' },
          { value: 'step', label: 'Stepped Discrete' },
        ],
      },
      {
        key: 'strokeWidth',
        label: 'Line Stroke Width',
        kind: 'slider',
        min: 1,
        max: 6,
        step: 1,
        unit: 'px',
      },
      {
        key: 'showDots',
        label: 'Show Data Point Markers',
        kind: 'switch',
        description: 'Render circular vertices at each category coordinate.',
      },
    ],
  },

  area: {
    type: 'area',
    label: 'Area Chart',
    shortDescription:
      'Highlight volume and cumulative magnitude beneath continuous series trends.',
    schemaKind: 'tabular-series',
    schemaBadgeLabel: 'Tabular Grid Schema',
    supportsAxes: true,
    dataSchema: TabularSeriesDataSchema,
    defaultData: createDefaultTabularData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: false,
      palette: 'emerald',
      options: {
        ...DEFAULT_OPTIONS,
        curveType: 'smooth',
        areaOpacity: 35,
        showDots: true,
      },
    }),
    presets: [
      {
        id: 'area-default',
        name: 'Cumulative Regional Volume',
        description: 'Multi-region volume trajectory.',
        data: createDefaultTabularData(),
        config: {
          title: 'Cumulative Regional Volume ($M)',
          subtitle: 'Filled area magnitude across operating territories',
          xAxisLabel: 'Fiscal Quarter',
          yAxisLabel: 'Volume ($M)',
          palette: 'emerald',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'curveType',
        label: 'Area Curve Interpolation',
        kind: 'select',
        choices: [
          { value: 'smooth', label: 'Smooth Spline' },
          { value: 'linear', label: 'Linear Segments' },
          { value: 'step', label: 'Stepped Area' },
        ],
      },
      {
        key: 'areaOpacity',
        label: 'Fill Gradient Opacity',
        kind: 'slider',
        min: 10,
        max: 90,
        step: 5,
        unit: '%',
      },
      {
        key: 'showDots',
        label: 'Show Vertex Markers',
        kind: 'switch',
      },
    ],
  },

  pie: {
    type: 'pie',
    label: 'Pie / Donut Chart',
    shortDescription:
      'Show part-to-whole proportional distribution using a custom slice & percentage input builder.',
    schemaKind: 'proportional-slices',
    schemaBadgeLabel: 'Proportional Slices Schema',
    supportsAxes: false,
    dataSchema: ProportionalSlicesDataSchema,
    defaultData: createDefaultSlicesData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'right',
      showGrid: false,
      showValueLabels: true,
      palette: 'sandstone',
      options: {
        ...DEFAULT_OPTIONS,
        innerRadius: 48,
        padAngle: 2,
      },
    }),
    presets: [
      {
        id: 'pie-energy-mix',
        name: 'Renewable Energy Generation Mix',
        description: 'Clean energy breakdown in GWh across 5 sources.',
        data: createDefaultSlicesData(),
        config: {
          title: 'Renewable Energy Generation Mix',
          subtitle: 'Proportional share of clean power output by technology (GWh)',
          palette: 'sandstone',
        },
      },
      {
        id: 'pie-budget-allocation',
        name: 'Operating Budget Breakdown',
        description: 'Departmental allocation across organization pillars.',
        data: {
          schemaKind: 'proportional-slices',
          unitLabel: '$K',
          slices: [
            {
              id: 'b1',
              label: 'Product Engineering',
              value: 540,
              note: 'Core R&D & QA',
            },
            {
              id: 'b2',
              label: 'Cloud & Infrastructure',
              value: 260,
              note: 'Hosting & CDN',
            },
            {
              id: 'b3',
              label: 'Customer Success',
              value: 190,
              note: 'Support & onboarding',
            },
            {
              id: 'b4',
              label: 'Growth & Partnerships',
              value: 230,
              note: 'Enterprise outreach',
            },
            {
              id: 'b5',
              label: 'Operations & Legal',
              value: 110,
              note: 'Compliance & G&A',
            },
          ],
        },
        config: {
          title: 'Annual Operating Budget Breakdown',
          subtitle: 'Departmental allocation ($K)',
          palette: 'sunset',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'innerRadius',
        label: 'Donut Cutout Radius (0% = Pie)',
        kind: 'slider',
        min: 0,
        max: 75,
        step: 5,
        unit: '%',
      },
      {
        key: 'padAngle',
        label: 'Slice Separation Gap',
        kind: 'slider',
        min: 0,
        max: 8,
        step: 1,
        unit: '°',
      },
    ],
  },

  scatter: {
    type: 'scatter',
    label: 'Scatter / Bubble Plot',
    shortDescription:
      'Analyze correlations, clusters, and outliers across continuous (X, Y, Size) coordinates.',
    schemaKind: 'coordinate-points',
    schemaBadgeLabel: 'XY/Z Coordinate Schema',
    supportsAxes: true,
    dataSchema: CoordinatePointsDataSchema,
    defaultData: createDefaultCoordinateData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: true,
      palette: 'vivid',
      options: {
        ...DEFAULT_OPTIONS,
        showTrendline: true,
        enableBubbleSize: true,
      },
    }),
    presets: [
      {
        id: 'scatter-adoption',
        name: 'Adoption vs. Net Retention Clusters',
        description: 'Customer cohorts plotted by adoption index, retention, and contract weight.',
        data: createDefaultCoordinateData(),
        config: {
          title: 'Adoption Score vs. Retention Rate by Tier',
          subtitle: 'Continuous (X, Y) coordinate clusters with bubble weight sizing',
          xAxisLabel: 'Feature Adoption Index (0–100)',
          yAxisLabel: 'Net Retention Rate (%)',
          palette: 'vivid',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'showTrendline',
        label: 'Show Linear Regression Trendline',
        kind: 'switch',
        description: 'Compute and overlay least-squares line of best fit.',
      },
      {
        key: 'enableBubbleSize',
        label: 'Scale Radius by Point Weight (Bubble Mode)',
        kind: 'switch',
        description: 'Vary point radius using each coordinate’s size dimension.',
      },
    ],
  },

  radar: {
    type: 'radar',
    label: 'Radar / Spider Chart',
    shortDescription:
      'Compare multivariate profiles across radial axes arranged around a central origin.',
    schemaKind: 'tabular-series',
    schemaBadgeLabel: 'Multivariate Axis Schema',
    supportsAxes: false,
    dataSchema: TabularSeriesDataSchema,
    defaultData: createDefaultRadarData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: true,
      palette: 'sandstone',
      options: {
        ...DEFAULT_OPTIONS,
        radarGridShape: 'polygon',
        areaOpacity: 30,
      },
    }),
    presets: [
      {
        id: 'radar-benchmark',
        name: 'System Capability Benchmark',
        description: 'Six-axis comparison between Platform v2.4 and v3.0.',
        data: createDefaultRadarData(),
        config: {
          title: 'System Architecture Capability Profile',
          subtitle: 'Multivariate benchmark score comparison (0–100 scale)',
          palette: 'sandstone',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'radarGridShape',
        label: 'Radial Grid Geometry',
        kind: 'select',
        choices: [
          { value: 'polygon', label: 'Polygonal Web' },
          { value: 'circle', label: 'Concentric Circles' },
        ],
      },
      {
        key: 'areaOpacity',
        label: 'Polygon Fill Opacity',
        kind: 'slider',
        min: 10,
        max: 80,
        step: 5,
        unit: '%',
      },
    ],
  },

  treemap: {
    type: 'treemap',
    label: 'Hierarchical Treemap',
    shortDescription:
      'Visualize nested parent-child tree hierarchies using area-proportional tiled rectangles.',
    schemaKind: 'hierarchical-tree',
    schemaBadgeLabel: 'Nested Tree Schema',
    supportsAxes: false,
    dataSchema: HierarchicalTreeDataSchema,
    defaultData: createDefaultTreeData,
    defaultConfig: () => ({
      title: '',
      subtitle: '',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: false,
      showValueLabels: true,
      palette: 'emerald',
      options: {
        ...DEFAULT_OPTIONS,
        treemapShowPercentages: true,
      },
    }),
    presets: [
      {
        id: 'treemap-rd',
        name: 'R&D Investment Portfolio',
        description: 'Hierarchical parent branches and leaf initiatives.',
        data: createDefaultTreeData(),
        config: {
          title: 'R&D Investment Portfolio Hierarchy',
          subtitle: 'Nested branch & leaf allocation across engineering divisions ($K)',
          palette: 'emerald',
        },
      },
    ],
    specificOptionFields: [
      {
        key: 'treemapShowPercentages',
        label: 'Show Leaf Share Percentages',
        kind: 'switch',
        description: 'Display percentage of total portfolio inside each tile.',
      },
    ],
  },
}

export const CHART_TYPES_LIST = Object.values(CHART_REGISTRY)

export function getChartDefinition(type: string): ChartTypeDefinition<any> {
  if (type in CHART_REGISTRY) {
    return CHART_REGISTRY[type as ChartTypeId]
  }
  return CHART_REGISTRY.bar
}

const UNTITLED_COUNTER_STORAGE_KEY = 'plotthechart.untitled.counter.v1'

export function getNextUntitledName(
  existingNames: Array<string> = [],
  advanceCounter = false,
): string {
  let maxNumber = 0

  for (const name of existingNames) {
    const match = /^Untitled-(\d+)$/i.exec(name.trim())
    if (match) {
      const n = Number(match[1])
      if (Number.isFinite(n) && n > maxNumber) {
        maxNumber = n
      }
    }
  }

  let storedCounter = 0
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(UNTITLED_COUNTER_STORAGE_KEY)
      const parsed = raw ? Number(raw) : 0
      if (Number.isFinite(parsed) && parsed > 0) {
        storedCounter = parsed
      }
    } catch {
      // Ignore storage access errors
    }
  }

  const nextNumber = Math.max(maxNumber + 1, storedCounter + 1, 1)

  if (advanceCounter && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        UNTITLED_COUNTER_STORAGE_KEY,
        String(nextNumber),
      )
    } catch {
      // Ignore storage quota errors
    }
  }

  return `Untitled-${nextNumber}`
}

export function validateChartPayload(
  chartType: string,
  rawData: unknown,
  rawConfig: unknown,
) {
  const def = getChartDefinition(chartType)
  const parsedData = def.dataSchema.safeParse(rawData)
  const parsedConfig = ChartConfigSchema.safeParse(rawConfig)

  return {
    chartType: def.type,
    schemaKind: def.schemaKind,
    data: parsedData.success ? parsedData.data : def.defaultData(),
    config: parsedConfig.success ? parsedConfig.data : def.defaultConfig(),
    isValid: parsedData.success && parsedConfig.success,
  }
}

export function resolveEntryDate(
  entryDate?: string,
  labelOrCategory?: string,
): string {
  const trimmedDate = entryDate?.trim()
  if (trimmedDate && /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return trimmedDate
  }

  const trimmedLabel = labelOrCategory?.trim()
  if (trimmedLabel && /\d{4}/.test(trimmedLabel)) {
    const parsedLabel = new Date(trimmedLabel)
    if (!Number.isNaN(parsedLabel.getTime())) {
      return formatLocalIsoDate(parsedLabel)
    }
  }

  if (trimmedDate) {
    const parsedDate = new Date(trimmedDate)
    if (!Number.isNaN(parsedDate.getTime())) {
      return formatLocalIsoDate(parsedDate)
    }
  }

  return getTodayIsoDate()
}

export function getTimeRangeBounds(
  preset: TimeRangePreset,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } | null {
  if (preset === 'all') return null

  const now = new Date()
  const todayStr = formatLocalIsoDate(now)

  if (preset === 'today') {
    return { from: todayStr, to: todayStr }
  }

  if (preset === '7d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    return { from: formatLocalIsoDate(start), to: todayStr }
  }

  if (preset === '1m') {
    const start = new Date(now)
    start.setMonth(start.getMonth() - 1)
    return { from: formatLocalIsoDate(start), to: todayStr }
  }

  if (preset === '6m') {
    const start = new Date(now)
    start.setMonth(start.getMonth() - 6)
    return { from: formatLocalIsoDate(start), to: todayStr }
  }

  if (preset === '1y') {
    const start = new Date(now)
    start.setFullYear(start.getFullYear() - 1)
    return { from: formatLocalIsoDate(start), to: todayStr }
  }

  // preset === 'custom'
  const rawFrom = customFrom?.trim() || '0000-01-01'
  const rawTo = customTo?.trim() || '9999-12-31'
  const from = rawFrom <= rawTo ? rawFrom : rawTo
  const to = rawFrom <= rawTo ? rawTo : rawFrom
  return { from, to }
}

export function filterChartDataByTimeRange(
  data: AnyChartData,
  preset: TimeRangePreset,
  customFrom?: string,
  customTo?: string,
): {
  filteredData: AnyChartData
  matchedCount: number
  totalCount: number
} {
  const bounds = getTimeRangeBounds(preset, customFrom, customTo)

  if (data.schemaKind === 'tabular-series') {
    const totalCount = data.rows.length
    if (!bounds) {
      return { filteredData: data, matchedCount: totalCount, totalCount }
    }
    const matchedRows = data.rows.filter((r) => {
      const d = resolveEntryDate(r.date, r.category)
      return d >= bounds.from && d <= bounds.to
    })
    return {
      filteredData: { ...data, rows: matchedRows },
      matchedCount: matchedRows.length,
      totalCount,
    }
  }

  if (data.schemaKind === 'proportional-slices') {
    const totalCount = data.slices.length
    if (!bounds) {
      return { filteredData: data, matchedCount: totalCount, totalCount }
    }
    const matchedSlices = data.slices.filter((s) => {
      const d = resolveEntryDate(s.date, s.label)
      return d >= bounds.from && d <= bounds.to
    })
    return {
      filteredData: { ...data, slices: matchedSlices },
      matchedCount: matchedSlices.length,
      totalCount,
    }
  }

  if (data.schemaKind === 'coordinate-points') {
    const totalCount = data.points.length
    if (!bounds) {
      return { filteredData: data, matchedCount: totalCount, totalCount }
    }
    const matchedPoints = data.points.filter((pt) => {
      const d = resolveEntryDate(pt.date, pt.label)
      return d >= bounds.from && d <= bounds.to
    })
    return {
      filteredData: { ...data, points: matchedPoints },
      matchedCount: matchedPoints.length,
      totalCount,
    }
  }

  // hierarchical-tree
  const totalCount = data.branches.reduce(
    (sum, b) => sum + b.children.length,
    0,
  )
  if (!bounds) {
    return { filteredData: data, matchedCount: totalCount, totalCount }
  }
  let matchedCount = 0
  const matchedBranches = data.branches
    .map((b) => {
      const children = b.children.filter((leaf) => {
        const d = resolveEntryDate(leaf.date, leaf.name)
        return d >= bounds.from && d <= bounds.to
      })
      matchedCount += children.length
      return { ...b, children }
    })
    .filter((b) => b.children.length > 0)

  return {
    filteredData: { ...data, branches: matchedBranches },
    matchedCount,
    totalCount,
  }
}

