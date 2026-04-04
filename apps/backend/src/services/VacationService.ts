import { db } from '../db'
import { vacationRequests, users } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const VacationService = {
  async findByUser(userId: number) {
    return db
      .select({
        id: vacationRequests.id,
        date: vacationRequests.date,
        comment: vacationRequests.comment,
        createdAt: vacationRequests.createdAt,
      })
      .from(vacationRequests)
      .where(eq(vacationRequests.userId, userId))
      .orderBy(vacationRequests.date)
  },

  async findByMonth(yearMonth: string) {
    return db
      .select({
        id: vacationRequests.id,
        userId: vacationRequests.userId,
        date: vacationRequests.date,
        comment: vacationRequests.comment,
        userName: users.name,
      })
      .from(vacationRequests)
      .leftJoin(users, eq(vacationRequests.userId, users.id))
      .where(sql`${vacationRequests.date} LIKE ${yearMonth + '-%'}`)
      .orderBy(vacationRequests.date)
  },

  async findByDate(date: string) {
    return db
      .select({
        id: vacationRequests.id,
        userId: vacationRequests.userId,
        date: vacationRequests.date,
        comment: vacationRequests.comment,
        userName: users.name,
      })
      .from(vacationRequests)
      .leftJoin(users, eq(vacationRequests.userId, users.id))
      .where(eq(vacationRequests.date, date))
  },

  async upsert(userId: number, date: string, comment: string | null) {
    const existing = await db.query.vacationRequests.findFirst({
      where: and(eq(vacationRequests.userId, userId), eq(vacationRequests.date, date)),
    })
    if (existing) {
      const result = await db
        .update(vacationRequests)
        .set({ comment })
        .where(eq(vacationRequests.id, existing.id))
        .returning()
      return result[0]
    }
    const result = await db
      .insert(vacationRequests)
      .values({ userId, date, comment })
      .returning()
    return result[0]
  },

  async delete(id: number, userId: number, isAdmin: boolean) {
    const existing = await db.query.vacationRequests.findFirst({
      where: eq(vacationRequests.id, id),
    })
    if (!existing) return false
    if (!isAdmin && existing.userId !== userId) return false
    await db.delete(vacationRequests).where(eq(vacationRequests.id, id))
    return true
  },
}
