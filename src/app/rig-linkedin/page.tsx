"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, FileText, Image as ImageIcon, CheckCircle2, Clock,
  AlertTriangle, Users, Calendar, TrendingUp, Shield, Zap,
  RefreshCw, Loader2, Filter, ChevronDown, Search,
  ExternalLink, Lock, Award, Eye, Send,
} from "lucide-react";

interface LIPost {
  id: string;
  filename: string;
  vertical: string;
  title: string;
  status: "draft" | "queued" | "scheduled" | "published" | "approved";
  hasImage: boolean;
  bdfScore: number | null;
  antiGenericScore: number | null;
  wordCount: number;
  size: number;
  modifiedAt: string;
  preview: string;
  imageRulesPassed: boolean;
  imageViolations: string[];
}

interface Agent {
  name: string;
  role: string;
  status: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft:     { label: "Draft",     color: "var(--cream-dim)",  bg: "rgba(165,151,131,0.08)", icon: FileText },
  queued:    { label: "Queued",    color: "#7dd3fc",           bg: "rgba(125,211,252,0.1)",  icon: Clock },
  scheduled: { label: "Scheduled", color: "var(--gold)",       bg: "rgba(212,165,116,0.1)",  icon: Calendar },
  approved:  { label: "Approved",  color: "var(--emerald)",    bg: "rgba(90,184,150,0.1)",   icon: CheckCircle2 },
  published: { label: "Published", color: "var(--emerald)",    bg: "rgba(90,184,150,0.12)",  icon: Send },
};

const verticalColors: Record<string, string> = {
  construction: "#d4a574",
  law: "#5ab896",
  healthcare: "#ef4444",
  dental: "#22d3ee",
  cpa: "#fbbf24",
  services: "#a855f7",
  manufacturing: "#c97c5e",
  "pe_cfo": "#c4607e",
  general: "#6b7280",
};

export default function LinkedInStudioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [imageFilter, setImageFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/linkedin");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error("Failed to load LinkedIn data:", e);
    }
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  const posts: LIPost[] = data.posts || [];
  const kpis = data.kpis || {};
  const agents: Agent[] = data.agents || [];
  const verticals = data.verticals || [];

  // Apply filters
  const filtered = posts.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (verticalFilter !== "all" && p.vertical !== verticalFilter) return false;
    if (imageFilter === "with-images" && !p.hasImage) return false;
    if (imageFilter === "without-images" && p.hasImage) return false;
    if (imageFilter === "violations" && p.imageRulesPassed) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.preview.toLowerCase().includes(q) && !p.filename.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const imageCompliance = kpis.totalPosts > 0 ? Math.round((kpis.postsWithImages / kpis.totalPosts) * 100) : 0;
  const nonCompliant = posts.filter(p => !p.imageRulesPassed).length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={24} style={{ color: "#0a66c2" }} />
              <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)", fontWeight: 600 }}>
                LinkedIn Studio
              </span>
            </div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Post Manager
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--cream-dim)" }}>
              {kpis.totalPosts || 0} posts · {agents.length} agents · {verticals.length} verticals · BDF30 scoring · Image enforcement active
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line)", color: "var(--cream-dim)" }}
          >
            <RefreshCw size={14} />
            <span className="text-xs">Refresh</span>
          </button>
        </div>
      </motion.section>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard icon={FileText} label="Total Posts" value={kpis.totalPosts || 0} color="var(--cream)" />
          <KPICard icon={Send} label="Published" value={kpis.published || 0} color="var(--emerald)" />
          <KPICard icon={Clock} label="Queued" value={kpis.queued || 0} color="#7dd3fc" />
          <KPICard icon={FileText} label="Drafts" value={kpis.drafts || 0} color="var(--cream-dim)" />
          <KPICard icon={ImageIcon} label="With Images" value={kpis.postsWithImages || 0} color="var(--gold)" />
          <KPICard icon={AlertTriangle} label="No Image" value={kpis.postsWithoutImages || 0} color="var(--plum)" />
        </div>
      </motion.section>

      {/* ── Image Enforcement Banner ───────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div
          className="rounded-xl p-5 flex items-start gap-4"
          style={{
            background: nonCompliant > 0 ? "rgba(196,96,126,0.08)" : "rgba(90,184,150,0.08)",
            border: `1px solid ${nonCompliant > 0 ? "rgba(196,96,126,0.25)" : "rgba(90,184,150,0.25)"}`,
          }}
        >
          <Shield size={28} style={{ color: nonCompliant > 0 ? "var(--plum)" : "var(--emerald)", flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                Image Enforcement — Mike&apos;s Rules (Gate-D)
              </h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: nonCompliant > 0 ? "rgba(196,96,126,0.2)" : "rgba(90,184,150,0.2)",
                  color: nonCompliant > 0 ? "var(--plum)" : "var(--emerald)",
                }}
              >
                {nonCompliant > 0 ? `${nonCompliant} VIOLATIONS` : "ALL COMPLIANT"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {(data.imageRules?.rules || []).map((rule: any) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
                >
                  {rule.severity === "hard-block" ? (
                    <Lock size={12} style={{ color: "var(--plum)" }} />
                  ) : (
                    <AlertTriangle size={12} style={{ color: "var(--gold)" }} />
                  )}
                  <span className="text-xs" style={{ color: "var(--cream-dim)" }}>{rule.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--cream-dim)" }}>Image compliance:</span>
                <span className="text-sm font-bold" style={{ color: imageCompliance >= 80 ? "var(--emerald)" : "var(--plum)" }}>
                  {imageCompliance}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--cream-dim)" }}>Approval:</span>
                <span className="text-xs" style={{ color: "var(--gold)" }}>{data.approvalProtocol?.cadence || "Weekly Monday"}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Agent Roster ───────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} style={{ color: "var(--gold)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
            Agent Panel — {agents.length} Specialists
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {agents.map((agent, i) => (
            <div
              key={i}
              className="rounded-lg p-3 flex flex-col items-center text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-2 text-xs font-bold"
                style={{ background: "rgba(212,165,116,0.15)", color: "var(--gold)" }}
              >
                {agent.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--cream)" }}>{agent.name}</div>
              <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{agent.role}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--emerald)" }} />
                <span className="text-[9px] uppercase" style={{ color: "var(--cream-dim)" }}>{agent.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Infrastructure Status ──────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfraCard
            label="Postiz"
            installed={data.infrastructure?.postizInstalled}
            detail={data.infrastructure?.postizAuthenticated ? "Authenticated" : "Not authenticated"}
          />
          <InfraCard
            label="Scheduler"
            installed={data.infrastructure?.schedulerActive}
            detail={data.infrastructure?.schedulerStatus || "not loaded"}
          />
          <InfraCard
            label="Receipt Ledger"
            installed={data.infrastructure?.receiptLedgerExists}
            detail={`${kpis.receiptCount || 0} entries`}
          />
          <InfraCard
            label="LinkedIn Studio"
            installed={data._truth?.linkedinStudioExists}
            detail={data._truth?.studioRepoExists ? "Repo + Desktop" : "Checking paths"}
          />
        </div>
      </motion.section>

      {/* ── Filters ────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter size={14} style={{ color: "var(--cream-dim)" }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Filter:</span>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={posts.length} />
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = posts.filter(p => p.status === key).length;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={key}
                  active={filter === key}
                  onClick={() => setFilter(key)}
                  label={cfg.label}
                  count={count}
                  color={cfg.color}
                />
              );
            })}
          </div>

          {/* Image filter */}
          <div className="flex items-center gap-1 ml-2">
            <FilterChip active={imageFilter === "all"} onClick={() => setImageFilter("all")} label="All Images" />
            <FilterChip active={imageFilter === "with-images"} onClick={() => setImageFilter("with-images")} label="✓ Image" />
            <FilterChip active={imageFilter === "without-images"} onClick={() => setImageFilter("without-images")} label="✗ No Image" color="var(--plum)" />
            <FilterChip active={imageFilter === "violations"} onClick={() => setImageFilter("violations")} label="⚠ Violations" color="var(--gold)" />
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 ml-auto">
            <Search size={14} style={{ color: "var(--cream-dim)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="text-xs px-3 py-1.5 rounded-lg outline-none w-48"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
            />
          </div>
        </div>
      </motion.section>

      {/* ── Post List ──────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        {filtered.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}>
            <FileText size={40} style={{ color: "var(--cream-dim)", opacity: 0.3, margin: "0 auto 12px" }} />
            <p className="text-sm" style={{ color: "var(--cream-dim)" }}>
              No posts found{posts.length === 0 ? " — LinkedIn studio directories may be empty" : " matching filters"}
            </p>
            {posts.length === 0 && (
              <p className="text-xs mt-2" style={{ color: "var(--cream-mute)" }}>
                Checked: ~/Desktop/rig-linkedin-studio, ai-company/proof, RIGForge/repos
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((post, i) => {
                const cfg = statusConfig[post.status] || statusConfig.draft;
                const vColor = verticalColors[post.vertical] || verticalColors.general;
                const isExpanded = expandedPost === post.id;

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: i * 0.02 }}
                    className="rounded-lg overflow-hidden"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
                  >
                    {/* Post row */}
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer transition"
                      onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                    >
                      {/* Status icon */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: cfg.bg }}
                      >
                        <cfg.icon size={14} style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate" style={{ color: "var(--cream)" }}>
                            {post.title}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: `${vColor}15`, color: vColor }}
                          >
                            {post.vertical}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: "var(--cream-dim)" }}>
                          {post.preview}
                        </p>

                        {/* Meta badges */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
                            {post.filename}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                            {post.wordCount} words
                          </span>
                          {/* Image badge */}
                          {post.hasImage ? (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--emerald)" }}>
                              <ImageIcon size={10} /> Image OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--plum)" }}>
                              <AlertTriangle size={10} /> NO IMAGE
                            </span>
                          )}
                          {/* BDF score */}
                          {post.bdfScore != null && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--gold)" }}>
                              <Award size={10} /> BDF {post.bdfScore}
                            </span>
                          )}
                          {/* Anti-generic */}
                          {post.antiGenericScore != null && (
                            <span className="text-[10px]" style={{ color: post.antiGenericScore >= 85 ? "var(--emerald)" : "var(--gold)" }}>
                              AG {post.antiGenericScore}/100
                            </span>
                          )}
                          {/* Violations */}
                          {post.imageViolations.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--plum)" }}>
                              <Lock size={10} /> {post.imageViolations.length} violation(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <span
                          className="text-[10px] px-2 py-1 rounded-full font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={14} style={{ color: "var(--cream-dim)" }} />
                        ) : (
                          <Eye size={14} style={{ color: "var(--cream-dim)" }} />
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
                            {/* Image violations detail */}
                            {post.imageViolations.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {post.imageViolations.map((v, vi) => (
                                  <div key={vi} className="flex items-center gap-2 text-xs" style={{ color: "var(--plum)" }}>
                                    <Lock size={10} />
                                    <span>{v}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* File details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                              <DetailItem label="Modified" value={new Date(post.modifiedAt).toLocaleDateString()} />
                              <DetailItem label="File Size" value={`${(post.size / 1024).toFixed(1)} KB`} />
                              <DetailItem label="Word Count" value={`${post.wordCount}`} />
                              <DetailItem label="Has Image" value={post.hasImage ? "Yes" : "NO"} color={post.hasImage ? "var(--emerald)" : "var(--plum)"} />
                            </div>

                            {/* Approval protocol reminder */}
                            <div
                              className="rounded-lg p-3 mt-2"
                              style={{ background: "rgba(212,165,116,0.05)", border: "1px solid rgba(212,165,116,0.15)" }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Shield size={12} style={{ color: "var(--gold)" }} />
                                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gold)", fontWeight: 600 }}>
                                  Gate-D Approval Required
                                </span>
                              </div>
                              <p className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                                Weekly Monday approval only. Mike reviews individually. Never bulk-publish.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="text-center pt-4">
        <p className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
          {data._truth?.note || "Scanned from filesystem · No live LinkedIn API connection"}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
    >
      <Icon size={16} style={{ color }} />
      <div className="text-2xl font-bold mt-1" style={{ color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
        {label}
      </div>
    </div>
  );
}

function InfraCard({ label, installed, detail }: { label: string; installed?: boolean; detail: string }) {
  const ok = !!installed;
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: ok ? "var(--emerald)" : "var(--plum)" }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium" style={{ color: "var(--cream)" }}>{label}</div>
        <div className="text-[10px]" style={{ color: ok ? "var(--emerald)" : "var(--cream-dim)" }}>{detail}</div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, count, color }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-xs transition"
      style={{
        background: active ? "rgba(212,165,116,0.15)" : "transparent",
        border: `1px solid ${active ? "var(--line)" : "var(--line-soft)"}`,
        color: active ? (color || "var(--gold)") : "var(--cream-dim)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}{count != null && ` ${count}`}
    </button>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{label}</div>
      <div className="text-xs font-medium" style={{ color: color || "var(--cream)" }}>{value}</div>
    </div>
  );
}
