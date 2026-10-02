import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'
import { getChartDefinition } from './registry'
import { AnyChartDataSchema, ChartConfigSchema } from './types'
import type { AnyChartData, ChartConfig, ChartTypeId } from './types'

async function requireAuthenticatedUser() {
  const request = getRequest()
  if (!request) {
    throw new Error('Authentication required: No active request context.')
  }
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  if (!session?.user) {
    throw new Error('Authentication required: Please sign in to save or manage projects.')
  }
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('Vary', 'Cookie, Authorization')
      console.log('Session user:', session?.user)
  return session.user
}

export const getServerSessionFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const request = getRequest()
    if (!request) return null
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    setResponseHeader('Cache-Control', 'private, no-store')
    setResponseHeader('Vary', 'Cookie, Authorization')
      console.log('Session user:', session?.user)
    if (!session?.user) return null
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
          emailVerified: session.user.emailVerified,
        image: session.user.image ?? null,
      },
    }
  } catch {
    return null
  }
})

export interface SerializedChartProject {
  id: string
  name: string
  description: string
  chartType: ChartTypeId
  schemaKind: AnyChartData['schemaKind']
  schemaVersion: number
  dataPayload: AnyChartData
  configPayload: ChartConfig
  userId: string
  createdAt: string
  updatedAt: string
}

function serializeProject(record: {
  id: string
  name: string
  description: string | null
  chartType: string
  schemaKind: string
  schemaVersion: number
  dataPayload: unknown
  configPayload: unknown
  userId: string
  createdAt: Date
  updatedAt: Date
}): SerializedChartProject {
  const def = getChartDefinition(record.chartType)
  const parsedData = def.dataSchema.safeParse(record.dataPayload)
  const parsedConfig = ChartConfigSchema.safeParse(record.configPayload)

  const dataPayload: AnyChartData = parsedData.success
    ? parsedData.data
    : def.defaultData()
  const configPayload: ChartConfig = parsedConfig.success
    ? parsedConfig.data
    : def.defaultConfig()

  return {
    id: record.id,
    name: record.name,
    description: record.description ?? '',
    chartType: def.type,
    schemaKind: dataPayload.schemaKind,
    schemaVersion: record.schemaVersion,
    dataPayload,
    configPayload,
    userId: record.userId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export const listMyChartProjectsFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<Array<SerializedChartProject>> => {
  const user = await requireAuthenticatedUser()
  const records = await prisma.chartProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })
  return records.map(serializeProject)
})

export const getChartProjectByIdFn = createServerFn({
  method: 'GET',
})
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<SerializedChartProject | null> => {
    try {
      const request = getRequest()
      if (!request) return null
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (!session?.user) return null
      setResponseHeader('Cache-Control', 'private, no-store')
      setResponseHeader('Vary', 'Cookie, Authorization')
      console.log('Session user:', session?.user)

      const record = await prisma.chartProject.findFirst({
        where: {
          id: data.id,
          userId: session.user.id,
        },
      })
      if (!record) return null
      return serializeProject(record)
    } catch {
      return null
    }
  })

const SaveProjectInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Project name is required'),
  description: z.string().trim().optional().default(''),
  chartType: z.enum([
    'bar',
    'line',
    'area',
    'pie',
    'scatter',
    'radar',
    'treemap',
  ]),
  dataPayload: AnyChartDataSchema,
  configPayload: ChartConfigSchema,
})

export type SaveProjectInput = z.infer<typeof SaveProjectInputSchema>

export const saveChartProjectFn = createServerFn({
  method: 'POST',
})
  .validator((input: SaveProjectInput) => SaveProjectInputSchema.parse(input))
  .handler(async ({ data }): Promise<SerializedChartProject> => {
    const user = await requireAuthenticatedUser()
    const def = getChartDefinition(data.chartType)

    // Validate that the dataPayload matches the selected chart type's schema
    const validatedData = def.dataSchema.parse(data.dataPayload)
    const validatedConfig = ChartConfigSchema.parse(data.configPayload)

    if (data.id) {
      const existing = await prisma.chartProject.findFirst({
        where: { id: data.id, userId: user.id },
      })
      if (existing) {
        const updated = await prisma.chartProject.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            description: data.description || null,
            chartType: def.type,
            schemaKind: validatedData.schemaKind,
            dataPayload: validatedData as any,
            configPayload: validatedConfig as any,
          },
        })
        return serializeProject(updated)
      }
    }

    const created = await prisma.chartProject.create({
      data: {
        name: data.name,
        description: data.description || null,
        chartType: def.type,
        schemaKind: validatedData.schemaKind,
        schemaVersion: 1,
        dataPayload: validatedData as any,
        configPayload: validatedConfig as any,
        userId: user.id,
      },
    })

    return serializeProject(created)
  })

export const duplicateChartProjectFn = createServerFn({
  method: 'POST',
})
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<SerializedChartProject> => {
    const user = await requireAuthenticatedUser()
    const existing = await prisma.chartProject.findFirst({
      where: { id: data.id, userId: user.id },
    })
    if (!existing) {
      throw new Error('Chart project not found')
    }

    const copy = await prisma.chartProject.create({
      data: {
        name: `${existing.name} (Copy)`,
        description: existing.description,
        chartType: existing.chartType,
        schemaKind: existing.schemaKind,
        schemaVersion: existing.schemaVersion,
        dataPayload: existing.dataPayload as any,
        configPayload: existing.configPayload as any,
        userId: user.id,
      },
    })
    return serializeProject(copy)
  })

export const deleteChartProjectFn = createServerFn({
  method: 'POST',
})
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; deletedId: string }> => {
    const user = await requireAuthenticatedUser()
    const existing = await prisma.chartProject.findFirst({
      where: { id: data.id, userId: user.id },
    })
    if (!existing) {
      throw new Error('Chart project not found or unauthorized')
    }
    await prisma.chartProject.delete({
      where: { id: existing.id },
    })
    return { success: true, deletedId: existing.id }
  })

