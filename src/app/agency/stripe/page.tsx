'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, AlertCircle, CheckCircle, ArrowRight, DollarSign,
  TrendingUp, Target, Zap, Building2, Lock, Rocket, Activity,
  Crown, Box, Users, FileCheck,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function StripeRevenueCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/agency/stripe').then(r => r.json()).then(setData).catch(() => setData({}));
  }, []);

  if (!data) {
    return (
      <div style={{ padding: '3rem', color: 'var(--cream-dim)' }}>
        <Activity size={20} className="animate-pulse" style={{ color: 'var(--gold)', display: 'inline', marginRight: 8 }} />
        Loading Stripe Revenue Command Center…
      </div>
    );
  }

  const acct = data.account || {};
  const ready = data.ready_for_live || {};
  const readiness = data.readiness || {};
  const model = data.revenue_model || {};
  const tiers = model.tiers || [];
  const managed = data.managed_state || {};
  const catalog = data.catalog || {};
  const blockers = data.blockers || [];
  const checklist = readiness.checklist || [];
  const resources = catalog.managed_resources || [];

  const modeLabel = data.mode === 'test' ? 'SANDBOX / TEST' : 'LIVE';
  const modeColor = data.mode === 'test' ? 'var(--plum)' : 'var(--emerald)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        {/* ─── Header ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <CreditCard size={28} style={{ color: 'var(--gold)' }} />
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--cream-mute)', fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
          >
            Revenue Infrastructure
          </span>
          <span
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              borderRadius: 999,
              background: `${modeColor}22`,
              color: modeColor,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              border: `1px solid ${modeColor}44`,
            }}
          >
            {modeLabel}
          </span>
        </div>
        <h1
          style={{
            fontSize: '2rem',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 500,
            color: 'var(--cream)',
            marginBottom: 4,
          }}
        >
          Stripe Revenue Command Center
        </h1>
        <p style={{ color: 'var(--cream-dim)', fontSize: 14, marginBottom: 24 }}>
          Live integration status · Product catalog · Revenue projections toward $10M ARR
        </p>

        {/* ─── Account Summary ─── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{
            background: 'linear-gradient(135deg, var(--bg-card), var(--bg-elev))',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Building2 size={20} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--cream-mute)', fontWeight: 600 }}>
              Connected Account
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--cream)', marginBottom: 12 }}>
            {acct.business_name || 'Unknown Account'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Account ID', value: acct.id || '—', icon: <Lock size={14} /> },
              { label: 'Email', value: acct.email || '—', icon: <Users size={14} /> },
              { label: 'Business URL', value: acct.business_url || '—', icon: <Building2 size={14} /> },
              { label: 'Status', value: data.status || '—', icon: <Activity size={14} /> },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cream-mute)', fontSize: 11, marginBottom: 4 }}>
                  {f.icon}
                  {f.label}
                </div>
                <div style={{ color: 'var(--cream-soft)', fontSize: 14, fontWeight: 500, wordBreak: 'break-all' }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Go-Live Readiness Gauge ─── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--line-soft)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={18} style={{ color: ready.all_clear ? 'var(--emerald)' : 'var(--plum)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', margin: 0 }}>
                Go-Live Readiness
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: ready.all_clear ? 'var(--emerald)' : 'var(--gold)' }}>
                {readiness.percent || 0}%
              </span>
              <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
                {readiness.completed || 0}/{readiness.total || 8} steps
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-deep)', marginBottom: 16, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${readiness.percent || 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 4,
                background: ready.all_clear
                  ? 'linear-gradient(90deg, var(--emerald-dim), var(--emerald))'
                  : 'linear-gradient(90deg, var(--gold-deep), var(--gold))',
              }}
            />
          </div>

          {/* Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
            {checklist.map((item: any, i: number) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: item.done ? 'rgba(90, 184, 150, 0.06)' : 'var(--bg-deep)',
                  border: `1px solid ${item.done ? 'rgba(90, 184, 150, 0.15)' : 'var(--line-soft)'}`,
                }}
              >
                {item.done ? (
                  <CheckCircle size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={16} style={{ color: item.critical ? 'var(--plum)' : 'var(--cream-mute)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: item.done ? 'var(--cream-soft)' : 'var(--cream)', fontWeight: 500 }}>
                    {item.label}
                  </div>
                  {item.note && (
                    <div style={{ fontSize: 11, color: 'var(--cream-mute)', marginTop: 2 }}>{item.note}</div>
                  )}
                </div>
                {item.critical && !item.done && (
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(196, 96, 126, 0.15)', color: 'var(--plum)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Critical
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Revenue Projection Model ─── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--line-soft)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={18} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', margin: 0 }}>
                Revenue Projection Model
              </h2>
            </div>
            <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>4-tier pricing strategy</span>
          </div>

          {/* Top-level metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Annual Run Rate', value: formatCurrency(model.total_annual_run_rate || 0), icon: <TrendingUp size={16} />, accent: 'var(--gold)' },
              { label: 'Monthly Recurring', value: formatCurrency(model.total_monthly_recurring || 0), icon: <Zap size={16} />, accent: 'var(--emerald)' },
              { label: 'One-Time Revenue', value: formatCurrency(model.total_one_time || 0), icon: <Box size={16} />, accent: 'var(--plum)' },
              { label: 'Path to $10M', value: `${model.path_to_10m_percent || 0}%`, icon: <Target size={16} />, accent: 'var(--rust)' },
            ].map((m, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: 'var(--bg-deep)', border: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: m.accent }}>
                  {m.icon}
                  <span style={{ fontSize: 11, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: m.accent, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Tier cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {tiers.map((tier: any, i: number) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--bg-mid)',
                  border: `1px solid ${tier.color}33`,
                  borderTop: `3px solid ${tier.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: tier.color }}>{tier.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--cream-mute)', marginLeft: 8, textTransform: 'uppercase' }}>
                      {tier.billing === 'monthly' ? 'MRR' : 'One-time'}
                    </span>
                  </div>
                  {i === 0 && <Crown size={14} style={{ color: 'var(--cream-mute)' }} />}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
                  {formatCurrency(tier.price)}
                  <span style={{ fontSize: 12, color: 'var(--cream-dim)', fontWeight: 400 }}>
                    {tier.billing === 'monthly' ? '/mo' : ''}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--cream-dim)', marginBottom: 12, lineHeight: 1.4 }}>{tier.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--line-soft)' }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--cream-mute)', textTransform: 'uppercase' }}>Target</span>
                    <p style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 600, margin: 0 }}>{tier.targetClients} clients</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--cream-mute)', textTransform: 'uppercase' }}>Pipeline</span>
                    <p style={{ fontSize: 14, color: tier.color, fontWeight: 600, margin: 0 }}>{tier.expectedFromPipeline} expected</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--cream-mute)', textTransform: 'uppercase' }}>Annual</span>
                    <p style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 600, margin: 0 }}>{formatCurrency(tier.annualRunRate)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── Managed Resources & Catalog ─── */}
        {resources.length > 0 && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--line-soft)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Box size={18} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', margin: 0 }}>
                Managed Catalog Resources
              </h2>
              <span style={{ fontSize: 11, color: 'var(--cream-mute)', marginLeft: 8 }}>via rig-stripe-ops</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {resources.map((res: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--line-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {res.kind === 'product' && <Box size={14} style={{ color: 'var(--gold)' }} />}
                    {res.kind === 'price' && <DollarSign size={14} style={{ color: 'var(--emerald)' }} />}
                    {res.kind === 'customer' && <Users size={14} style={{ color: 'var(--plum)' }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{res.name || res.key}</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: 'var(--bg-mid)', color: 'var(--cream-dim)', textTransform: 'uppercase',
                    }}>
                      {res.kind}
                    </span>
                  </div>
                  {res.lookup_key && (
                    <code style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'monospace' }}>{res.lookup_key}</code>
                  )}
                  {res.unit_amount != null && (
                    <span style={{ fontSize: 12, color: 'var(--emerald)' }}>
                      {(res.unit_amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {res.billing || res.type || ''}
                    </span>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--cream-dim)', margin: 0, lineHeight: 1.4 }}>{res.purpose}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Blockers & Next Steps ─── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.25 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        >
          {blockers.length > 0 && (
            <div style={{
              background: 'rgba(196, 96, 126, 0.06)',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid rgba(196, 96, 126, 0.2)',
            }}>
              <h2 style={{ color: 'var(--plum)', marginBottom: 12, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} /> Blockers to Go Live ({blockers.length})
              </h2>
              {blockers.map((b: string, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < blockers.length - 1 ? '1px solid var(--line-soft)' : 'none', color: 'var(--cream-soft)', fontSize: 13 }}>
                  • {b}
                </div>
              ))}
            </div>
          )}

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid var(--line-soft)',
          }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: 12, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCheck size={16} /> Next Steps to Go Live
            </h2>
            {(data.next_steps || []).map((step: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-elev)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ color: 'var(--cream-soft)', fontSize: 13 }}>{step}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Footer ─── */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--cream-mute)' }}>
          <span>
            Key fingerprint: <code style={{ fontFamily: 'monospace' }}>{data.secret_key_fingerprint || '—'}</code>
          </span>
          <span>Last checked: {new Date(data.api_generated_at || data.generated_at || Date.now()).toLocaleTimeString()}</span>
        </div>
      </motion.div>
    </div>
  );
}
