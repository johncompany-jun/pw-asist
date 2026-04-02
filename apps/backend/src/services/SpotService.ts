import { db } from '../db'
import { spots } from '../db/schema'
import { eq } from 'drizzle-orm'

export const SpotService = {
  async findAll() {
    return db.select().from(spots)
  },

  async create(data: { name: string; address?: string; description?: string }) {
    const result = await db.insert(spots).values(data).returning()
    return result[0]
  },

  async delete(id: number) {
    await db.delete(spots).where(eq(spots.id, id))
  },
}
