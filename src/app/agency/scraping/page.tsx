'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Zap, Users, Building2, TrendingUp, Activity } from 'lucide-react';

export default function ScrapingPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/agency/scraping').then(r => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }} />;
  
  const sources = data.sources || [];
  const profiles = data.profiles || [];
  const summary = data.summary || {};
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Database size={32} color="var(--gold)" />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--cream)' }}>Data Scraping Dashboard</h1>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Data', value: `${summary.totalDataGB} GB`, icon: Database, color: 'var(--gold)' },
          { label: 'New Profiles', value: summary.totalProfiles, icon: Users, color: 'var(--emerald)' },
          { label: 'New Companies', value: summary.newCompanies, icon: Building2, color: '#5ab896' },
          { label: 'Decision Makers', value: summary.decisionMakers, icon: TrendingUp, color: '#fbbf24' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(212,165,116,0.15)' }}>
              <Icon size={24} color={stat.color} />
              <p style={{ color: 'var(--cream)', opacity: 0.6, fontSize: 13, marginTop: 8 }}>{stat.label}</p>
              <p style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700, margin: '4px 0 0' }}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {sources.map((src: any, i: number) => (
          <motion.div key={src.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            style={{ background: 'var(--bg-mid)', borderRadius: 16, padding: 20, border: '1px solid rgba(212,165,116,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} color="var(--gold)" />
                <h3 style={{ color: 'var(--cream)', fontWeight: 700, margin: 0 }}>{src.name}</h3>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 12, background: 'rgba(90,184,150,0.2)', color: 'var(--emerald)', fontSize: 12, fontWeight: 600 }}>{src.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Profiles</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{src.profiles}</p></div>
              <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Data</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{src.dataGB} GB</p></div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--cream)', opacity: 0.6 }}>
              {src.actors?.map((a: string) => <span key={a} style={{ marginRight: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(212,165,116,0.1)' }}>{a}</span>)}
              {src.queries?.map((q: string) => <span key={q} style={{ marginRight: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(212,165,116,0.1)' }}>{q}</span>)}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--bg-mid)', borderRadius: 16, padding: 20, border: '1px solid rgba(212,165,116,0.15)' }}>
        <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: 16 }}>Top Profiles Scraped</h3>
        {profiles.map((p: any) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(212,165,116,0.08)' }}>
            <div><span style={{ color: 'var(--cream)', fontWeight: 600 }}>{p.name}</span> <span style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 13 }}>{p.title} · {p.company}</span></div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.7 }}>{p.source}</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: `rgba(${p.score > 90 ? '239,68,68' : '212,165,116'},0.15)`, color: p.score > 90 ? '#ef4444' : 'var(--gold)', fontSize: 13, fontWeight: 700 }}>{p.score}</span>
            </div>
          </div>
        ))}
      </motion.div>

      <div style={{ marginTop: 16, background: 'var(--bg-mid)', borderRadius: 16, padding: 20, border: '1px solid rgba(212,165,116,0.15)' }}>
        <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: 8 }}>Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div><span style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 13 }}>Target Profiles</span><p style={{ color: 'var(--gold)' }}>{data.config?.targetProfiles}</p></div>
          <div><span style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 13 }}>Cadence</span><p style={{ color: 'var(--gold)' }}>{data.config?.cadence}</p></div>
          <div><span style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 13 }}>Data Cap</span><p style={{ color: 'var(--gold)' }}>{data.config?.dataCap}</p></div>
          <div><span style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 13 }}>Geo</span><p style={{ color: 'var(--gold)' }}>{data.config?.geo}</p></div>
        </div>
      </div>
    </div>
  );
}