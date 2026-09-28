import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { getDatabaseUrl } from '../src/database-url.js'
import { CHART_REGISTRY } from '../src/lib/charts/registry.js'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Preserve starter Todo seed
  await prisma.todo.deleteMany()
  const todos = await prisma.todo.createMany({
    data: [
      { title: 'Review Q4 regional revenue bar chart' },
      { title: 'Compare renewable energy mix donut slices' },
      { title: 'Analyze cohort retention scatter plot' },
    ],
  })
  console.log(`✅ Created ${todos.count} demo todos`)

  // Seed sample projects if demo user exists
  const demoUser = await prisma.user.findUnique({
    where: { email: 'analyst@plotthechart.local' },
  })

  if (demoUser) {
    const existingCount = await prisma.chartProject.count({
      where: { userId: demoUser.id },
    })

    if (existingCount === 0) {
      const sampleTypes = ['bar', 'pie', 'scatter', 'treemap'] as const
      for (const type of sampleTypes) {
        const def = CHART_REGISTRY[type]
        const cfg = def.defaultConfig()
        await prisma.chartProject.create({
          data: {
            name: cfg.title,
            description: cfg.subtitle,
            chartType: def.type,
            schemaKind: def.schemaKind,
            schemaVersion: 1,
            dataPayload: def.defaultData() as any,
            configPayload: cfg as any,
            userId: demoUser.id,
          },
        })
      }
      console.log(`✅ Seeded 4 polymorphic ChartProject records for ${demoUser.email}`)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
