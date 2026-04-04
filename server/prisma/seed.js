// ============================================================
// prisma/seed.js — Seed initial hospital data into the DB
//
// Run with: node prisma/seed.js
// or add to package.json: "prisma": { "seed": "node prisma/seed.js" }
// then run: npx prisma db seed
// ============================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const hospitals = [
  { name: 'Government General Hospital', phone: '044-2530-5000', lat: 13.0780, lng: 80.2785, beds: 1500, city: 'Chennai' },
  { name: 'Apollo Hospital',             phone: '044-2829-0200', lat: 13.0600, lng: 80.2500, beds: 500,  city: 'Chennai' },
  { name: 'MIOT International',          phone: '044-4200-2288', lat: 13.0100, lng: 80.1900, beds: 250,  city: 'Chennai' },
  { name: 'Fortis Malar Hospital',       phone: '044-4289-2222', lat: 13.0107, lng: 80.2649, beds: 200,  city: 'Chennai' },
  { name: 'Stanley Medical College',     phone: '044-2528-5000', lat: 13.1086, lng: 80.2888, beds: 1200, city: 'Chennai' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Upsert hospitals (safe to re-run)
  for (const hospital of hospitals) {
    await prisma.hospital.upsert({
      where:  { id: hospital.name.toLowerCase().replace(/\s+/g, '-') },
      update: hospital,
      create: { id: hospital.name.toLowerCase().replace(/\s+/g, '-'), ...hospital },
    })
  }

  console.log(`✅ Seeded ${hospitals.length} hospitals`)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
