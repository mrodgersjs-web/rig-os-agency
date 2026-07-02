// ── Obsidian Vault API ───────────────────────────────────────────────
// GET /api/obsidian?action=recent&limit=12
// GET /api/obsidian?action=search&q=...
// GET /api/obsidian?action=stats
// GET /api/obsidian?action=note&path=...
// GET /api/obsidian?action=list&maxNotes=100

import { NextRequest, NextResponse } from "next/server";
import { listNotes, searchNotes, getNote, getRecentNotes, getVaultStats } from "@/lib/obsidian";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "recent";
  const limit = parseInt(searchParams.get("limit") ?? "12", 10);
  const query = searchParams.get("q") ?? "";
  const path = searchParams.get("path") ?? "";
  const maxNotes = parseInt(searchParams.get("maxNotes") ?? "100", 10);

  try {
    switch (action) {
      case "recent": {
        const notes = await getRecentNotes(limit);
        return NextResponse.json({ action: "recent", count: notes.length, notes });
      }

      case "search": {
        if (!query.trim()) {
          return NextResponse.json({ action: "search", count: 0, notes: [], error: "Missing query parameter 'q'" }, { status: 400 });
        }
        const notes = await searchNotes(query.trim(), limit);
        return NextResponse.json({ action: "search", query, count: notes.length, notes });
      }

      case "stats": {
        const stats = await getVaultStats();
        return NextResponse.json({ action: "stats", stats });
      }

      case "note": {
        if (!path.trim()) {
          return NextResponse.json({ action: "note", error: "Missing path parameter" }, { status: 400 });
        }
        const note = await getNote(path);
        if (!note) {
          return NextResponse.json({ action: "note", error: "Note not found", path }, { status: 404 });
        }
        return NextResponse.json({ action: "note", note });
      }

      case "list": {
        const notes = await listNotes({ maxNotes, withPreview: false });
        return NextResponse.json({ action: "list", count: notes.length, notes });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Use: recent, search, stats, note, list` }, { status: 400 });
    }
  } catch (err) {
    console.error("[obsidian] API error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}