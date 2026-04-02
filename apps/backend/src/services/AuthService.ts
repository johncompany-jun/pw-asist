import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '../auth'

export const AuthService = {
  async login(email: string, password: string) {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null
    const token = await generateToken({ id: user.id, username: user.email, name: user.name, isAdmin: user.isAdmin })
    return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } }
  },

  async verifyPassword(userId: number, password: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return false
    return bcrypt.compare(password, user.passwordHash)
  },

  async changePassword(userId: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
  },
}
