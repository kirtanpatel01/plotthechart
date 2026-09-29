import { defineConfig } from 'prisma/config'

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
    url:
      process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/template1?sslmode=disable',
  },
})
