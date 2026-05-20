import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './auth'
import { AuthService } from './services/AuthService'
import { RotationService, isLeadForSpot } from './services/RotationService'
import { ScheduleService } from './services/ScheduleService'
import { UserService } from './services/UserService'
import usersRouter from './routes/users'
import spotsRouter from './routes/spots'
import schedulesRouter from './routes/schedules'
import rotationsRouter from './routes/rotations'
import themesRouter from './routes/themes'
import vacationsRouter from './routes/vacations'

export function createApp(corsOrigin?: string, resendApiKey?: string, resendFromEmail?: string) {
  const app = new Hono()

  const originEnv = corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const origin = originEnv.includes(',') ? originEnv.split(',').map(o => o.trim()) : originEnv
  app.use('*', cors({
    origin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }))

  app.get('/', (c) => c.json({ message: 'PW-Assistant API' }))

  app.post('/api/login', async (c) => {
    const { email, password } = await c.req.json()
    const result = await AuthService.login(email, password)
    if (!result) return c.json({ message: 'Invalid email or password' }, 401)
    return c.json(result)
  })

  app.get('/api/me', authMiddleware, (c) => {
    const payload = c.get('jwtPayload') as any
    return c.json({ user: payload })
  })

  app.put('/api/me/password', authMiddleware, async (c) => {
    const payload = c.get('jwtPayload') as any
    const { currentPassword, newPassword } = await c.req.json()
    if (!(await AuthService.verifyPassword(payload.id, currentPassword))) {
      return c.json({ message: '現在のパスワードが正しくありません' }, 400)
    }
    await AuthService.changePassword(payload.id, newPassword)
    return c.json({ success: true })
  })

  app.route('/api/users', usersRouter)
  app.route('/api/spots', spotsRouter)
  app.route('/api/schedules', schedulesRouter)
  app.route('/api/rotations', rotationsRouter)
  app.post('/api/rotations/:id/notify', authMiddleware, async (c) => {
    const payload = c.get('jwtPayload') as any
    const rotationId = Number(c.req.param('id'))
    const { message, ccAdminIds } = await c.req.json()

    const rotation = await RotationService.getByIdWithSpot(rotationId)
    if (!rotation) return c.json({ message: 'Not found' }, 404)

    if (!payload.isAdmin) {
      const lead = await isLeadForSpot(rotation.date, rotation.spotId!, payload.id)
      if (!lead) return c.json({ message: '責任者のみ送信できます' }, 403)
    }

    const members = await ScheduleService.getMembersWithEmail(rotation.date, rotation.spotId!)
    if (members.length === 0) return c.json({ message: '送信先メンバーがいません' }, 400)

    if (!resendApiKey || !resendFromEmail) {
      return c.json({ message: 'メール送信が設定されていません' }, 500)
    }

    let ccEmails: string[] = []
    if (Array.isArray(ccAdminIds) && ccAdminIds.length > 0) {
      const allUsers = await UserService.findAll()
      const memberIds = new Set(members.map((m: any) => m.id))
      ccEmails = allUsers
        .filter((u: any) => u.isAdmin && ccAdminIds.includes(u.id) && !memberIds.has(u.id))
        .map((u: any) => u.email)
    }

    const subject = `【SMPW FA】${rotation.date} [${rotation.spotName}] ローテーション`
    const text = `${message ? message + '\n\n' : ''}---\n送信者: ${payload.name}\n※このメールは送信専用です。返信はできませんのでご了承ください。`

    let success = 0
    let failed = 0
    for (let i = 0; i < members.length; i++) {
      const body: any = {
        from: resendFromEmail,
        to: [members[i].email],
        subject,
        text,
      }
      if (i === 0 && ccEmails.length > 0) body.cc = ccEmails

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        success++
      } else {
        failed++
        const errBody = await res.text().catch(() => '')
        console.error(`Resend failed for ${members[i].email}: ${res.status} ${errBody}`)
      }
    }

    if (success === 0) return c.json({ message: 'メール送信に失敗しました' }, 500)
    return c.json({ count: success, failed })
  })

  app.get('/api/my-rotations', authMiddleware, async (c) => {
    const payload = c.get('jwtPayload') as any
    return c.json(await RotationService.findMyRotations(payload.id))
  })
  app.route('/api/themes', themesRouter)
  app.route('/api/vacations', vacationsRouter)

  return app
}
