import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDatabaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'

neonConfig.poolQueryViaFetch = true

declare global {
  var __prisma: PrismaClient | undefined
  var __prismaUrl: string | undefined
}

function createPrismaClient(connectionString: string): PrismaClient {
  const isNeon =
    connectionString.includes('.neon.tech') ||
    connectionString.includes('neon.database')

  if (isNeon) {
    const adapter = new PrismaNeon({ connectionString, maxUses: 1 })
    return new PrismaClient({ adapter })
  }

  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export function getPrisma(): PrismaClient {
  const url = getDatabaseUrl()
  if (globalThis.__prisma && globalThis.__prismaUrl === url) {
    return globalThis.__prisma
  }
  const client = createPrismaClient(url)
  globalThis.__prisma = client
  globalThis.__prismaUrl = url
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
