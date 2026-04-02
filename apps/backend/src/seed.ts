import { Database } from 'bun:sqlite'
import { mkdirSync } from 'fs'
import bcrypt from 'bcryptjs'
import { createDb } from './db/create'
import { setDb, db } from './db'
import { users, spots } from './db/schema'
import { eq } from 'drizzle-orm'

mkdirSync('./data', { recursive: true })
const sqlite = new Database('./data/local.db', { create: true })
setDb(createDb(sqlite))

const seedAdmin = async () => {
  const existing = await db.query.users.findFirst({ where: eq(users.email, 'admin@example.com') })
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 10)
    await db.insert(users).values({ email: 'admin@example.com', name: 'Administrator', passwordHash, isAdmin: true, gender: 'male' })
    console.log('Seed: Created initial admin user (admin@example.com / admin123)')
  }
}

const seedSpots = async () => {
  const existing = await db.select().from(spots)
  if (existing.length > 0) return
  const spotNames = ['スポットA', 'スポットB', 'スポットC', 'スポットD', 'スポットE', 'スポットF']
  await db.insert(spots).values(spotNames.map(name => ({ name })))
  console.log('Seed: Created spots A-F')
}

const seedUsers = async () => {
  const existing = await db.query.users.findFirst({ where: eq(users.email, 'user001@example.com') })
  if (existing) return

  const lastNames = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水']
  const maleFirstNames = ['太郎', '次郎', '健太', '翔', '拓也', '大輔', '雄一', '浩二', '康平', '龍']
  const femaleFirstNames = ['花子', '裕子', '恵', '真由美', '幸子', '智子', '和美', '由美', '美穂', 'あゆみ']

  const passwordHash = await bcrypt.hash('SmpwFa10', 10)
  const values = []
  let maleCount = 0
  let femaleCount = 0

  for (let i = 1; i <= 100; i++) {
    const gender = (i % 3 === 0 ? 'female' : 'male') as 'male' | 'female'
    const n = gender === 'female' ? femaleCount++ : maleCount++
    const lastName = lastNames[n % lastNames.length]
    const firstName = gender === 'female'
      ? femaleFirstNames[Math.floor(n / lastNames.length) % femaleFirstNames.length]
      : maleFirstNames[Math.floor(n / lastNames.length) % maleFirstNames.length]
    values.push({ email: `user${String(i).padStart(3, '0')}@example.com`, name: `${lastName} ${firstName}`, passwordHash, isAdmin: false, gender })
  }

  await db.insert(users).values(values)
  console.log('Seed: Created 100 test users')
}

seedAdmin().catch(console.error)
seedSpots().catch(console.error)
seedUsers().catch(console.error)
