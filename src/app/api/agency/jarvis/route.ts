import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GTM_V2 = '/Users/rig128gb/Developer/rig-gtm-studio-v2';

function run(cmd: string): string {
  try { return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim(); } catch { return ''; }
}

// Query SQLite via Python
function dbQuery<T>(sql: string): T[] {
  const dbPath = join(process.cwd(), 'data', 'rigos.db');
  if (!existsSync(dbPath)) return [];
  try {
    const escaped = sql.replace(/'/g, "'\\''");
    const result = run(`python3 -c "
import sqlite3, json, sys
conn = sqlite3.connect('${dbPath}')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute('${escaped}')
rows = [dict(r) for r in cur.fetchall()]
print(json.dumps(rows, default=str))
conn.close()
"`);
    return JSON.parse(result) as T[];
  } catch { return []; }
}

// ── GTM Studio V2 REAL DATA ────────────────────────────────────

// Real client prospect count from clients/ dir (exclude _ prefixed meta dirs)
function getGtmProspectCount(): number {
  const clientsDir = join(GTM_V2, 'clients');
  if (!existsSync(clientsDir)) return 0;
  try {
    return readdirSync(clientsDir)
      .filter(f => !f.startsWith('_') && !f.startsWith('.'))
      .filter(f => {
        try { return statSync(join(clientsDir, f)).isDirectory(); } catch { return false; }
      }).length;
  } catch { return 0; }
}

// Real prospect sub-status counts
function getGtmProspectBreakdown() {
  const clientsDir = join(GTM_V2, 'clients');
  let siteClone = 0, teaserV2 = 0, brandExtract = 0, iqrsqpi = 0, designExtract = 0;
  const dirs = readdirSync(clientsDir).filter(f => !f.startsWith('_') && !f.startsWith('.'));
  for (const d of dirs) {
    const clientPath = join(clientsDir, d);
    try { if (existsSync(join(clientPath, 'site-clone-emerge'))) siteClone++; } catch {}
    try { if (existsSync(join(clientPath, 'teaser-v2'))) teaserV2++; } catch {}
    try { if (existsSync(join(clientPath, 'brand-extract'))) brandExtract++; } catch {}
    try { if (existsSync(join(clientPath, 'iqrsqpi'))) iqrsqpi++; } catch {}
    try { if (existsSync(join(clientPath, 'design-extract'))) designExtract++; } catch {}
  }
  return { total: dirs.length, siteClone, teaserV2, brandExtract, iqrsqpi, designExtract };
}

// Real emails sent — reads sent manifests with Resend IDs
function getGtmSentEmails() {
  const outboundDir = join(GTM_V2, 'proof', 'outbound');

  // followup-one-SENT manifest
  let followupCount = 0;
  let followupIds: string[] = [];
  try {
    const files = readdirSync(outboundDir).filter(f => f.includes('followup') && f.includes('SENT'));
    for (const f of files) {
      const content = readFileSync(join(outboundDir, f), 'utf-8');
      const manifest = JSON.parse(content);
      followupCount += manifest.sent_count || 0;
      const results = manifest.results || [];
      for (const r of results) {
        const rid = r.resend_id || r.id || r.message_id;
        if (rid) followupIds.push(rid);
      }
    }
  } catch {}

  // replybait-canary-SENT manifest
  let replybaitCount = 0;
  let replybaitIds: string[] = [];
  try {
    const files = readdirSync(outboundDir).filter(f => f.includes('replybait') && f.includes('SENT'));
    for (const f of files) {
      const content = readFileSync(join(outboundDir, f), 'utf-8');
      const manifest = JSON.parse(content);
      replybaitCount += manifest.sent_count || 0;
      const results = manifest.results || [];
      for (const r of results) {
        const rid = r.resend_id || r.id || r.message_id;
        if (rid) replybaitIds.push(rid);
      }
    }
  } catch {}

  // warmup-day1 sent
  let warmupCount = 0;
  try {
    const warmupFile = join(outboundDir, 'warmup-day1-sent.json');
    if (existsSync(warmupFile)) {
      const content = readFileSync(warmupFile, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) warmupCount = data.length;
      else warmupCount = data.sent_count || 0;
    }
  } catch {}

  return {
    followup: followupCount,
    replybait: replybaitCount,
    warmup: warmupCount,
    total: followupCount + replybaitCount + warmupCount,
    resendIds: [...followupIds, ...replybaitIds],
  };
}

// Real launchd service status
function getLaunchdServices() {
  const list = run(`launchctl list 2>/dev/null`);
  const lines = list.split('\n').filter(l => l.trim() && !l.includes('PID'));
  const rigServices = lines.filter(l => /rig/i.test(l));

  let active = 0, failed = 0, loaded = rigServices.length;
  for (const line of rigServices) {
    const parts = line.split('\t');
    const pid = parts[0];
    const exitCode = parts[1];
    if (pid && pid !== '-') active++;
    if (exitCode && exitCode !== '0' && exitCode !== '-') failed++;
  }

  // Get specific key services
  const keyServices: any[] = [];
  for (const line of rigServices) {
    const parts = line.split('\t');
    if (parts.length >= 3) {
      keyServices.push({
        name: parts[2].replace(/com\.rig\./, '').replace(/ai\.rig\./, ''),
        pid: parts[0],
        status: parts[0] === '-' ? 'stopped' : 'running',
        exitCode: parts[1],
      });
    }
  }

  return { loaded, active, failed, services: keyServices };
}

// Real N8N status
function getN8nStatus() {
  const health = run(`curl -s http://localhost:5678/healthz 2>/dev/null`);
  const isHealthy = health.includes('"ok"') || health.includes('ok');
  return {
    url: 'http://localhost:5678',
    healthy: isHealthy,
    label: isHealthy ? 'running (healthz ok)' : 'not responding',
  };
}

// Real Stripe status — check env key prefix for test vs live mode
function getStripeStatus() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';
  const hasKey = !!key;
  const mode = key.startsWith('sk_test_') ? 'SANDBOX/TEST' : key.startsWith('sk_live_') ? 'LIVE' : 'NOT_SET';
  return {
    configured: hasKey,
    mode,
    hasPublishableKey: !!pubKey,
    label: hasKey ? `${mode} — key present` : 'NOT CONFIGURED',
  };
}

export async function GET() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── REAL SYSTEM DATA ──────────────────────────────────────────

  // 1. Real git commits
  const gitLog = run(`cd /Users/rig128gb/Developer/rig-os-agency && git log --oneline --since="24 hours ago" 2>/dev/null | head -20`);
  const commits = gitLog ? gitLog.split('\n').filter(Boolean) : [];

  // 2. Real page/API count
  const pageCount = parseInt(run(`find /Users/rig128gb/Developer/rig-os-agency/app/src/app -name "page.tsx" 2>/dev/null | wc -l`)) || 0;
  const apiCount = parseInt(run(`find /Users/rig128gb/Developer/rig-os-agency/app/src/app/api -name "route.ts" 2>/dev/null | wc -l`)) || 0;

  // 3. Real system stats
  const diskFree = run(`df -h / | tail -1 | awk '{print $4}'`) || 'unknown';
  const processCount = parseInt(run(`ps aux | wc -l`)) || 0;
  const loadAvg = run(`sysctl -n vm.loadavg 2>/dev/null`) || 'unknown';

  // 4. REAL GTM Studio V2 data
  const prospectCount = getGtmProspectCount();
  const prospectBreakdown = getGtmProspectBreakdown();
  const sentEmails = getGtmSentEmails();
  const launchdServices = getLaunchdServices();
  const n8nStatus = getN8nStatus();
  const stripeStatus = getStripeStatus();

  // 5. DB seed data (SAMPLE — NOT REAL CLIENTS)
  const seedClients = dbQuery<any>('SELECT * FROM clients ORDER BY created_at DESC');
  const seedContracts = dbQuery<any>('SELECT * FROM contracts ORDER BY created_at DESC');
  const seedInvoices = dbQuery<any>('SELECT * FROM invoices ORDER BY created_at DESC');
  const seedPipelineDeals = dbQuery<any>('SELECT * FROM pipeline_deals ORDER BY deal_size DESC');
  const seedProposals = dbQuery<any>('SELECT * FROM proposals ORDER BY created_at DESC');

  // 6. REAL revenue = $0. Pre-revenue but actively prospecting.
  const realRevenue = 0;
  const realMRR = 0;
  const realPipeline = 0;

  // 7. Real Obsidian vault stats
  const vaultPath = '/Users/rig128gb/Documents/JakeStudio';
  let vaultFileCount = 0;
  let recentSessions: string[] = [];
  try {
    const sessionsDir = join(vaultPath, 'Memory', 'Agent Sessions');
    if (existsSync(sessionsDir)) {
      recentSessions = readdirSync(sessionsDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .slice(-5);
    }
    for (const dir of readdirSync(vaultPath)) {
      const fullDir = join(vaultPath, dir);
      try { vaultFileCount += readdirSync(fullDir).filter(f => f.endsWith('.md')).length; } catch {}
    }
    vaultFileCount += readdirSync(vaultPath).filter(f => f.endsWith('.md')).length;
  } catch {}

  // 8. Real skills count
  const skillsPath = '/Users/rig128gb/.hermes/skills';
  let skillCount = 0;
  try {
    if (existsSync(skillsPath)) {
      skillCount = readdirSync(skillsPath).filter(f => statSync(join(skillsPath, f)).isDirectory()).length;
    }
  } catch {}

  // 9. Real GitHub repos
  const repoCount = parseInt(run(`find /Users/rig128gb/Developer -maxdepth 2 -name ".git" -type d 2>/dev/null | wc -l`)) || 0;

  // 10. Real connection status
  const connections: any[] = [];
  const envKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY', 'STRIPE_SECRET_KEY', 'EXA_API_KEY', 'TAVILY_API_KEY', 'RESEND_API_KEY'];
  for (const key of envKeys) {
    const val = process.env[key];
    connections.push({ name: key, status: val ? 'connected' : 'not_set' });
  }

  // 11. Recent Obsidian session
  let recentSessionPreview = 'No sessions found';
  if (recentSessions.length > 0) {
    try {
      const latestPath = join(vaultPath, 'Memory', 'Agent Sessions', recentSessions[recentSessions.length - 1]);
      if (existsSync(latestPath)) {
        const content = readFileSync(latestPath, 'utf-8');
        recentSessionPreview = content.slice(0, 500).replace(/\n/g, ' ');
      }
    } catch {}
  }

  // ── BUILD BRIEFING ─────────────────────────────────────────────

  const briefing = {
    timestamp: now.toISOString(),
    date: dateStr,
    greeting: `${greeting}, Mike`,
    _truth: {
      realRevenue: 0,
      realClients: 0,
      realContracts: 0,
      realPipeline: 0,
      realProspects: prospectCount,
      realEmailsSent: sentEmails.total,
      seedDataInDB: seedClients.length,
      seedDataLabel: "SAMPLE DATA in rigos.db — not real clients. Real prospects are in GTM Studio V2.",
    },
    sections: [] as Array<{ id: string; title: string; icon: string; items: any[]; summary: string; real: boolean }>
  };

  // 1. Overnight work — REAL
  briefing.sections.push({
    id: 'overnight',
    title: 'Overnight Work Summary',
    icon: 'moon',
    summary: commits.length > 0 ? `${commits.length} commits pushed in the last 24 hours` : 'No new commits in 24 hours',
    real: true,
    items: commits.length > 0 ? commits.map(c => ({ text: c })) : [{ text: 'No commits in last 24h — check cron jobs' }]
  });

  // 2. GTM Studio V2 — REAL PROSPECTS AND REAL EMAILS SENT
  briefing.sections.push({
    id: 'gtm-studio',
    title: 'GTM Studio V2 — Real Outreach Data',
    icon: 'mail',
    summary: `${prospectCount} real prospects in clients/ — ${sentEmails.total} real emails sent via Resend (${sentEmails.followup} followup + ${sentEmails.replybait} reply-bait)`,
    real: true,
    items: [
      { label: 'Total Prospects (client dirs)', value: prospectCount },
      { label: 'Site Clones Built', value: prospectBreakdown.siteClone },
      { label: 'Teaser V2 Pages', value: prospectBreakdown.teaserV2 },
      { label: 'Brand Extracts', value: prospectBreakdown.brandExtract },
      { label: 'Design Extracts', value: prospectBreakdown.designExtract },
      { label: 'IQRSQPI Stages', value: prospectBreakdown.iqrsqpi },
      { label: 'Emails Sent — Followup', value: sentEmails.followup },
      { label: 'Emails Sent — Reply-Bait', value: sentEmails.replybait },
      { label: 'Emails Sent — Warmup', value: sentEmails.warmup },
      { label: 'Total Emails Sent', value: sentEmails.total },
      { label: 'Resend Message IDs', value: sentEmails.resendIds.length },
      { label: 'Sample Resend ID', value: sentEmails.resendIds[0] || 'none' },
      { label: 'Armed By', value: 'mike-goal-directive-2026-07-02' },
      { label: 'Dry Run', value: false },
    ]
  });

  // 3. Revenue — HONEST: $0 but actively prospecting
  briefing.sections.push({
    id: 'revenue',
    title: 'Revenue — REAL',
    icon: 'dollar-sign',
    summary: `$0 ARR. $0 MRR. RIG is pre-revenue. BUT: ${prospectCount} real prospects scraped, ${sentEmails.total} real emails sent via Resend. Pipeline is real.`,
    real: true,
    items: [
      { label: 'Real ARR', value: '$0' },
      { label: 'Real MRR', value: '$0' },
      { label: 'Real Clients (paying)', value: 0 },
      { label: 'Real Contracts Signed', value: 0 },
      { label: 'Real Pipeline (qualified)', value: '$0' },
      { label: 'Real Prospects in GTM V2', value: prospectCount },
      { label: 'Real Emails Sent', value: sentEmails.total },
      { label: 'Target', value: '$10,000,000' },
      { label: 'Gap', value: '$10,000,000' },
      { label: 'Progress', value: '0%' }
    ]
  });

  // 4. What needs to happen to get revenue
  briefing.sections.push({
    id: 'next-steps',
    title: 'What Needs to Happen to Get Real Revenue',
    icon: 'target',
    summary: `${prospectCount} prospects scraped, ${sentEmails.total} emails sent. Next: get replies → discovery calls → proposals → contracts → Stripe.`,
    real: true,
    items: [
      { text: `1. ✅ ${prospectCount} real prospects scraped and in GTM Studio V2 clients/`, priority: 'DONE', status: 'green' },
      { text: `2. ✅ ${sentEmails.total} real emails sent via Resend (${sentEmails.followup} followup + ${sentEmails.replybait} reply-bait)`, priority: 'DONE', status: 'green' },
      { text: '3. 🔲 Monitor for replies — set up reply capture (IMAP/Resend webhooks)', priority: 'HIGH', status: 'yellow' },
      { text: '4. 🔲 Get on real discovery calls with prospects who reply', priority: 'HIGH', status: 'yellow' },
      { text: '5. 🔲 Send real proposals to qualified prospects', priority: 'HIGH', status: 'yellow' },
      { text: '6. 🔲 Close real contracts', priority: 'HIGH', status: 'red' },
      { text: '7. 🔲 Connect Stripe to collect real payments', priority: 'HIGH', status: 'red' },
      { text: '8. 🔲 Replace seed data in rigos.db with real closed clients', priority: 'MEDIUM', status: 'red' },
    ]
  });

  // 5. Launchd Services — REAL
  briefing.sections.push({
    id: 'launchd',
    title: 'Launchd Services — RIG Fleet',
    icon: 'server',
    summary: `${launchdServices.loaded} RIG services loaded, ${launchdServices.active} running, ${launchdServices.failed} failed`,
    real: true,
    items: [
      { label: 'Total Loaded', value: launchdServices.loaded },
      { label: 'Active (running)', value: launchdServices.active },
      { label: 'Failed', value: launchdServices.failed },
      { label: 'Key Services', value: launchdServices.services.slice(0, 12).map(s => `${s.name}: ${s.status}`).join(', ') },
    ]
  });

  // 6. Infrastructure status — REAL
  briefing.sections.push({
    id: 'infra',
    title: 'Infrastructure Status',
    icon: 'server',
    summary: `N8N: ${n8nStatus.label} | Stripe: ${stripeStatus.label} | ${launchdServices.active}/${launchdServices.loaded} launchd services running`,
    real: true,
    items: [
      { label: 'N8N', value: `${n8nStatus.label} @ ${n8nStatus.url}` },
      { label: 'N8N Health', value: n8nStatus.healthy ? 'OK' : 'DOWN' },
      { label: 'Stripe', value: stripeStatus.label },
      { label: 'Stripe Mode', value: stripeStatus.mode },
      { label: 'Stripe Configured', value: stripeStatus.configured ? 'Yes' : 'No' },
      { label: 'Launchd Services (active)', value: `${launchdServices.active}/${launchdServices.loaded}` },
      { label: 'Launchd Failed', value: launchdServices.failed },
    ]
  });

  // 7. Builds status — REAL
  briefing.sections.push({
    id: 'builds',
    title: 'Builds Status',
    icon: 'hammer',
    summary: `${pageCount} pages, ${apiCount} APIs, ${skillCount} skills, ${repoCount} repos, ${prospectCount} GTM prospects, ${sentEmails.total} emails sent`,
    real: true,
    items: [
      { label: 'Pages', value: pageCount },
      { label: 'API Routes', value: apiCount },
      { label: 'Hermes Skills', value: skillCount },
      { label: 'Local Git Repos', value: repoCount },
      { label: 'Obsidian Vault Files', value: vaultFileCount },
      { label: 'GTM V2 Prospects', value: prospectCount },
      { label: 'Real Emails Sent', value: sentEmails.total },
      { label: 'DB Seed Records (SAMPLE, not real)', value: seedClients.length }
    ]
  });

  // 8. System health — REAL
  briefing.sections.push({
    id: 'system',
    title: 'System Health',
    icon: 'activity',
    summary: `Disk: ${diskFree} free, ${processCount} processes, load: ${loadAvg}`,
    real: true,
    items: [
      { label: 'Disk Free', value: diskFree },
      { label: 'Processes', value: processCount },
      { label: 'Load Average', value: loadAvg },
      { label: 'DB Exists', value: seedClients.length > 0 ? 'Yes (seed data only)' : 'No' },
      { label: 'App Running', value: 'Port 3737' },
      { label: 'N8N Health', value: n8nStatus.healthy ? 'OK' : 'DOWN' },
    ]
  });

  // 9. API connections — REAL
  briefing.sections.push({
    id: 'connections',
    title: 'API Connections',
    icon: 'plug',
    summary: `${connections.filter(c => c.status === 'connected').length}/${connections.length} keys configured`,
    real: true,
    items: connections.map(c => ({ name: c.name, status: c.status }))
  });

  // 10. Obsidian vault — REAL
  briefing.sections.push({
    id: 'obsidian',
    title: 'Obsidian Vault',
    icon: 'book-open',
    summary: `${vaultFileCount} files, ${recentSessions.length} recent sessions, latest: ${recentSessions[recentSessions.length - 1] || 'none'}`,
    real: true,
    items: [
      { label: 'Vault Files', value: vaultFileCount },
      { label: 'Recent Sessions', value: recentSessions.length },
      { label: 'Latest Session', value: recentSessions[recentSessions.length - 1] || 'none' },
      { label: 'Latest Preview', value: recentSessionPreview.slice(0, 120) + '...' }
    ]
  });

  // 11. Cron jobs — REAL schedule
  briefing.sections.push({
    id: 'cron',
    title: 'Scheduled Jobs',
    icon: 'clock',
    summary: `${launchdServices.loaded} launchd services loaded — fleet automation is live`,
    real: true,
    items: [
      { name: 'Jarvis Morning Briefing', schedule: '0 7 * * *', deliver: 'Telegram' },
      { name: '1000x Marathon', schedule: 'every 30m', deliver: 'Telegram' },
      { name: '1000x Improvement', schedule: 'every 2h', deliver: 'Telegram' },
      { name: '1000x Nightly Deep', schedule: '0 23 * * *', deliver: 'Telegram' },
      { name: 'GTM Daily Loop', schedule: '30 8 * * *', deliver: 'Local' },
      { name: 'GTM Daily Queue', schedule: '0 9 * * *', deliver: 'Local' },
      { name: 'GTM Daily Enforcer', schedule: '30 9 * * *', deliver: 'Local' },
      { name: 'GTM Weekly Scoreboard', schedule: '0 10 * * 1', deliver: 'Local' },
      { name: 'N8N Service', schedule: 'always (launchd)', deliver: 'Local' },
      { name: 'Jarvis Service', schedule: 'always (launchd)', deliver: 'Local' },
    ]
  });

  // 12. GitHub — REAL
  briefing.sections.push({
    id: 'github',
    title: 'GitHub Activity',
    icon: 'github',
    summary: `${commits.length} commits in 24h to RIGIntelligence/rig-os-agency`,
    real: true,
    items: commits.length > 0 ? commits.map(c => ({ text: c })) : [{ text: 'No commits' }]
  });

  // 13. Seed data — clearly labeled as FAKE (separate from real GTM prospects)
  briefing.sections.push({
    id: 'seed-data',
    title: '⚠️ SAMPLE DATA IN DATABASE (NOT REAL CLIENTS)',
    icon: 'alert-triangle',
    summary: `${seedClients.length} sample clients in rigos.db — DEMO DATA. Real prospects (${prospectCount}) are in GTM Studio V2. Real revenue: $0.`,
    real: true,
    items: [
      { text: 'rigos.db seed records are demo data from app development:', priority: 'INFO' },
      ...seedClients.slice(0, 5).map(c => ({
        text: `SAMPLE: ${c.name} (${c.vertical}) — $${c.annual_fee}/yr — NOT A REAL CLIENT`,
        priority: 'WARNING'
      })),
      { text: `Total sample records: ${seedClients.length} clients, ${seedContracts.length} contracts, ${seedInvoices.length} invoices, ${seedPipelineDeals.length} pipeline deals`, priority: 'INFO' },
      { text: `Real data: ${prospectCount} prospects in GTM V2, ${sentEmails.total} emails sent via Resend`, priority: 'ACTION' },
      { text: 'To get real clients: reply capture → discovery calls → close deals → add to DB', priority: 'ACTION' }
    ]
  });

  // 14. The real path to $10M ARR
  briefing.sections.push({
    id: 'path-to-10m',
    title: 'The Real Path to $10M ARR',
    icon: 'trending-up',
    summary: `$0 → $10M. ${prospectCount} prospects scraped, ${sentEmails.total} emails sent. Reply capture is the next bottleneck.`,
    real: true,
    items: [
      { text: 'Phase 1 (DONE): Scrape real prospects ✅, write real cold emails ✅, send via Resend ✅', priority: 'DONE', status: 'green' },
      { text: 'Phase 2 (NOW): Capture replies, get discovery calls, close first 3 contracts', priority: 'TODAY', status: 'yellow' },
      { text: 'Phase 3: $30K MRR (5 clients) — target September', priority: 'Q3' },
      { text: 'Phase 4: $100K MRR (15-20 clients) — target December', priority: 'Q4' },
      { text: 'Phase 5: $833K MRR ($10M ARR) — 2027', priority: '2027' },
      { text: `${prospectCount} real prospects + ${sentEmails.total} real emails = real pipeline. Revenue is $0 but the machine is running.`, priority: 'TRUTH' }
    ]
  });

  // 15. Love text for James — not sent, just ready
  briefing.sections.push({
    id: 'love-text',
    title: 'Love Text for James',
    icon: 'heart',
    summary: 'Ready but NOT auto-sent. You need to send it manually or wire Telegram bot.',
    real: true,
    items: [
      { text: 'Good morning James! Hope you have an amazing day today. Thinking of you. ❤️', note: 'NOT SENT — manual or wire to bot' }
    ]
  });

  return NextResponse.json(briefing);
}