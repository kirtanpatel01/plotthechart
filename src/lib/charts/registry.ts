import {
  ChartConfigSchema,
  CoordinatePointsDataSchema,
  HierarchicalTreeDataSchema,
  ProportionalSlicesDataSchema,
  TabularSeriesDataSchema,
} from './types'
import type {
  ChartSpecificOptions,
  ChartTypeDefinition,
  ChartTypeId,
  CoordinatePointsData,
  HierarchicalTreeData,
  ProportionalSlicesData,
  TabularSeriesData,
} from './types'

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
  return {
    schemaKind: 'tabular-series',
    categoryLabel: 'Quarter',
    series: [
      { id: 'series-1', name: 'North America' },
      { id: 'series-2', name: 'Europe' },
      { id: 'series-3', name: 'Asia Pacific' },
    ],
    rows: [
      {
        id: 'row-1',
        category: 'Q1',
        values: { 'series-1': 142, 'series-2': 98, 'series-3': 115 },
      },
      {
        id: 'row-2',
        category: 'Q2',
        values: { 'series-1': 168, 'series-2': 112, 'series-3': 134 },
      },
      {
        id: 'row-3',
        category: 'Q3',
        values: { 'series-1': 156, 'series-2': 129, 'series-3': 162 },
      },
      {
        id: 'row-4',
        category: 'Q4',
        values: { 'series-1': 194, 'series-2': 145, 'series-3': 188 },
      },
    ],
  }
}

export function createDefaultRadarData(): TabularSeriesData {
  return {
    schemaKind: 'tabular-series',
    categoryLabel: 'Metric',
    series: [
      { id: 'series-1', name: 'Platform v2.4' },
      { id: 'series-2', name: 'Platform v3.0' },
    ],
    rows: [
      {
        id: 'row-1',
        category: 'Throughput',
        values: { 'series-1': 72, 'series-2': 94 },
      },
      {
        id: 'row-2',
        category: 'Reliability',
        values: { 'series-1': 84, 'series-2': 96 },
      },
      {
        id: 'row-3',
        category: 'Efficiency',
        values: { 'series-1': 65, 'series-2': 89 },
      },
      {
        id: 'row-4',
        category: 'Scalability',
        values: { 'series-1': 78, 'series-2': 92 },
      },
      {
        id: 'row-5',
        category: 'Observability',
        values: { 'series-1': 70, 'series-2': 90 },
      },
      {
        id: 'row-6',
        category: 'Security',
        values: { 'series-1': 88, 'series-2': 95 },
      },
    ],
  }
}

export function createDefaultSlicesData(): ProportionalSlicesData {
  return {
    schemaKind: 'proportional-slices',
    unitLabel: 'GWh',
    slices: [
      {
        id: 'slice-1',
        label: 'Solar Photovoltaic',
        value: 420,
        note: 'Utility & rooftop array output',
      },
      {
        id: 'slice-2',
        label: 'Offshore & Onshore Wind',
        value: 340,
        note: 'Coastal turbine grid',
      },
      {
        id: 'slice-3',
        label: 'Hydroelectric',
        value: 215,
        note: 'Reservoir baseload',
      },
      {
        id: 'slice-4',
        label: 'Geothermal & Biomass',
        value: 125,
        note: 'Thermal dispatchable capacity',
      },
      {
        id: 'slice-5',
        label: 'Grid Battery Storage',
        value: 90,
        note: 'Peak shaving reserve',
      },
    ],
  }
}

export function createDefaultCoordinateData(): CoordinatePointsData {
  return {
    schemaKind: 'coordinate-points',
    groups: [
      { id: 'grp-enterprise', name: 'Enterprise Tier' },
      { id: 'grp-growth', name: 'Growth Tier' },
      { id: 'grp-starter', name: 'Self-Serve Tier' },
    ],
    points: [
      {
        id: 'pt-1',
        label: 'Cluster A1',
        groupId: 'grp-starter',
        x: 18,
        y: 62,
        size: 12,
      },
      {
        id: 'pt-2',
        label: 'Cluster A2',
        groupId: 'grp-starter',
        x: 26,
        y: 68,
        size: 15,
      },
      {
        id: 'pt-3',
        label: 'Cluster B1',
        groupId: 'grp-growth',
        x: 42,
        y: 76,
        size: 22,
      },
      {
        id: 'pt-4',
        label: 'Cluster B2',
        groupId: 'grp-growth',
        x: 55,
        y: 82,
        size: 26,
      },
      {
        id: 'pt-5',
        label: 'Cluster B3',
        groupId: 'grp-growth',
        x: 63,
        y: 79,
        size: 20,
      },
      {
        id: 'pt-6',
        label: 'Cluster C1',
        groupId: 'grp-enterprise',
        x: 78,
        y: 91,
        size: 34,
      },
      {
        id: 'pt-7',
        label: 'Cluster C2',
        groupId: 'grp-enterprise',
        x: 88,
        y: 95,
        size: 38,
      },
      {
        id: 'pt-8',
        label: 'Cluster C3',
        groupId: 'grp-enterprise',
        x: 94,
        y: 93,
        size: 30,
      },
    ],
  }
}

export function createDefaultTreeData(): HierarchicalTreeData {
  return {
    schemaKind: 'hierarchical-tree',
    rootLabel: 'Annual R&D Allocation ($K)',
    branches: [
      {
        id: 'branch-1',
        name: 'Core Infrastructure',
        children: [
          { id: 'leaf-1', name: 'Distributed Storage', value: 380 },
          { id: 'leaf-2', name: 'Compute Runtime', value: 290 },
          { id: 'leaf-3', name: 'Edge Networking', value: 195 },
        ],
      },
      {
        id: 'branch-2',
        name: 'Data & Analytics',
        children: [
          { id: 'leaf-4', name: 'Query Engine', value: 310 },
          { id: 'leaf-5', name: 'Streaming Pipeline', value: 240 },
          { id: 'leaf-6', name: 'Visualization SDK', value: 180 },
        ],
      },
      {
        id: 'branch-3',
        name: 'Security & Compliance',
        children: [
          { id: 'leaf-7', name: 'Zero-Trust Identity', value: 220 },
          { id: 'leaf-8', name: 'Audit Telemetry', value: 145 },
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
      title: 'Regional Revenue Comparison ($M)',
      subtitle: 'Quarterly revenue performance across primary operating regions',
      xAxisLabel: 'Fiscal Quarter',
      yAxisLabel: 'Revenue ($M)',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: true,
      palette: 'ocean',
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
      title: 'Quarterly Growth Trajectory ($M)',
      subtitle: 'Multi-region trend progression across four fiscal quarters',
      xAxisLabel: 'Fiscal Quarter',
      yAxisLabel: 'Revenue ($M)',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: false,
      palette: 'ocean',
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
      title: 'Cumulative Regional Volume ($M)',
      subtitle: 'Filled area magnitude across operating territories',
      xAxisLabel: 'Fiscal Quarter',
      yAxisLabel: 'Volume ($M)',
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
      title: 'Renewable Energy Generation Mix',
      subtitle: 'Proportional share of clean power output by technology (GWh)',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'right',
      showGrid: false,
      showValueLabels: true,
      palette: 'ocean',
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
          palette: 'ocean',
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
      title: 'Adoption Score vs. Retention Rate by Tier',
      subtitle: 'Continuous (X, Y) coordinate clusters with bubble weight sizing',
      xAxisLabel: 'Feature Adoption Index (0–100)',
      yAxisLabel: 'Net Retention Rate (%)',
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
      title: 'System Architecture Capability Profile',
      subtitle: 'Multivariate benchmark score comparison (0–100 scale)',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      legendPosition: 'top',
      showGrid: true,
      showValueLabels: true,
      palette: 'ocean',
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
          palette: 'ocean',
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
      title: 'R&D Investment Portfolio Hierarchy',
      subtitle: 'Nested branch & leaf allocation across engineering divisions ($K)',
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
