import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runMigrations } from './migrations.js';
import type { Database as DB } from '../types/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {Kysely<DB> | null} */
let dbInstance: Kysely<DB> | null = null;

function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('file:')) {
    const relativePath = dbUrl.replace('file:', '');
    const absolutePath = path.resolve(__dirname, '..', '..', relativePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return absolutePath;
  }
  
  // Fallback
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'telegram-bot.db');
}

function createKysely(): Kysely<DB> {
  const dbPath = getDbPath();
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL');

  const dialect = new SqliteDialect({
    database: sqlite,
  });

  const db = new Kysely<DB>({
    dialect,
    // log: ['query'] // enable for debug
  });

  return db;
}

export async function initializeDatabase(): Promise<Kysely<DB>> {
  if (!dbInstance) {
    dbInstance = createKysely();
    await runMigrations(dbInstance);
    console.log('[DB] Kysely + SQLite initialized');
  }
  return dbInstance;
}

export function getDb(): Kysely<DB> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('[DB] Connection closed');
  }
}
