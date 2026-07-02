"use client";

import { motion } from "framer-motion";
import {
  Rocket, Shield, Zap, TrendingUp, Building2, DollarSign,
  CheckCircle2, ArrowUpRight, AlertTriangle, FileText, Mail,
} from "lucide-react";
import {
  RIG_DOORS, RIG_CAIO_ENGAGEMENTS, RIG_FORGE_OFFERINGS,
  RIG_SITE_VERTICALS, RIG_RECEIPTS, RIG_SCREENING_NOTE,
  RIG_CO_AI_LAW, RIG_TALKS, RIG_FIELD_NOTES,
} from "@/lib/rig-offerings";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  build: { label: "Build", icon: <Zap size={14} />, color: "#d4a574" },
  audit: { label: "Audit", icon: <FileText size={14} />, color: "#5ab896" },
  compliance: { label: "Compliance", icon: <Shield size={14} />, color: "#ef4444" },
  fractional: { label: "Fractional", icon: <TrendingUp size={14} />, color: "#c4607e" },
  advisory: { label: "Advisory", icon: <Building2 size={14} />, color: "#a855f7" },
  caio: { label: "CAIO", icon: <Rocket size={14} />, color: "#d4a574" },
  forge: { label: "Forge", icon: <Zap size={14} />, color: "#d4a574" },
};

export default function OfferingsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            rodgersintelligence.com
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Offerings & <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Engagement Models</span>
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          Strategy first. AI second. Automation third. The full catalog from Rodgers Intelligence Group —
          three doors, ten ways to engage, eight verticals, each with its own bleed.
        </p>
      </motion.section>

      {/* Three Doors */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> The Three Doors
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RIG_DOORS.map((door) => (
            <div
              key={door.id}
              className="rounded-xl p-5 border h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] mono mb-1" style={{ color: "var(--gold)" }}>{door.num}</div>
                  <h3 className="text-[16px] font-semibold" style={{ color: "var(--cream)" }}>{door.title}</h3>
                  <div className="text-[11px]" style={{ color: "var(--cream-mute)" }}>{door.subtitle}</div>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--cream-dim)" }}>{door.tagline}</p>
              {door.stats.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t" style={{ borderColor: "var(--line-soft)" }}>
                  {door.stats.map((s) => (
                    <div key={s.label}>
                      <div className="text-[18px] hand" style={{ color: "var(--gold)" }}>{s.value}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* CAIO Engagement Models */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> CAIO Engagement Models
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {RIG_CAIO_ENGAGEMENTS.map((eng) => (
            <div
              key={eng.title}
              className="rounded-xl p-5 border h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--cream-mute)" }}>{eng.type}</div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{eng.title}</h3>
              <div className="text-[18px] mb-1" style={{ color: "var(--gold)", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>
                {eng.price}
              </div>
              <div className="text-[10px] mono mb-3" style={{ color: "var(--cream-dim)" }}>{eng.cadence}</div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{eng.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Forge Offerings */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>III.</span> The Forge — Ten Ways to Engage
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {RIG_FORGE_OFFERINGS.map((offering) => {
            const meta = CATEGORY_META[offering.category] || CATEGORY_META.build;
            return (
              <motion.div
                key={offering.id}
                whileHover={{ y: -2 }}
                className="rounded-xl p-5 border h-full relative overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  borderColor: offering.featured ? "var(--gold)" : "var(--line-soft)",
                }}
              >
                {offering.featured && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] uppercase tracking-widest rounded-bl-lg"
                    style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
                    Free
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="grid place-items-center w-7 h-7 rounded-md"
                    style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}40` }}
                  >
                    {meta.icon}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{meta.label}</span>
                </div>
                <h3 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{offering.name}</h3>
                <div className="text-[16px] mb-2" style={{ color: "var(--gold)", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>
                  {offering.price}
                  {offering.priceNote && <span className="text-[10px] ml-2" style={{ color: "var(--cream-mute)" }}>{offering.priceNote}</span>}
                </div>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--cream-dim)" }}>{offering.description}</p>
                {offering.deliverables.length > 0 && (
                  <div className="space-y-1 pt-3 border-t" style={{ borderColor: "var(--line-soft)" }}>
                    {offering.deliverables.map((d) => (
                      <div key={d} className="flex items-start gap-1.5">
                        <CheckCircle2 size={11} style={{ color: "var(--emerald)", marginTop: 1, flexShrink: 0 }} />
                        <span className="text-[11px]" style={{ color: "var(--cream-soft)" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                )}
                {offering.timeline && (
                  <div className="text-[10px] mono mt-3" style={{ color: "var(--cream-mute)" }}>
                    Timeline: {offering.timeline}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* 8 Verticals */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>IV.</span> Eight Verticals — By Wound
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RIG_SITE_VERTICALS.map((v, i) => (
            <div
              key={v.id}
              className="rounded-xl p-4 border h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] mono" style={{ color: "var(--gold)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
              </div>
              <h4 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{v.name}</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{v.wound}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Receipts */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>V.</span> The Receipts
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RIG_RECEIPTS.map((r) => (
            <div
              key={r.client}
              className="rounded-xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="text-[20px] hand mb-2" style={{ color: "var(--gold)" }}>{r.metric}</div>
              <h4 className="text-[13px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{r.client}</h4>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{r.result}</p>
              <div className="text-[9px] mono mt-3" style={{ color: "var(--cream-mute)" }}>Source: {r.source}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Colorado AI Law Alert */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div
          className="rounded-xl p-5 border flex items-start gap-4"
          style={{ background: "rgba(239, 68, 68, 0.06)", borderColor: "rgba(239, 68, 68, 0.3)" }}
        >
          <AlertTriangle size={20} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
              {RIG_CO_AI_LAW.law} — Effective {RIG_CO_AI_LAW.effective}
            </h3>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>
              Enforced by the {RIG_CO_AI_LAW.enforcedBy}, with civil penalties of {RIG_CO_AI_LAW.penalty} under the {RIG_CO_AI_LAW.statute}.
              {" "}{RIG_CO_AI_LAW.urgency}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Talks + Field Notes */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Talks */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>VI.</span> Talks — Straight, No Theater
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {RIG_TALKS.map((talk) => (
                <div
                  key={talk.title}
                  className="rounded-xl p-4 border"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                >
                  <h4 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{talk.title}</h4>
                  <p className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{talk.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Field Notes */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>VII.</span> Field Notes
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div
              className="rounded-xl p-5 border h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <h4 className="text-[15px] font-semibold mb-2" style={{ color: "var(--cream)" }}>{RIG_FIELD_NOTES.title}</h4>
              <p className="text-[11px] mono mb-3" style={{ color: "var(--gold)" }}>{RIG_FIELD_NOTES.cadence}</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{RIG_FIELD_NOTES.description}</p>
              <Link
                href="https://rodgersintelligence.com"
                target="_blank"
                className="inline-flex items-center gap-1 mt-4 text-[12px] font-medium"
                style={{ color: "var(--gold)" }}
              >
                Subscribe on rodgersintelligence.com
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Screening Note */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.4 }}>
        <div
          className="rounded-xl p-5 border flex items-center justify-between flex-wrap gap-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
              {RIG_SCREENING_NOTE.title}
            </div>
            <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
              {RIG_SCREENING_NOTE.body}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/agency/pipeline"
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
            >
              View Pipeline →
            </Link>
            <Link
              href="/agency"
              className="px-4 py-2 rounded-lg text-[12px] font-medium border"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              Agency Dashboard
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
