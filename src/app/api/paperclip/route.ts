import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Paperclip API — reads real company data from the paperclip-companies directory
// and the dispatch log

async function getPaperclipData() {
  const companiesDir = "/Users/rig128gb/.agentic-os/paperclip-companies";
  const dispatchLog = path.join(companiesDir, "dispatch_log.jsonl");

  let companies: any[] = [];
  let dispatchEntries: any[] = [];

  // Read company directories
  if (existsSync(companiesDir)) {
    const entries = await readdir(companiesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const companyPath = path.join(companiesDir, entry.name);
        let companyData: any = {
          id: entry.name,
          name: entry.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          slug: entry.name,
          status: "registered",
          agents: 0,
          tasks: [],
          lastActivity: null,
        };

        // Check for company config
        try {
          const configPath = path.join(companyPath, "config.json");
          if (existsSync(configPath)) {
            const config = JSON.parse(await readFile(configPath, "utf-8"));
            companyData.config = config;
            if (config.name) companyData.name = config.name;
          }
        } catch {}

        // Count agents/skills in the company
        try {
          const subEntries = await readdir(companyPath, { withFileTypes: true });
          const agentDirs = subEntries.filter((e) => e.isDirectory());
          companyData.agents = agentDirs.length;
          companyData.agentList = agentDirs.map((e) => e.name);
        } catch {}

        // Get last modified time
        try {
          const stats = await stat(companyPath);
          companyData.lastActivity = stats.mtime.toISOString();
          companyData.registeredAt = stats.birthtime.toISOString();
        } catch {}

        companies.push(companyData);
      }
    }
  }

  // Read dispatch log
  if (existsSync(dispatchLog)) {
    try {
      const logContent = await readFile(dispatchLog, "utf-8");
      const lines = logContent.trim().split("\n");
      for (const line of lines) {
        try {
          dispatchEntries.push(JSON.parse(line));
        } catch {}
      }
    } catch {}
  }

  return { companies, dispatchEntries };
}

async function checkPaperclipRunning(): Promise<{ running: boolean; port: number; url: string }> {
  try {
    const res = await fetch("http://127.0.0.1:3100/", { signal: AbortSignal.timeout(2000) });
    return { running: res.ok || res.status === 404, port: 3100, url: "http://127.0.0.1:3100" };
  } catch {
    return { running: false, port: 3100, url: "http://127.0.0.1:3100" };
  }
}

export async function GET() {
  try {
    const [{ companies, dispatchEntries }, serverStatus] = await Promise.all([
      getPaperclipData(),
      checkPaperclipRunning(),
    ]);

    return NextResponse.json({
      server: serverStatus,
      companies: {
        total: companies.length,
        items: companies,
      },
      dispatch: {
        total: dispatchEntries.length,
        recent: dispatchEntries.slice(-20).reverse(),
      },
      summary: {
        totalCompanies: companies.length,
        totalDispatches: dispatchEntries.length,
        activeAgents: companies.reduce((s, c) => s + (c.agents || 0), 0),
        serverRunning: serverStatus.running,
        operational247: serverStatus.running,
        lastDispatch: dispatchEntries.length > 0 ? dispatchEntries[dispatchEntries.length - 1]?.timestamp : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
