import { Database } from 'bun:sqlite'
import { mock } from 'bun:test'
import { createDb } from '../db/create'

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = createDb(sqlite)
  mock.module('../db', () => ({ db }))
  return db
}
