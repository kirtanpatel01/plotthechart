import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ChartStudio } from '#/components/charts/ChartStudio'
import { getChartProjectByIdFn } from '#/lib/charts/projects.functions'

const studioSearchSchema = z.object({
  projectId: z.string().optional(),
  type: z
    .enum(['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'treemap'])
    .optional(),
})

export const Route = createFileRoute('/studio')({
  validateSearch: studioSearchSchema,
  loaderDeps: ({ search }) => ({ projectId: search.projectId }),
  loader: async ({ deps }) => {
    if (!deps.projectId) {
      return { initialProject: null }
    }
    const project = await getChartProjectByIdFn({
      data: { id: deps.projectId },
    })
    return { initialProject: project }
  },
  component: StudioPage,
})

function StudioPage() {
  const { initialProject } = Route.useLoaderData()
  const { type } = Route.useSearch()

  return (
    <main className="w-full min-w-0 min-h-[calc(100dvh-8rem)]">
      <ChartStudio
        key={initialProject?.id ?? type ?? 'new-studio'}
        initialProject={initialProject}
        initialChartType={type}
      />
    </main>
  )
}
