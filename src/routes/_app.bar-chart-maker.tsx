import { createFileRoute } from '@tanstack/react-router'
import { ChartStudio } from '#/components/charts/ChartStudio'
import { CHART_REGISTRY } from '#/lib/charts/registry'

export const Route = createFileRoute('/_app/bar-chart-maker')({
  head: () => ({
    meta: [
      { title: 'Free Bar Chart Maker & Bar Graph Generator' },
      { name: 'description', content: 'Create bar charts and bar graphs online. Compare categorical data easily with our free bar chart maker.' },
      { property: 'og:title', content: 'Free Bar Chart Maker & Bar Graph Generator' },
      { property: 'og:description', content: 'Create bar charts and bar graphs online. Compare categorical data easily with our free bar chart maker.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://plotthechart.com/bar-chart-maker' },
      { rel: 'canonical', href: 'https://plotthechart.com/bar-chart-maker' },
    ],
  }),
  component: barchartmakertsxPage,
})

function barchartmakertsxPage() {
  const chartDef = CHART_REGISTRY['bar']

  return (
    <main className="w-full flex flex-col min-w-0">
      

      <div className="w-full min-h-[calc(100dvh-8rem)]">
        <ChartStudio initialChartType="bar" isPublicMode />
      </div>

      
      <section className="mx-auto max-w-5xl w-full px-4 py-12 space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">About {chartDef.label}s</h2>
          <p className="text-muted-foreground leading-relaxed">
            {chartDef.shortDescription}
          </p>
        </div>
        
        {chartDef.presets && chartDef.presets.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Common Use Cases</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {chartDef.presets.map(preset => (
                <div key={preset.id} className="p-4 rounded-xl border border-border/60 bg-card">
                  <h4 className="font-semibold text-sm mb-1">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      
    </main>
  )
}
