"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Wand2, Copy, Download, Send,
  Building2, DollarSign, Target, Calendar, AlertCircle,
  CheckCircle, ChevronRight, RefreshCw, Mail,
} from "lucide-react";

const VERTICALS = [
  { id: "construction", name: "Construction" },
  { id: "dental", name: "Dental" },
  { id: "legal", name: "Legal" },
  { id: "manufacturing", name: "Manufacturing" },
  { id: "healthcare", name: "Healthcare" },
  { id: "realestate", name: "Real Estate" },
  { id: "ecommerce", name: "E-Commerce" },
  { id: "saas", name: "SaaS" },
  { id: "services", name: "Services" },
  { id: "nonprofit", name: "Nonprofit" },
];

const TIERS = [
  { id: "starter", name: "Starter", fee: 2500 },
  { id: "growth", name: "Growth", fee: 6000 },
  { id: "scale", name: "Scale", fee: 12000 },
  { id: "enterprise", name: "Enterprise", fee: 25000 },
];

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface ProposalOutput {
  proposalId: string;
  generatedAt: string;
  clientName: string;
  vertical: string;
  tier: string;
  monthlyFee: number;
  annualFee: number;
  timelineWeeks: number;
  confidenceScore: number;
  rationale: string;
  markdown: string;
  sections: {
    executiveSummary: string;
    scope: string;
    deliverables: string[];
    timeline: { week: number; milestone: string }[];
    investment: string;
    nextSteps: string[];
  };
}

export default function ProposalGeneratorPage() {
  const [clientName, setClientName] = useState("");
  const [vertical, setVertical] = useState("services");
  const [tier, setTier] = useState<string>(""); // auto if blank
  const [monthlyBudget, setMonthlyBudget] = useState(6000);
  const [dealSize, setDealSize] = useState(72000);
  const [timelineWeeks, setTimelineWeeks] = useState(12);
  const [problem, setProblem] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProposalOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/agency/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName || undefined,
          vertical,
          tier: tier || undefined,
          monthlyBudget,
          dealSize,
          timelineWeeks,
          problem: problem || undefined,
          desiredOutcomes: desiredOutcomes
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${r.status}`);
      }
      const data: ProposalOutput = await r.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${result.clientName.replace(/\s+/g, "_")}-${result.proposalId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = () => {
    if (!result) return;
    const subject = encodeURIComponent(`Proposal — ${result.clientName}`);
    const body = encodeURIComponent(
      `${result.contactName ? "Hi " + result.contactName.split(" ")[0] + ",\n\n" : "Hi,\n\n"}Attached is the proposal we discussed. Full text below — let me know if you want to hop on a call to walk through it.\n\n— RIG OS Agency\n\n---\n\n${result.markdown}`
    );
    window.location.href = `mailto:${contactEmail || ""}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-2">
          <Wand2 size={22} style={{ color: "var(--gold)" }} />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Proposal Generator
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Generate a tier-matched, vertical-aware proposal in under 10 seconds. Powered by RIG OS agency playbooks.
        </p>
      </motion.section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-5 rounded-xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <FileText size={18} style={{ color: "var(--gold)" }} />
            Deal Inputs
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <FieldRow>
              <Field label="Client name" icon={<Building2 size={14} />}>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Acme Construction"
                  className={inputCls}
                />
              </Field>
              <Field label="Vertical" icon={<Target size={14} />}>
                <select
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  className={inputCls}
                >
                  {VERTICALS.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="Monthly budget ($)" icon={<DollarSign size={14} />}>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </Field>
              <Field label="Deal size ($)" icon={<DollarSign size={14} />}>
                <input
                  type="number"
                  value={dealSize}
                  onChange={(e) => setDealSize(parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="Tier (optional)" icon={<Sparkles size={14} />}>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Auto-pick from budget</option>
                  {TIERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (${t.fee}/mo)</option>
                  ))}
                </select>
              </Field>
              <Field label="Timeline (weeks)" icon={<Calendar size={14} />}>
                <input
                  type="number"
                  value={timelineWeeks}
                  onChange={(e) => setTimelineWeeks(parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </Field>
            </FieldRow>

            <Field label="Problem statement">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. Bid pipeline dropping 35% between estimate and contract."
                className={inputCls + " min-h-[70px]"}
              />
            </Field>

            <Field label="Desired outcomes (one per line)">
              <textarea
                value={desiredOutcomes}
                onChange={(e) => setDesiredOutcomes(e.target.value)}
                placeholder={"30 more qualified bids per quarter\nPipeline dashboard in 60 days"}
                className={inputCls + " min-h-[70px]"}
              />
            </Field>

            <FieldRow>
              <Field label="Contact name">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Sarah Chen"
                  className={inputCls}
                />
              </Field>
              <Field label="Contact email">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="sarah@acme.co"
                  className={inputCls}
                />
              </Field>
            </FieldRow>

            {error && (
              <div
                className="text-sm flex items-start gap-2 p-3 rounded-md"
                style={{ background: "var(--red-bg)", color: "var(--red)" }}
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "var(--gold)", color: "#1a1410" }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Generate Proposal
                </>
              )}
            </button>
          </form>
        </motion.section>

        {/* Result */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-5 rounded-xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {!result ? (
            <div
              className="h-full min-h-[400px] flex flex-col items-center justify-center text-center"
              style={{ color: "var(--text-3)" }}
            >
              <Sparkles size={36} className="mb-3 opacity-40" />
              <p className="text-sm">
                Fill the deal inputs and hit <strong style={{ color: "var(--text-2)" }}>Generate</strong>.
              </p>
              <p className="text-xs mt-2 opacity-70">
                Output appears here as a formatted Markdown proposal with executive summary,
                scope, deliverables, timeline, and investment table.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-medium flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <CheckCircle size={18} style={{ color: "var(--emerald)" }} />
                  {result.tier} · ${result.annualFee.toLocaleString()}/yr
                </h2>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)" }}
                >
                  Confidence {Math.round(result.confidenceScore * 100)}%
                </span>
              </div>

              <div
                className="p-3 rounded-md text-sm"
                style={{ background: "var(--card-2)", color: "var(--text-2)" }}
              >
                <strong style={{ color: "var(--text)" }}>Rationale:</strong> {result.rationale}
              </div>

              {/* Tabs: Outline, Markdown */}
              <Tabs
                tabs={[
                  {
                    key: "outline",
                    label: "Outline",
                    body: (
                      <div className="space-y-3 text-sm" style={{ color: "var(--text-2)" }}>
                        <Section label="Executive Summary" lines={result.sections.executiveSummary} />
                        <Section label="Scope of Work" lines={result.sections.scope} />
                        <div>
                          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>
                            Deliverables
                          </p>
                          <ul className="space-y-1 pl-4 list-disc">
                            {result.sections.deliverables.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>
                            Timeline
                          </p>
                          <ul className="space-y-1 pl-4 list-disc">
                            {result.sections.timeline.map((t, i) => (
                              <li key={i}>
                                <strong>Week {t.week}:</strong> {t.milestone}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Section label="Investment" lines={result.sections.investment} />
                        <div>
                          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>
                            Next Steps
                          </p>
                          <ul className="space-y-1 pl-4 list-disc">
                            {result.sections.nextSteps.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "md",
                    label: "Markdown",
                    body: (
                      <pre
                        className="text-xs whitespace-pre-wrap leading-relaxed p-3 rounded-md max-h-[420px] overflow-auto"
                        style={{
                          background: "var(--bg-2)",
                          color: "var(--text-2)",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {result.markdown}
                      </pre>
                    ),
                  },
                ]}
              />

              <div className="flex flex-wrap gap-2 pt-2">
                <ActionBtn onClick={handleCopy} icon={<Copy size={14} />} label={copyStatus || "Copy Markdown"} />
                <ActionBtn onClick={handleDownload} icon={<Download size={14} />} label="Download .md" />
                <ActionBtn onClick={handleSend} icon={<Send size={14} />} label="Email to client" />
              </div>
              <div className="text-xs flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                <ChevronRight size={12} />
                ID: {result.proposalId} · {new Date(result.generatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span
        className="text-xs uppercase tracking-wide flex items-center gap-1.5"
        style={{ color: "var(--text-3)" }}
      >
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-offset-0 transition-colors";

function Tabs({ tabs }: { tabs: { key: string; label: string; body: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) || tabs[0];
  return (
    <div>
      <div className="flex gap-1 mb-3 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              color: active === t.key ? "var(--text)" : "var(--text-3)",
              borderBottom: active === t.key ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current.body}</div>
    </div>
  );
}

function Section({ label, lines }: { label: string; lines: string }) {
  // Render markdown-lite: strip leading "## ", split paragraphs, render as plain lines.
  const cleaned = lines.replace(/^##\s.*\n/, "").trim();
  return (
    <div>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>
        {label}
      </p>
      <div className="space-y-1 leading-relaxed">
        {cleaned.split("\n").map((l, i) => (
          <p key={i}>{l.replace(/^#+\s*/, "").replace(/^\*\*/g, "").replace(/\*\*$/g, "")}</p>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 font-medium"
      style={{ background: "var(--gold-bg)", color: "var(--gold)" }}
    >
      {icon}
      {label}
    </button>
  );
}
