import { createFileRoute } from '@tanstack/react-router'
import { ChartStudio } from '#/components/charts/ChartStudio'


export const Route = createFileRoute('/_app/graph-maker')({
  head: () => ({
    meta: [
      { title: 'Free Online Graph Maker & Generator | PlotTheChart' },
      { name: 'description', content: 'Create beautiful graphs online with our free graph maker. No coding required. Build line graphs, bar graphs, and more.' },
      { property: 'og:title', content: 'Free Online Graph Maker & Generator | PlotTheChart' },
      { property: 'og:description', content: 'Create beautiful graphs online with our free graph maker. No coding required. Build line graphs, bar graphs, and more.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://plotthechart.com/graph-maker' },
      { rel: 'canonical', href: 'https://plotthechart.com/graph-maker' },
    ],
  }),
  component: graphmakertsxPage,
})

function graphmakertsxPage() {
  

  return (
    <main className="w-full flex flex-col min-w-0">
      

      <div className="w-full min-h-[calc(100dvh-8rem)]">
        <ChartStudio isPublicMode />
      </div>

      
    </main>
  )
}
