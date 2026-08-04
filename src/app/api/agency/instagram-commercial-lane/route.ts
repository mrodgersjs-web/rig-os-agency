import { NextResponse } from 'next/server';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FOUNDRY_ROOT = '/Users/rig128gb/Developer/rig-intelligence-worktrees/foundry-runtime/platform/automation-foundry';
const DOCKER_PATH = '/Users/rig128gb/Developer/rig-intelligence/departments/instagram/projects/rig-instagram-studio-v2/compose.yaml';

function safeRead(path: string): string | null {
  try {
    if (existsSync(path)) return readFileSync(path, 'utf-8');
    return null;
  } catch { return null; }
}

function safeRun(cmd: string): string {
  try { return execSync(cmd, { timeout: 5000, encoding: 'utf-8' }).trim(); } catch { return ''; }
}

export async function GET() {
  // Check foundry directory exists
  const foundryExists = existsSync(FOUNDRY_ROOT);

  // Read manifest
  const manifestPath = join(FOUNDRY_ROOT, 'manifests', 'instagram-commercial-lane.yaml');
  const manifestRaw = safeRead(manifestPath);
  let maturity: string | null = null;
  let desiredState: string | null = null;
  let productionAdmissible: boolean | null = null;
  if (manifestRaw) {
    const mMatch = manifestRaw.match(/maturity:\s*(\S+)/);
    const dMatch = manifestRaw.match(/desired_state:\s*(\S+)/);
    const pMatch = manifestRaw.match(/production_admissible:\s*(\S+)/);
    if (mMatch) maturity = mMatch[1];
    if (dMatch) desiredState = dMatch[1];
    if (pMatch) productionAdmissible = pMatch[1] === 'true';
  }

  // Count test files
  const testsDir = join(FOUNDRY_ROOT, 'tests');
  let instagramTestCount = 0;
  let testFiles: string[] = [];
  if (existsSync(testsDir)) {
    try {
      testFiles = readdirSync(testsDir).filter(f => f.startsWith('test_instagram') || f.startsWith('test_m2'));
      instagramTestCount = testFiles.length;
    } catch {}
  }

  // Read last evidence/verdict
  const evidenceDir = join(FOUNDRY_ROOT, 'evidence', 'instagram');
  let lastVerdict: string | null = null;
  let lastArtifact: string | null = null;
  let evidenceFileCount = 0;
  if (existsSync(evidenceDir)) {
    try {
      const evidenceFiles = readdirSync(evidenceDir).filter(f => f.endsWith('.json'));
      evidenceFileCount = evidenceFiles.length;
      if (evidenceFiles.length > 0) {
        const fixturePath = join(evidenceDir, 'instagram-readiness-source.v1.json');
        const fixture = safeRead(fixturePath);
        if (fixture) {
          try {
            const parsed = JSON.parse(fixture);
            lastArtifact = parsed.artifact_id || null;
          } catch {}
        }
      }
    } catch {}
  }

  // Check for the MVP loop output (verdict card)
  const mvpCardPath = join(evidenceDir, 'mvp_loop_telegram_card.txt');
  const mvpCardExists = existsSync(mvpCardPath);
  if (mvpCardExists) {
    const cardContent = safeRead(mvpCardPath);
    if (cardContent) {
      if (cardContent.includes('✅')) lastVerdict = 'READY';
      else if (cardContent.includes('🔴')) lastVerdict = 'HOLD';
      else if (cardContent.includes('❓')) lastVerdict = 'UNKNOWN';
    }
  }

  // Check for producer module
  const producerPath = join(FOUNDRY_ROOT, 'src', 'rig_foundry', 'instagram_producer.py');
  const producerExists = existsSync(producerPath);

  // Check for consumer module
  const consumerPath = join(FOUNDRY_ROOT, 'src', 'rig_foundry', 'instagram_consumer.py');
  const consumerExists = existsSync(consumerPath);

  // Check for M2 admission code (admission_envelope parameter in promote_instagram_readiness)
  const readinessPath = join(FOUNDRY_ROOT, 'src', 'rig_foundry', 'instagram_readiness.py');
  const readinessRaw = safeRead(readinessPath);
  let m2AdmissionCode = false;
  let writeSafetyLaw = false;
  if (readinessRaw) {
    m2AdmissionCode = readinessRaw.includes('admission_envelope');
    writeSafetyLaw = readinessRaw.includes('enforce_write_safety_law');
  }

  // Check for live-false test
  const liveFalsePath = join(testsDir, 'test_instagram_live_false.py');
  const liveFalseExists = existsSync(liveFalsePath);

  // Docker compose status
  const dockerComposeExists = existsSync(DOCKER_PATH);

  // Check docker container health
  const dockerHealth = safeRun('docker ps --filter name=rig-instagram --format "{{.Status}}" 2>/dev/null') || 'not running';

  // Prefect dashboard check
  const prefectHealth = safeRun('curl -s http://localhost:4200/api/health 2>/dev/null') || 'unreachable';

  // Grid.py reachability test
  const gridTestPath = '/Users/rig128gb/Developer/rig-intelligence/departments/instagram/projects/rig-instagram-studio-v2/tests/test_grid_reachability.py';
  const gridTestExists = existsSync(gridTestPath);

  // Build stage status
  const stages = [
    { id: 1, name: 'Producer', description: 'Emit real observations from grid.py', status: producerExists ? 'BUILT' : 'MISSING' },
    { id: 2, name: 'Format Constraints', description: 'Source real Meta Graph API constraints', status: 'DONE' },
    { id: 3, name: 'Telegram Consumer', description: 'Surface READY verdicts for approval', status: consumerExists ? 'BUILT' : 'MISSING' },
    { id: 4, name: 'M2 Admission', description: 'Conditional M1_PROMOTION_LOCK bypass', status: m2AdmissionCode ? 'BUILT' : 'MISSING' },
    { id: 5, name: 'Publish + Write-Safety', description: 'Gate-D enforcement before publish', status: writeSafetyLaw ? 'BUILT' : 'MISSING' },
  ];

  // 11 gates from the evaluator
  const gates = [
    'media-missing', 'caption-missing', 'rights-record-missing', 'rights-revoked',
    'format-constraints-unsourced', 'format-invalid', 'accessibility-incomplete',
    'source-coverage-missing', 'kpi-coverage-missing', 'analytics-settlement-missing',
    'cadence-owner-conflict',
  ];

  return NextResponse.json({
    foundry: {
      exists: foundryExists,
      path: FOUNDRY_ROOT,
    },
    manifest: {
      maturity,
      desiredState,
      productionAdmissible,
    },
    evaluator: {
      testFiles: testFiles,
      testCount: instagramTestCount,
      lastVerdict,
      lastArtifact,
      liveFalseTest: liveFalseExists,
    },
    stages,
    gates,
    pipeline: {
      producer: { exists: producerExists },
      consumer: { exists: consumerExists },
      m2Admission: { exists: m2AdmissionCode },
      writeSafetyLaw: { exists: writeSafetyLaw },
    },
    evidence: {
      fileCount: evidenceFileCount,
      mvpCardExists,
    },
    docker: {
      composeExists: dockerComposeExists,
      containerHealth: dockerHealth,
    },
    prefect: {
      dashboardUrl: 'http://localhost:4200',
      health: prefectHealth,
    },
    grid: {
      reachabilityTest: gridTestExists,
    },
  });
}