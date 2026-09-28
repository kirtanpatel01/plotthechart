import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ChartStudio } from '#/components/charts/ChartStudio'
import { getChartProjectByIdFn } from '#/lib/charts/projects.functions'

const studioSearchSchema = z.object({
  projectId: z.string().optional(),
})

export const Route = createFileRoute('/')({
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
  component: StudioHomePage,
})

function StudioHomePage() {
  const { initialProject } = Route.useLoaderData()

  return (
    <main className="w-full min-h-[calc(100vh-8rem)]">
      <ChartStudio
        key={initialProject?.id ?? 'new-studio'}
        initialProject={initialProject}
      />
    </main>
  )
}
