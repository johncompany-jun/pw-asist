import { db } from '../db'
import { themes } from '../db/schema'
import { eq } from 'drizzle-orm'

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export const ThemeService = {
  async findCurrent() {
    const weekStart = getWeekStart()
    return (await db.query.themes.findFirst({ where: eq(themes.weekStart, weekStart) })) ?? null
  },

  async findAll() {
    return db.select().from(themes).orderBy(themes.weekStart)
  },

  async upsert(data: { weekStart?: string; title: string; body?: string | null }) {
    const weekStart = data.weekStart ?? getWeekStart()
    const existing = await db.query.themes.findFirst({ where: eq(themes.weekStart, weekStart) })
    if (existing) {
      const result = await db.update(themes)
        .set({ title: data.title, body: data.body ?? null })
        .where(eq(themes.id, existing.id))
        .returning()
      return result[0]
    }
    const result = await db.insert(themes).values({ weekStart, title: data.title, body: data.body ?? null }).returning()
    return result[0]
  },

  async delete(id: number) {
    await db.delete(themes).where(eq(themes.id, id))
  },
}
