import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

export function createDb(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      gender TEXT CHECK(gender IN ('male', 'female')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      spot_id INTEGER REFERENCES spots(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      is_lead INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, user_id)
    );
    CREATE TABLE IF NOT EXISTS rotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      spot_id INTEGER NOT NULL REFERENCES spots(id),
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      interval_minutes INTEGER NOT NULL,
      user_order TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, spot_id)
    );
    CREATE TABLE IF NOT EXISTS rotation_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rotation_id INTEGER NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
      slot_index INTEGER NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      duty TEXT NOT NULL CHECK(duty IN ('service', 'watching', 'break')),
      UNIQUE(rotation_id, slot_index, user_id)
    );
    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  return drizzle(sqlite, { schema })
}
