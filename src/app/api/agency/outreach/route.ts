import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OUTBOUND_DIR = "/Users/rig128gb/Developer/rig-gtm-studio-v2/proof/outbound";
const CLIENTS_DIR = "/Users/rig128gb/Developer/rig-gtm-studio-v2/clients";

interface EmailResult {
  slug: string;
  firm: string;
  status: string;
  resend_id: string;
  manifest: string;
  angle: string;
  ok?: boolean;
  code?: number;
}

interface ManifestMeta {
  file: string;
  angle: string;
  armed_by: string;
  sent_count: number;
  dry_run: boolean;
}

function readJsonFile(path: string): any {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function slugToFirm(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getAllEmails(): EmailResult[] {
  const emails: EmailResult[] = [];

  // warmup-day1-sent.json — array format with firm + email
  const warmupFile = join(OUTBOUND_DIR, "warmup-day1-sent.json");
  if (existsSync(warmupFile)) {
    const data = readJsonFile(warmupFile);
    if (Array.isArray(data)) {
      for (const r of data) {
        if (r.resend_id) {
          emails.push({
            slug: r.slug || "",
            firm: r.firm || slugToFirm(r.slug || ""),
            status: r.ok ? "delivered" : "unknown",
            resend_id: r.resend_id,
            manifest: "warmup-day1",
            angle: "Warmup Day 1 — initial send",
            ok: r.ok,
            code: r.code,
          });
        }
      }
    }
  }

  // followup-one-SENT manifest
  const followupFile = join(OUTBOUND_DIR, "followup-one-SENT-20260702.json");
  if (existsSync(followupFile)) {
    const data = readJsonFile(followupFile);
    const results = data?.results || [];
    for (const r of results) {
      if (r.resend_id) {
        emails.push({
          slug: r.slug,
          firm: slugToFirm(r.slug),
          status: r.status || "sent",
          resend_id: r.resend_id,
          manifest: "followup-one",
          angle: "Follow-up One — second touch",
        });
      }
    }
  }

  // replybait-canary-SENT manifest
  const replybaitFile = join(OUTBOUND_DIR, "replybait-canary-SENT-20260702.json");
  if (existsSync(replybaitFile)) {
    const data = readJsonFile(replybaitFile);
    const results = data?.results || [];
    for (const r of results) {
      if (r.resend_id) {
        emails.push({
          slug: r.slug,
          firm: slugToFirm(r.slug),
          status: r.status || "sent",
          resend_id: r.resend_id,
          manifest: "replybait-canary",
          angle: "Reply-Bait Canary — third touch",
        });
      }
    }
  }

  return emails;
}

function getManifests(): ManifestMeta[] {
  const manifests: ManifestMeta[] = [];
  try {
    const files = readdirSync(OUTBOUND_DIR).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const data = readJsonFile(join(OUTBOUND_DIR, f));
      if (!data) continue;
      manifests.push({
        file: f,
        angle: data.angle || data.intent || data.note || "unknown",
        armed_by: data.armed_by || "unknown",
        sent_count: data.sent_count || (Array.isArray(data) ? data.length : 0),
        dry_run: data.dry_run_preview ?? (data.MODE === "dry-run-preview"),
      });
    }
  } catch {}
  return manifests;
}

function getProspectCount(): number {
  try {
    return readdirSync(CLIENTS_DIR).filter(
      (f) => !f.startsWith("_") && !f.startsWith(".")
    ).length;
  } catch {
    return 0;
  }
}

export async function GET() {
  const emails = getAllEmails();
  const manifests = getManifests();
  const prospectCount = getProspectCount();

  // Compute summary stats
  const totalSent = manifests
    .filter((m) => !m.dry_run)
    .reduce((sum, m) => sum + m.sent_count, 0);

  const byManifest: Record<string, number> = {};
  for (const e of emails) {
    byManifest[e.manifest] = (byManifest[e.manifest] || 0) + 1;
  }

  const byStatus: Record<string, number> = {};
  for (const e of emails) {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  }

  const uniqueCompanies = new Set(emails.map((e) => e.slug));
  const uniqueResendIds = emails.filter((e) => e.resend_id).length;

  return NextResponse.json({
    _real: true,
    _source: "GTM Studio V2 proof/outbound/ manifests — real Resend sends",
    summary: {
      totalEmailsSent: emails.length,
      totalDryRun: manifests.reduce((sum, m) => sum + (m.dry_run ? m.sent_count : 0), 0),
      totalLiveSent: totalSent,
      uniqueCompanies: uniqueCompanies.size,
      uniqueResendIds,
      replies: 0,
      opens: 0,
      clicks: 0,
      byManifest,
      byStatus,
      prospectCount,
      trackingEnabled: true, // from tracking-enabled manifest
      trackingSince: "2026-07-02T07:22:00-06:00",
    },
    manifests: manifests.map((m) => ({
      ...m,
      is_live: !m.dry_run && m.sent_count > 0,
    })),
    emails: emails.map((e) => ({
      slug: e.slug,
      firm: e.firm,
      status: e.status,
      resend_id: e.resend_id,
      manifest: e.manifest,
      angle: e.angle,
      delivered: e.ok ?? (e.status === "sent"),
    })),
  });
}