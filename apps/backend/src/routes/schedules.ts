import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../auth'
import { ScheduleService } from '../services/ScheduleService'

const app = new Hono()

app.get('/dates', authMiddleware, async (c) => {
  const { year, month } = c.req.query()
  return c.json(await ScheduleService.findDatesByMonth(year, month))
})

app.get('/', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  return c.json(await ScheduleService.findAll(!!payload.isAdmin, payload.id))
})

app.post('/', authMiddleware, adminMiddleware, async (c) => {
  const { date, spotId, userId, isLead, note } = await c.req.json()
  await ScheduleService.upsert({ date, spotId: spotId ?? null, userId, isLead: !!isLead, note: note ?? null })
  return c.json({ success: true })
})

app.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  await ScheduleService.delete(Number(c.req.param('id')))
  return c.json({ success: true })
})

export default app
