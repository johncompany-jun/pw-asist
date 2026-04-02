import { describe, it, expect, beforeEach } from 'bun:test'
import { createTestDb } from './setup'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

async function getService() {
  const { ThemeService } = await import('../services/ThemeService')
  return ThemeService
}

describe('ThemeService', () => {
  describe('upsert', () => {
    it('テーマを作成できる', async () => {
      const ThemeService = await getService()
      const theme = await ThemeService.upsert({ weekStart: '2026-03-30', title: '今週のテーマ', body: '説明' })
      expect(theme.title).toBe('今週のテーマ')
      expect(theme.weekStart).toBe('2026-03-30')
    })

    it('同じweekStartで再登録するとupdateされる', async () => {
      const ThemeService = await getService()
      await ThemeService.upsert({ weekStart: '2026-03-30', title: '初回', body: null })
      const updated = await ThemeService.upsert({ weekStart: '2026-03-30', title: '更新後', body: '新しい説明' })
      expect(updated.title).toBe('更新後')
      const all = await ThemeService.findAll()
      expect(all.length).toBe(1)
    })
  })

  describe('findAll', () => {
    it('全テーマを週開始日順で返す', async () => {
      const ThemeService = await getService()
      await ThemeService.upsert({ weekStart: '2026-04-06', title: '4月第2週' })
      await ThemeService.upsert({ weekStart: '2026-03-30', title: '3月最終週' })
      const all = await ThemeService.findAll()
      expect(all[0].weekStart).toBe('2026-03-30')
      expect(all[1].weekStart).toBe('2026-04-06')
    })
  })

  describe('findCurrent', () => {
    it('今週のテーマを返す', async () => {
      const ThemeService = await getService()
      // ThemeService内部のgetWeekStart()と同じロジックで今週月曜を取得
      const d = new Date()
      const day = d.getDay()
      const diff = day === 0 ? -6 : 1 - day
      d.setDate(d.getDate() + diff)
      const thisWeek = d.toISOString().slice(0, 10)
      await ThemeService.upsert({ weekStart: thisWeek, title: '今週のテーマ' })
      const current = await ThemeService.findCurrent()
      expect(current).not.toBeNull()
      expect(current!.title).toBe('今週のテーマ')
    })

    it('今週のテーマがない場合はnullを返す', async () => {
      const ThemeService = await getService()
      const current = await ThemeService.findCurrent()
      expect(current).toBeNull()
    })
  })

  describe('delete', () => {
    it('テーマを削除できる', async () => {
      const ThemeService = await getService()
      const theme = await ThemeService.upsert({ weekStart: '2026-03-30', title: '削除対象' })
      await ThemeService.delete(theme.id)
      const all = await ThemeService.findAll()
      expect(all.length).toBe(0)
    })
  })
})
