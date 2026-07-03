#!/usr/bin/env node
/**
 * Seed the RIG OS Agency SQLite database.
 * Run: node scripts/seed-db.js
 */

const Database = require("better-sqlite3");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const path = require("path");

const DB_PATH = path.join(require("os").homedir(), "Developer/rig-os-agency/data/rigos.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("Seeding RIG OS Agency database at", DB_PATH);

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    workspace_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    settings TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    assignee TEXT,
    created_by TEXT,
    due_date TEXT,
    tags TEXT DEFAULT '[]',
    section TEXT DEFAULT 'today',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_activity (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS pipeline_deals (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    company TEXT NOT NULL,
    contact TEXT,
    value INTEGER DEFAULT 0,
    stage TEXT DEFAULT 'discovery',
    source TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    persona TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_ws ON tasks(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_activity_ws ON agent_activity(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_deals_ws ON pipeline_deals(workspace_id);
`);

// Create Mike's admin account
const mikeEmail = "mike@rig.local";
let mike = db.prepare("SELECT id FROM users WHERE email = ?").get(mikeEmail);

if (!mike) {
  const mikeId = nanoid();
  const wsId = nanoid();
  const hash = bcrypt.hashSync("rig2026", 10);

  db.prepare("INSERT INTO workspaces (id, name, owner_id, plan) VALUES (?, ?, ?, ?)")
    .run(wsId, "Rodgers Intelligence Group", mikeId, "enterprise");

  db.prepare("INSERT INTO users (id, email, name, password_hash, role, workspace_id, settings) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(mikeId, mikeEmail, "Mike Rodgers", hash, "admin", wsId, JSON.stringify({ theme: "midnight-aubergine", copilot: "ornith" }));

  console.log("Created admin: mike@rig.local / rig2026");

  // Seed tasks
  const tasks = [
    ["Review Q3 proposal for NeuralSoft", "Dr. Lisa Zhao responded to our $85K proposal.", "high", "pending", null, "inbox", '["sales","proposal"]'],
    ["Approve LinkedIn content calendar", "Sarah Chen has 12 posts queued.", "high", "pending", null, "inbox", '["linkedin"]'],
    ["Stripe payout reconciliation", "3 failed payments need attention.", "critical", "pending", null, "inbox", '["finance"]'],
    ["Review Jake's improvement list", "Auto-generated this morning.", "medium", "pending", null, "inbox", '["ops"]'],
    ["Darius 1:1 prep", "Weekly sync agenda items.", "medium", "pending", null, "inbox", '["team"]'],
    ["Ship RIG OS native app v1.1", "Copilot, terminal, panels.", "high", "in-progress", "Jordan Tech", "today", '["dev"]'],
    ["LinkedIn viral post — AI replacing teams", "Write, design, schedule 2PM.", "high", "in-progress", "Sarah Chen", "today", '["linkedin"]'],
    ["GTM outreach — 50 prospects", "Scored leads, personalized emails.", "high", "in-progress", "Marcus Vale", "today", '["gtm"]'],
    ["Instagram Reel — behind the scenes", "RIG OS build timelapse.", "medium", "draft", "Maya Rivera", "today", '["instagram"]'],
    ["Competitive analysis — Crayon vs Klue", "Feature comparison, positioning.", "medium", "in-progress", "Dr. Alan Cross", "today", '["strategy"]'],
    ["Client portal — TechFlow onboarding", "Branded portal, feeds.", "high", "in-progress", "Marcus Vale", "today", '["client"]'],
    ["Improvement engine running", "10x daily scan active.", "low", "done", "Jake PAI", "today", '["ops"]'],
    ["SEO audit — rodgersintelligence.com", "Meta tags, sitemap, schema.", "medium", "in-progress", "Sarah Chen", "today", '["seo"]'],
  ];

  const stmt = db.prepare("INSERT INTO tasks (id, workspace_id, title, description, priority, status, assignee, section, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const t of tasks) {
    stmt.run(nanoid(), wsId, ...t, mikeId);
  }
  console.log(`Created ${tasks.length} tasks`);

  // Seed deals
  const deals = [
    ["TechFlow Inc", "Sarah Chen", 48000, "discovery"],
    ["DataMeld", "James Park", 120000, "qualified"],
    ["NeuralSoft", "Dr. Lisa Zhao", 85000, "proposal"],
    ["CloudVista", "Mark Reeves", 220000, "negotiation"],
    ["AIPartner Co", "Tom Bridges", 95000, "closed"],
    ["ScaleUp Labs", "Nina Patel", 67000, "discovery"],
    ["DeepTech AI", "Chris Wong", 180000, "qualified"],
    ["BioMetric Systems", "Amy Liu", 75000, "proposal"],
  ];
  const dealStmt = db.prepare("INSERT INTO pipeline_deals (id, workspace_id, company, contact, value, stage) VALUES (?, ?, ?, ?, ?, ?)");
  for (const d of deals) {
    dealStmt.run(nanoid(), wsId, ...d);
  }
  console.log(`Created ${deals.length} deals`);

  // Seed activity
  const acts = [
    ["Jake PAI", "Generated daily briefing with 10 items"],
    ["Hermes", "Connected to Telegram, 10 messages pending"],
    ["Improvement Engine", "Scan complete: 0 issues, Ornith loaded"],
    ["Marcus Vale", "Scored 12 new leads, 3 moved to qualified"],
    ["Sarah Chen", "Scheduled 3 LinkedIn posts for today"],
  ];
  const actStmt = db.prepare("INSERT INTO agent_activity (id, workspace_id, agent_name, action) VALUES (?, ?, ?, ?)");
  for (const a of acts) {
    actStmt.run(nanoid(), wsId, ...a);
  }
  console.log(`Created ${acts.length} activities`);
} else {
  console.log("Admin already exists, skipping seed");
}

// Summary
console.log("\n--- Database Summary ---");
console.log("Users:", db.prepare("SELECT COUNT(*) as c FROM users").get().c);
console.log("Workspaces:", db.prepare("SELECT COUNT(*) as c FROM workspaces").get().c);
console.log("Tasks:", db.prepare("SELECT COUNT(*) as c FROM tasks").get().c);
console.log("Deals:", db.prepare("SELECT COUNT(*) as c FROM pipeline_deals").get().c);
console.log("Activity:", db.prepare("SELECT COUNT(*) as c FROM agent_activity").get().c);
console.log("Chat history:", db.prepare("SELECT COUNT(*) as c FROM chat_history").get().c);
console.log("\nAdmin login: mike@rig.local / rig2026");

db.close();
