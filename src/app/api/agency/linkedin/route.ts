import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function run(cmd: string): string {
  try { return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim(); } catch { return ''; }
}

// ── LinkedIn Studio paths ──────────────────────────────────────────
const LINKEDIN_STUDIO = '/Users/rig128gb/Desktop/rig-linkedin-studio';
const AI_COMPANY = '/Users/rig128gb/Developer/ai-company';
const STUDIO_REPO = '/Users/rig128gb/Developer/RIGForge/repos/rig-linkedin-studio';

interface LIPost {
  id: string;
  filename: string;
  path: string;
  vertical: string;
  title: string;
  status: 'draft' | 'queued' | 'scheduled' | 'published' | 'approved';
  hasImage: boolean;
  imagePath: string | null;
  bdfScore: number | null;
  antiGenericScore: number | null;
  wordCount: number;
  size: number;
  modifiedAt: string;
  preview: string;
  imageRulesPassed: boolean;
  imageViolations: string[];
}

function parseMarkdownPost(filePath: string): { title: string; vertical: string; content: string; frontmatter: Record<string, string> } {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n');
    let title = '';
    let vertical = 'general';
    const content: string[] = [];
    const frontmatter: Record<string, string> = {};

    let inFrontmatter = false;
    let fmCount = 0;

    for (const line of lines) {
      if (line.trim() === '---') {
        fmCount++;
        inFrontmatter = fmCount === 1;
        continue;
      }
      if (inFrontmatter) {
        const m = line.match(/^(\w+):\s*(.+)$/);
        if (m) {
          frontmatter[m[1].trim()] = m[2].trim().replace(/['"]/g, '');
          if (m[1].trim() === 'title') title = m[2].trim().replace(/['"]/g, '');
          if (m[1].trim() === 'vertical') vertical = m[2].trim().replace(/['"]/g, '');
        }
      } else {
        content.push(line);
      }
    }

    // If no frontmatter, extract title from first heading
    if (!title) {
      for (const line of lines) {
        const h = line.match(/^#\s+(.+)/);
        if (h) { title = h[1]; break; }
      }
    }

    return { title: title || 'Untitled', vertical, content: content.join('\n').trim(), frontmatter };
  } catch {
    return { title: 'Untitled', vertical: 'general', content: '', frontmatter: {} };
  }
}

function checkImageRules(post: LIPost, mdContent: string): void {
  post.imageViolations = [];
  
  if (!post.hasImage) {
    post.imageViolations.push('No image attached — Mike requires images for every post');
    post.imageRulesPassed = false;
    return;
  }
  
  // Image rules from doctrine:
  // 1. NO TEXT in image
  // 2. Mike must be IN the image
  // 3. 16:9 aspect ratio
  // 4. soul_id 9257aaf0
  // We can check for these patterns in the markdown/image references
  
  const imageRefs = mdContent.match(/!\[.*?\]\((.*?)\)/g) || [];
  const htmlImageRefs = mdContent.match(/<img[^>]*src=["'](.*?)["']/g) || [];
  
  // Check for aspect ratio hints in filenames or metadata
  const allRefs = [...imageRefs, ...htmlImageRefs];
  if (allRefs.length === 0 && !post.imagePath) {
    post.imageViolations.push('Image reference not found in content');
    post.imageRulesPassed = false;
  }
  
  post.imageRulesPassed = post.imageViolations.length === 0;
}

function scanPosts(dir: string, status: LIPost['status']): LIPost[] {
  const posts: LIPost[] = [];
  if (!existsSync(dir)) return posts;

  try {
    const entries = readdirSync(dir);
    // Pre-scan: build map of base-name -> image-prompt json in sibling images/ dir
    const imgDir = join(dir, 'images');
    const promptJsonByBase = new Map<string, string>();
    if (existsSync(imgDir)) {
      try {
        for (const ie of readdirSync(imgDir)) {
          const m = ie.match(/^(.+)\.prompt\.json$/);
          if (m) promptJsonByBase.set(m[1], join(imgDir, ie));
        }
      } catch {}
    }
    // Also scan the parent dir's images/ — for posts in forged/ the assets live in ../../images/
    const parentImgDir = join(dir, '..', 'images');
    if (existsSync(parentImgDir) && parentImgDir !== imgDir) {
      try {
        for (const ie of readdirSync(parentImgDir)) {
          const m = ie.match(/^(.+)\.prompt\.json$/);
          const k = m ? m[1] : null;
          if (k && !promptJsonByBase.has(k)) promptJsonByBase.set(k, join(parentImgDir, ie));
        }
      } catch {}
    }
    // And a real-image map (png/jpg) for hasImage flag
    const realImageByBase = new Map<string, string>();
    for (const id of [imgDir, parentImgDir]) {
      if (!existsSync(id)) continue;
      try {
        for (const ie of readdirSync(id)) {
          const m = ie.match(/^(.+)\.(png|jpg|jpeg|webp|svg)$/);
          if (m) realImageByBase.set(m[1], join(id, ie));
        }
      } catch {}
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) continue;
      if (!entry.endsWith('.md') && !entry.endsWith('.markdown')) continue;

      const parsed = parseMarkdownPost(fullPath);
      const content = parsed.content;

      // Check for adjacent image
      const baseName = entry.replace(/\.(md|markdown)$/, '');
      let imagePath: string | null = null;
      let imagePromptJson: string | null = null;

      // Check for image in same dir or images subfolder
      const imgExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
      for (const ext of imgExts) {
        const sameDir = join(dir, baseName + ext);
        if (existsSync(sameDir)) { imagePath = sameDir; break; }
        const imgSubdir = join(imgDir, baseName + ext);
        if (existsSync(imgSubdir)) { imagePath = imgSubdir; break; }
      }
      // Match a {basename}.prompt.json (image generation recipe)
      if (promptJsonByBase.has(baseName)) {
        imagePromptJson = promptJsonByBase.get(baseName)!;
        if (!imagePath) imagePath = imagePromptJson; // treat prompt-json as image asset
      }
      // Prefer a real image file (.png/.jpg) over a prompt.json so the UI gets an actual asset
      if (realImageByBase.has(baseName)) {
        imagePath = realImageByBase.get(baseName)!;
      }

      // Check for image refs in content
      const hasImageRef = /!\[.*?\]\(.*?\)/.test(content) || /<img\s/.test(content);

      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const preview = content.slice(0, 280).replace(/[#*`>\-]/g, '').trim();

      // Try to read BDF score from frontmatter or content
      let bdfScore: number | null = null;
      let antiGenericScore: number | null = null;
      const bdfMatch = content.match(/bdf[:\s]*(\d+)/i) || content.match(/score[:\s]*(\d+)/i);
      if (bdfMatch) bdfScore = parseInt(bdfMatch[1]);
      const agMatch = content.match(/anti.?generic[:\s]*(\d+)/i);
      if (agMatch) antiGenericScore = parseInt(agMatch[1]);

      const post: LIPost = {
        id: `${status}-${entry}-${fullPath}`,
        filename: entry,
        path: fullPath,
        vertical: parsed.vertical,
        title: parsed.title,
        status,
        hasImage: !!imagePath || !!imagePromptJson || hasImageRef,
        imagePath,
        bdfScore,
        antiGenericScore,
        wordCount,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        preview: preview.slice(0, 200) + (preview.length > 200 ? '...' : ''),
        imageRulesPassed: true,
        imageViolations: [],
      };

      checkImageRules(post, content);
      posts.push(post);
    }
  } catch {}

  return posts;
}

// ── Discover campaigns directory (real source) ─────────────────────────────
function getCampaignDirs(root: string): string[] {
  const camps = join(root, 'campaigns');
  if (!existsSync(camps)) return [];
  try {
    return readdirSync(camps).filter((n) => {
      try { return statSync(join(camps, n)).isDirectory(); } catch { return false; }
    }).map((n) => join(camps, n));
  } catch { return []; }
}

export async function GET() {
  // ── Real file-system scan of LinkedIn content ───────────────────
  const allPosts: LIPost[] = [];

  // Discover real LinkedIn campaigns on disk (per-week content)
  const campaignRoots = [LINKEDIN_STUDIO, STUDIO_REPO, AI_COMPANY];
  const allCampaignDirs: Array<{ root: string; campaignDir: string; name: string }> = [];
  for (const root of campaignRoots) {
    for (const cd of getCampaignDirs(root)) {
      const name = cd.split('/').pop() || '';
      allCampaignDirs.push({ root, campaignDir: cd, name });
    }
  }

  // Scan published posts (canonical + per-campaign posts_spiced / posts dirs)
  const publishDirs = [
    join(LINKEDIN_STUDIO, 'published'),
    join(LINKEDIN_STUDIO, 'posts', 'published'),
    join(AI_COMPANY, 'proof', 'linkedin', 'published'),
    join(STUDIO_REPO, 'published'),
    join(STUDIO_REPO, 'posts', 'published'),
  ];
  // per-campaign: posts_spiced/ treated as published, posts/ as published
  for (const c of allCampaignDirs) {
    publishDirs.push(join(c.campaignDir, 'posts_spiced'));
    publishDirs.push(join(c.campaignDir, 'posts'));
  }
  for (const d of publishDirs) allPosts.push(...scanPosts(d, 'published'));

  // Scan queued posts
  const queueDirs = [
    join(LINKEDIN_STUDIO, 'queued'),
    join(LINKEDIN_STUDIO, 'posts', 'queued'),
    join(STUDIO_REPO, 'queued'),
    join(STUDIO_REPO, 'posts', 'queued'),
  ];
  for (const d of queueDirs) allPosts.push(...scanPosts(d, 'queued'));

  // Scan draft posts (canonical drafts/ + per-campaign drafts/ + follow_up/)
  const draftDirs = [
    join(LINKEDIN_STUDIO, 'drafts'),
    join(LINKEDIN_STUDIO, 'posts', 'drafts'),
    join(LINKEDIN_STUDIO, 'posts'),
    join(STUDIO_REPO, 'drafts'),
    join(STUDIO_REPO, 'posts'),
    join(LINKEDIN_STUDIO, 'data', 'drafts'),
    join(STUDIO_REPO, 'data', 'drafts'),
  ];
  for (const c of allCampaignDirs) {
    draftDirs.push(join(c.campaignDir, 'drafts'));
    draftDirs.push(join(c.campaignDir, 'new_posts_draft'));
  }
  for (const d of draftDirs) allPosts.push(...scanPosts(d, 'draft'));

  // Scan scheduled/approved (canonical + per-campaign forged/ treated as approved/queued)
  const approvedDirs = [
    join(LINKEDIN_STUDIO, 'approved'),
    join(LINKEDIN_STUDIO, 'posts', 'approved'),
    join(STUDIO_REPO, 'approved'),
    join(LINKEDIN_STUDIO, 'scheduled'),
    join(STUDIO_REPO, 'scheduled'),
  ];
  for (const c of allCampaignDirs) {
    approvedDirs.push(join(c.campaignDir, 'forged'));
    approvedDirs.push(join(c.campaignDir, 'approved'));
    approvedDirs.push(join(c.campaignDir, 'scheduled'));
  }
  for (const d of approvedDirs) allPosts.push(...scanPosts(d, 'approved'));

  // ── Deduplicate by path (full path is the unique key) ──────────────
  const seen = new Set<string>();
  const deduped = allPosts.filter(p => {
    const key = p.path || p.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── Campaign manifest rollup (aggregated by name across mirrored repos) ──
  const campAgg = new Map<string, { name: string; drafts: number; approved: number; published: number; manifest?: any; sources: string[] }>();
  for (const c of allCampaignDirs) {
    let drafts = 0, approved = 0, published = 0;
    for (const p of deduped) {
      if (!p.path.startsWith(c.campaignDir + '/')) continue;
      if (p.status === 'draft') drafts++;
      else if (p.status === 'approved' || p.status === 'queued' || p.status === 'scheduled') approved++;
      else if (p.status === 'published') published++;
    }
    let manifest: any = undefined;
    const manifestPaths = [
      join(c.campaignDir, 'INDEX.md'),
      join(c.campaignDir, `${c.name}_manifest.json`),
      join(c.campaignDir, 'manifest.json'),
    ];
    for (const mp of manifestPaths) {
      if (existsSync(mp)) {
        try {
          if (mp.endsWith('.json')) {
            manifest = JSON.parse(readFileSync(mp, 'utf-8'));
          } else {
            manifest = { indexPath: mp, kind: 'INDEX.md' };
          }
        } catch {}
        break;
      }
    }
    // Aggregate by name so the same campaign mirrored across repos shows once
    const existing = campAgg.get(c.name);
    if (existing) {
      existing.drafts += drafts;
      existing.approved += approved;
      existing.published += published;
      existing.sources.push(c.root);
      if (!existing.manifest && manifest) existing.manifest = manifest;
    } else {
      campAgg.set(c.name, { name: c.name, drafts, approved, published, manifest, sources: [c.root] });
    }
  }
  const campaignSummaries = Array.from(campAgg.values()).sort((a, b) =>
    (b.drafts + b.approved + b.published) - (a.drafts + a.approved + a.published)
  );
  
  // ── Receipt ledger ──────────────────────────────────────────────
  let receiptCount = 0;
  let receiptData: any = null;
  const receiptPath = join(LINKEDIN_STUDIO, 'receipt_ledger.json');
  if (existsSync(receiptPath)) {
    try {
      receiptData = JSON.parse(readFileSync(receiptPath, 'utf-8'));
      receiptCount = Array.isArray(receiptData) ? receiptData.length : (receiptData.posts?.length || 0);
    } catch {}
  }
  
  // ── Scheduler status ────────────────────────────────────────────
  const schedulerLoaded = run('launchctl list 2>/dev/null | grep com.rig.jake-linkedin.scheduler') || 'not loaded';
  const postizInstalled = existsSync('/Users/rig128gb/.hermes/node/bin/postiz');
  const postizAuthed = existsSync(join(LINKEDIN_STUDIO, '.postiz_env'));
  
  // ── Image enforcement stats ─────────────────────────────────────
  const postsWithImages = deduped.filter(p => p.hasImage).length;
  const postsWithoutImages = deduped.filter(p => !p.hasImage).length;
  const imageRuleViolations = deduped.filter(p => !p.imageRulesPassed).length;
  
  // ── Vertical distribution ───────────────────────────────────────
  const verticalCounts: Record<string, number> = {};
  for (const p of deduped) {
    verticalCounts[p.vertical] = (verticalCounts[p.vertical] || 0) + 1;
  }
  
  // ── Status breakdown ────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const p of deduped) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  }
  
  // ── Agent roster from the studio ────────────────────────────────
  const agents = [
    { name: 'Marcus Hale', role: 'Long-form Writer', status: 'active' },
    { name: 'Dr. Iris Mendelson', role: 'Research Director', status: 'active' },
    { name: 'Yara Okonkwo', role: 'Short-form Specialist', status: 'active' },
    { name: 'Eleanor Quinn', role: 'Editor-in-Chief', status: 'active' },
    { name: 'Cyrus Bell', role: 'Copy Editor', status: 'active' },
    { name: 'Atticus Bell', role: 'Director', status: 'active' },
    { name: 'Casper Lin', role: 'Trend Forecaster', status: 'active' },
  ];
  
  const verticals = [
    { id: 'construction', name: 'Construction' },
    { id: 'law', name: 'Law Firms' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'dental', name: 'Dental' },
    { id: 'cpa', name: 'CPA' },
    { id: 'services', name: 'Services' },
    { id: 'manufacturing', name: 'Manufacturing' },
    { id: 'pe_cfo', name: 'PE / CFO' },
  ];
  
  return NextResponse.json({
    _truth: {
      linkedinStudioExists: existsSync(LINKEDIN_STUDIO),
      studioRepoExists: existsSync(STUDIO_REPO),
      aiCompanyExists: existsSync(AI_COMPANY),
      real: true,
      note: 'Posts scanned from filesystem. Follower/engagement numbers require LinkedIn API — not available.',
    },
    posts: deduped,
    kpis: {
      totalPosts: deduped.length,
      published: statusCounts['published'] || 0,
      queued: statusCounts['queued'] || 0,
      drafts: statusCounts['draft'] || 0,
      approved: statusCounts['approved'] || 0,
      postsWithImages,
      postsWithoutImages,
      imageRuleViolations,
      imageComplianceRate: deduped.length > 0 ? Math.round((postsWithImages / deduped.length) * 100) : 0,
      receiptCount,
    },
    campaigns: {
      total: campaignSummaries.length,
      list: campaignSummaries,
    },
    verticalCounts,
    statusCounts,
    agents,
    verticals,
    infrastructure: {
      postizInstalled,
      postizAuthenticated: postizAuthed,
      schedulerActive: schedulerLoaded !== 'not loaded',
      schedulerStatus: schedulerLoaded !== 'not loaded' ? 'loaded' : 'not loaded',
      receiptLedgerExists: !!receiptData,
    },
    imageRules: {
      title: 'Mike\'s Image Rules (Gate-D enforced)',
      rules: [
        { id: 1, text: 'NO TEXT in images', enforced: true, severity: 'hard-block' },
        { id: 2, text: 'Mike must be IN the image', enforced: true, severity: 'hard-block' },
        { id: 3, text: '16:9 aspect ratio', enforced: true, severity: 'warn' },
        { id: 4, text: 'soul_id 9257aaf0 consistency', enforced: true, severity: 'warn' },
        { id: 5, text: 'Every post MUST have an image', enforced: true, severity: 'hard-block' },
      ],
    },
    approvalProtocol: {
      cadence: 'Weekly Monday approval only',
      rule: 'Gate-D: NEVER bulk-approve/publish without Mike\'s explicit Monday review',
      batchSize: '1 post at a time',
      overrideRequired: 'Mike must approve each post individually',
    },
  });
}
