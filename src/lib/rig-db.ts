import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.env.HOME || "/Users/rig128gb", "Developer/rig-os-agency/data/rigos.db");

// Ensure data dir exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Lazy-load better-sqlite3 to avoid build-time native module failures.
// The native module may not compile against the running Node.js version;
// we only need it at request time, not during `next build` page-data collection.
let _db: any = null;
let _loadError: string | null = null;

function loadDb() {
  if (_db) return _db;
  if (_loadError) throw new Error(_loadError);
  try {
    // Dynamic require so the build doesn't choke on the native .node file
    const Database = require("better-sqlite3");
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.pragma("busy_timeout = 5000");
    initSchema(_db);
    return _db;
  } catch (e) {
    _loadError = e instanceof Error ? e.message : String(e);
    throw new Error(`SQLite unavailable: ${_loadError}`);
  }
}

function initSchema(db: any) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin','user','client','agent')),
    workspace_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    settings TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id),
    plan TEXT DEFAULT 'free' CHECK(plan IN ('free','pro','agency','enterprise')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in-progress','done','archived')),
    assignee TEXT,
    created_by TEXT REFERENCES users(id),
    due_date TEXT,
    tags TEXT DEFAULT '[]',
    section TEXT DEFAULT 'today',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_activity (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pipeline_deals (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    company TEXT NOT NULL,
    contact TEXT,
    value INTEGER DEFAULT 0,
    stage TEXT DEFAULT 'discovery' CHECK(stage IN ('discovery','qualified','proposal','negotiation','closed','lost')),
    source TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    persona TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_used TEXT,
    rate_limit INTEGER DEFAULT 100
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_activity_workspace ON agent_activity(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_deals_workspace ON pipeline_deals(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id, persona);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);
}

// Proxy that lazily loads on first access
const dbProxy = new Proxy({} as any, {
  get(_target, prop) {
    const db = loadDb();
    const val = db[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});

export default dbProxy;
export type DB = any;
