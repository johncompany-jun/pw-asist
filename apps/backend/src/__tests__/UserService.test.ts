import { describe, it, expect, beforeEach } from 'bun:test'
import { createTestDb } from './setup'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

async function getService() {
  const { UserService } = await import('../services/UserService')
  return UserService
}

describe('UserService', () => {
  describe('create', () => {
    it('ユーザーを作成できる', async () => {
      const UserService = await getService()
      const user = await UserService.create({
        email: 'new@example.com',
        name: '田中太郎',
        password: 'pass123',
        isAdmin: false,
        gender: 'male',
      })
      expect(user.email).toBe('new@example.com')
      expect(user.name).toBe('田中太郎')
      expect(user.isAdmin).toBe(false)
    })

    it('性別なしはエラーになる', async () => {
      const UserService = await getService()
      await expect(UserService.create({
        email: 'new@example.com',
        name: '田中太郎',
        password: 'pass123',
        isAdmin: false,
        gender: null,
      })).rejects.toThrow('性別は必須です')
    })

    it('重複メールアドレスはエラーになる', async () => {
      const UserService = await getService()
      await UserService.create({ email: 'dup@example.com', name: '太郎', password: 'pass', isAdmin: false, gender: 'male' })
      await expect(UserService.create({ email: 'dup@example.com', name: '次郎', password: 'pass', isAdmin: false, gender: 'male' }))
        .rejects.toThrow()
    })
  })

  describe('findAll', () => {
    it('作成したユーザーが一覧に含まれる', async () => {
      const UserService = await getService()
      await UserService.create({ email: 'a@example.com', name: 'Aさん', password: 'pass', isAdmin: false, gender: 'female' })
      await UserService.create({ email: 'b@example.com', name: 'Bさん', password: 'pass', isAdmin: false, gender: 'male' })
      const all = await UserService.findAll()
      expect(all.length).toBe(2)
    })
  })

  describe('delete', () => {
    it('ユーザーを削除できる', async () => {
      const UserService = await getService()
      const user = await UserService.create({ email: 'del@example.com', name: '削除太郎', password: 'pass', isAdmin: false, gender: 'male' })
      await UserService.delete(user.id)
      const all = await UserService.findAll()
      expect(all.find(u => u.id === user.id)).toBeUndefined()
    })
  })

  describe('bulkCreate', () => {
    it('有効な行を一括登録できる', async () => {
      const UserService = await getService()
      const results = await UserService.bulkCreate([
        { email: 'bulk1@example.com', name: 'Bulk1', gender: 'male', password: 'pass' },
        { email: 'bulk2@example.com', name: 'Bulk2', gender: 'female', password: 'pass' },
      ])
      expect(results.filter(r => r.ok).length).toBe(2)
    })

    it('不正なgenderはエラー行になる', async () => {
      const UserService = await getService()
      const results = await UserService.bulkCreate([
        { email: 'bad@example.com', name: 'Bad', gender: 'unknown', password: 'pass' },
      ])
      expect(results[0].ok).toBe(false)
      expect(results[0].error).toContain('gender')
    })

    it('重複メールはエラー行になり他の行は成功する', async () => {
      const UserService = await getService()
      await UserService.create({ email: 'exist@example.com', name: '既存', password: 'pass', isAdmin: false, gender: 'male' })
      const results = await UserService.bulkCreate([
        { email: 'exist@example.com', name: '重複', gender: 'male', password: 'pass' },
        { email: 'new@example.com', name: '新規', gender: 'female', password: 'pass' },
      ])
      expect(results[0].ok).toBe(false)
      expect(results[1].ok).toBe(true)
    })
  })
})
