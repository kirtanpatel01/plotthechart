import { createFileRoute } from '@tanstack/react-router'
import { ChartStudio } from '#/components/charts/ChartStudio'


export const Route = createFileRoute('/_app/chart-maker')({
  head: () => ({
    meta: [
      { title: 'Free Online Chart Maker & Generator | PlotTheChart' },
      { name: 'description', content: 'Use our free online chart maker to create stunning data visualizations. Build pie charts, bar charts, and scatter plots easily.' },
      { property: 'og:title', content: 'Free Online Chart Maker & Generator | PlotTheChart' },
      { property: 'og:description', content: 'Use our free online chart maker to create stunning data visualizations. Build pie charts, bar charts, and scatter plots easily.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://plotthechart.com/chart-maker' },
      { rel: 'canonical', href: 'https://plotthechart.com/chart-maker' },
    ],
  }),
  component: chartmakertsxPage,
})

function chartmakertsxPage() {
  

  return (
    <main className="w-full flex flex-col min-w-0">
      

      <div className="w-full min-h-[calc(100dvh-8rem)]">
        <ChartStudio isPublicMode />
      </div>

      
    </main>
  )
}
