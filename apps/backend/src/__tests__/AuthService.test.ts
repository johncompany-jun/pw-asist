import { describe, it, expect, beforeEach } from 'bun:test'
import bcrypt from 'bcryptjs'
import { createTestDb } from './setup'
import { users } from '../db/schema'

let db: ReturnType<typeof createTestDb>

beforeEach(() => {
  db = createTestDb()
})

// AuthServiceはdbモックが確立してからimportする必要があるため動的importを使用
async function getService() {
  const { AuthService } = await import('../services/AuthService')
  return AuthService
}

async function seedUser(isAdmin = false) {
  const passwordHash = await bcrypt.hash('password123', 10)
  const result = await db.insert(users).values({
    email: 'test@example.com',
    name: 'テストユーザー',
    passwordHash,
    isAdmin,
    gender: 'male',
  }).returning()
  return result[0]
}

describe('AuthService', () => {
  describe('login', () => {
    it('正しいメールアドレスとパスワードでログインできる', async () => {
      await seedUser()
      const AuthService = await getService()
      const result = await AuthService.login('test@example.com', 'password123')
      expect(result).not.toBeNull()
      expect(result!.user.email).toBe('test@example.com')
      expect(result!.token).toBeTruthy()
    })

    it('存在しないメールアドレスはnullを返す', async () => {
      const AuthService = await getService()
      const result = await AuthService.login('notfound@example.com', 'password123')
      expect(result).toBeNull()
    })

    it('パスワードが間違っている場合はnullを返す', async () => {
      await seedUser()
      const AuthService = await getService()
      const result = await AuthService.login('test@example.com', 'wrongpassword')
      expect(result).toBeNull()
    })
  })

  describe('verifyPassword', () => {
    it('正しいパスワードはtrueを返す', async () => {
      const user = await seedUser()
      const AuthService = await getService()
      expect(await AuthService.verifyPassword(user.id, 'password123')).toBe(true)
    })

    it('間違ったパスワードはfalseを返す', async () => {
      const user = await seedUser()
      const AuthService = await getService()
      expect(await AuthService.verifyPassword(user.id, 'wrong')).toBe(false)
    })

    it('存在しないユーザーIDはfalseを返す', async () => {
      const AuthService = await getService()
      expect(await AuthService.verifyPassword(9999, 'password123')).toBe(false)
    })
  })

  describe('changePassword', () => {
    it('パスワードを変更できる', async () => {
      const user = await seedUser()
      const AuthService = await getService()
      await AuthService.changePassword(user.id, 'newpassword456')
      expect(await AuthService.verifyPassword(user.id, 'newpassword456')).toBe(true)
      expect(await AuthService.verifyPassword(user.id, 'password123')).toBe(false)
    })
  })
})
