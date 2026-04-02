import { describe, it, expect, beforeEach } from 'bun:test'
import bcrypt from 'bcryptjs'
import { createTestDb } from './setup'
import { users, spots } from '../db/schema'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

async function getService() {
  const { ScheduleService } = await import('../services/ScheduleService')
  return ScheduleService
}

async function seedData() {
  const passwordHash = await bcrypt.hash('pass', 10)
  const [user] = await db.insert(users).values({ email: 'u@example.com', name: 'ユーザー', passwordHash, isAdmin: false, gender: 'male' }).returning()
  const [spot] = await db.insert(spots).values({ name: 'スポットA' }).returning()
  return { user, spot }
}

describe('ScheduleService', () => {
  describe('upsert / findAll', () => {
    it('スケジュールを登録して管理者は全件取得できる', async () => {
      const { user, spot } = await seedData()
      const ScheduleService = await getService()
      await ScheduleService.upsert({ date: '2026-04-01', spotId: spot.id, userId: user.id, isLead: false, note: null })
      const rows = await ScheduleService.findAll(true, user.id)
      expect(rows.length).toBe(1)
      expect(rows[0].date).toBe('2026-04-01')
    })

    it('同じ日付・ユーザーで再登録するとupdateされる', async () => {
      const { user, spot } = await seedData()
      const ScheduleService = await getService()
      await ScheduleService.upsert({ date: '2026-04-01', spotId: spot.id, userId: user.id, isLead: false, note: null })
      await ScheduleService.upsert({ date: '2026-04-01', spotId: spot.id, userId: user.id, isLead: true, note: 'メモ' })
      const rows = await ScheduleService.findAll(true, user.id)
      expect(rows.length).toBe(1)
      expect(rows[0].isLead).toBe(true)
      expect(rows[0].note).toBe('メモ')
    })

    it('一般ユーザーはspotIdがnull（休み）は自分のみ見える', async () => {
      const passwordHash = await bcrypt.hash('pass', 10)
      const [user1] = await db.insert(users).values({ email: 'u1@example.com', name: 'A', passwordHash, isAdmin: false, gender: 'male' }).returning()
      const [user2] = await db.insert(users).values({ email: 'u2@example.com', name: 'B', passwordHash, isAdmin: false, gender: 'female' }).returning()
      const ScheduleService = await getService()
      await ScheduleService.upsert({ date: '2026-04-01', spotId: null, userId: user1.id, isLead: false, note: null })
      await ScheduleService.upsert({ date: '2026-04-01', spotId: null, userId: user2.id, isLead: false, note: null })
      const rows = await ScheduleService.findAll(false, user1.id)
      expect(rows.every(r => r.spotId !== null || r.userId === user1.id)).toBe(true)
    })
  })

  describe('findDatesByMonth', () => {
    it('指定月のスケジュール日付一覧を返す', async () => {
      const { user, spot } = await seedData()
      const ScheduleService = await getService()
      await ScheduleService.upsert({ date: '2026-04-01', spotId: spot.id, userId: user.id, isLead: false, note: null })
      await ScheduleService.upsert({ date: '2026-04-15', spotId: spot.id, userId: user.id, isLead: false, note: null })
      const dates = await ScheduleService.findDatesByMonth('2026', '4')
      expect(dates).toContain('2026-04-01')
      expect(dates).toContain('2026-04-15')
    })
  })

  describe('delete', () => {
    it('スケジュールを削除できる', async () => {
      const { user, spot } = await seedData()
      const ScheduleService = await getService()
      await ScheduleService.upsert({ date: '2026-04-01', spotId: spot.id, userId: user.id, isLead: false, note: null })
      const [before] = await ScheduleService.findAll(true, user.id)
      await ScheduleService.delete(before.id)
      const after = await ScheduleService.findAll(true, user.id)
      expect(after.length).toBe(0)
    })
  })
})
