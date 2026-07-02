import { NextResponse } from "next/server";
import { minimaxToken } from "@/lib/hermesStudio";
import { readHermesEnv } from "@/lib/hermesPhone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/voicebox  { text, voiceId?, provider?, rate?, pitch? }
//   → { audio: dataURI }  (server-side TTS via ElevenLabs or MiniMax)
//   → { error }
//
// This endpoint proxies to Hermes TTS providers. For browser-side Web Speech
// API, the client calls voicebox.ts directly (no server round-trip needed).
// This route is for when you want server-rendered audio (higher quality).

function elevenKey(): string | null {
  try {
    const fromProfile = readHermesEnv().ELEVENLABS_API_KEY;
    if (fromProfile && fromProfile.trim()) return fromProfile.trim();
  } catch {
    /* ignore */
  }
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

async function elevenTts(
  text: string,
  voiceId: string,
  stability: number,
  similarity: number,
  style: number,
): Promise<NextResponse> {
  const key = elevenKey();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "ElevenLabs not connected — add ELEVENLABS_API_KEY to ~/.hermes/profiles/<active>/.env",
      },
      { status: 400 },
    );
  }
  const vid = /^[A-Za-z0-9]{16,}$/.test(voiceId)
    ? voiceId
    : "onwK4e9ZLuTAKqWW03F9"; // default: Daniel (British)
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128&optimize_streaming_latency=3`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability,
          similarity_boost: similarity,
          style,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    return NextResponse.json(
      { error: `ElevenLabs ${r.status}`, detail: detail.slice(0, 200) },
      { status: 502 },
    );
  }
  const buf = Buffer.from(await r.arrayBuffer());
  return NextResponse.json({ audio: `data:audio/mp3;base64,${buf.toString("base64")}` });
}

async function minimaxTts(text: string, voiceId: string): Promise<NextResponse> {
  const tok = minimaxToken();
  if (!tok)
    return NextResponse.json(
      { error: "MiniMax not connected (run `hermes auth add minimax-oauth`)." },
      { status: 400 },
    );
  const vid = /^[a-z0-9_-]+$/i.test(voiceId) ? voiceId : "male-qn-qingse";
  const tr = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "speech-02-turbo",
      text: text.slice(0, 4000),
      stream: false,
      voice_setting: { voice_id: vid, speed: 1.05, vol: 1, pitch: 0 },
      audio_setting: { format: "mp3", sample_rate: 32000, bitrate: 128000 },
    }),
  });
  const tj = await tr.json();
  const hex = tj?.data?.audio;
  if (!hex)
    return NextResponse.json(
      { error: "no audio", detail: tj?.base_resp ?? tj },
      { status: 502 },
    );
  return NextResponse.json({
    audio: `data:audio/mp3;base64,${Buffer.from(hex, "hex").toString("base64")}`,
  });
}

export async function POST(req: Request) {
  let body: {
    text?: string;
    voiceId?: string;
    provider?: string;
    rate?: number;
    pitch?: number;
    stability?: number;
    similarity?: number;
    style?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "missing text" }, { status: 400 });
  }

  const provider = body.provider === "minimax" ? "minimax" : "elevenlabs";
  const voiceId = typeof body.voiceId === "string" ? body.voiceId : "";
  const stability = typeof body.stability === "number" ? body.stability : 0.45;
  const similarity = typeof body.similarity === "number" ? body.similarity : 0.8;
  const style = typeof body.style === "number" ? body.style : 0.2;

  try {
    if (provider === "minimax") {
      return await minimaxTts(text, voiceId);
    }
    return await elevenTts(text, voiceId, stability, similarity, style);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET — health check + available voice presets
export async function GET() {
  const elevenConnected = !!elevenKey();
  const minimaxConnected = !!minimaxToken();

  const voicePresets = [
    {
      id: "onwK4e9ZLuTAKqWW03F9",
      label: "Daniel (British Butler)",
      provider: "elevenlabs",
    },
    {
      id: "pNInz6obpgDQGcFmaJgB",
      label: "Adam (Deep)",
      provider: "elevenlabs",
    },
    { id: "male-qn-qingse", label: "Male (MiniMax)", provider: "minimax" },
    { id: "female-shaonv", label: "Female (MiniMax)", provider: "minimax" },
    { id: "presenter_female", label: "Presenter (MiniMax)", provider: "minimax" },
  ];

  return NextResponse.json({
    providers: {
      elevenlabs: elevenConnected ? "connected" : "not_connected",
      minimax: minimaxConnected ? "connected" : "not_connected",
    },
    voicePresets,
  });
}