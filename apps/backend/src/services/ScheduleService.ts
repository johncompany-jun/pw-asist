import { db } from '../db'
import { users, spots, schedules } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const ScheduleService = {
  async findDatesByMonth(year: string, month: string) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const rows = await db
      .selectDistinct({ date: schedules.date })
      .from(schedules)
      .where(sql`${schedules.date} LIKE ${prefix + '-%'}`)
    return rows.map(r => r.date)
  },

  async findAll(isAdmin: boolean, userId: number) {
    const rows = await db
      .select({
        id: schedules.id,
        date: schedules.date,
        spotId: schedules.spotId,
        userId: schedules.userId,
        isLead: schedules.isLead,
        note: schedules.note,
        userName: users.name,
        userGender: users.gender,
        spotName: spots.name,
      })
      .from(schedules)
      .leftJoin(users, eq(schedules.userId, users.id))
      .leftJoin(spots, eq(schedules.spotId, spots.id))

    if (isAdmin) return rows
    return rows.filter(r => r.spotId !== null || r.userId === userId)
  },

  async upsert(data: { date: string; spotId: number | null; userId: number; isLead: boolean; note: string | null }) {
    const existing = await db.query.schedules.findFirst({
      where: and(eq(schedules.date, data.date), eq(schedules.userId, data.userId))
    })
    if (existing) {
      await db.update(schedules)
        .set({ spotId: data.spotId, isLead: data.isLead, note: data.note })
        .where(eq(schedules.id, existing.id))
    } else {
      await db.insert(schedules).values(data)
    }
  },

  async delete(id: number) {
    await db.delete(schedules).where(eq(schedules.id, id))
  },

  async getMembersWithEmail(date: string, spotId: number) {
    return db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(schedules)
      .innerJoin(users, eq(schedules.userId, users.id))
      .where(and(eq(schedules.date, date), eq(schedules.spotId, spotId)))
  },
}
