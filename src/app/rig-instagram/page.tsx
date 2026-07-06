"use client";

// ── RIG OS Agency — Instagram Studio ─────────────────────────────────
// Wires to /api/agency/social (the real Postiz + LinkedIn studio +
// receipt_ledger introspection). Surfaces truthful "unknown — requires
// API" badges where we don't have an Instagram API integration yet,
// rather than fabricating follower/engagement numbers.
//
// Design: Midnight Aubergine (--bg-deep / --cream / --gold).
// Auto-refresh every 60s. Doctrine footer.

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CopilotDrawer, PERSONAS } from "@/components/CopilotDrawer";
import {
  Camera, Heart, MessageCircle, Bookmark, BarChart3,
  Image as ImageIcon, Film, Users, TrendingUp, Plus, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle,
  Hash, AtSign, Clock, ExternalLink, Layers, Eye,
} from "lucide-react";

interface SocialTruth {
  postizInstalled: boolean;
  postizAuthenticated: boolean;
  linkedinStudioExists: boolean;
  operatorExists: boolean;
  probeExists: boolean;
  schedulerLoaded: boolean;
  real: boolean;
  note: string;
}

interface LinkedInBlock {
  coPageId: string;
  coPageUrl: string;
  followers: string;
  publishedPostsFound: number;
  queuedPostsFound: number;
  campaignPosts: number;
  scheduler: string;
  dmServices: { morning: string; afternoon: string; evening: string };
  operator: string;
  capabilityProbe: string;
  receiptLedger: string;
  publishedFromObsidian: number;
  queuedFromObsidian: number;
}

interface InstagramBlock {
  followers: string;
  postsThisWeek: number;
  engagementRate: string;
  note: string;
}

interface TwitterBlock {
  followers: string;
  postsThisWeek: number;
  engagementRate: string;
  note: string;
}

interface PostizBlock {
  installed: boolean;
  path: string;
  authenticated: boolean;
  envFile: string;
}

interface SocialData {
  _truth: SocialTruth;
  linkedin: LinkedInBlock;
  instagram: InstagramBlock;
  twitter: TwitterBlock;
  postiz: PostizBlock;
  real: boolean;
}

const C = {
  bg: "var(--bg-deep)",
  bgMid: "var(--bg-mid)",
  card: "var(--bg-card)",
  elev: "var(--bg-elev)",
  text: "var(--cream)",
  text2: "var(--cream-soft)",
  text3: "var(--cream-dim)",
  mute: "var(--cream-mute)",
  border: "var(--line-soft)",
  borderHot: "var(--line)",
  gold: "var(--gold)",
  goldSoft: "var(--gold-soft)",
  emerald: "var(--emerald)",
  plum: "var(--plum)",
  igPink: "#E1306C",
  igPurple: "#833AB4",
  igOrange: "#F77737",
  igRed: "#f43f5e",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function UnknownBadge({ label = "requires API" }: { label?: string }) {
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ background: "rgba(196,96,126,0.10)", color: "var(--plum)", border: "1px solid rgba(196,96,126,0.25)" }}
    >
      <AlertTriangle size={9} />
      {label}
    </span>
  );
}

function LiveBadge() {
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ background: "rgba(90,184,150,0.12)", color: "var(--emerald)", border: "1px solid rgba(90,184,150,0.30)" }}
    >
      <CheckCircle2 size={9} />
      live
    </span>
  );
}

function LoadedBadge({ loaded }: { loaded: boolean }) {
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{
        background: loaded ? "rgba(90,184,150,0.12)" : "rgba(165,151,131,0.12)",
        color: loaded ? "var(--emerald)" : "var(--cream-dim)",
        border: loaded ? "1px solid rgba(90,184,150,0.30)" : "1px solid var(--line-soft)",
      }}
    >
      {loaded ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
      {loaded ? "loaded" : "not loaded"}
    </span>
  );
}

export default function InstagramStudioPage() {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persona = PERSONAS.instagram;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/agency/social", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SocialData = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message || "Failed to load social data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(() => load(true), 60_000);
    return () => clearInterval(i);
  }, [load]);

  const kpis = useMemo(() => {
    if (!data) return [];
    const li = data.linkedin;
    return [
      {
        label: "Instagram Followers",
        value: data.instagram.followers,
        icon: Users,
        color: C.igPink,
        sub: data.instagram.note,
        unknown: true,
      },
      {
        label: "IG Engagement",
        value: data.instagram.engagementRate,
        icon: Heart,
        color: C.igRed,
        sub: "Posts this week: " + data.instagram.postsThisWeek,
        unknown: true,
      },
      {
        label: "LinkedIn Published",
        value: li.publishedFromObsidian.toString(),
        icon: CheckCircle2,
        color: C.emerald,
        sub: `From Obsidian session log`,
        unknown: false,
      },
      {
        label: "LinkedIn Queued",
        value: li.queuedFromObsidian.toString(),
        icon: Clock,
        color: C.gold,
        sub: `Campaign posts: ${li.campaignPosts}`,
        unknown: false,
      },
    ];
  }, [data]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-3xl tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
          >
            Instagram Studio
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--cream-mute)" }}>
            Loading real social telemetry from /api/agency/social…
          </p>
        </div>
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}>
          <RefreshCw className="animate-spin mx-auto mb-3" size={28} style={{ color: "var(--gold)" }} />
          <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Querying Postiz runtime + LinkedIn studio…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Camera size={22} style={{ color: C.igPink }} />
              <span
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
              >
                Studios
              </span>
              {data?.real && <LiveBadge />}
              {lastRefresh && (
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                  refreshed {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
            <h1
              className="text-3xl tracking-tight"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
            >
              Instagram <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Studio</span>
            </h1>
            <p className="text-[13px] mt-1 max-w-2xl" style={{ color: "var(--cream-mute)" }}>
              Truthful surface for visual storytelling. Wired to /api/agency/social. Where APIs aren't connected,
              we say <em>unknown — requires API</em> instead of fabricating numbers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition text-[12px]"
              style={{
                background: "var(--bg-card)",
                color: "var(--cream-dim)",
                border: "1px solid var(--line-soft)",
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition text-[13px]"
              style={{ background: `${persona.accent}20`, color: persona.accent, border: `1px solid ${persona.accent}44` }}
            >
              <div
                className="grid place-items-center w-6 h-6 rounded-md font-bold text-[10px]"
                style={{ background: `${persona.accent}33` }}
              >
                {persona.glyph}
              </div>
              Ask {persona.name}
            </button>
          </div>
        </div>
        {error && (
          <div
            className="mt-3 rounded-lg p-3 text-[12px] flex items-center gap-2"
            style={{ background: "rgba(196,96,126,0.08)", border: "1px solid rgba(196,96,126,0.25)", color: "var(--plum)" }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}
      </motion.section>

      {/* KPI Strip */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-xl p-4 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="grid place-items-center w-7 h-7 rounded-md"
                    style={{ background: `${k.color}18`, color: k.color }}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                    {k.label}
                  </span>
                </div>
                <div
                  className="text-[20px] mb-1"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: k.color }}
                >
                  {k.value}
                </div>
                <div className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--cream-mute)" }}>
                  <span className="truncate">{k.sub}</span>
                  {k.unknown && <UnknownBadge />}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Postiz Runtime */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> Postiz Runtime
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={14} style={{ color: "var(--gold)" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                Installed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {data?.postiz.installed ? (
                <CheckCircle2 size={16} style={{ color: "var(--emerald)" }} />
              ) : (
                <XCircle size={16} style={{ color: "var(--plum)" }} />
              )}
              <span className="text-[13px]" style={{ color: "var(--cream)" }}>
                {data?.postiz.installed ? "installed" : "not installed"}
              </span>
            </div>
            <div className="text-[10px] mt-1 mono truncate" style={{ color: "var(--cream-mute)" }}>
              {data?.postiz.path}
            </div>
          </div>
          <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-2">
              <AtSign size={14} style={{ color: "var(--gold)" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                Authenticated
              </span>
            </div>
            <div className="flex items-center gap-2">
              {data?.postiz.authenticated ? (
                <CheckCircle2 size={16} style={{ color: "var(--emerald)" }} />
              ) : (
                <XCircle size={16} style={{ color: "var(--plum)" }} />
              )}
              <span className="text-[13px]" style={{ color: "var(--cream)" }}>
                {data?.postiz.authenticated ? "credentials present" : "no .postiz_env"}
              </span>
            </div>
            <div className="text-[10px] mt-1 mono truncate" style={{ color: "var(--cream-mute)" }}>
              {data?.postiz.envFile}
            </div>
          </div>
          <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Hash size={14} style={{ color: "var(--gold)" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                LinkedIn Co Page
              </span>
            </div>
            <a
              href={data?.linkedin.coPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px]"
              style={{ color: "var(--cream)" }}
            >
              {data?.linkedin.coPageId}
              <ExternalLink size={11} style={{ color: "var(--cream-dim)" }} />
            </a>
            <div className="text-[10px] mt-1 mono truncate" style={{ color: "var(--cream-mute)" }}>
              rodgersintelligence
            </div>
          </div>
        </div>
      </motion.section>

      {/* Truth + Doctrines */}
      {data?._truth && (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
              <span style={{ color: "var(--gold)" }}>II.</span> Truth Layer
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
          </div>
          <div
            className="rounded-xl p-5 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Postiz binary", ok: data._truth.postizInstalled },
                { label: "Postiz auth", ok: data._truth.postizAuthenticated },
                { label: "LinkedIn studio", ok: data._truth.linkedinStudioExists },
                { label: "Scheduler", ok: data._truth.schedulerLoaded },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  {t.ok ? (
                    <CheckCircle2 size={13} style={{ color: "var(--emerald)" }} />
                  ) : (
                    <XCircle size={13} style={{ color: "var(--plum)" }} />
                  )}
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{t.label}</span>
                </div>
              ))}
            </div>
            <div
              className="rounded-lg p-3 text-[11px] leading-relaxed"
              style={{ background: "rgba(212,165,116,0.06)", border: "1px solid rgba(212,165,116,0.18)", color: "var(--cream-dim)" }}
            >
              <strong style={{ color: "var(--gold)" }}>Why so much is "unknown"</strong> — Instagram / Twitter / X follower counts and engagement rates require first-party API credentials we don't have wired here. Per RIG doctrine, we don't fabricate. When the credential comes online, this page lights up automatically.
            </div>
          </div>
        </motion.section>
      )}

      {/* LinkedIn cross-section (real data) */}
      {data?.linkedin && (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
              <span style={{ color: "var(--gold)" }}>III.</span> LinkedIn Cross-Section (real receipts)
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Published", value: data.linkedin.publishedFromObsidian, color: "var(--emerald)" },
              { label: "Queued", value: data.linkedin.queuedFromObsidian, color: "var(--gold)" },
              { label: "On disk", value: data.linkedin.publishedPostsFound, color: "var(--gold-soft)" },
              { label: "Campaign", value: data.linkedin.campaignPosts, color: "var(--cream)" },
              { label: "DM morning", value: data.linkedin.dmServices.morning, color: "var(--cream-dim)" },
            ].map((m, i) => (
              <div
                key={m.label}
                className="rounded-xl p-3 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>
                  {m.label}
                </div>
                <div
                  className="text-[18px]"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: m.color }}
                >
                  {String(m.value)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <LoadedBadge loaded={data.linkedin.scheduler === "loaded"} />
            <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>scheduler</span>
            <LoadedBadge loaded={data.linkedin.dmServices.morning === "loaded"} />
            <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>dm morning</span>
            <LoadedBadge loaded={data.linkedin.dmServices.afternoon === "loaded"} />
            <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>dm afternoon</span>
            <LoadedBadge loaded={data.linkedin.dmServices.evening === "loaded"} />
            <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>dm evening</span>
          </div>
        </motion.section>
      )}

      {/* Content Plan (truthful, no fabrication) */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>IV.</span> Content Plan
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                Pipeline (LinkedIn queue → IG when Postiz auth extends)
              </h3>
              <button
                disabled
                className="text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 opacity-50 cursor-not-allowed"
                style={{ background: "rgba(212,165,116,0.08)", color: "var(--gold)", border: "1px solid rgba(212,165,116,0.20)" }}
                title="Disabled until IG channel is configured in Postiz"
              >
                <Plus size={12} /> New Post
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { type: "Reel", caption: "Behind the scenes: RIG OS 1000x build", status: "linkedin-draft", note: "ready to push to IG once channel is wired" },
                { type: "Carousel", caption: "5 Brier-calibrated metrics that matter", status: "linkedin-draft", note: "image set in /Desktop/rig-linkedin-studio" },
                { type: "Story", caption: "Jake composer — proof packet landed", status: "linkedin-queued", note: "10 slots in obsidian queue" },
              ].map((post, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}
                >
                  <div
                    className="grid place-items-center w-10 h-10 rounded-md shrink-0"
                    style={{ background: `${C.igPurple}22`, color: C.igPurple }}
                  >
                    {post.type === "Reel" ? <Film size={16} /> : post.type === "Carousel" ? <ImageIcon size={16} /> : <Camera size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
                      {post.caption}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                      {post.type} · {post.note}
                    </div>
                  </div>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(212,165,116,0.12)",
                      color: "var(--gold)",
                      border: "1px solid rgba(212,165,116,0.30)",
                    }}
                  >
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <h3 className="text-[14px] font-semibold mb-4" style={{ color: "var(--cream)" }}>
              Channel Status
            </h3>
            <div className="space-y-2.5">
              {[
                { ch: "Instagram", status: data?.instagram.note || "no API", icon: Camera, color: C.igPink },
                { ch: "Twitter / X", status: data?.twitter.note || "no API", icon: MessageCircle, color: "#1da1f2" },
                { ch: "LinkedIn", status: data?.linkedin.publishedFromObsidian ? `${data.linkedin.publishedFromObsidian} published via Obsidian` : "via Postiz", icon: Users, color: "#0a66c2" },
                { ch: "TikTok", status: "no API", icon: Film, color: "#ff0050" },
                { ch: "YouTube Shorts", status: "no API", icon: Eye, color: "#ff0000" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.ch}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}
                  >
                    <div
                      className="grid place-items-center w-9 h-9 rounded-md shrink-0"
                      style={{ background: `${row.color}18`, color: row.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{row.ch}</div>
                      <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{row.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Doctrine Footer */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div
          className="rounded-xl p-4 text-[11px] leading-relaxed"
          style={{
            background: "rgba(90,184,150,0.06)",
            border: "1px solid rgba(90,184,150,0.18)",
            color: "var(--cream-dim)",
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <strong style={{ color: "var(--emerald)" }}>Doctrine:</strong>{" "}
          No source, no number. No mechanism, no claim. Instagram follower / engagement metrics require a first-party
          Instagram Graph API credential — we surface that gap honestly rather than fabricate.{" "}
          <span style={{ color: "var(--gold)" }}>Auto-refresh every 60s.</span>
        </div>
      </motion.section>

      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} personaId="instagram" />
    </div>
  );
}