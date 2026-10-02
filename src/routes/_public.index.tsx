import React from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Download,
  FolderKanban,
  GitBranch,
  Layers,
  LineChart,
  Palette,
  PieChart,
  Radar,
  ScatterChart,
  Table2,
} from 'lucide-react'
import { z } from 'zod'
import ThemeToggle from '#/components/ThemeToggle'
import { Button } from '#/components/ui/button'
import { CHART_TYPES_LIST } from '#/lib/charts/registry'
import { PALETTES } from '#/lib/charts/types'
import type { ChartTypeId } from '#/lib/charts/types'

const landingSearchSchema = z.object({
  projectId: z.string().optional(),
})

export const Route = createFileRoute('/_public/')({
  validateSearch: landingSearchSchema,
  beforeLoad: ({ search }) => {
    if (search.projectId) {
      throw redirect({
        to: '/workspace',
        search: { projectId: search.projectId },
      })
    }
  },
  component: LandingPage,
})

const CHART_ICONS: Record<
  ChartTypeId,
  React.ComponentType<{ className?: string }>
> = {
  bar: BarChart3,
  line: LineChart,
  area: Layers,
  pie: PieChart,
  scatter: ScatterChart,
  radar: Radar,
  treemap: GitBranch,
}

const EXISTING_FEATURES = [
  {
    icon: Table2,
    title: '4 Adaptive Data Editors',
    description:
      'Tabular series grid (with CSV/TSV paste import), proportional slice table (with sort & normalize to 100%), XY/size coordinate table (with cluster cohorts), and nested tree editor, plus a copyable JSON inspector.',
  },
  {
    icon: Palette,
    title: `${Object.keys(PALETTES).length} Color Palettes & Options`,
    description:
      'Switch between 8 color palettes, set custom slice colors, and configure titles, subtitles, X/Y axis labels, legend position, gridlines, value labels, and chart-specific geometry.',
  },
  {
    icon: Download,
    title: 'Live SVG Preview & Export',
    description:
      'Charts render live as responsive vector graphics with hover value tooltips and one-click SVG file download.',
  },
  {
    icon: FolderKanban,
    title: 'Saved Projects Dashboard',
    description:
      'Create, configure, and export charts without an account. Sign in with email and password to save, search, filter by chart type, duplicate, and reopen projects.',
  },
]

function LandingPage() {
  return (
    <div className="flex flex-1 flex-col w-full min-w-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PlotTheChart',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            description: 'A data visualization studio for generating, configuring, and exporting charts instantly.',
          }),
        }}
      />
      {/* Standalone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link
            to="/"
            search={{}}
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground no-underline"
          >
            <img
              src="/logo.png"
              alt="PlotTheChart"
              className="size-7 shrink-0 rounded-lg object-contain"
            />
            <span>PlotTheChart</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link to="/workspace" search={{}} className="no-underline">
                Open Studio
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-5xl flex-col justify-center px-4 py-8 sm:py-12 space-y-10 sm:space-y-14">
        {/* Minimal Hero */}
        <section className="max-w-2xl space-y-3.5 sm:space-y-4">
          <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Data Visualization Tool
          </span>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Free Online Chart Maker & Graph Generator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Create charts online with our free graph maker. PlotTheChart is a powerful data visualization tool for building beautiful Bar, Line, Area, Pie, Donut, Scatter, Radar, and Treemap charts. Enter your data, configure styling, and instantly generate charts—no coding required.
          </p>
          <div className="pt-1 sm:pt-2">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/chart-maker" search={{}} className="no-underline">
                Open Chart Maker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

      {/* 7 Supported Chart Types */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            7 Chart Types
          </h2>
          <span className="text-xs text-muted-foreground">
            Tap any chart to open in Studio
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHART_TYPES_LIST.map((chart) => {
            const Icon = CHART_ICONS[chart.type] || BarChart3
            
            let routeTo = '/workspace'
            let searchParams: any = { type: chart.type }
            
            if (chart.type === 'bar') { routeTo = '/bar-chart-maker'; searchParams = {} }
            else if (chart.type === 'line') { routeTo = '/line-chart-maker'; searchParams = {} }
            else if (chart.type === 'pie') { routeTo = '/pie-chart-maker'; searchParams = {} }
            else if (chart.type === 'area') { routeTo = '/area-chart-maker'; searchParams = {} }
            else if (chart.type === 'scatter') { routeTo = '/scatter-plot-maker'; searchParams = {} }

            return (
              <Link
                key={chart.type}
                to={routeTo as any}
                search={searchParams as any}
                className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 no-underline transition-colors hover:border-foreground/30 hover:bg-muted/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {chart.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {chart.shortDescription}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {chart.schemaKind}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* What Exists in the Workspace */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          What&apos;s Included
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {EXISTING_FEATURES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Is this online graph maker free?</h3>
            <p className="text-sm text-muted-foreground">Yes! Our free chart maker allows you to create charts online and export them instantly without any hidden fees.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">What types of charts can I create?</h3>
            <p className="text-sm text-muted-foreground">As a versatile chart generator, you can create pie charts, line graphs, bar charts, scatter plots, donut charts, area charts, and more.</p>
          </div>
        </div>
      </section>
      </main>
    </div>
  )
}
