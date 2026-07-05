"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Send, Calendar, Trash2, Edit3, Plus, X,
  TrendingUp, Eye, Heart, MessageCircle, Bookmark, AlertTriangle,
  Clock, CheckCircle2, BarChart3, Filter,
} from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/* ── Types ────────────────────────────────────────────────────────────────── */
type PostStatus = "draft" | "scheduled" | "published" | "archived";

interface DraftPost {
  id: string;
  content: string;
  imageUrl: string | null;
  imageName: string | null;
  scheduledDate: string | null;
  status: PostStatus;
  engagement: { impressions: number; likes: number; comments: number; reposts: number; saves: number } | null;
  hashtags: string[];
  createdAt: string;
}

/* ── Scoring Engine ───────────────────────────────────────────────────────── */
function scorePost(content: string, imageUrl: string | null, hashtags: string[]): { score: number; checks: { label: string; pass: boolean; weight: number }[] } {
  const checks = [
    { label: "Image attached", pass: imageUrl !== null, weight: 30 },
    { label: "Length 80–300 chars", pass: content.length >= 80 && content.length <= 300, weight: 15 },
    { label: "Has 2–5 hashtags", pass: hashtags.length >= 2 && hashtags.length <= 5, weight: 15 },
    { label: "Opens with a hook (first line ≤ 6 words)", pass: content.split("\n")[0]?.split(/\s+/).length <= 6, weight: 10 },
    { label: "Contains a story / lesson marker", pass: /\b(lesson|learned|story|how we|mistake|insight|year|month)\b/i.test(content), weight: 10 },
    { label: "Ends with a CTA / question", pass: /\?\s*$|what.*you.*think\?|share|comment below/i.test(content), weight: 10 },
    { label: "No wall of text (≤3 line breaks)", pass: content.split(/\n/).length <= 5, weight: 5 },
    { label: "Includes a number or data point", pass: /\d+/.test(content), weight: 5 },
  ];
  const score = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);
  return { score, checks };
}

/* ── Seed Data ─────────────────────────────────────────────────────────────── */
const SEED: DraftPost[] = [
  {
    id: "p1",
    content: "We rebuilt our agency in 90 days.\n\nNot the website. The operating system.\n\nEvery proposal, every pipeline deal, every client dashboard — now running on RIG OS Agency.\n\nThe result? 3x faster response time, zero lost leads.\n\nWhat would you rebuild first?",
    imageUrl: "rig-os-screenshot.png",
    imageName: "RIG OS Dashboard",
    scheduledDate: "2026-07-05T14:00:00Z",
    status: "scheduled",
    hashtags: ["#agencytech", "#aiops", "#founder"],
    createdAt: "2026-07-03T10:00:00Z",
    engagement: null,
  },
  {
    id: "p2",
    content: "3 lessons from running AI agents in production for 6 months.\n\n1/ Guardrails beat prompts.\n2/ Local-first beats cloud-first.\n3/ ProofPackets beat vibes.\n\nThe agents that survive are the ones with deterministic gates.",
    imageUrl: null,
    imageName: null,
    scheduledDate: null,
    status: "draft",
    hashtags: ["#aiagents", "#production"],
    createdAt: "2026-07-02T16:30:00Z",
    engagement: null,
  },
  {
    id: "p3",
    content: "Turned down $240K in retainers this quarter.\n\nHere's why: every yes to the wrong client is a no to the right one.\n\nWe built a scoring gate that rejects leads below AntiGeneric ≥ 85.\n\nResult: tighter pipeline, better work, happier team.\n\nWhat's your hardest filter?",
    imageUrl: "pipeline-screenshot.png",
    imageName: "Pipeline Gate",
    scheduledDate: "2026-07-01T09:00:00Z",
    status: "published",
    hashtags: ["#gtm", "#qualifyleads", "#agencygrowth"],
    createdAt: "2026-06-28T12:00:00Z",
    engagement: { impressions: 12400, likes: 387, comments: 42, reposts: 15, saves: 89 },
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function formatDate(iso: string | null): string {
  if (!iso) return "Not scheduled";
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hrs = Math.round(diff / 3_600_000);
  if (diff < 0) return `Published ${Math.abs(hrs)}h ago`;
  if (hrs < 24) return `In ${hrs}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const STATUS_META: Record<PostStatus, { color: string; label: string }> = {
  draft:     { color: "#a59783", label: "Draft" },
  scheduled: { color: "#fbbf24", label: "Scheduled" },
  published: { color: "#5ab896", label: "Published" },
  archived:  { color: "#6e6353", label: "Archived" },
};

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function LinkedInPostManagerPage() {
  const [posts, setPosts] = useState<DraftPost[]>(SEED);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [composerOpen, setComposerOpen] = useState(false);

  /* Composer state */
  const [draftContent, setDraftContent] = useState("");
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [draftImageName, setDraftImageName] = useState<string | null>(null);
  const [draftHashtags, setDraftHashtags] = useState<string[]>([]);
  const [draftSchedule, setDraftSchedule] = useState<string>("");

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  const counts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    archived: posts.filter((p) => p.status === "archived").length,
  }), [posts]);

  const liveScore = useMemo(() => scorePost(draftContent, draftImage, draftHashtags), [draftContent, draftImage, draftHashtags]);

  /* Stats across published posts */
  const aggregate = useMemo(() => {
    const pub = posts.filter((p) => p.engagement);
    if (pub.length === 0) return { impressions: 0, likes: 0, comments: 0, engagementRate: 0 };
    const impressions = pub.reduce((s, p) => s + (p.engagement?.impressions || 0), 0);
    const likes = pub.reduce((s, p) => s + (p.engagement?.likes || 0), 0);
    const comments = pub.reduce((s, p) => s + (p.engagement?.comments || 0), 0);
    const engRate = impressions > 0 ? ((likes + comments) / impressions) * 100 : 0;
    return { impressions, likes, comments, engagementRate: engRate };
  }, [posts]);

  const [composerError, setComposerError] = useState<string | null>(null);

  const handleSaveNew = useCallback(() => {
    setComposerError(null);
    if (!draftContent.trim()) {
      setComposerError("Post content is required.");
      return;
    }
    if (!draftImage) {
      setComposerError("Image is REQUIRED — LinkedIn posts without images get ~70% less engagement. Attach an image before saving.");
      return;
    }
    const newPost: DraftPost = {
      id: `p${Date.now()}`,
      content: draftContent,
      imageUrl: draftImage,
      imageName: draftImageName,
      hashtags: draftHashtags,
      scheduledDate: draftSchedule ? new Date(draftSchedule).toISOString() : null,
      status: draftSchedule ? "scheduled" : "draft",
      engagement: null,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposerOpen(false);
    setDraftContent("");
    setDraftImage(null);
    setDraftImageName(null);
    setDraftHashtags([]);
    setDraftSchedule("");
    setComposerError(null);
  }, [draftContent, draftImage, draftImageName, draftHashtags, draftSchedule]);

  /* ── Preview Modal State ───────────────────────────────────────────── */
  const [previewPost, setPreviewPost] = useState<DraftPost | null>(null);

  const openPreview = useCallback((post: DraftPost) => {
    setPreviewPost(post);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewPost(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleAddHashtag = useCallback((tag: string) => {
    const clean = tag.trim().replace(/\s+/g, "");
    if (clean && !draftHashtags.includes(clean)) {
      setDraftHashtags((prev) => [...prev, clean.startsWith("#") ? clean : `#${clean}`]);
    }
  }, [draftHashtags]);

  const scoreColor = (score: number) => score >= 80 ? "#5ab896" : score >= 50 ? "#fbbf24" : "#ef4444";

  return (
    <div className="space-y-7 pb-8">
      {/* Header */}
      <motion.section {...fadeUp}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--cream)" }}>
              LinkedIn Post Manager
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--cream-dim)" }}>
              Draft, score, and schedule posts with image enforcement — AntiGeneric ≥ 85 for all public-facing content.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setComposerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={16} /> New Post
          </motion.button>
        </div>
      </motion.section>

      {/* Aggregate Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: "Total Impressions", value: aggregate.impressions.toLocaleString(), color: "#fbbf24" },
          { icon: Heart, label: "Total Likes", value: aggregate.likes.toLocaleString(), color: "#5ab896" },
          { icon: MessageCircle, label: "Total Comments", value: aggregate.comments.toLocaleString(), color: "#c4607e" },
          { icon: TrendingUp, label: "Engagement Rate", value: `${aggregate.engagementRate.toFixed(1)}%`, color: "#d4a574" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp}
            transition={{ delay: i * 0.06 }}
            className="panel p-5 flex items-center gap-3"
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ background: `${s.color}1a`, color: s.color, width: 42, height: 42 }}
            >
              <s.icon size={18} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--cream)" }}>{s.value}</div>
              <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--cream-mute)" }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "rgba(212, 165, 116, 0.15)" }}>
        {(["all", "draft", "scheduled", "published", "archived"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className="flex items-center gap-2 px-4 py-2.5 font-medium text-[13px] transition-all"
            style={{
              color: filter === k ? "var(--gold)" : "var(--cream-mute)",
              borderBottom: filter === k ? "2px solid var(--gold)" : "2px solid transparent",
            }}
          >
            <Filter size={12} /> {k === "all" ? "All Posts" : STATUS_META[k].label}
            <span style={{ color: "var(--cream-dim)" }}>({counts[k]})</span>
          </button>
        ))}
      </div>

      {/* Post Cards */}
      <section className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => {
            const eval_ = scorePost(post.content, post.imageUrl, post.hashtags);
            return (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
              >
                <PostCard
                  post={post}
                  score={eval_.score}
                  checks={eval_.checks}
                  onDelete={() => handleDelete(post.id)}
                  onPreview={() => openPreview(post)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      {/* Composer Modal */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setComposerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ background: "var(--bg-card)", borderColor: "var(--line)" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--line-soft)" }}>
                <h2 className="text-lg font-bold" style={{ color: "var(--cream)" }}>Compose Post</h2>
                <button onClick={() => setComposerOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-elev)]">
                  <X size={18} style={{ color: "var(--cream-dim)" }} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Content Area */}
                <div>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Write your post… Open with a punchy hook. Tell a story. End with a question."
                    className="w-full p-4 rounded-xl border resize-none text-sm leading-relaxed"
                    style={{
                      background: "var(--bg-mid)",
                      borderColor: "var(--line-soft)",
                      color: "var(--cream)",
                      minHeight: 160,
                    }}
                    maxLength={600}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs" style={{ color: draftContent.length > 300 ? "#fbbf24" : "var(--cream-mute)" }}>
                      {draftContent.length}/600
                    </span>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: "var(--cream-soft)" }}>
                    <ImageIcon size={14} /> Attach Image <span style={{ color: "#ef4444" }}>*Required</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {draftImage ? (
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="flex items-center justify-center rounded-lg border"
                          style={{ width: 56, height: 56, background: `${"#5ab896"}12`, borderColor: "#5ab89644" }}
                        >
                          <CheckCircle2 size={20} style={{ color: "#5ab896" }} />
                        </div>
                        <span className="text-sm" style={{ color: "var(--cream-soft)" }}>{draftImageName}</span>
                        <button
                          onClick={() => { setDraftImage(null); setDraftImageName(null); }}
                          className="ml-auto p-1.5 rounded hover:bg-[var(--bg-elev)]"
                        >
                          <Trash2 size={14} style={{ color: "#ef4444" }} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDraftImage("post-image.png");
                          setDraftImageName("post-image.png");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed text-sm transition-all hover:border-[var(--gold)]"
                        style={{ borderColor: "var(--line)", color: "var(--cream-dim)" }}
                      >
                        <ImageIcon size={18} /> Drop image or click to upload
                      </button>
                    )}
                  </div>
                  {!draftImage && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle size={12} style={{ color: "#ef4444" }} />
                      <span className="text-xs" style={{ color: "#ef4444" }}>Posts without images get 70% less engagement — gate enforced.</span>
                    </div>
                  )}
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--cream-soft)" }}>Hashtags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {draftHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{ background: "var(--bg-elev)", color: "var(--gold-soft)" }}
                      >
                        {tag}
                        <button onClick={() => setDraftHashtags((prev) => prev.filter((t) => t !== tag))}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddHashtag((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                    placeholder="Type hashtag + Enter (e.g. agencygrowth)"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: "var(--cream-soft)" }}>
                    <Calendar size={14} /> Schedule (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={draftSchedule}
                    onChange={(e) => setDraftSchedule(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  />
                </div>

                {/* Live Score Preview */}
                {draftContent && (
                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--bg-mid)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} style={{ color: "var(--gold)" }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--cream)" }}>Quality Score</span>
                      </div>
                      <span className="text-2xl font-bold" style={{ color: scoreColor(liveScore.score) }}>{liveScore.score}/100</span>
                    </div>
                    <div className="space-y-1.5">
                      {liveScore.checks.map((c) => (
                        <div key={c.label} className="flex items-center gap-2 text-xs">
                          {c.pass ? (
                            <CheckCircle2 size={13} style={{ color: "#5ab896" }} />
                          ) : (
                            <X size={13} style={{ color: "#ef4444" }} />
                          )}
                          <span style={{ color: c.pass ? "var(--cream-dim)" : "#ef4444" }}>{c.label}</span>
                          <span className="ml-auto" style={{ color: "var(--cream-mute)" }}>+{c.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-5 border-t" style={{ borderColor: "var(--line-soft)" }}>
                <div className="flex items-center gap-2">
                  {draftImage ? (
                    <span className="text-xs flex items-center gap-1" style={{ color: "#5ab896" }}>
                      <CheckCircle2 size={12} /> Image present
                    </span>
                  ) : (
                    <span className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                      <AlertTriangle size={12} /> Missing image
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setComposerOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-elev)]"
                    style={{ color: "var(--cream-dim)" }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveNew}
                    disabled={!draftContent.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
                  >
                    <Send size={14} />
                    {draftSchedule ? "Schedule Post" : "Save Draft"}
                  </motion.button>
                </div>
              </div>
              {composerError && (
                <div
                  className="mx-5 mb-4 p-3 rounded-lg flex items-start gap-2 text-xs"
                  style={{ background: "#ef444418", border: "1px solid #ef444444", color: "#fca5a5" }}
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{composerError}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border max-w-xl w-full max-h-[90vh] overflow-y-auto"
              style={{ background: "#0A0E27", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              {/* LinkedIn-style card preview */}
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full grid place-items-center font-bold text-sm" style={{ background: "#d4a574", color: "#0A0E27" }}>
                    MR
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Mike Rodgers</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Founder, RIG · 1st</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Just now · 🌐</div>
                  </div>
                </div>
                <button onClick={closePreview} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {previewPost.content}
                </div>
                {previewPost.imageUrl && (
                  <div
                    className="rounded-lg border grid place-items-center text-xs font-mono"
                    style={{
                      height: 240,
                      background: `linear-gradient(135deg, rgba(212,165,116,0.15), rgba(90,184,150,0.15))`,
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    [ Image: {previewPost.imageName || previewPost.imageUrl} ]
                  </div>
                )}
                {previewPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewPost.hashtags.map((tag) => (
                      <span key={tag} className="text-xs font-semibold" style={{ color: "#0a66c2" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t flex items-center justify-around text-xs" style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                {[
                  { icon: Heart, label: "Like" },
                  { icon: MessageCircle, label: "Comment" },
                  { icon: Send, label: "Repost" },
                  { icon: Send, label: "Send" },
                ].map((a, i) => (
                  <button key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/5 font-semibold">
                    <a.icon size={14} /> {a.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Post Card Sub-Component ───────────────────────────────────────────────── */
function PostCard({
  post,
  score,
  checks,
  onDelete,
  onPreview,
}: {
  post: DraftPost;
  score: number;
  checks: { label: string; pass: boolean; weight: number }[];
  onDelete: () => void;
  onPreview: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[post.status];
  const scoreCol = score >= 80 ? "#5ab896" : score >= 50 ? "#fbbf24" : "#ef4444";

  return (
    <div
      className="panel p-5 flex flex-col gap-4"
      style={{ borderColor: "var(--line-soft)" }}
    >
      {/* Top Row: Status + Score + Date */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
            style={{ background: `${meta.color}1a`, color: meta.color }}
          >
            {meta.label}
          </span>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cream-mute)" }}>
            <Clock size={11} /> {formatDate(post.scheduledDate)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center rounded-md font-bold text-sm"
              style={{ width: 32, height: 32, background: `${scoreCol}1a`, color: scoreCol }}
            >
              {score}
            </div>
          </div>
          {!post.imageUrl && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: "#ef44441a", color: "#ef4444" }}>
              <AlertTriangle size={10} /> NO IMAGE
            </span>
          )}
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-[var(--bg-elev)] transition-colors">
            <Trash2 size={14} style={{ color: "#ef4444" }} />
          </button>
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={{ background: "rgba(212, 165, 116, 0.1)", color: "#d4a574", border: "1px solid rgba(212, 165, 116, 0.15)" }}
            >
              <Eye size={10} /> Preview
            </button>
          </div>
        </div>

        {/* Content Preview */}
      <div className="text-sm leading-relaxed" style={{ color: "var(--cream-soft)" }}>
        {post.content.split("\n").map((line, idx) => (
          <p key={idx} className={idx > 0 ? "mt-1" : ""}>{line}</p>
        ))}
      </div>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: "var(--bg-elev)", color: "var(--gold-soft)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement (if published) */}
      {post.engagement && (
        <div className="flex items-center gap-5 pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
          {[
            { icon: Eye, label: "Impressions", value: post.engagement.impressions },
            { icon: Heart, label: "Likes", value: post.engagement.likes },
            { icon: MessageCircle, label: "Comments", value: post.engagement.comments },
            { icon: Send, label: "Reposts", value: post.engagement.reposts },
            { icon: Bookmark, label: "Saves", value: post.engagement.saves },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cream-mute)" }}>
              <m.icon size={13} />
              <span className="font-medium" style={{ color: "var(--cream-soft)" }}>{m.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Quality Breakdown */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: "var(--gold)" }}
      >
        <BarChart3 size={12} />
        {expanded ? "Hide" : "Show"} Quality Breakdown
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-2">
              {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-xs">
                  {c.pass ? (
                    <CheckCircle2 size={12} style={{ color: "#5ab896" }} />
                  ) : (
                    <X size={12} style={{ color: "#ef4444" }} />
                  )}
                  <span style={{ color: c.pass ? "var(--cream-dim)" : "#ef4444" }}>{c.label}</span>
                  <span className="ml-auto" style={{ color: "var(--cream-mute)" }}>+{c.weight}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
