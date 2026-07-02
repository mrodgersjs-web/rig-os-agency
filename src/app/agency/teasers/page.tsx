'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Mail, Calendar, TrendingUp, Award, AlertCircle } from 'lucide-react';

export default function TeasersPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/agency/teasers').then(r => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }} />;
  
  const teasers = data.teasers || [];
  const statusColors: Record<string, string> = { sent: '#4a9eff', drafting: '#6b7280' };
  const totalLabel = data.source ? `${data.totalWithStrategy} Real Strategy Teasers` : 'Strategy Teasers';
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <FileText size={32} color="var(--gold)" />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--cream)' }}>{totalLabel}</h1>
        </div>
        {data.source && (
          <p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 13, marginBottom: 24 }}>
            {data.source} · {data.totalClientDirs} client dirs scanned
          </p>
        )}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'With Strategy', value: data.total ?? data.totalWithStrategy, icon: FileText, color: 'var(--gold)' },
          { label: 'Sent', value: data.sent, icon: CheckCircle, color: 'var(--emerald)' },
          { label: 'Drafting', value: data.drafting, icon: AlertCircle, color: '#6b7280' },
          { label: 'Send Rate', value: data.sendRate, icon: TrendingUp, color: '#4a9eff' },
          { label: 'Avg Score', value: `${data.avgAntiGeneric}/100`, icon: Award, color: 'var(--gold)' },
          { label: 'Pipeline $', value: `$${(data.pipelineValue ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'var(--emerald)' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
              style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 16, border: '1px solid rgba(212,165,116,0.15)' }}>
              <Icon size={20} color={s.color} />
              <p style={{ color: 'var(--cream)', opacity: 0.6, fontSize: 12, marginTop: 6 }}>{s.label}</p>
              <p style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 700, margin: '2px 0 0' }}>{s.value}</p>
            </motion.div>
          );
        })}
      </div>

      {data.sentWithoutStrategy && data.sentWithoutStrategy.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.08)', borderRadius: 12, padding: 12, marginBottom: 16, border: '1px solid rgba(251,191,36,0.2)' }}>
          <p style={{ color: '#fbbf24', fontSize: 12, margin: 0 }}>
            ⚠ {data.sentWithoutStrategy.length} companies were sent emails but have no strategy.generated.json: {data.sentWithoutStrategy.join(', ')}
          </p>
        </div>
      )}

      {data.verticalBreakdown && Object.keys(data.verticalBreakdown).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(data.verticalBreakdown).sort((a: any, b: any) => b[1].total - a[1].total).map(([vert, stats]: any) => (
            <span key={vert} style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(212,165,116,0.08)', fontSize: 12, color: 'var(--cream)' }}>
              {vert}: {stats.sent}/{stats.total}
            </span>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--bg-mid)', borderRadius: 16, padding: 20, border: '1px solid rgba(212,165,116,0.15)' }}>
        <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: 16 }}>Teaser Pipeline — Real Client Data</h3>
        {teasers.map((t: any, i: number) => (
          <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.5) }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(212,165,116,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <span style={{ color: 'var(--cream)', opacity: 0.4, fontSize: 13, minWidth: 30 }}>#{i + 1}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ color: 'var(--cream)', fontWeight: 600, margin: 0, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.firm}
                </p>
                <span style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.6 }}>
                  {t.vertical} · Score: {t.recommendationScore} · {t.evidenceCount} evidence sources
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {t.campaign && (
                <span style={{ fontSize: 11, color: 'var(--cream)', opacity: 0.4 }}>{t.campaign}</span>
              )}
              <span style={{ fontSize: 12, color: 'var(--cream)', opacity: 0.5 }}>${t.estimatedValue.toLocaleString()}</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: `${statusColors[t.status]}22`, color: statusColors[t.status], fontSize: 12, fontWeight: 600 }}>
                {t.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}