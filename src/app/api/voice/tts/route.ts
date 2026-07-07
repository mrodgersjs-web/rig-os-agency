import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

// POST /api/voice/tts  { text, voice?, rate?, pitch? }  → audio/mpeg
// Uses edge-tts (Python) to generate speech audio.
export async function POST(req: Request) {
  try {
    const { text, voice, rate, pitch } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "missing text" }, { status: 400 });
    }

    const voiceName = voice || "en-US-GuyNeural";
    const rateStr = rate || "+10%";
    const pitchStr = pitch || "-5Hz";

    // Write to temp file, run edge-tts, read back
    const id = randomUUID();
    const outFile = join(tmpdir(), `jake-tts-${id}.mp3`);

    try {
      await execFileAsync("python3", ["-m", "edge_tts",
        "--voice", voiceName,
        "--rate", rateStr,
        "--pitch", pitchStr,
        "--text", text.slice(0, 4000),
        "--write-media", outFile,
      ], { timeout: 15000 });

      const audioBuf = await readFile(outFile);
      return new NextResponse(audioBuf, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-cache",
        },
      });
    } finally {
      // Cleanup temp file
      await unlink(outFile).catch(() => {});
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
