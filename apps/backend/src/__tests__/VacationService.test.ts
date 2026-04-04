import { describe, it, expect, beforeEach } from 'bun:test'
import bcrypt from 'bcryptjs'
import { createTestDb } from './setup'
import { users } from '../db/schema'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

async function getService() {
  const { VacationService } = await import('../services/VacationService')
  return VacationService
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash('pass', 10)
  const [user1] = await db.insert(users).values({ email: 'u1@example.com', name: '田中', passwordHash, isAdmin: false, gender: 'male' }).returning()
  const [user2] = await db.insert(users).values({ email: 'u2@example.com', name: '鈴木', passwordHash, isAdmin: false, gender: 'female' }).returning()
  const [admin] = await db.insert(users).values({ email: 'admin@example.com', name: '管理者', passwordHash, isAdmin: true, gender: 'male' }).returning()
  return { user1, user2, admin }
}

describe('VacationService', () => {
  describe('upsert', () => {
    it('休み申請を作成できる', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      const req = await VacationService.upsert(user1.id, '2026-04-10', 'イベントのため')
      expect(req.date).toBe('2026-04-10')
      expect(req.comment).toBe('イベントのため')
    })

    it('コメントなしで申請できる', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      const req = await VacationService.upsert(user1.id, '2026-04-10', null)
      expect(req.comment).toBeNull()
    })

    it('同じユーザー・同じ日付で再申請するとコメントが上書きされる', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      await VacationService.upsert(user1.id, '2026-04-10', '最初のコメント')
      const updated = await VacationService.upsert(user1.id, '2026-04-10', '更新後のコメント')
      expect(updated.comment).toBe('更新後のコメント')
      const list = await VacationService.findByUser(user1.id)
      expect(list.length).toBe(1)
    })
  })

  describe('findByUser', () => {
    it('自分の申請のみ取得できる', async () => {
      const { user1, user2 } = await seedUsers()
      const VacationService = await getService()
      await VacationService.upsert(user1.id, '2026-04-10', null)
      await VacationService.upsert(user1.id, '2026-04-15', null)
      await VacationService.upsert(user2.id, '2026-04-10', null)
      const list = await VacationService.findByUser(user1.id)
      expect(list.length).toBe(2)
      expect(list.every(r => r.date === '2026-04-10' || r.date === '2026-04-15')).toBe(true)
    })

    it('日付昇順で返す', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      await VacationService.upsert(user1.id, '2026-04-20', null)
      await VacationService.upsert(user1.id, '2026-04-05', null)
      const list = await VacationService.findByUser(user1.id)
      expect(list[0].date).toBe('2026-04-05')
      expect(list[1].date).toBe('2026-04-20')
    })
  })

  describe('findByMonth', () => {
    it('指定月の全ユーザーの申請を返す', async () => {
      const { user1, user2 } = await seedUsers()
      const VacationService = await getService()
      await VacationService.upsert(user1.id, '2026-04-10', null)
      await VacationService.upsert(user2.id, '2026-04-15', null)
      await VacationService.upsert(user1.id, '2026-05-01', null) // 別の月
      const list = await VacationService.findByMonth('2026-04')
      expect(list.length).toBe(2)
      expect(list.every(r => r.date.startsWith('2026-04'))).toBe(true)
    })

    it('ユーザー名が含まれている', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      await VacationService.upsert(user1.id, '2026-04-10', null)
      const list = await VacationService.findByMonth('2026-04')
      expect(list[0].userName).toBe('田中')
    })
  })

  describe('findByDate', () => {
    it('指定日の申請を返す', async () => {
      const { user1, user2 } = await seedUsers()
      const VacationService = await getService()
      await VacationService.upsert(user1.id, '2026-04-10', null)
      await VacationService.upsert(user2.id, '2026-04-10', null)
      await VacationService.upsert(user1.id, '2026-04-11', null)
      const list = await VacationService.findByDate('2026-04-10')
      expect(list.length).toBe(2)
    })
  })

  describe('delete', () => {
    it('本人は自分の申請を削除できる', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      const req = await VacationService.upsert(user1.id, '2026-04-10', null)
      const ok = await VacationService.delete(req.id, user1.id, false)
      expect(ok).toBe(true)
      const list = await VacationService.findByUser(user1.id)
      expect(list.length).toBe(0)
    })

    it('他人の申請は削除できない', async () => {
      const { user1, user2 } = await seedUsers()
      const VacationService = await getService()
      const req = await VacationService.upsert(user1.id, '2026-04-10', null)
      const ok = await VacationService.delete(req.id, user2.id, false)
      expect(ok).toBe(false)
      const list = await VacationService.findByUser(user1.id)
      expect(list.length).toBe(1)
    })

    it('管理者は他人の申請を削除できる', async () => {
      const { user1, admin } = await seedUsers()
      const VacationService = await getService()
      const req = await VacationService.upsert(user1.id, '2026-04-10', null)
      const ok = await VacationService.delete(req.id, admin.id, true)
      expect(ok).toBe(true)
      const list = await VacationService.findByUser(user1.id)
      expect(list.length).toBe(0)
    })

    it('存在しないIDはfalseを返す', async () => {
      const { user1 } = await seedUsers()
      const VacationService = await getService()
      const ok = await VacationService.delete(9999, user1.id, false)
      expect(ok).toBe(false)
    })
  })
})
