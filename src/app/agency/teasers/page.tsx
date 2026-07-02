'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Mail, Calendar, TrendingUp, Award } from 'lucide-react';

export default function TeasersPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/agency/teasers').then(r => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }} />;
  
  const teasers = data.teasers || [];
  const statusColors: Record<string, string> = { meeting_booked: '#10b981', replied: '#fbbf24', sent: '#4a9eff', drafting: '#6b7280' };
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <FileText size={32} color="var(--gold)" />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--cream)' }}>50 Strategy Teasers</h1>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', value: data.total, icon: FileText, color: 'var(--gold)' },
          { label: 'Sent', value: data.sent, icon: CheckCircle, color: 'var(--emerald)' },
          { label: 'Replies', value: data.replied, icon: Mail, color: '#fbbf24' },
          { label: 'Meetings', value: data.meetings, icon: Calendar, color: '#10b981' },
          { label: 'Reply Rate', value: data.replyRate, icon: TrendingUp, color: '#4a9eff' },
          { label: 'AntiGeneric', value: `${data.avgAntiGeneric}/100`, icon: Award, color: 'var(--gold)' }
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

      <div style={{ background: 'var(--bg-mid)', borderRadius: 16, padding: 20, border: '1px solid rgba(212,165,116,0.15)' }}>
        <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: 16 }}>Teaser Pipeline</h3>
        {teasers.map((t: any) => (
          <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: t.slot * 0.01 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(212,165,116,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--cream)', opacity: 0.4, fontSize: 13, minWidth: 30 }}>#{t.slot}</span>
              <div>
                <p style={{ color: 'var(--cream)', fontWeight: 600, margin: 0, fontSize: 14 }}>{t.title}</p>
                <span style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.6 }}>{t.vertical} · AG: {t.antiGenericScore}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--cream)', opacity: 0.5 }}>${t.estimatedValue.toLocaleString()}</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: `${statusColors[t.status]}22`, color: statusColors[t.status], fontSize: 12, fontWeight: 600 }}>{t.status.replace(/_/g, ' ')}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}