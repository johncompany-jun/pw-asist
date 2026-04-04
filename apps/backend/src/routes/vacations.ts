import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../auth'
import { VacationService } from '../services/VacationService'

const app = new Hono()

// 自分の申請一覧
app.get('/my', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  return c.json(await VacationService.findByUser(payload.id))
})

// 月別全申請（admin用）
app.get('/', authMiddleware, adminMiddleware, async (c) => {
  const month = c.req.query('month') // YYYY-MM
  if (!month) return c.json({ message: 'month query required' }, 400)
  return c.json(await VacationService.findByMonth(month))
})

// 日付別全申請（配置調整画面用：admin）
app.get('/date', authMiddleware, adminMiddleware, async (c) => {
  const date = c.req.query('date') // YYYY-MM-DD
  if (!date) return c.json({ message: 'date query required' }, 400)
  return c.json(await VacationService.findByDate(date))
})

// 申請作成・更新
app.post('/', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  const { date, comment } = await c.req.json()
  if (!date) return c.json({ message: 'date required' }, 400)
  return c.json(await VacationService.upsert(payload.id, date, comment ?? null))
})

// 申請削除
app.delete('/:id', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  const id = Number(c.req.param('id'))
  const ok = await VacationService.delete(id, payload.id, payload.isAdmin)
  if (!ok) return c.json({ message: '削除できません' }, 403)
  return c.json({ success: true })
})

export default app
