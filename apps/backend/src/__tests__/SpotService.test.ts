import { describe, it, expect, beforeEach } from 'bun:test'
import { createTestDb } from './setup'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

async function getService() {
  const { SpotService } = await import('../services/SpotService')
  return SpotService
}

describe('SpotService', () => {
  it('スポットを作成できる', async () => {
    const SpotService = await getService()
    const spot = await SpotService.create({ name: 'スポットA', address: '東京都', description: '説明' })
    expect(spot.name).toBe('スポットA')
    expect(spot.address).toBe('東京都')
  })

  it('スポット一覧を取得できる', async () => {
    const SpotService = await getService()
    await SpotService.create({ name: 'A' })
    await SpotService.create({ name: 'B' })
    const all = await SpotService.findAll()
    expect(all.length).toBe(2)
  })

  it('スポットを削除できる', async () => {
    const SpotService = await getService()
    const spot = await SpotService.create({ name: '削除スポット' })
    await SpotService.delete(spot.id)
    const all = await SpotService.findAll()
    expect(all.find(s => s.id === spot.id)).toBeUndefined()
  })
})
