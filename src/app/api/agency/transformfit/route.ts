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
  const tfPath = '/Users/rig128gb/Developer/transformfit-flutter';
  const exists = existsSync(tfPath);
  
  if (!exists) {
    return NextResponse.json({ status: 'not_found', message: 'TransformFit repo not found locally' });
  }

  // Real git status
  const gitLog = run(`cd ${tfPath} && git log --oneline -5 2>/dev/null`);
  const commits = gitLog ? gitLog.split('\n').filter(Boolean) : [];
  
  // Real dart file count
  const dartCount = parseInt(run(`find ${tfPath}/lib -name "*.dart" 2>/dev/null | wc -l`)) || 0;
  
  // Real build status
  const buildExists = existsSync(join(tfPath, 'build', 'web', 'index.html'));
  
  // Real supabase functions
  const functionsDir = join(tfPath, 'supabase', 'functions');
  const functions = existsSync(functionsDir) 
    ? readdirSync(functionsDir).filter(f => !f.startsWith('_') && !f.startsWith('.')) 
    : [];
  
  // Real remote
  const remote = run(`cd ${tfPath} && git remote get-url origin 2>/dev/null`);
  
  // Check if deployed
  const deployed = run(`curl -s -o /dev/null -w '%{http_code}' https://transformfit.app 2>/dev/null`);
  
  // Real pubspec info
  const pubspecPath = join(tfPath, 'pubspec.yaml');
  let version = 'unknown';
  let description = '';
  if (existsSync(pubspecPath)) {
    const content = readFileSync(pubspecPath, 'utf-8');
    const versionMatch = content.match(/^version:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*"?(.+?)"?\s*$/m);
    if (versionMatch) version = versionMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
  }
  
  // Real feature modules
  const featuresDir = join(tfPath, 'lib', 'features');
  const features = existsSync(featuresDir) ? readdirSync(featuresDir).filter(f => statSync(join(featuresDir, f)).isDirectory()) : [];
  
  // Real screens
  const screensDir = join(tfPath, 'lib', 'screens');
  const screens = existsSync(screensDir) ? readdirSync(screensDir).filter(f => f.endsWith('.dart')) : [];
  
  return NextResponse.json({
    status: exists ? 'active' : 'not_found',
    repo: {
      path: tfPath,
      remote: remote || 'none',
      version: version,
      description: description,
      commits: commits.length,
      recentCommits: commits.slice(0, 5),
    },
    build: {
      webBuildExists: buildExists,
      buildPath: join(tfPath, 'build', 'web'),
      deployed: deployed !== '404' && deployed !== '000' && deployed !== '',
      deployedUrl: 'https://transformfit.app',
      deployedStatus: deployed,
    },
    code: {
      dartFiles: dartCount,
      features: features,
      screens: screens,
      supabaseFunctions: functions,
    },
    supabase: {
      configured: existsSync(join(tfPath, 'supabase', 'config.toml')),
      functionsCount: functions.length,
      hasTypes: existsSync(join(tfPath, 'supabase', 'types.ts')),
      migrations: existsSync(join(tfPath, 'supabase', 'migrations')) 
        ? readdirSync(join(tfPath, 'supabase', 'migrations')).length 
        : 0,
    },
    flutter: {
      installed: run('which flutter 2>/dev/null') !== '',
      version: run('flutter --version 2>/dev/null | head -1') || 'not installed',
    },
    real: true,
  });
}