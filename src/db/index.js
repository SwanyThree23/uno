import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../antigravity.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seewhy_event TEXT UNIQUE,
    ghl_action TEXT,
    ghl_config TEXT, -- JSON string
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT, -- 'GHL_TO_SEEWHY' or 'SEEWHY_TO_GHL'
    endpoint TEXT,
    payload TEXT,
    status_code INTEGER,
    response TEXT,
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export const getConfig = (key) => {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : null;
};

export const setConfig = (key, value) => {
  db.prepare('INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value);
};

export const saveLog = (direction, endpoint, payload, statusCode, response, error = null) => {
  db.prepare(`
    INSERT INTO logs (direction, endpoint, payload, status_code, response, error)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    direction,
    endpoint,
    typeof payload === 'object' ? JSON.stringify(payload) : payload,
    statusCode,
    typeof response === 'object' ? JSON.stringify(response) : response,
    error
  );
};

export default db;
