import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_DIR = "/Users/rig128gb/Developer/rig-os-site";
const DOMAIN = "rodgersintelligence.com";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 10000, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function countFiles(dir: string, pattern: RegExp): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter((f) => pattern.test(f)).length;
  } catch {
    return 0;
  }
}

function countFilesRecursive(dir: string, ext: string): number {
  return parseInt(run(`find "${dir}" -name "*.${ext}" -type f 2>/dev/null | wc -l`)) || 0;
}

export async function GET() {
  // Count pages
  const mainPages = countFiles(SITE_DIR, /\.html$/);
  const offerPages = countFiles(join(SITE_DIR, "offers"), /\.html$/);
  const blogPages = countFiles(join(SITE_DIR, "blog", "posts"), /\.html$/);
  const caseStudyPages = countFiles(SITE_DIR, /^case-.*\.html$/);
  const blogIndex = existsSync(join(SITE_DIR, "blog", "index.html")) ? 1 : 0;

  // HTTP status of rodgersintelligence.com
  const httpStatus = run(
    `curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN} 2>/dev/null`
  );
  const httpsReachable = httpStatus === "200";

  // Site last modified
  let lastModified = "unknown";
  try {
    const files = readdirSync(SITE_DIR).filter((f) => f.endsWith(".html"));
    if (files.length > 0) {
      const newest = files.reduce((a, b) => {
        const ta = statSync(join(SITE_DIR, a)).mtimeMs;
        const tb = statSync(join(SITE_DIR, b)).mtimeMs;
        return ta > tb ? a : b;
      });
      lastModified = statSync(join(SITE_DIR, newest)).mtime.toISOString();
    }
  } catch {}

  // SEO daily cron status (com.rig.seo-daily from launchctl)
  const launchdList = run("launchctl list 2>/dev/null");
  const seoLine =
    launchdList
      .split("\n")
      .find((l) => l.includes("com.rig.seo-daily")) || "";
  const seoParts = seoLine.split("\t");
  const seoCronPid = seoParts[0] || "-";
  const seoCronExit = seoParts[1] || "0";
  const seoCronRunning = seoCronPid !== "-" && seoCronPid.length > 0;

  // Domain DNS check
  const digResult = run(`dig +short ${DOMAIN} 2>/dev/null`).split("\n").filter(Boolean);

  // SSL check
  const sslExpiry = run(
    `echo | openssl s_client -servername ${DOMAIN} -connect ${DOMAIN}:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2`
  );

  // All HTML files recursive
  const totalHtmlFiles = countFilesRecursive(SITE_DIR, "html");

  return NextResponse.json({
    _real: true,
    _source: "Filesystem scan of /Users/rig128gb/Developer/rig-os-site/",
    domain: DOMAIN,
    pages: {
      mainPages,
      offerPages,
      blogPages,
      blogIndex,
      caseStudyPages,
      total: totalHtmlFiles,
      breakdown: {
        main: mainPages,
        offers: offerPages,
        blog: blogPages,
        case_studies: caseStudyPages,
        blog_index: blogIndex,
      },
    },
    http: {
      status: parseInt(httpStatus) || 0,
      code: httpStatus || "unknown",
      reachable: httpsReachable,
      domain: `https://${DOMAIN}`,
    },
    ssl: {
      expiry: sslExpiry || "unknown",
      valid: !!sslExpiry,
    },
    dns: {
      records: digResult.length,
      ips: digResult.filter((l) => l.match(/^\d+\.\d+\.\d+\.\d+$/)),
    },
    cron: {
      service: "com.rig.seo-daily",
      pid: seoCronPid,
      exitCode: seoCronExit,
      running: seoCronRunning,
      status: seoCronRunning
        ? "RUNNING (PID " + seoCronPid + ")"
        : seoCronExit === "0"
        ? "LOADED (not currently running, last exit clean)"
        : "LOADED (not running, last exit: " + seoCronExit + ")",
    },
    lastModified,
    generated_at: new Date().toISOString(),
  });
}