import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'
import { setDb } from './db'
import { createApp } from './app'

type Bindings = {
  DB: any
  CORS_ORIGIN?: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
}

// Standard Cloudflare Workers fetch handler
export default {
  async fetch(request: Request, env: Bindings) {
    setDb(drizzle(env.DB, { schema }))
    return createApp(env.CORS_ORIGIN, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL).fetch(request)
  },
}
