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
  const sitePath = '/Users/rig128gb/Developer/rig-os-site';
  const exists = existsSync(sitePath);
  
  if (!exists) {
    return NextResponse.json({ status: 'not_found' });
  }

  // Real pages
  const htmlPages = run(`find ${sitePath} -maxdepth 1 -name "*.html" 2>/dev/null | wc -l`);
  const offerPages = existsSync(join(sitePath, 'offers')) 
    ? readdirSync(join(sitePath, 'offers')).filter(f => f.endsWith('.html')).length 
    : 0;
  const blogPosts = existsSync(join(sitePath, 'blog', 'posts'))
    ? readdirSync(join(sitePath, 'blog', 'posts')).filter(f => f.endsWith('.html')).length
    : 0;
  
  // Real deploy status
  const liveStatus = run(`curl -s -o /dev/null -w '%{http_code}' https://rodgersintelligence.com 2>/dev/null`);
  const liveTitle = run(`curl -s https://rodgersintelligence.com 2>/dev/null | grep -o '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g'`);
  
  // Real git status
  const gitLog = run(`cd ${sitePath} && git log --oneline -5 2>/dev/null`);
  const commits = gitLog ? gitLog.split('\n').filter(Boolean) : [];
  
  // Real SEO script
  const seoScriptExists = existsSync(join(sitePath, 'scripts', 'seo-daily.sh'));
  
  // Real cron status
  const seoCron = run(`launchctl list 2>/dev/null | grep com.rig.seo-daily`) || 'not loaded';
  
  return NextResponse.json({
    site: {
      url: 'https://rodgersintelligence.com',
      live: liveStatus === '200',
      httpStatus: liveStatus,
      title: liveTitle || 'unknown',
    },
    pages: {
      mainPages: parseInt(htmlPages) || 0,
      offerPages: offerPages,
      blogPosts: blogPosts,
      total: parseInt(htmlPages) + offerPages + blogPosts,
    },
    offers: existsSync(join(sitePath, 'offers'))
      ? readdirSync(join(sitePath, 'offers')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
      : [],
    blog: {
      posts: existsSync(join(sitePath, 'blog', 'posts'))
        ? readdirSync(join(sitePath, 'blog', 'posts')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
        : [],
      seoScriptExists: seoScriptExists,
      seoCronLoaded: seoCron !== 'not loaded',
    },
    git: {
      remote: run(`cd ${sitePath} && git remote get-url origin 2>/dev/null`) || 'none',
      recentCommits: commits.slice(0, 5),
    },
    real: true,
  });
}