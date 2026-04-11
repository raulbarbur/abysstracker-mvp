import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.SEED_USERNAME
  const password = process.env.SEED_PASSWORD

  if (!username || !password) {
    console.error('SEED_USERNAME and SEED_PASSWORD must be provided in the environment variables')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      passwordHash,
      active: true,
    },
  })

  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
