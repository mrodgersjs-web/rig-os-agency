"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Wand2, ChevronRight, Sparkles,
  CheckCircle, Clock, Send,
} from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const FEATURES = [
  {
    icon: Wand2,
    title: "Auto-tier matching",
    body: "Picks Starter → Growth → Scale → Enterprise based on monthly budget and deal size.",
  },
  {
    icon: Sparkles,
    title: "Vertical playbooks",
    body: "10 verticals with diagnosed pains, outcomes, and channel sets baked into every proposal.",
  },
  {
    icon: FileText,
    title: "5-section output",
    body: "Executive summary, scope, deliverables, timeline, investment — Markdown + parsed outline.",
  },
  {
    icon: Send,
    title: "Email-ready",
    body: "Copy as markdown, download as .md, or open a pre-filled mailto with body included.",
  },
];

export default function ProposalsHub() {
  return (
    <div className="space-y-6">
      <motion.section {...fadeUp} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-2">
          <FileText size={22} style={{ color: "var(--gold)" }} />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Proposals
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Generate tier-matched, vertical-aware proposals in seconds. The fastest path from qualified lead to signed contract.
        </p>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-6 rounded-xl border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium" style={{ color: "var(--text)" }}>
              New Proposal
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Fill in deal context, pick vertical + budget, and the generator does the rest.
            </p>
          </div>
          <Link
            href="/agency/proposals/new"
            className="px-4 py-2.5 rounded-md font-medium flex items-center gap-2"
            style={{ background: "var(--gold)", color: "#1a1410" }}
          >
            <Wand2 size={16} />
            Open Generator
            <ChevronRight size={14} />
          </Link>
        </div>
      </motion.section>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {FEATURES.map((f) => {
          const I = f.icon;
          return (
            <div
              key={f.title}
              className="p-4 rounded-xl border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-md flex-shrink-0"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)" }}
                >
                  <I size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {f.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
                    {f.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="p-5 rounded-xl border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
          <CheckCircle size={14} style={{ color: "var(--emerald)" }} />
          Recent generations
        </h3>
        <div
          className="text-sm py-6 text-center"
          style={{ color: "var(--text-3)" }}
        >
          <Clock size={20} className="inline-block mr-2 opacity-50" />
          No proposals generated in this session yet. Open the generator to create one.
        </div>
      </motion.section>
    </div>
  );
}
