"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { LinkedinIcon, InstagramIcon, TwitterIcon } from "@/components/BrandIcons";

const C = {
  bg: "var(--rig-bg)", card: "var(--rig-card)", text: "var(--rig-text)",
  text2: "var(--rig-text-2)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", borderSoft: "var(--rig-border-soft)",
  hover: "var(--rig-hover)", active: "var(--rig-active)",
  gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)",
  plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  orange: "var(--rig-orange)", orangeBg: "var(--rig-orange-bg)",
  purple: "var(--rig-purple)", purpleBg: "var(--rig-purple-bg)",
};

function TruthDot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 size={12} style={{ color: C.emerald }} />
  ) : (
    <XCircle size={12} style={{ color: C.red }} />
  );
}

export default function SocialPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/social");
      const json = await r.json();
      setData(json);
      setLastFetch(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20" style={{ background: C.bg, minHeight: "50vh" }}>
        <div className="text-[13px]" style={{ color: C.mute }}>Loading social channels…</div>
      </div>
    );
  }

  const li = data.linkedin || {};
  const ig = data.instagram || {};
  const tw = data.twitter || {};
  const truth = data._truth || {};
  const postiz = data.postiz || {};

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ background: C.blueBg }}>
              <TrendingUp size={20} style={{ color: C.blue }} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold" style={{ color: C.text }}>Social Media Hub</h1>
              <p className="text-[12px]" style={{ color: C.mute }}>
                Truth-aware channel status · LinkedIn (Postiz) · Instagram · Twitter/X
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition hover:bg-black/[0.02] disabled:opacity-50"
              style={{ borderColor: C.border, color: C.text2, background: C.card }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <span className="text-[11px]" style={{ color: C.mute }}>
              {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : ""}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Truth banner */}
      <div className="rounded-xl p-4 border mb-6" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: C.gold }} />
          <div className="flex-1">
            <p className="text-[12px] font-semibold" style={{ color: C.text }}>
              {truth.note || "Follower/engagement numbers require platform APIs. Published/queued counts from local files only."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: "Postiz installed", val: truth.postizInstalled },
            { label: "Postiz authenticated", val: truth.postizAuthenticated },
            { label: "LinkedIn studio", val: truth.linkedinStudioExists },
            { label: "Operator", val: truth.operatorExists },
            { label: "Probe", val: truth.probeExists },
            { label: "Scheduler loaded", val: truth.schedulerLoaded },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[11px]"
              style={{ borderColor: C.borderSoft, background: C.bg }}
            >
              <TruthDot ok={!!t.val} />
              <span style={{ color: C.text2 }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LinkedIn Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-5 border"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center w-9 h-9 rounded-lg" style={{ background: "#e0eaff" }}>
                <LinkedinIcon size={18} color="#0a66c2" />
              </div>
              <h2 className="text-[16px] font-bold" style={{ color: C.text }}>LinkedIn</h2>
            </div>
            <a
              href={li.coPageUrl || "https://linkedin.com"}
              target="_blank" rel="noopener"
              className="text-[11px] flex items-center gap-0.5"
              style={{ color: C.blue }}
            >
              Company <ExternalLink size={10} />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Followers</div>
              <div className="text-[15px] font-bold" style={{ color: C.blue }}>{li.followers || "—"}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Engagement</div>
              <div className="text-[15px] font-bold" style={{ color: C.blue }}>{li.engagementRate || "—"}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Published</div>
              <div className="text-[15px] font-bold" style={{ color: C.emerald }}>{li.publishedPostsFound ?? li.publishedFromObsidian ?? 0}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Queued</div>
              <div className="text-[15px] font-bold" style={{ color: C.gold }}>{li.queuedPostsFound ?? li.queuedFromObsidian ?? 0}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: C.mute }}>DM Services</div>
            {li.dmServices && Object.entries(li.dmServices).map(([slot, status]: any) => (
              <div key={slot} className="flex items-center justify-between text-[11px] px-2 py-1 rounded" style={{ background: C.hover }}>
                <span className="capitalize" style={{ color: C.text2 }}>{slot}</span>
                <span className="text-[10px] font-semibold" style={{ color: status === "loaded" ? C.emerald : C.orange }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Instagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 border"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center w-9 h-9 rounded-lg" style={{ background: "#fce7f3" }}>
                <InstagramIcon size={18} color="#ec4899" />
              </div>
              <h2 className="text-[16px] font-bold" style={{ color: C.text }}>Instagram</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: C.redBg, color: C.red }}>
              No API
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Followers</div>
              <div className="text-[15px] font-bold" style={{ color: "#ec4899" }}>{ig.followers || "—"}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Engagement</div>
              <div className="text-[15px] font-bold" style={{ color: "#ec4899" }}>{ig.engagementRate || "—"}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Posts/Week</div>
              <div className="text-[15px] font-bold" style={{ color: C.plum }}>{ig.postsThisWeek ?? 0}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Story Views</div>
              <div className="text-[15px] font-bold" style={{ color: C.plum }}>{ig.storyViews ?? 0}</div>
            </div>
          </div>
          <div className="text-[11px] p-2 rounded" style={{ background: C.hover, color: C.text3 }}>
            {ig.note || "Instagram credentials not configured — counts unavailable."}
          </div>
        </motion.div>

        {/* Twitter/X */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-5 border"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center w-9 h-9 rounded-lg" style={{ background: "#dbeafe" }}>
                <TwitterIcon size={18} color="#1d9bf0" />
              </div>
              <h2 className="text-[16px] font-bold" style={{ color: C.text }}>Twitter / X</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: C.redBg, color: C.red }}>
              No API
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Followers</div>
              <div className="text-[15px] font-bold" style={{ color: "#1d9bf0" }}>{tw.followers || "—"}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Posts/Week</div>
              <div className="text-[15px] font-bold" style={{ color: "#1d9bf0" }}>{tw.postsThisWeek ?? 0}</div>
            </div>
            <div className="rounded-lg p-2.5 border" style={{ borderColor: C.borderSoft, background: C.bg }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>Engagement</div>
              <div className="text-[15px] font-bold" style={{ color: "#1d9bf0" }}>{tw.engagementRate || "—"}</div>
            </div>
          </div>
          <div className="text-[11px] p-2 rounded" style={{ background: C.hover, color: C.text3 }}>
            {tw.note || "Twitter/X credentials not configured — counts unavailable."}
          </div>
        </motion.div>
      </div>

      {/* Postiz integration footer */}
      <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: postiz.authenticated ? C.emeraldBg : C.orangeBg }}>
              {postiz.authenticated ? (
                <CheckCircle2 size={14} style={{ color: C.emerald }} />
              ) : (
                <AlertCircle size={14} style={{ color: C.orange }} />
              )}
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>Postiz Scheduler</div>
              <div className="text-[10px] font-mono" style={{ color: C.mute }}>
                {postiz.path || "—"}
              </div>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: C.mute }}>
            env: <code style={{ background: C.hover, padding: "0 4px", borderRadius: 3 }}>{postiz.envFile || "—"}</code>
          </div>
        </div>
      </div>
    </div>
  );
}