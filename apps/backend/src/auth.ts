import { jwt, sign, verify } from 'hono/jwt'
import type { Context, Next } from 'hono'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const generateToken = async (user: { id: number; username: string; name: string; isAdmin: boolean }) => {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    isAdmin: user.isAdmin,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  }
  return await sign(payload, JWT_SECRET)
}

export const authMiddleware = jwt({
  secret: JWT_SECRET,
  alg: 'HS256',
})

export const adminMiddleware = async (c: Context, next: Next) => {
  const payload = c.get('jwtPayload') as any
  if (!payload || !payload.isAdmin) {
    return c.json({ message: 'Forbidden: Admin access required' }, 403)
  }
  await next()
}
