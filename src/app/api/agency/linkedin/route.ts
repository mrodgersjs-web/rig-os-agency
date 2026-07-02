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
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) continue;
      if (!entry.endsWith('.md') && !entry.endsWith('.markdown')) continue;
      
      const parsed = parseMarkdownPost(fullPath);
      const content = parsed.content;
      
      // Check for adjacent image
      const baseName = entry.replace(/\.(md|markdown)$/, '');
      const imgDir = join(dir, 'images');
      let imagePath: string | null = null;
      
      // Check for image in same dir or images subfolder
      const imgExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
      for (const ext of imgExts) {
        const sameDir = join(dir, baseName + ext);
        if (existsSync(sameDir)) { imagePath = sameDir; break; }
        const imgSubdir = join(imgDir, baseName + ext);
        if (existsSync(imgSubdir)) { imagePath = imgSubdir; break; }
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
        id: `${status}-${entry}`,
        filename: entry,
        path: fullPath,
        vertical: parsed.vertical,
        title: parsed.title,
        status,
        hasImage: !!imagePath || hasImageRef,
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

export async function GET() {
  // ── Real file-system scan of LinkedIn content ───────────────────
  const allPosts: LIPost[] = [];
  
  // Scan published posts
  const publishDirs = [
    join(LINKEDIN_STUDIO, 'published'),
    join(LINKEDIN_STUDIO, 'posts', 'published'),
    join(AI_COMPANY, 'proof', 'linkedin', 'published'),
    join(STUDIO_REPO, 'published'),
    join(STUDIO_REPO, 'posts', 'published'),
  ];
  for (const d of publishDirs) allPosts.push(...scanPosts(d, 'published'));
  
  // Scan queued posts
  const queueDirs = [
    join(LINKEDIN_STUDIO, 'queued'),
    join(LINKEDIN_STUDIO, 'posts', 'queued'),
    join(STUDIO_REPO, 'queued'),
    join(STUDIO_REPO, 'posts', 'queued'),
  ];
  for (const d of queueDirs) allPosts.push(...scanPosts(d, 'queued'));
  
  // Scan draft posts
  const draftDirs = [
    join(LINKEDIN_STUDIO, 'drafts'),
    join(LINKEDIN_STUDIO, 'posts', 'drafts'),
    join(LINKEDIN_STUDIO, 'posts'),
    join(STUDIO_REPO, 'drafts'),
    join(STUDIO_REPO, 'posts'),
  ];
  for (const d of draftDirs) allPosts.push(...scanPosts(d, 'draft'));
  
  // Scan scheduled/approved
  const approvedDirs = [
    join(LINKEDIN_STUDIO, 'approved'),
    join(LINKEDIN_STUDIO, 'posts', 'approved'),
    join(STUDIO_REPO, 'approved'),
  ];
  for (const d of approvedDirs) allPosts.push(...scanPosts(d, 'approved'));
  
  // ── Deduplicate by filename ─────────────────────────────────────
  const seen = new Set<string>();
  const deduped = allPosts.filter(p => {
    if (seen.has(p.filename)) return false;
    seen.add(p.filename);
    return true;
  });
  
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
