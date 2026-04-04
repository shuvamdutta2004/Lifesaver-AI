// ============================================================
// server/lib/db.js — Prisma Client singleton
//
// Exports a single PrismaClient instance reused across all routes.
// Handles graceful disconnection on process exit.
// ============================================================

import { PrismaClient } from '@prisma/client'

// ── Singleton (prevent multiple instances in dev) ────────────
const globalForPrisma = globalThis

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ── Graceful shutdown ────────────────────────────────────────
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0) })
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0) })

export default prisma
