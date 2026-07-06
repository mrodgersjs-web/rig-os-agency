// ── RIG OS Agency — Content Calendar API ─────────────────────────────
// Aggregates scheduled posts (Postiz), queued drafts, and the published
// ledger into a week-by-week, day-by-day editorial calendar.
// Real evidence only: scans LinkedIn studio campaigns/content, ai-company
// proof dirs, and Postiz runtime to surface genuine numbers.

import { NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LINKEDIN_STUDIO = "/Users/rig128gb/Desktop/rig-linkedin-studio";
const AI_COMPANY = "/Users/rig128gb/Developer/ai-company";
const POSTIZ_PATH = "/Users/rig128gb/.hermes/node/bin/postiz";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 5000, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function safeList(dir: string, ext?: string[]): string[] {
  try {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter((f) => {
      if (f.startsWith(".")) return false;
      if (!ext) return true;
      return ext.some((e) => f.endsWith(e));
    });
  } catch {
    return [];
  }
}

function readJsonSafe(path: string): any | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

interface Slot {
  date: string;
  channel: "linkedin" | "instagram" | "twitter" | "blog" | "newsletter";
  status: "published" | "scheduled" | "queued" | "draft" | "expired";
  title: string;
  excerpt: string;
  source: string;
  score?: number;
  proofHash?: string;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoWeekStart(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setUTCDate(d.getUTCDate() + diff);
  m.setUTCHours(0, 0, 0, 0);
  return m;
}

function dayIndex(d: Date): string {
  // Monday = 0
  return DAYS[(d.getUTCDay() + 6) % 7];
}

function slotFromFile(
  fp: string,
  channel: Slot["channel"],
  status: Slot["status"],
  source: string,
  dateOverride?: Date
): Slot | null {
  try {
    const st = statSync(fp);
    const dt = dateOverride || new Date(st.mtime);
    const f = fp.split("/").pop() || "post";
    let title = f.replace(/\.(md|json)$/, "");
    let excerpt = "";
    let score: number | undefined;
    let proofHash: string | undefined;
    if (f.endsWith(".md")) {
      const body = readFileSync(fp, "utf-8");
      const firstLine = body.split("\n").find((l) => l.startsWith("#"));
      if (firstLine) title = firstLine.replace(/^#+\s*/, "").slice(0, 80);
      excerpt = body.replace(/[#>*`_-]/g, "").trim().slice(0, 140);
    } else if (f.endsWith(".json")) {
      try {
        const j = JSON.parse(readFileSync(fp, "utf-8"));
        title = (j.title || j.name || j.post_title || j.slug || f).slice(0, 80);
        excerpt = (j.content || j.body || j.text || j.excerpt || "").slice(0, 140);
        if (typeof j.score === "number") score = j.score;
        if (typeof j.hash === "string") proofHash = j.hash;
      } catch {}
    }
    return {
      date: ymd(dt),
      channel,
      status,
      title,
      excerpt,
      source,
      score,
      proofHash,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const now = new Date();
  const weekStart = isoWeekStart(now);

  const slots: Slot[] = [];

  // 1. Receipt ledger — published posts with timestamps
  const ledger = readJsonSafe(join(LINKEDIN_STUDIO, "receipt_ledger.json"));
  if (ledger && Array.isArray(ledger.posts)) {
    for (const p of ledger.posts) {
      const ts = p.published_at || p.scheduled_at || p.created_at;
      if (!ts) continue;
      const dt = new Date(ts);
      slots.push({
        date: ymd(dt),
        channel: "linkedin",
        status: p.status === "published" ? "published" : "scheduled",
        title: p.title || p.slug || "LinkedIn post",
        excerpt: (p.content || p.body || "").slice(0, 140),
        source: `receipt_ledger:${p.id || p.slug || "unknown"}`,
        proofHash: p.hash || p.proof_hash,
        score: p.score,
      });
    }
  }

  // 2. LinkedIn studio — campaign posts (all campaign dirs)
  const campaignsDir = join(LINKEDIN_STUDIO, "campaigns");
  const campaignDirs = safeList(campaignsDir).filter((d) => {
    try {
      return statSync(join(campaignsDir, d)).isDirectory();
    } catch {
      return false;
    }
  });
  let campaignPostCount = 0;
  let scheduledManifestCount = 0;
  for (const cd of campaignDirs) {
    // 2a. markdown posts in posts/ or posts_spiced/
    for (const sub of ["posts", "posts_spiced"]) {
      const dir = join(campaignsDir, cd, sub);
      const files = safeList(dir, [".md"]);
      campaignPostCount += files.length;
      for (const f of files) {
        const s = slotFromFile(
          join(dir, f),
          "linkedin",
          "queued",
          `linkedin_studio:campaigns/${cd}/${sub}/${f}`
        );
        if (s) slots.push(s);
      }
    }
    // 2b. blotato_schedule.json + master_schedule.csv — scheduled
    const blotatoSched = readJsonSafe(
      join(campaignsDir, cd, "blotato_schedule.json")
    );
    if (blotatoSched && Array.isArray(blotatoSched.posts)) {
      scheduledManifestCount += blotatoSched.posts.length;
      for (const p of blotatoSched.posts) {
        const ts = p.scheduled_for || p.scheduled_at || p.publish_at;
        if (!ts) continue;
        slots.push({
          date: ts.slice(0, 10),
          channel: "linkedin",
          status: "scheduled",
          title: (p.title || p.text?.slice(0, 60) || `Blotato post`).slice(0, 80),
          excerpt: (p.text || p.content || "").slice(0, 140),
          source: `blotato_schedule:${cd}:${p.id || "unknown"}`,
        });
      }
    }
    // 2c. campaign_state.json — scheduled timeline
    const stateJson = readJsonSafe(
      join(campaignsDir, cd, "campaign_state.json")
    );
    if (stateJson && Array.isArray(stateJson.schedule)) {
      for (const p of stateJson.schedule) {
        const ts = p.publish_date || p.scheduled_for || p.date;
        if (!ts) continue;
        slots.push({
          date: String(ts).slice(0, 10),
          channel: "linkedin",
          status: p.status === "published" ? "published" : "scheduled",
          title: (p.title || p.topic || p.post_id || "Campaign post").slice(0, 80),
          excerpt: (p.excerpt || p.note || "").slice(0, 140),
          source: `campaign_state:${cd}:${p.post_id || "unknown"}`,
        });
      }
    }
  }

  // 3. LinkedIn studio — content/ directory (saved drafts)
  const contentDir = join(LINKEDIN_STUDIO, "content");
  const contentFiles = safeList(contentDir, [".md"]);
  for (const f of contentFiles) {
    const s = slotFromFile(
      join(contentDir, f),
      "linkedin",
      "draft",
      `linkedin_studio:content/${f}`
    );
    if (s) slots.push(s);
  }

  // 4. ai-company proof directory — published LinkedIn content
  const liProofDir = join(AI_COMPANY, "proof", "linkedin", "published");
  const liProofFiles = safeList(liProofDir, [".md", ".json"]);
  for (const f of liProofFiles) {
    const s = slotFromFile(
      join(liProofDir, f),
      "linkedin",
      "published",
      `ai-company:proof/linkedin/published/${f}`
    );
    if (s) slots.push(s);
  }

  // 5. Postiz queued/scheduled if available
  const postizOk = existsSync(POSTIZ_PATH);
  if (postizOk) {
    const queued = run(`${POSTIZ_PATH} queue list --json 2>/dev/null`);
    if (queued && queued.startsWith("[")) {
      try {
        const arr = JSON.parse(queued);
        for (const p of arr) {
          slots.push({
            date: (p.scheduled_for || p.date || "").slice(0, 10) || ymd(now),
            channel: (p.channel || "linkedin") as any,
            status: "scheduled",
            title: (p.title || p.text?.slice(0, 60) || "Scheduled post").slice(0, 80),
            excerpt: (p.text || "").slice(0, 140),
            source: `postiz:${p.id || "queue"}`,
          });
        }
      } catch {}
    }
  }

  // 6. Roll into weeks — current and recent past (last 4 + next 8 = 12 weeks total)
  const weeks: Record<string, Record<string, Slot[]>> = {};
  const nowWeekStart = isoWeekStart(now);
  const totalWeeks = 12;
  const pastWeeks = 4;
  for (let i = -pastWeeks; i < totalWeeks - pastWeeks; i++) {
    const ws = new Date(nowWeekStart);
    ws.setUTCDate(nowWeekStart.getUTCDate() + i * 7);
    const label = `Week of ${ymd(ws)}`;
    weeks[label] = {};
    for (const day of DAYS) {
      weeks[label][day] = [];
    }
  }

  // Place slots into week buckets
  let placedCount = 0;
  for (const s of slots) {
    const d = new Date(s.date + "T00:00:00Z");
    if (isNaN(d.getTime())) continue;
    const ws = isoWeekStart(d);
    const label = `Week of ${ymd(ws)}`;
    if (!weeks[label]) continue;
    const day = dayIndex(d);
    weeks[label][day].push(s);
    placedCount += 1;
  }

  // KPI rollups
  const totals = {
    published: slots.filter((s) => s.status === "published").length,
    scheduled: slots.filter((s) => s.status === "scheduled").length,
    queued: slots.filter((s) => s.status === "queued").length,
    draft: slots.filter((s) => s.status === "draft").length,
    total: slots.length,
    placed: placedCount,
  };

  // Channel split
  const channelSplit: Record<string, number> = {};
  for (const s of slots) {
    channelSplit[s.channel] = (channelSplit[s.channel] || 0) + 1;
  }

  // Coverage gaps — days in current week with zero slots
  const currentLabel = `Week of ${ymd(weekStart)}`;
  const gaps: string[] = [];
  for (const day of DAYS) {
    const list = weeks[currentLabel]?.[day] || [];
    if (list.length === 0) gaps.push(day);
  }

  return NextResponse.json({
    _truth: {
      generated_at: now.toISOString(),
      week_start: ymd(weekStart),
      week_end: ymd(new Date(weekStart.getTime() + 7 * 86400_000)),
      evidence: {
        linkedin_studio: existsSync(LINKEDIN_STUDIO),
        campaigns_scanned: campaignDirs.length,
        ai_company_proof: existsSync(liProofDir),
        postiz_runtime: postizOk,
        ledger_present: !!ledger,
        campaign_post_count: campaignPostCount,
        scheduled_manifest_count: scheduledManifestCount,
        content_drafts_count: contentFiles.length,
        ai_company_published_count: liProofFiles.length,
      },
    },
    weeks,
    totals,
    channelSplit,
    gaps,
    week_start: ymd(weekStart),
    week_end: ymd(new Date(weekStart.getTime() + 7 * 86400_000)),
  });
}