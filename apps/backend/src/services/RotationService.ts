import { db } from '../db'
import { users, spots, schedules, rotations, rotationSlots } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export async function isLeadForSpot(date: string, spotId: number, userId: number) {
  return !!(await checkIsLead(date, spotId, userId))
}

async function checkIsLead(date: string, spotId: number, userId: number) {
  return db.query.schedules.findFirst({
    where: and(
      eq(schedules.date, date),
      eq(schedules.spotId, spotId),
      eq(schedules.userId, userId),
      eq(schedules.isLead, true)
    )
  })
}

export const RotationService = {
  async find(date: string, spotId: number, userId: number, isAdmin: boolean) {
    const rotation = await db.query.rotations.findFirst({
      where: and(eq(rotations.date, date), eq(rotations.spotId, spotId))
    })
    if (!rotation) return null

    const isLead = !isAdmin && await checkIsLead(date, spotId, userId)
    const slots = await db
      .select({
        slotIndex: rotationSlots.slotIndex,
        userId: rotationSlots.userId,
        duty: rotationSlots.duty,
        userName: users.name,
        userGender: users.gender,
      })
      .from(rotationSlots)
      .leftJoin(users, eq(rotationSlots.userId, users.id))
      .where(eq(rotationSlots.rotationId, rotation.id))

    return { ...rotation, slots, canEdit: isAdmin || !!isLead }
  },

  async upsert(
    data: { date: string; spotId: number; startsAt: string; endsAt: string; intervalMinutes: number; slots: any[]; userOrder: number[] | null },
    userId: number,
    isAdmin: boolean,
  ) {
    if (!isAdmin) {
      const isLead = await checkIsLead(data.date, data.spotId, userId)
      if (!isLead) throw new Error('責任者のみ編集できます')
    }

    const existing = await db.query.rotations.findFirst({
      where: and(eq(rotations.date, data.date), eq(rotations.spotId, data.spotId))
    })

    let rotationId: number
    const userOrderJson = data.userOrder ? JSON.stringify(data.userOrder) : null

    if (existing) {
      await db.update(rotations)
        .set({ startsAt: data.startsAt, endsAt: data.endsAt, intervalMinutes: data.intervalMinutes, userOrder: userOrderJson })
        .where(eq(rotations.id, existing.id))
      rotationId = existing.id
      await db.delete(rotationSlots).where(eq(rotationSlots.rotationId, rotationId))
    } else {
      const inserted = await db.insert(rotations)
        .values({ date: data.date, spotId: data.spotId, startsAt: data.startsAt, endsAt: data.endsAt, intervalMinutes: data.intervalMinutes, userOrder: userOrderJson })
        .returning()
      rotationId = inserted[0].id
    }

    if (data.slots && data.slots.length > 0) {
      const rows = data.slots.map((s: any) => ({ rotationId, slotIndex: s.slotIndex, userId: s.userId, duty: s.duty }))
      // D1 のバインドパラメータ上限（100）に対して1スロット4カラムのため25件ずつバッチ実行
      const BATCH_SIZE = 25
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await db.insert(rotationSlots).values(rows.slice(i, i + BATCH_SIZE))
      }
    }
  },

  async delete(id: number, userId: number, isAdmin: boolean) {
    const rotation = await db.query.rotations.findFirst({ where: eq(rotations.id, id) })
    if (!rotation) throw new Error('Not found')

    if (!isAdmin) {
      const isLead = await checkIsLead(rotation.date, rotation.spotId, userId)
      if (!isLead) throw new Error('責任者のみ削除できます')
    }

    await db.delete(rotationSlots).where(eq(rotationSlots.rotationId, id))
    await db.delete(rotations).where(eq(rotations.id, id))
  },

  async getByIdWithSpot(id: number) {
    const result = await db
      .select({
        id: rotations.id,
        date: rotations.date,
        spotId: rotations.spotId,
        spotName: spots.name,
      })
      .from(rotations)
      .leftJoin(spots, eq(rotations.spotId, spots.id))
      .where(eq(rotations.id, id))
    return result[0] || null
  },

  async findMyRotations(userId: number) {
    return db
      .select({
        slotIndex: rotationSlots.slotIndex,
        duty: rotationSlots.duty,
        date: rotations.date,
        spotId: rotations.spotId,
        spotName: spots.name,
        startsAt: rotations.startsAt,
        endsAt: rotations.endsAt,
        intervalMinutes: rotations.intervalMinutes,
      })
      .from(rotationSlots)
      .leftJoin(rotations, eq(rotationSlots.rotationId, rotations.id))
      .leftJoin(spots, eq(rotations.spotId, spots.id))
      .where(eq(rotationSlots.userId, userId))
  },
}
