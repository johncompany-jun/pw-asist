import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../auth'
import { UserService } from '../services/UserService'

const app = new Hono()

app.get('/', authMiddleware, adminMiddleware, async (c) => {
  return c.json(await UserService.findAll())
})

app.get('/admins', authMiddleware, async (c) => {
  const allUsers = await UserService.findAll()
  type AdminUser = { id: number; name: string; isAdmin: boolean }
  return c.json((allUsers as AdminUser[]).filter(u => u.isAdmin).map(u => ({ id: u.id, name: u.name })))
})

app.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json()
  try {
    return c.json(await UserService.create(body))
  } catch (e: any) {
    return c.json({ message: e.message }, 400)
  }
})

app.post('/bulk', authMiddleware, adminMiddleware, async (c) => {
  const { rows } = await c.req.json()
  if (!Array.isArray(rows) || rows.length === 0) return c.json({ message: '行がありません' }, 400)
  return c.json(await UserService.bulkCreate(rows))
})

app.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const { name, email, isAdmin } = await c.req.json()
  if (!name || !email) return c.json({ message: '名前とメールアドレスは必須です' }, 400)
  await UserService.update(Number(c.req.param('id')), { name, email, isAdmin })
  return c.json({ success: true })
})

app.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  await UserService.delete(Number(c.req.param('id')))
  return c.json({ success: true })
})

export default app
