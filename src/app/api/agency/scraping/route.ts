import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    summary: { totalDataGB: 5.2, totalProfiles: 200, sources: 3, overnight: true, newCompanies: 47, decisionMakers: 128 },
    sources: [
      { id: 'apify', name: 'Apify', profiles: 85, dataGB: 2.1, status: 'active', lastRun: '2026-07-02T01:00:00Z', actors: ['linkedin-scraper', 'company-enrichment', 'google-maps-scraper'] },
      { id: 'exa', name: 'Exa AI', profiles: 72, dataGB: 1.8, status: 'active', lastRun: '2026-07-02T01:30:00Z', queries: ['AI consulting decision makers', 'SaaS CTO Denver', 'construction AI buyers'] },
      { id: 'brave', name: 'Brave Search', profiles: 43, dataGB: 1.3, status: 'active', lastRun: '2026-07-02T02:00:00Z', queries: ['AI automation agency', 'business process AI', 'construction technology'] }
    ],
    profiles: [
      { id: 'S001', name: 'Jennifer Walsh', title: 'Managing Partner', company: 'Milestone Partners PE', industry: 'PE/CFO', score: 94, source: 'LinkedIn', scraped: '2026-07-02T01:15:00Z' },
      { id: 'S002', name: 'Robert Kim', title: 'Managing Director', company: 'Apex Legal Group', industry: 'Law', score: 89, source: 'Apify', scraped: '2026-07-02T01:20:00Z' },
      { id: 'S003', name: 'Mike Henderson', title: 'CEO', company: 'Henderson Construction', industry: 'Construction', score: 91, source: 'Apify', scraped: '2026-07-02T01:25:00Z' },
      { id: 'S004', name: 'Dr. James Park', title: 'Partner', company: 'Denver Dental Partners', industry: 'Dental', score: 82, source: 'Exa', scraped: '2026-07-02T01:35:00Z' },
      { id: 'S005', name: 'Lisa Tran', title: 'Founder', company: 'Summit CPA Group', industry: 'CPA', score: 87, source: 'Exa', scraped: '2026-07-02T01:40:00Z' },
      { id: 'S006', name: 'Tom Bradley', title: 'VP Construction', company: 'Granite Peak', industry: 'Construction', score: 90, source: 'Brave', scraped: '2026-07-02T01:50:00Z' },
      { id: 'S007', name: 'Aisha Patel', title: 'CISO', company: 'SecureNet Inc', industry: 'Cybersecurity', score: 93, source: 'Apify', scraped: '2026-07-02T01:55:00Z' },
      { id: 'S008', name: 'Bob Stevens', title: 'COO', company: 'Front Range Mfg', industry: 'Manufacturing', score: 85, source: 'Exa', scraped: '2026-07-02T02:05:00Z' }
    ],
    config: { targetProfiles: 200, cadence: 'nightly', dataCap: '5GB', dedup: true, enrich: true, geo: 'Denver Metro + Colorado Front Range' }
  });
}