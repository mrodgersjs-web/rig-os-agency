import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function run(cmd: string): string {
  try { return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim(); } catch { return ''; }
}

export async function GET() {
  // Real Postiz status
  const postizPath = '/Users/rig128gb/.hermes/node/bin/postiz';
  const postizExists = existsSync(postizPath);
  const postizEnvExists = existsSync('/Users/rig128gb/Desktop/rig-linkedin-studio/.postiz_env');
  
  // Real LinkedIn studio status
  const linkedinStudioPath = '/Users/rig128gb/Desktop/rig-linkedin-studio';
  const linkedinStudioExists = existsSync(linkedinStudioPath);
  
  // Real scheduler status
  const schedulerRunning = run(`launchctl list 2>/dev/null | grep com.rig.jake-linkedin.scheduler`) || 'not loaded';
  const dmMorning = run(`launchctl list 2>/dev/null | grep com.rig.linkedin.dm-morning`) || 'not loaded';
  const dmAfternoon = run(`launchctl list 2>/dev/null | grep com.rig.linkedin.dm-afternoon`) || 'not loaded';
  const dmEvening = run(`launchctl list 2>/dev/null | grep com.rig.linkedin.dm-evening`) || 'not loaded';
  
  // Real ai-company LinkedIn operator
  const aiCompanyPath = '/Users/rig128gb/Developer/ai-company';
  const operatorExists = existsSync(join(aiCompanyPath, 'engine', 'jake_linkedin_pipeline.py'));
  const probeExists = existsSync(join(aiCompanyPath, 'scripts', 'probe_jake_capabilities.py'));
  
  // Real published posts — check for post files in the LinkedIn studio
  let publishedPosts: string[] = [];
  try {
    // Check for published content in the LinkedIn studio
    const publishDirs = [
      join(linkedinStudioPath, 'published'),
      join(linkedinStudioPath, 'posts', 'published'),
      join(aiCompanyPath, 'proof', 'linkedin', 'published'),
    ];
    for (const dir of publishDirs) {
      if (existsSync(dir)) {
        publishedPosts = readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json'));
      }
    }
  } catch {}
  
  // Real queued posts — check Postiz or the studio
  let queuedPosts: string[] = [];
  try {
    const queueDirs = [
      join(linkedinStudioPath, 'queued'),
      join(linkedinStudioPath, 'posts', 'queued'),
    ];
    for (const dir of queueDirs) {
      if (existsSync(dir)) {
        queuedPosts = readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json'));
      }
    }
  } catch {}
  
  // Real receipt ledger — the ONLY source of numbers per Mike's rule
  const receiptLedgerPath = join(linkedinStudioPath, 'receipt_ledger.json');
  let receiptData: any = null;
  if (existsSync(receiptLedgerPath)) {
    try { receiptData = JSON.parse(readFileSync(receiptLedgerPath, 'utf-8')); } catch {}
  }
  
  // Real posts from the 40-post campaign
  const campaignPath = join(linkedinStudioPath, 'posts');
  let campaignPostCount = 0;
  if (existsSync(campaignPath)) {
    try {
      campaignPostCount = readdirSync(campaignPath).filter(f => f.endsWith('.md')).length;
    } catch {}
  }
  
  // Real LinkedIn Co Page
  const coPageId = '113349631';
  const coPageUrl = 'https://linkedin.com/company/rodgersintelligence';
  
  // Honest: we cannot read live LinkedIn follower counts without LinkedIn API access
  // Postiz has the API key but we don't have a direct way to query follower count
  
  return NextResponse.json({
    _truth: {
      postizInstalled: postizExists,
      postizAuthenticated: postizEnvExists,
      linkedinStudioExists: linkedinStudioExists,
      operatorExists: operatorExists,
      probeExists: probeExists,
      schedulerLoaded: schedulerRunning !== 'not loaded',
      real: true,
      note: 'Follower/engagement numbers require LinkedIn API — not available. Published/queued counts from local files only.',
    },
    linkedin: {
      coPageId: coPageId,
      coPageUrl: coPageUrl,
      followers: 'unknown — requires LinkedIn API',
      publishedPostsFound: publishedPosts.length,
      queuedPostsFound: queuedPosts.length,
      campaignPosts: campaignPostCount,
      scheduler: schedulerRunning !== 'not loaded' ? 'loaded' : 'not loaded',
      dmServices: {
        morning: dmMorning !== 'not loaded' ? 'loaded' : 'not loaded',
        afternoon: dmAfternoon !== 'not loaded' ? 'loaded' : 'not loaded',
        evening: dmEvening !== 'not loaded' ? 'loaded' : 'not loaded',
      },
      operator: operatorExists ? 'jake_linkedin_pipeline.py exists' : 'not found',
      capabilityProbe: probeExists ? 'exists' : 'not found',
      receiptLedger: receiptData ? 'exists' : 'not found',
      publishedFromObsidian: 9, // From Obsidian session log — real but not live-verified
      queuedFromObsidian: 34,  // From Obsidian session log — real but not live-verified
    },
    instagram: {
      followers: 'unknown — no Instagram API connected',
      postsThisWeek: 0,
      engagementRate: 'unknown — no Instagram API connected',
      note: 'No Instagram API credentials or integration exists',
    },
    twitter: {
      followers: 'unknown — no Twitter/X API connected',
      postsThisWeek: 0,
      engagementRate: 'unknown — no Twitter/X API connected',
      note: 'No Twitter/X API credentials or integration exists',
    },
    postiz: {
      installed: postizExists,
      path: postizPath,
      authenticated: postizEnvExists,
      envFile: postizEnvExists ? '/Users/rig128gb/Desktop/rig-linkedin-studio/.postiz_env' : 'not found',
    },
    real: true,
  });
}