import { describe, it, expect, beforeEach } from 'bun:test'
import bcrypt from 'bcryptjs'
import { createTestDb } from './setup'
import { users, spots, schedules } from '../db/schema'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

async function getService() {
  const { RotationService } = await import('../services/RotationService')
  return RotationService
}

async function seedData() {
  const passwordHash = await bcrypt.hash('pass', 10)
  const [admin] = await db.insert(users).values({ email: 'admin@example.com', name: '管理者', passwordHash, isAdmin: true, gender: 'male' }).returning()
  const [member] = await db.insert(users).values({ email: 'member@example.com', name: '隊員', passwordHash, isAdmin: false, gender: 'female' }).returning()
  const [spot] = await db.insert(spots).values({ name: 'スポットA' }).returning()
  return { admin, member, spot }
}

const baseRotation = {
  date: '2026-04-01',
  startsAt: '09:00',
  endsAt: '17:00',
  intervalMinutes: 60,
  userOrder: null,
  slots: [],
}

describe('RotationService', () => {
  describe('upsert', () => {
    it('管理者はローテーションを作成できる', async () => {
      const { admin, spot } = await seedData()
      const RotationService = await getService()
      await RotationService.upsert({ ...baseRotation, spotId: spot.id }, admin.id, true)
      const result = await RotationService.find('2026-04-01', spot.id, admin.id, true)
      expect(result).not.toBeNull()
      expect(result!.startsAt).toBe('09:00')
    })

    it('管理者でも責任者でもない場合はエラー', async () => {
      const { member, spot } = await seedData()
      const RotationService = await getService()
      await expect(
        RotationService.upsert({ ...baseRotation, spotId: spot.id }, member.id, false)
      ).rejects.toThrow('責任者のみ編集できます')
    })

    it('責任者はローテーションを編集できる', async () => {
      const { member, spot } = await seedData()
      await db.insert(schedules).values({ date: '2026-04-01', spotId: spot.id, userId: member.id, isLead: true, note: null })
      const RotationService = await getService()
      await RotationService.upsert({ ...baseRotation, spotId: spot.id }, member.id, false)
      const result = await RotationService.find('2026-04-01', spot.id, member.id, false)
      expect(result).not.toBeNull()
    })

    it('スロット付きでローテーションを作成できる', async () => {
      const { admin, member, spot } = await seedData()
      const RotationService = await getService()
      const slots = [{ slotIndex: 0, userId: member.id, duty: 'service' }]
      await RotationService.upsert({ ...baseRotation, spotId: spot.id, slots }, admin.id, true)
      const result = await RotationService.find('2026-04-01', spot.id, admin.id, true)
      expect(result!.slots.length).toBe(1)
      expect(result!.slots[0].duty).toBe('service')
    })
  })

  describe('delete', () => {
    it('管理者はローテーションを削除できる', async () => {
      const { admin, spot } = await seedData()
      const RotationService = await getService()
      await RotationService.upsert({ ...baseRotation, spotId: spot.id }, admin.id, true)
      const result = await RotationService.find('2026-04-01', spot.id, admin.id, true)
      await RotationService.delete(result!.id, admin.id, true)
      expect(await RotationService.find('2026-04-01', spot.id, admin.id, true)).toBeNull()
    })

    it('存在しないIDはエラー', async () => {
      const { admin } = await seedData()
      const RotationService = await getService()
      await expect(RotationService.delete(9999, admin.id, true)).rejects.toThrow('Not found')
    })

    it('権限なしはエラー', async () => {
      const { admin, member, spot } = await seedData()
      const RotationService = await getService()
      await RotationService.upsert({ ...baseRotation, spotId: spot.id }, admin.id, true)
      const result = await RotationService.find('2026-04-01', spot.id, admin.id, true)
      await expect(RotationService.delete(result!.id, member.id, false)).rejects.toThrow('責任者のみ削除できます')
    })
  })

  describe('findMyRotations', () => {
    it('自分が割り当てられたスロットのみ返す', async () => {
      const { admin, member, spot } = await seedData()
      const RotationService = await getService()
      const slots = [{ slotIndex: 0, userId: member.id, duty: 'service' }]
      await RotationService.upsert({ ...baseRotation, spotId: spot.id, slots }, admin.id, true)
      const myRotations = await RotationService.findMyRotations(member.id)
      expect(myRotations.length).toBe(1)
      expect(myRotations[0].duty).toBe('service')
    })
  })
})
