import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../auth'
import { ThemeService } from '../services/ThemeService'

const app = new Hono()

app.get('/current', authMiddleware, async (c) => {
  return c.json(await ThemeService.findCurrent())
})

app.get('/', authMiddleware, adminMiddleware, async (c) => {
  return c.json(await ThemeService.findAll())
})

app.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json()
  return c.json(await ThemeService.upsert(body))
})

app.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  await ThemeService.delete(Number(c.req.param('id')))
  return c.json({ success: true })
})

export default app
