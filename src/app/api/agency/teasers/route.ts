import { NextResponse } from 'next/server';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Path resolution ────────────────────────────────────────────────────────
// The GTM Studio V2 client tree lives at ~/Developer/rig-gtm-studio-v2/clients/
// Allow override via env var for portability.
const GTM_STUDIO_V2 = process.env.GTM_STUDIO_V2_PATH
  ?? join(os.homedir(), 'Developer', 'rig-gtm-studio-v2');
const CLIENTS_DIR = join(GTM_STUDIO_V2, 'clients');

// ─── Types ──────────────────────────────────────────────────────────────────
interface TeaserEntry {
  id: string;
  slug: string;
  firm: string;
  industry: string;
  vertical: string;
  title: string;
  recommendationTitle: string;
  recommendationScore: number;
  recommendationTier: string;
  status: 'sent' | 'drafting';
  sentDate: string | null;
  campaign: string | null;
  recipient: string | null;
  subject: string | null;
  evidenceCount: number;
  optionCount: number;
  estimatedValue: number;
  strategyPath: string;
  generatedAt: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Strategy teasers are stored in two locations:
 *   1. clients/<slug>/strategy.generated.json              (top-level, newer format)
 *   2. clients/<slug>/site-clone-emerge/content/strategy.generated.json  (nested, v1 format)
 * We check both.
 */
function findStrategyJson(slug: string): string | null {
  const topLevel = join(CLIENTS_DIR, slug, 'strategy.generated.json');
  if (existsSync(topLevel)) return topLevel;

  const nested = join(CLIENTS_DIR, slug, 'site-clone-emerge', 'content', 'strategy.generated.json');
  if (existsSync(nested)) return nested;

  return null;
}

/**
 * Extract a display title from the strategy JSON.
 * Handles both formats: top-level (options + synthesis) and nested (recommendation).
 */
function extractTitle(data: any): { title: string; recTitle: string; recScore: number; recTier: string } {
  // Format 2 (nested / site-clone-emerge): recommendation object
  if (data.recommendation) {
    return {
      title: data.recommendation.title ?? data.recommendation.id ?? 'Strategy Teaser',
      recTitle: data.recommendation.title ?? data.recommendation.id ?? '—',
      recScore: typeof data.recommendation.score === 'number' ? data.recommendation.score : 0,
      recTier: data.recommendation.tier ?? '—',
    };
  }

  // Format 1 (top-level): options array + synthesis
  if (data.options && Array.isArray(data.options) && data.options.length > 0) {
    const best = data.options.reduce((a: any, b: any) => (b.score > a.score ? b : a));
    return {
      title: best.title ?? best.id ?? 'Strategy Teaser',
      recTitle: best.title ?? best.id ?? '—',
      recScore: typeof best.score === 'number' ? best.score : 0,
      recTier: '—',
    };
  }

  return { title: 'Strategy Teaser', recTitle: '—', recScore: 0, recTier: '—' };
}

/**
 * Extract the firm name from the strategy JSON.
 */
function extractFirm(data: any, slug: string): string {
  return data.firm ?? data.slug ?? slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Extract the industry / vertical from the strategy JSON.
 */
function extractVertical(data: any): string {
  if (data._sources?.industry) return data._sources.industry;
  if (data.industry) return data.industry;
  // Try to infer from recommendation
  if (data.recommendation?.title) {
    const title = data.recommendation.title.toLowerCase();
    if (title.includes('law') || title.includes('legal')) return 'Law';
    if (title.includes('dental')) return 'Dental';
    if (title.includes('cpa') || title.includes('account') || title.includes('tax')) return 'CPA';
    if (title.includes('manufactur') || title.includes('cnc') || title.includes('machine')) return 'Manufacturing';
    if (title.includes('medical') || title.includes('health') || title.includes('clinic')) return 'Health';
    if (title.includes('construct') || title.includes('build')) return 'Construction';
    if (title.includes('design') || title.includes('agency') || title.includes('creative')) return 'Agency';
    if (title.includes('real') || title.includes('property') || title.includes('realtor')) return 'Real Estate';
    if (title.includes('saas') || title.includes('software') || title.includes('tech')) return 'SaaS';
    if (title.includes('fin') || title.includes('capital') || title.includes('invest')) return 'Finance';
  }
  return 'General';
}

/**
 * Extract estimated value from firmographics or default.
 */
function extractValue(data: any): number {
  if (data.firmographics?.revenue_usd) {
    // Estimate teaser value at ~0.1% of revenue, min $15K, max $120K
    const est = Math.round(data.firmographics.revenue_usd * 0.001);
    return Math.min(120000, Math.max(15000, est));
  }
  if (data.recommendation?.score) {
    // Scale by score: higher score = higher value
    return Math.round(20000 + data.recommendation.score * 50000);
  }
  return 30000; // default
}

/**
 * Load sent manifest data from all proof/outbound JSON files + _send-log.json.
 * Returns a map of slug -> { sentDate, campaign, recipient, subject, status }.
 */
interface SentRecord {
  sentDate: string | null;
  campaign: string | null;
  recipient: string | null;
  subject: string | null;
  status: 'sent' | 'queued';
}

function loadSentManifests(): Map<string, SentRecord> {
  const sentMap = new Map<string, SentRecord>();

  // 1. clients/_send-log.json (primary reconciliation log)
  const sendLogPath = join(CLIENTS_DIR, '_send-log.json');
  if (existsSync(sendLogPath)) {
    try {
      const entries: any[] = JSON.parse(readFileSync(sendLogPath, 'utf8'));
      for (const e of entries) {
        if (e.slug && e.status) {
          sentMap.set(e.slug, {
            sentDate: e.sent ?? e.sent_at_utc?.split('T')[0] ?? null,
            campaign: e.campaign ?? null,
            recipient: e.to ?? null,
            subject: e.subject ?? null,
            status: e.status === 'queued' ? 'queued' : 'sent',
          });
        }
      }
    } catch { /* malformed JSON — skip */ }
  }

  // 2. proof/outbound/warmup-day1-sent.json
  const warmupPath = join(GTM_STUDIO_V2, 'proof', 'outbound', 'warmup-day1-sent.json');
  if (existsSync(warmupPath)) {
    try {
      const entries: any[] = JSON.parse(readFileSync(warmupPath, 'utf8'));
      for (const e of entries) {
        if (e.slug && e.ok && !sentMap.has(e.slug)) {
          sentMap.set(e.slug, {
            sentDate: '2026-06-24',
            campaign: 'lane1-warm',
            recipient: e.email ?? null,
            subject: null,
            status: 'sent',
          });
        }
      }
    } catch { /* skip */ }
  }

  // 3. proof/outbound/followup-one-SENT-20260702.json
  const followupPath = join(GTM_STUDIO_V2, 'proof', 'outbound', 'followup-one-SENT-20260702.json');
  if (existsSync(followupPath)) {
    try {
      const data = JSON.parse(readFileSync(followupPath, 'utf8'));
      for (const r of data.results ?? []) {
        if (r.slug && r.status === 'sent' && !sentMap.has(r.slug)) {
          sentMap.set(r.slug, {
            sentDate: '2026-06-24',
            campaign: data.armed_by?.includes('reply-bait') ? 'replybait' : 'lane2-batch2',
            recipient: null,
            subject: null,
            status: 'sent',
          });
        }
      }
    } catch { /* skip */ }
  }

  // 4. proof/outbound/replybait-canary-SENT-20260702.json
  const replybaitPath = join(GTM_STUDIO_V2, 'proof', 'outbound', 'replybait-canary-SENT-20260702.json');
  if (existsSync(replybaitPath)) {
    try {
      const data = JSON.parse(readFileSync(replybaitPath, 'utf8'));
      for (const r of data.results ?? []) {
        if (r.slug && r.status === 'sent' && !sentMap.has(r.slug)) {
          sentMap.set(r.slug, {
            sentDate: '2026-07-02',
            campaign: 'replybait-canary',
            recipient: null,
            subject: null,
            status: 'sent',
          });
        }
      }
    } catch { /* skip */ }
  }

  return sentMap;
}

// ─── Main handler ───────────────────────────────────────────────────────────
export async function GET() {
  // Check if clients directory exists
  if (!existsSync(CLIENTS_DIR)) {
    return NextResponse.json({
      error: 'GTM Studio V2 clients directory not found',
      path: CLIENTS_DIR,
      total: 0, sent: 0, drafting: 0,
      teasers: [],
    }, { status: 200 }); // 200 so the UI still renders
  }

  // 1. Scan all client directories
  const allSlugs = readdirSync(CLIENTS_DIR)
    .filter(name => !name.startsWith('_') && !name.startsWith('.'))
    .filter(name => {
      try { return statSync(join(CLIENTS_DIR, name)).isDirectory(); } catch { return false; }
    })
    .sort();

  // 2. Filter to only those with strategy.generated.json
  const teasers: TeaserEntry[] = [];
  for (const slug of allSlugs) {
    const strategyPath = findStrategyJson(slug);
    if (!strategyPath) continue;

    try {
      const raw = readFileSync(strategyPath, 'utf8');
      const data = JSON.parse(raw);

      const { title, recTitle, recScore, recTier } = extractTitle(data);
      const firm = extractFirm(data, slug);
      const vertical = extractVertical(data);
      const estimatedValue = extractValue(data);
      const evidenceCount = Array.isArray(data.evidence) ? data.evidence.length : 0;
      const optionCount = Array.isArray(data.options) ? data.options.length : 0;
      const generatedAt = data.generated_at ?? data._generated_by ?? null;

      teasers.push({
        id: `T${(teasers.length + 1).toString().padStart(3, '0')}`,
        slug,
        firm,
        industry: vertical,
        vertical,
        title: recTitle !== '—' ? recTitle : title,
        recommendationTitle: recTitle,
        recommendationScore: recScore,
        recommendationTier: recTier,
        status: 'drafting', // will be updated below
        sentDate: null,
        campaign: null,
        recipient: null,
        subject: null,
        evidenceCount,
        optionCount,
        estimatedValue,
        strategyPath: strategyPath.replace(CLIENTS_DIR + '/', ''),
        generatedAt,
      });
    } catch {
      // Malformed JSON — skip this client
      continue;
    }
  }

  // 3. Load sent manifests and cross-reference
  const sentMap = loadSentManifests();

  let sentCount = 0;
  for (const teaser of teasers) {
    const sentRecord = sentMap.get(teaser.slug);
    if (sentRecord) {
      teaser.status = 'sent';
      teaser.sentDate = sentRecord.sentDate;
      teaser.campaign = sentRecord.campaign;
      teaser.recipient = sentRecord.recipient;
      teaser.subject = sentRecord.subject;
      sentCount++;
    }
  }

  // 4. Sort: sent first (by date desc), then drafting (by firm name)
  teasers.sort((a, b) => {
    if (a.status === 'sent' && b.status !== 'sent') return -1;
    if (a.status !== 'sent' && b.status === 'sent') return 1;
    if (a.status === 'sent' && b.status === 'sent') {
      return (b.sentDate ?? '').localeCompare(a.sentDate ?? '');
    }
    return a.firm.localeCompare(b.firm);
  });

  // 5. Re-number slots
  teasers.forEach((t, i) => {
    t.id = `T${(i + 1).toString().padStart(3, '0')}`;
  });

  // 6. Calculate aggregate stats
  const totalClientDirs = allSlugs.length;
  const totalWithStrategy = teasers.length;
  const totalSent = sentCount;
  const totalDrafting = totalWithStrategy - totalSent;

  // Count unique slugs in sent manifests that may not have strategy files
  const sentSlugsWithoutStrategy: string[] = [];
  for (const [slug] of sentMap) {
    if (!teasers.find(t => t.slug === slug)) {
      sentSlugsWithoutStrategy.push(slug);
    }
  }

  const pipelineValue = teasers
    .filter(t => t.status === 'sent')
    .reduce((sum, t) => sum + t.estimatedValue, 0);

  const avgScore = teasers.length > 0
    ? +(teasers.reduce((s, t) => s + t.recommendationScore, 0) / teasers.length).toFixed(2)
    : 0;

  // Vertical breakdown
  const verticalBreakdown: Record<string, { total: number; sent: number }> = {};
  for (const t of teasers) {
    const v = t.vertical;
    if (!verticalBreakdown[v]) verticalBreakdown[v] = { total: 0, sent: 0 };
    verticalBreakdown[v].total++;
    if (t.status === 'sent') verticalBreakdown[v].sent++;
  }

  // Campaign breakdown
  const campaignBreakdown: Record<string, number> = {};
  for (const t of teasers) {
    if (t.campaign) {
      campaignBreakdown[t.campaign] = (campaignBreakdown[t.campaign] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    // Real data flag
    source: 'GTM Studio V2 — real client directories',
    clientsDir: CLIENTS_DIR,

    // Counts
    totalClientDirs,
    totalWithStrategy,
    total: totalWithStrategy,
    sent: totalSent,
    drafting: totalDrafting,
    replied: 0,       // no reply tracking yet
    meetings: 0,      // no meeting tracking yet

    // Slugs that appear in sent manifests but have no strategy.generated.json
    sentWithoutStrategy: sentSlugsWithoutStrategy,
    sentWithoutStrategyCount: sentSlugsWithoutStrategy.length,

    // Rates
    replyRate: '0%',
    meetingRate: '0%',
    sendRate: totalWithStrategy > 0 ? `${((totalSent / totalWithStrategy) * 100).toFixed(1)}%` : '0%',
    avgAntiGeneric: avgScore > 0 ? Math.round(avgScore * 100) : 0,

    // Value
    pipelineValue,
    estimatedPipelineValue: pipelineValue,

    // Breakdowns
    verticalBreakdown,
    campaignBreakdown,

    // Teasers array
    teasers,
  });
}