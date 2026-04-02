import { Hono } from 'hono'
import { authMiddleware } from '../auth'
import { RotationService } from '../services/RotationService'

const app = new Hono()

app.get('/', authMiddleware, async (c) => {
  const { date, spotId } = c.req.query()
  const payload = c.get('jwtPayload') as any
  return c.json(await RotationService.find(date, Number(spotId), payload.id, !!payload.isAdmin))
})

app.post('/', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  const body = await c.req.json()
  try {
    await RotationService.upsert({ ...body, spotId: Number(body.spotId) }, payload.id, !!payload.isAdmin)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ message: e.message }, 403)
  }
})

app.delete('/:id', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  try {
    await RotationService.delete(Number(c.req.param('id')), payload.id, !!payload.isAdmin)
    return c.json({ success: true })
  } catch (e: any) {
    const status = e.message === 'Not found' ? 404 : 403
    return c.json({ message: e.message }, status)
  }
})

export default app
