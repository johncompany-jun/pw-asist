// Proxy-based mutable singleton.
// - Local dev: setDb(createDb(sqlite)) called in src/index.ts
// - Workers:   setDb(drizzle(env.DB, { schema })) called in src/worker.ts middleware
// - Tests:     mock.module replaces this module entirely

let _db: any = null

export function setDb(instance: any): void {
  _db = instance
}

export const db: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_db) throw new Error('Database not initialized. Call setDb() first.')
    return (_db as any)[prop]
  },
})
