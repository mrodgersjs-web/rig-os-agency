import React from "react";
import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

const DATA_FILE = "/Users/rig128gb/.rig/agency/deals.json";

interface DealData {
  id: string;
  name: string;
  value: number;
  stage: string;
  contacts: Array<{ name: string; title: string }>;
  source?: string;
  notes?: string;
}

async function loadDeals(): Promise<DealData[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
  } catch (e) {
    const seed: DealData[] = [
      { id: crypto.randomUUID(), name: "Acme Corp Integration", value: 45000, stage: "proposal", contacts: [{ name: "Jane Doe", title: "CTO" }] },
      { id: crypto.randomUUID(), name: "Startup Scaling Package", value: 12000, stage: "negotiation", contacts: [{ name: "John Smith", title: "CEO" }], source: "linkedin" },
    ];
    fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function saveDeals(deals: DealData[]): Promise<void> {
  fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(deals, null, 2));
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const deals = await loadDeals();
  return NextResponse.json({ ok: true, data: deals });
}
