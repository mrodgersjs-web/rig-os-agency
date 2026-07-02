import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    summary: {
      totalDataGB: 5.2,
      totalProfiles: 200,
      sources: 3,
      overnight: true,
      newCompanies: 47,
      decisionMakers: 128,
      qualified: 84,
      enrichmentRate: 0.73,
      dedupRate: 0.91,
      avgScore: 87.6,
      successRate: 0.98,
    },
    sources: [
      { id: 'apify', name: 'Apify', profiles: 85, dataGB: 2.1, status: 'active', lastRun: '2026-07-02T01:00:00Z', actors: ['linkedin-scraper', 'company-enrichment', 'google-maps-scraper'], successRate: 0.98, avgScore: 88.2 },
      { id: 'exa', name: 'Exa AI', profiles: 72, dataGB: 1.8, status: 'active', lastRun: '2026-07-02T01:30:00Z', queries: ['AI consulting decision makers', 'SaaS CTO Denver', 'construction AI buyers'], successRate: 0.95, avgScore: 86.4 },
      { id: 'brave', name: 'Brave Search', profiles: 43, dataGB: 1.3, status: 'active', lastRun: '2026-07-02T02:00:00Z', queries: ['AI automation agency', 'business process AI', 'construction technology'], successRate: 0.97, avgScore: 88.9 },
    ],
    profiles: [
      { id: 'S001', name: 'Jennifer Walsh', title: 'Managing Partner', company: 'Milestone Partners PE', industry: 'PE/CFO', score: 94, source: 'LinkedIn', scraped: '2026-07-02T01:15:00Z', enriched: true, qualified: true },
      { id: 'S002', name: 'Robert Kim', title: 'Managing Director', company: 'Apex Legal Group', industry: 'Law', score: 89, source: 'Apify', scraped: '2026-07-02T01:20:00Z', enriched: true, qualified: true },
      { id: 'S003', name: 'Mike Henderson', title: 'CEO', company: 'Henderson Construction', industry: 'Construction', score: 91, source: 'Apify', scraped: '2026-07-02T01:25:00Z', enriched: true, qualified: true },
      { id: 'S004', name: 'Dr. James Park', title: 'Partner', company: 'Denver Dental Partners', industry: 'Dental', score: 82, source: 'Exa', scraped: '2026-07-02T01:35:00Z', enriched: false, qualified: false },
      { id: 'S005', name: 'Lisa Tran', title: 'Founder', company: 'Summit CPA Group', industry: 'CPA', score: 87, source: 'Exa', scraped: '2026-07-02T01:40:00Z', enriched: true, qualified: true },
      { id: 'S006', name: 'Tom Bradley', title: 'VP Construction', company: 'Granite Peak', industry: 'Construction', score: 90, source: 'Brave', scraped: '2026-07-02T01:50:00Z', enriched: true, qualified: true },
      { id: 'S007', name: 'Aisha Patel', title: 'CISO', company: 'SecureNet Inc', industry: 'Cybersecurity', score: 93, source: 'Apify', scraped: '2026-07-02T01:55:00Z', enriched: true, qualified: true },
      { id: 'S008', name: 'Bob Stevens', title: 'COO', company: 'Front Range Mfg', industry: 'Manufacturing', score: 85, source: 'Exa', scraped: '2026-07-02T02:05:00Z', enriched: false, qualified: true },
    ],
    runHistory: [
      { id: 'run_2026_07_02', date: '2026-07-02T01:00:00Z', profiles: 200, newProfiles: 47, companies: 47, decisionMakers: 128, dataGB: 5.2, duration: '4m 32s', status: 'completed', sources: 3, errors: 0 },
      { id: 'run_2026_07_01', date: '2026-07-01T01:00:00Z', profiles: 178, newProfiles: 31, companies: 31, decisionMakers: 112, dataGB: 4.8, duration: '3m 58s', status: 'completed', sources: 3, errors: 0 },
      { id: 'run_2026_06_30', date: '2026-06-30T01:00:00Z', profiles: 162, newProfiles: 22, companies: 22, decisionMakers: 98, dataGB: 4.2, duration: '3m 21s', status: 'completed', sources: 3, errors: 0 },
      { id: 'run_2026_06_29', date: '2026-06-29T01:00:00Z', profiles: 148, newProfiles: 18, companies: 18, decisionMakers: 85, dataGB: 3.8, duration: '3m 12s', status: 'completed', sources: 3, errors: 1 },
      { id: 'run_2026_06_28', date: '2026-06-28T01:00:00Z', profiles: 134, newProfiles: 15, companies: 15, decisionMakers: 72, dataGB: 3.3, duration: '2m 48s', status: 'completed', sources: 2, errors: 0 },
      { id: 'run_2026_06_27', date: '2026-06-27T01:00:00Z', profiles: 120, newProfiles: 12, companies: 12, decisionMakers: 58, dataGB: 2.9, duration: '2m 31s', status: 'completed', sources: 2, errors: 0 },
      { id: 'run_2026_06_26', date: '2026-06-26T01:00:00Z', profiles: 108, newProfiles: 9, companies: 9, decisionMakers: 47, dataGB: 2.5, duration: '2m 15s', status: 'completed', sources: 2, errors: 0 },
    ],
    verticalBreakdown: [
      { vertical: 'Construction', count: 42, qualified: 38, avgScore: 90.2, trend: '+12%' },
      { vertical: 'Dental', count: 31, qualified: 24, avgScore: 84.8, trend: '+8%' },
      { vertical: 'Manufacturing', count: 28, qualified: 21, avgScore: 87.1, trend: '+15%' },
      { vertical: 'PE/CFO', count: 22, qualified: 18, avgScore: 91.5, trend: '+5%' },
      { vertical: 'Law', count: 24, qualified: 16, avgScore: 85.3, trend: '+3%' },
      { vertical: 'CPA', count: 19, qualified: 12, avgScore: 86.0, trend: '+7%' },
      { vertical: 'Cybersecurity', count: 16, qualified: 14, avgScore: 89.8, trend: '+22%' },
      { vertical: 'SaaS', count: 18, qualified: 11, avgScore: 84.2, trend: '+18%' },
    ],
    config: { targetProfiles: 200, cadence: 'nightly', dataCap: '5GB', dedup: true, enrich: true, geo: 'Denver Metro + Colorado Front Range', startTime: '01:00 UTC', webhookUrl: 'internal', alertEmail: 'ops@rigintelligence.com' },
    nextRun: '2026-07-03T01:00:00Z',
  });
}
