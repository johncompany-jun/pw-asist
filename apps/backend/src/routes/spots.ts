import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../auth'
import { SpotService } from '../services/SpotService'

const app = new Hono()

app.get('/', authMiddleware, async (c) => {
  return c.json(await SpotService.findAll())
})

app.post('/', authMiddleware, async (c) => {
  const body = await c.req.json()
  return c.json(await SpotService.create(body))
})

app.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  await SpotService.delete(Number(c.req.param('id')))
  return c.json({ success: true })
})

export default app
