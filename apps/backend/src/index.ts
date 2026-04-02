import { Database } from 'bun:sqlite'
import { mkdirSync } from 'fs'
import { createDb } from './db/create'
import { setDb } from './db'
import { createApp } from './app'

// Initialize SQLite for local development
mkdirSync('./data', { recursive: true })
const sqlite = new Database('./data/local.db', { create: true })

// Incremental migrations for existing databases
try { sqlite.exec('ALTER TABLE rotations ADD COLUMN user_order TEXT') } catch {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female'))") } catch {}
try { sqlite.exec('ALTER TABLE schedules ADD COLUMN is_lead INTEGER NOT NULL DEFAULT 0') } catch {}

setDb(createDb(sqlite))

export default createApp()
