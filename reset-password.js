const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin123!', 12)
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { password: hash }
  })
  console.log('Done! Login with: admin@example.com / Admin123!')
  await prisma.$disconnect()
}

main().catch(console.error)
