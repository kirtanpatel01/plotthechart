import { defineConfig, env } from 'prisma/config'

try {
  process.loadEnvFile('.env.local')
} catch {
  // Ignore if .env.local does not exist
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
