import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { ChartStudio } from '#/components/charts/ChartStudio'
import { getChartProjectByIdFn, getServerSessionFn } from '#/lib/charts/projects.functions'

const workspaceSearchSchema = z.object({
  projectId: z.string().optional(),
  type: z
    .enum(['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'treemap'])
    .optional(),
})

export const Route = createFileRoute('/_app/workspace')({
  beforeLoad: async () => {
    const session = await getServerSessionFn()
    if (!session?.user) {
      throw redirect({ to: '/signin' })
    }
    if (!session.user.emailVerified) {
      throw redirect({ to: '/verify-email' })
    }
    return { user: session.user }
  },
  validateSearch: workspaceSearchSchema,
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
  component: WorkspacePage,
})

function WorkspacePage() {
  const { initialProject } = Route.useLoaderData()
  const { type } = Route.useSearch()

  return (
    <main className="w-full min-w-0 min-h-[calc(100dvh-8rem)]">
      <ChartStudio
        key={initialProject?.id ?? 'new-workspace'}
        initialProject={initialProject}
        initialChartType={type}
        isPublicMode={false}
      />
    </main>
  )
}
