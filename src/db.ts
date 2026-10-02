import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDatabaseUrl } from './database-url.js'
import { PrismaClient } from './generated/prisma/client.js'

// neonConfig.poolQueryViaFetch = true

declare global {
  var __prismaV8: PrismaClient | undefined
  var __prismaUrlV8: string | undefined
}

function configureDevWasmCompiler(client: PrismaClient): PrismaClient {
  if (import.meta.env.DEV) {
    const engineConfig = (
      client as unknown as {
        _engineConfig?: {
          activeProvider?: string
          compilerWasm?: {
            getRuntime: () => Promise<unknown>
            getQueryCompilerWasmModule: () => Promise<WebAssembly.Module>
            importName: string
          }
        }
      }
    )._engineConfig

    if (engineConfig) {
      engineConfig.activeProvider = undefined
      engineConfig.compilerWasm = {
        getRuntime: async () =>
          await import('./generated/prisma/internal/query_compiler_fast_bg.js'),
        getQueryCompilerWasmModule: async () => {
          const { readFileSync } = await import('node:fs')
          const { resolve } = await import('node:path')
          return new WebAssembly.Module(
            readFileSync(
              resolve(
                process.cwd(),
                'src/generated/prisma/internal/query_compiler_fast_bg.wasm',
              ),
            ),
          )
        },
        importName: './query_compiler_fast_bg.js',
      }
    }
  }
  return client
}

function createPrismaClient(connectionString: string): PrismaClient {
  const isNeon =
    connectionString.includes('.neon.tech') ||
    connectionString.includes('neon.database')

  if (isNeon) {
    const adapter = new PrismaNeon({ connectionString, maxUses: 1 })
    return configureDevWasmCompiler(new PrismaClient({ adapter }))
  }

  const adapter = new PrismaPg({ connectionString })
  return configureDevWasmCompiler(new PrismaClient({ adapter }))
}

export function getPrisma(): PrismaClient {
  const url = getDatabaseUrl()
  if (globalThis.__prismaV8 && globalThis.__prismaUrlV8 === url) {
    return globalThis.__prismaV8
  }
  const client = createPrismaClient(url)
  globalThis.__prismaV8 = client
  globalThis.__prismaUrlV8 = url
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
