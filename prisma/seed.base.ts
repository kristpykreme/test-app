import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } })
  await prisma.role.upsert({ where: { name: 'user' },  update: {}, create: { name: 'user' } })
  console.log('Seeded base roles.')
}
main().finally(() => prisma.$disconnect())
