import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Администратор'

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required.')
  process.exit(1)
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

const passwordHash = await bcrypt.hash(password, 10)

const user = await prisma.user.upsert({
  where: { email },
  update: {
    passwordHash,
    role: 'ADMIN',
    profile: {
      upsert: {
        update: { fullName },
        create: {
          fullName,
          graduationYear: new Date().getFullYear(),
          specialty: 'Администрирование',
          status: 'APPROVED'
        }
      }
    }
  },
  create: {
    email,
    passwordHash,
    role: 'ADMIN',
    profile: {
      create: {
        fullName,
        graduationYear: new Date().getFullYear(),
        specialty: 'Администрирование',
        status: 'APPROVED'
      }
    }
  },
  include: { profile: true }
})

console.log(`Admin user is ready: ${user.email}`)

await prisma.$disconnect()
