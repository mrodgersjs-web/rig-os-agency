import db from "./db";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

// ─── Types ───
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace_id: string | null;
  created_at: string;
  last_login: string | null;
  settings: string;
}

export interface Session {
  token: string;
  user_id: string;
  expires_at: string;
}

// ─── Auth ───
export function createUser(email: string, name: string, password: string, role = "user"): User {
  const id = nanoid();
  const hash = bcrypt.hashSync(password, 10);
  
  // Create workspace for the user
  const wsId = nanoid();
  db.prepare("INSERT INTO workspaces (id, name, owner_id, plan) VALUES (?, ?, ?, 'free')")
    .run(wsId, `${name}'s Workspace`, id);

  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, role, workspace_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email, name, hash, role, wsId);

  return getUserById(id)!;
}

export function authenticate(email: string, password: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as (User & { password_hash: string }) | undefined;
  if (!row) return null;
  if (!bcrypt.compareSync(password, row.password_hash)) return null;
  
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(row.id);
  
  const { password_hash, ...user } = row;
  return user;
}

export function createSession(userId: string, ip?: string, userAgent?: string): string {
  const token = nanoid(48);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)"
  ).run(token, userId, expires, ip || null, userAgent || null);
  
  return token;
}

export function getSession(token: string): User | null {
  const session = db.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  ).get(token) as Session | undefined;
  
  if (!session) return null;
  return getUserById(session.user_id);
}

export function destroySession(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getUserById(id: string): User | null {
  const row = db.prepare("SELECT id, email, name, role, workspace_id, created_at, last_login, settings FROM users WHERE id = ?").get(id);
  return (row as User) || null;
}

export function getUserByEmail(email: string): User | null {
  const row = db.prepare("SELECT id, email, name, role, workspace_id, created_at, last_login, settings FROM users WHERE email = ?").get(email);
  return (row as User) || null;
}

// ─── Tasks ───
export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignee: string | null;
  created_by: string | null;
  due_date: string | null;
  tags: string;
  section: string;
  created_at: string;
  updated_at: string;
}

export function createTask(wsId: string, data: Partial<Task> & { title: string }): Task {
  const id = nanoid();
  db.prepare(`
    INSERT INTO tasks (id, workspace_id, title, description, priority, status, assignee, created_by, due_date, tags, section)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, wsId, data.title, data.description || null,
    data.priority || "medium", data.status || "pending",
    data.assignee || null, data.created_by || null,
    data.due_date || null, data.tags || "[]",
    data.section || "today"
  );
  return getTask(id)!;
}

export function getTask(id: string): Task | null {
  return (db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task) || null;
}

export function getTasks(wsId: string, section?: string): Task[] {
  if (section) {
    return db.prepare("SELECT * FROM tasks WHERE workspace_id = ? AND section = ? ORDER BY created_at DESC").all(wsId, section) as Task[];
  }
  return db.prepare("SELECT * FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC").all(wsId) as Task[];
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const allowed = ["title", "description", "priority", "status", "assignee", "due_date", "tags", "section"];
  const fields = allowed.filter(f => f in updates);
  if (fields.length === 0) return getTask(id);
  
  const sets = fields.map(f => `${f} = @${f}`).join(", ");
  const params: Record<string, unknown> = { id };
  fields.forEach(f => { params[f] = updates[f as keyof Task]; });
  
  db.prepare(`UPDATE tasks SET ${sets}, updated_at = datetime('now') WHERE id = @id`).run(params);
  return getTask(id);
}

export function deleteTask(id: string): void {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

// ─── Pipeline ───
export interface Deal {
  id: string;
  workspace_id: string;
  company: string;
  contact: string | null;
  value: number;
  stage: string;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export function getDeals(wsId: string): Deal[] {
  return db.prepare("SELECT * FROM pipeline_deals WHERE workspace_id = ? ORDER BY value DESC").all(wsId) as Deal[];
}

export function createDeal(wsId: string, data: Partial<Deal> & { company: string }): Deal {
  const id = nanoid();
  db.prepare(`
    INSERT INTO pipeline_deals (id, workspace_id, company, contact, value, stage, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, wsId, data.company, data.contact || null, data.value || 0, data.stage || "discovery", data.source || null);
  return db.prepare("SELECT * FROM pipeline_deals WHERE id = ?").get(id) as Deal;
}

// ─── Chat History ───
export function saveChatMessage(userId: string, persona: string, role: string, content: string, model?: string): void {
  const id = nanoid();
  db.prepare(
    "INSERT INTO chat_history (id, user_id, persona, role, content, model) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, userId, persona, role, content, model || null);
}

export function getChatHistory(userId: string, persona: string, limit = 20): Array<{ role: string; content: string }> {
  return db.prepare(
    "SELECT role, content FROM chat_history WHERE user_id = ? AND persona = ? ORDER BY created_at DESC LIMIT ?"
  ).all(userId, persona, limit).reverse() as Array<{ role: string; content: string }>;
}

// ─── Agent Activity ───
export function logActivity(wsId: string, agent: string, action: string, metadata?: Record<string, unknown>): void {
  const id = nanoid();
  db.prepare(
    "INSERT INTO agent_activity (id, workspace_id, agent_name, action, metadata) VALUES (?, ?, ?, ?, ?)"
  ).run(id, wsId, agent, action, JSON.stringify(metadata || {}));
}

export function getActivity(wsId: string, limit = 20): Array<{ agent_name: string; action: string; created_at: string; metadata: string }> {
  return db.prepare(
    "SELECT agent_name, action, created_at, metadata FROM agent_activity WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(wsId, limit) as Array<{ agent_name: string; action: string; created_at: string; metadata: string }>;
}
