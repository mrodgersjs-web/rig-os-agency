import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { getAllSiteStats, SITES } from '@/lib/seoPipeline';
import { getHistory } from '@/lib/seoHistory';

export const dynamic = 'force-dynamic';

// Tracked keyword clusters for SERP position tracking
const KEYWORD_CLUSTERS = [
  { keyword: 'ai agent community', volume: 8100, difficulty: 38, sites: ['bestaiagentcommunity'], intent: 'commercial' },
  { keyword: 'ai profit boardroom', volume: 4400, difficulty: 22, sites: ['aiprofitboardroom'], intent: 'brand' },
  { keyword: 'ai automation agency', volume: 14800, difficulty: 55, sites: ['bestaiagentcommunity', 'aiprofitboardroom'], intent: 'commercial' },
  { keyword: 'julian goldie ai', volume: 2900, difficulty: 15, sites: ['juliangoldieautomation', 'aisuccesslab', 'aimoneylab'], intent: 'brand' },
  { keyword: 'ai content automation', volume: 6600, difficulty: 42, sites: ['juliangoldieautomation'], intent: 'commercial' },
  { keyword: 'ai seo automation', volume: 5400, difficulty: 48, sites: ['juliangoldieautomation', 'aiprofitboardroom'], intent: 'commercial' },
  { keyword: 'ai money making lab', volume: 1900, difficulty: 18, sites: ['aimoneylab'], intent: 'brand' },
  { keyword: 'ai success lab', volume: 1300, difficulty: 12, sites: ['aisuccesslab'], intent: 'brand' },
  { keyword: 'best ai community platform', volume: 3600, difficulty: 35, sites: ['bestaiagentcommunity'], intent: 'commercial' },
  { keyword: 'ai automation for small business', volume: 8200, difficulty: 44, sites: ['aiprofitboardroom', 'juliangoldieautomation'], intent: 'commercial' },
  { keyword: 'ai agent platform', volume: 12100, difficulty: 58, sites: ['bestaiagentcommunity'], intent: 'commercial' },
  { keyword: 'passive income ai tools', volume: 4100, difficulty: 39, sites: ['aimoneylab'], intent: 'commercial' },
];

export async function GET() {
  try {
    const siteRoot = '/Users/rig128gb/Developer/rig-os-site';

    // ── Main site page counts ──
    let mainPages = 0, offerPages = 0, blogPages = 0, totalPages = 0;
    try {
      mainPages = parseInt(execSync(`find ${siteRoot} -maxdepth 1 -name '*.html' | wc -l`, { encoding: 'utf-8' }).trim()) || 0;
      offerPages = parseInt(execSync(`find ${siteRoot}/offers -name '*.html' 2>/dev/null | wc -l`, { encoding: 'utf-8' }).trim()) || 0;
      blogPages = parseInt(execSync(`find ${siteRoot}/blog -name '*.html' 2>/dev/null | wc -l`, { encoding: 'utf-8' }).trim()) || 0;
      totalPages = mainPages + offerPages + blogPages;
    } catch {}

    // ── Live site status ──
    let liveStatus = 'unknown';
    let liveStatusCode = 0;
    try {
      const code = execSync(`curl -s -m 5 -o /dev/null -w '%{http_code}' https://rodgersintelligence.com 2>/dev/null`, { encoding: 'utf-8' }).trim();
      liveStatusCode = parseInt(code) || 0;
      liveStatus = liveStatusCode === 200 ? 'live' : `error-${liveStatusCode}`;
    } catch {}

    // ── Technical SEO checks ──
    let sitemapExists = false;
    let robotsExists = false;
    try {
      sitemapExists = fs.existsSync(`${siteRoot}/sitemap.xml`);
      robotsExists = fs.existsSync(`${siteRoot}/robots.txt`);
    } catch {}

    // ── Main pages list ──
    let mainPageList: string[] = [];
    try {
      const files = execSync(`find ${siteRoot} -maxdepth 1 -name '*.html' -exec basename {} \\;`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
      mainPageList = files.sort();
    } catch {}

    // ── Multi-site SEO pipeline stats ──
    const siteStats = await getAllSiteStats();
    const totalBlogPosts = siteStats.reduce((sum, s) => sum + s.postCount, 0);
    const totalFunnelPages = totalPages + totalBlogPosts;

    // ── SEO history (generate sessions + deploys) ──
    const history = await getHistory();
    const recentSessions = (history.sessions || []).slice(-10).reverse();
    const recentDeploys = (history.deploys || []).slice(-15).reverse();
    const completedSessions = (history.sessions || []).filter((s: any) => s.status === 'completed').length;

    // ── Content velocity (posts per week over last 4 weeks) ──
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const velocityWeeks: { week: string; posts: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = now - (w + 1) * weekMs;
      const end = now - w * weekMs;
      let count = 0;
      for (const ss of siteStats) {
        for (const r of ss.recent) {
          if (r.mtime >= start && r.mtime < end) count++;
        }
      }
      const weekStart = new Date(now - w * weekMs);
      velocityWeeks.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        posts: count,
      });
    }

    // ── Keyword clusters with site assignments ──
    const keywordData = KEYWORD_CLUSTERS.map((kw) => {
      const assignedSites = kw.sites.map((sid) => SITES.find((s) => s.id === sid)).filter(Boolean);
      return {
        ...kw,
        assignedSites: assignedSites.map((s: any) => ({ id: s.id, name: s.name, url: s.url })),
        totalPosts: assignedSites.reduce((sum: number, s: any) => {
          const ss = siteStats.find((st) => st.site.id === s.id);
          return sum + (ss?.postCount || 0);
        }, 0),
      };
    });

    // ── Site indexability checklist ──
    const siteIndexability = siteStats.map((ss) => {
      const recentDate = ss.recent[0]?.date || ss.recent[0]?.mtime;
      return {
        id: ss.site.id,
        name: ss.site.name,
        url: ss.site.url,
        postCount: ss.postCount,
        lastPublish: recentDate
          ? typeof recentDate === 'number'
            ? new Date(recentDate).toISOString()
            : recentDate
          : null,
        daysSincePublish: recentDate
          ? Math.floor((now - (typeof recentDate === 'number' ? recentDate : new Date(recentDate).getTime())) / (24 * 60 * 60 * 1000))
          : null,
      };
    });

    const seo = {
      pages: {
        main: mainPages,
        offers: offerPages,
        blog: blogPages,
        total: totalPages,
      },
      live_site: {
        url: 'https://rodgersintelligence.com',
        status: liveStatus,
        http_code: liveStatusCode,
      },
      technical: {
        sitemap: sitemapExists,
        robots_txt: robotsExists,
      },
      main_page_list: mainPageList,
      pipeline: {
        sites: siteStats,
        totalFunnelSites: SITES.length,
        totalBlogPosts,
        totalFunnelPages,
      },
      keywords: keywordData,
      velocity: velocityWeeks,
      siteIndexability,
      history: {
        totalSessions: history.sessions?.length || 0,
        completedSessions,
        totalDeploys: history.deploys?.length || 0,
        recentSessions,
        recentDeploys,
      },
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(seo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
