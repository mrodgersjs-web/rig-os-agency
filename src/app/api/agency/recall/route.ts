import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 10000, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

export async function GET() {
  const url = 'https://app.recall.it';
  const httpCode = run(`curl -s -o /dev/null -w '%{http_code}' -L --max-time 8 ${url} 2>/dev/null`);
  const reachable = httpCode === '200';

  // Try to get page title for extra detail
  const title = run(`curl -s -L --max-time 8 ${url} 2>/dev/null | grep -o '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g'`);

  // Response time in ms
  const timeMs = run(`curl -s -o /dev/null -w '%{time_total}' -L --max-time 8 ${url} 2>/dev/null`);
  const responseTime = timeMs ? `${(parseFloat(timeMs) * 1000).toFixed(0)}ms` : '—';

  return NextResponse.json({
    service: 'Recall.it',
    url,
    status: reachable ? 'online' : 'offline',
    httpStatus: httpCode || '000',
    reachable,
    title: title || 'unknown',
    responseTime,
    checkedAt: new Date().toISOString(),
    real: true,
  });
}