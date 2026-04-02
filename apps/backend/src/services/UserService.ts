import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const UserService = {
  async findAll() {
    return db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      gender: users.gender,
      createdAt: users.createdAt,
    }).from(users)
  },

  async create(data: { email: string; name: string; password: string; isAdmin: boolean; gender: string | null }) {
    if (!data.gender) throw new Error('性別は必須です')
    const passwordHash = await bcrypt.hash(data.password, 10)
    const result = await db.insert(users).values({
      email: data.email,
      name: data.name,
      passwordHash,
      isAdmin: data.isAdmin,
      gender: data.gender as 'male' | 'female',
    }).returning()
    return result[0]
  },

  async bulkCreate(rows: { email: string; name: string; gender: string; password: string }[]) {
    const results: { email: string; ok: boolean; error?: string }[] = []
    const hashCache = new Map<string, string>()
    for (const row of rows) {
      try {
        if (!row.email || !row.name || !row.gender) throw new Error('email/name/gender は必須です')
        if (row.gender !== 'male' && row.gender !== 'female') throw new Error('gender は male か female')
        if (!hashCache.has(row.password)) hashCache.set(row.password, await bcrypt.hash(row.password, 4))
        const passwordHash = hashCache.get(row.password)!
        await db.insert(users).values({
          email: row.email,
          name: row.name,
          passwordHash,
          gender: row.gender as 'male' | 'female',
          isAdmin: false,
        })
        results.push({ email: row.email, ok: true })
      } catch (e: any) {
        results.push({ email: row.email ?? '(不明)', ok: false, error: e.message })
      }
    }
    return results
  },

  async update(id: number, data: { name: string; email: string; isAdmin?: boolean }) {
    const set: any = { name: data.name, email: data.email }
    if (data.isAdmin !== undefined) set.isAdmin = data.isAdmin
    await db.update(users).set(set).where(eq(users.id, id))
  },

  async delete(id: number) {
    await db.delete(users).where(eq(users.id, id))
  },
}
