import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GTM_STUDIO_ROOT = '/Users/rig128gb/Developer/rig-gtm-studio-v2';
const CLIENTS_DIR = join(GTM_STUDIO_ROOT, 'clients');
const OUTBOUND_DIR = join(GTM_STUDIO_ROOT, 'proof', 'outbound');

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

interface SendRecord {
  slug: string;
  status: string;
  reason: string | null;
  resend_id: string;
  manifest_file: string;
  campaign: string;
}

interface ManifestSummary {
  file: string;
  campaign: string;
  sent_count: number;
  dry_run_preview: boolean;
  armed_by: string;
}

export async function GET() {
  // ── 1. Count real client directories ──────────────────────────────────
  let clientCount = 0;
  let clientSlugs: string[] = [];

  if (existsSync(CLIENTS_DIR)) {
    try {
      const entries = readdirSync(CLIENTS_DIR);
      clientSlugs = entries.filter((name) => {
        if (name.startsWith('_')) return false; // skip meta files like _send-log.json
        const full = join(CLIENTS_DIR, name);
        try {
          return statSync(full).isDirectory();
        } catch {
          return false;
        }
      });
      clientCount = clientSlugs.length;
    } catch {
      // leave at 0
    }
  }

  // ── 2. Parse all SENT manifest JSON files ──────────────────────────────
  const allSends: SendRecord[] = [];
  const manifests: ManifestSummary[] = [];
  const manifestsParsed: string[] = [];

  if (existsSync(OUTBOUND_DIR)) {
    try {
      const files = readdirSync(OUTBOUND_DIR).filter(
        (f) =>
          f.endsWith('.json') &&
          f.toLowerCase().includes('-sent')
      );

      for (const file of files) {
        const filePath = join(OUTBOUND_DIR, file);
        try {
          const raw = readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);
          manifestsParsed.push(file);

          const sentCount: number = data.sent_count ?? (Array.isArray(data) ? data.length : (Array.isArray(data.results) ? data.results.length : 0));
          const dryRun: boolean = data.dry_run_preview ?? false;
          const armedBy: string = data.armed_by ?? 'unknown';

          // Derive campaign name from filename
          const campaign = file
            .replace(/-SENT-?\d*\.json$/i, '')
            .replace(/-sent\.json$/i, '')
            .replace(/\.json$/i, '')
            .replace(/-SENT$/i, '');

          manifests.push({
            file,
            campaign,
            sent_count: sentCount,
            dry_run_preview: dryRun,
            armed_by: armedBy,
          });

          // Extract individual send records — handle two manifest formats:
          // Format A: { sent_count, results: [{ slug, status, reason, resend_id }] }
          // Format B: [{ slug, ok, resend_id, code }] (flat array at top level)
          if (Array.isArray(data)) {
            // Format B — top-level array
            for (const r of data) {
              allSends.push({
                slug: r.slug ?? 'unknown',
                status: r.ok ? 'sent' : (r.status ?? 'unknown'),
                reason: r.reason ?? null,
                resend_id: r.resend_id ?? '',
                manifest_file: file,
                campaign,
              });
            }
          } else if (Array.isArray(data.results)) {
            // Format A — { results: [...] }
            for (const r of data.results) {
              allSends.push({
                slug: r.slug ?? 'unknown',
                status: r.status ?? 'unknown',
                reason: r.reason ?? null,
                resend_id: r.resend_id ?? '',
                manifest_file: file,
                campaign,
              });
            }
          }
        } catch {
          // skip unparseable file
        }
      }
    } catch {
      // directory read failure
    }
  }

  // ── 3. Build company contact list with status ──────────────────────────
  // Merge sends by slug — a company may appear in multiple manifests
  const companyMap = new Map<
    string,
    {
      slug: string;
      sends: SendRecord[];
      totalSends: number;
      lastStatus: string;
      hasResendId: boolean;
      campaigns: string[];
    }
  >();

  for (const send of allSends) {
    const existing = companyMap.get(send.slug);
    if (existing) {
      existing.sends.push(send);
      existing.totalSends += 1;
      if (!existing.campaigns.includes(send.campaign)) {
        existing.campaigns.push(send.campaign);
      }
      // last status from most recent manifest
      existing.lastStatus = send.status;
      if (send.resend_id) existing.hasResendId = true;
    } else {
      companyMap.set(send.slug, {
        slug: send.slug,
        sends: [send],
        totalSends: 1,
        lastStatus: send.status,
        hasResendId: !!send.resend_id,
        campaigns: [send.campaign],
      });
    }
  }

  const companiesContacted = Array.from(companyMap.values()).sort((a, b) =>
    a.slug.localeCompare(b.slug)
  );

  // ── Summary metrics ────────────────────────────────────────────────────
  const totalEmailsSent = allSends.length;
  const uniqueCompaniesContacted = companyMap.size;
  const confirmedSent = allSends.filter((s) => s.status === 'sent').length;
  const withResendId = allSends.filter((s) => s.resend_id).length;

  return NextResponse.json({
    source: 'rig-gtm-studio-v2',
    real: true,
    pipeline_root: GTM_STUDIO_ROOT,
    summary: {
      total_prospects: clientCount,
      total_emails_sent: totalEmailsSent,
      unique_companies_contacted: uniqueCompaniesContacted,
      confirmed_sent: confirmedSent,
      with_resend_id: withResendId,
      send_rate: clientCount > 0 ? ((uniqueCompaniesContacted / clientCount) * 100).toFixed(1) + '%' : '0%',
    },
    manifests: {
      parsed: manifestsParsed,
      summaries: manifests,
    },
    companies_contacted: companiesContacted.map((c) => ({
      slug: c.slug,
      status: c.lastStatus,
      total_sends: c.totalSends,
      campaigns: c.campaigns,
      has_resend_id: c.hasResendId,
      sends: c.sends.map((s) => ({
        status: s.status,
        resend_id: s.resend_id,
        manifest: s.manifest_file,
        campaign: s.campaign,
        reason: s.reason,
      })),
    })),
    all_client_slugs: clientSlugs.sort(),
  });
}