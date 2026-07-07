'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Sun, Moon, Target, Hammer, Mail, Briefcase, TrendingUp, Megaphone, Search, FileText, Package, Globe, DollarSign, Cpu, Database, Activity, FileCheck, Scissors, Heart, Clock, Sparkles } from 'lucide-react';
import { LinkedinIcon, InstagramIcon, GithubIcon } from '@/components/BrandIcons';

const iconMap: Record<string, any> = {
  moon: Moon, target: Target, hammer: Hammer, mail: Mail, briefcase: Briefcase, 'trending-up': TrendingUp, megaphone: Megaphone, search: Search, 'file-text': FileText, package: Package, globe: Globe, 'dollar-sign': DollarSign, cpu: Cpu, database: Database, linkedin: LinkedinIcon, activity: Activity, instagram: InstagramIcon, 'file-check': FileCheck, scissors: Scissors, heart: Heart, clock: Clock, github: GithubIcon, sparkles: Sparkles
};

interface BriefingItem { text?: string; label?: string; value?: any; name?: string; company?: string; role?: string; status?: string; date?: string; priority?: string; component?: string; loop?: number; platform?: string; campaign?: string; spend?: number; impressions?: number; clicks?: number; conversions?: number; keyword?: string; position?: number; change?: string; source?: string; profiles?: number; dataGB?: number; slot?: number; topic?: string; scheduled?: string; module?: string; progress?: number; url?: string; seo?: string; client?: string; description?: string; value_num?: number; stage?: string; probability?: number; action?: string; area?: string; current?: number; potential?: number; savings?: number; recipient?: string; time?: string; schedule?: string; deliver?: string; emails?: number; opened?: number; replied?: number; post?: string; likes?: number; comments?: number; shares?: number; }
interface Section { id: string; title: string; icon: string; summary: string; items: BriefingItem[] }

export default function JarvisPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [currentSection, setCurrentSection] = useState(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    fetch('/api/jake/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'morning_report' }) })
      .then(r => r.json())
      .then(d => { setBriefing(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const speakBriefing = async () => {
    // Try ElevenLabs first
    try {
      const voiceRes = await fetch('/api/jake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'morning report', mode: 'voice' }),
      });
      const voiceData = await voiceRes.json();
      if (voiceData.hasVoice && voiceData.voice) {
        const audio = new Audio("data:audio/mpeg;base64," + voiceData.voice);
        setSpeaking(true);
        audio.onended = () => { setSpeaking(false); setCurrentSection(-1); };
        audio.play();
        return;
      }
    } catch {}
    
    // Fallback to browser TTS
    if (!briefing || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setCurrentSection(-1);
      return;
    }

    setSpeaking(true);
    let textParts: string[] = [`${briefing.greeting}. It's ${briefing.date}.`];
    briefing.sections.forEach((s: Section, i: number) => {
      textParts.push(`${s.title}. ${s.summary}.`);
    });
    textParts.push("That's your morning briefing. Let's make it a great day, Mike.");

    let partIndex = 0;
    const speakNext = () => {
      if (partIndex >= textParts.length) {
        setSpeaking(false);
        setCurrentSection(-1);
        return;
      }
      setCurrentSection(partIndex === 0 ? -1 : partIndex - 1);
      const u = new SpeechSynthesisUtterance(textParts[partIndex]);
      u.rate = 1.0; u.pitch = 1.0; u.volume = 0.9;
      u.onend = () => { partIndex++; speakNext(); };
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    };
    speakNext();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={48} color="var(--gold)" />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <Sun size={36} color="var(--gold)" />
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--cream)', margin: 0 }}>
            {briefing?.greeting || 'Good morning, Mike'}
          </h1>
        </div>
        <p style={{ color: 'var(--gold)', fontSize: 16, opacity: 0.8 }}>{briefing?.date}</p>
        
        {/* Voice Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={speakBriefing}
          style={{
            marginTop: 16, padding: '12px 32px', borderRadius: 24,
            background: speaking ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, var(--gold), #d4a574)',
            border: 'none', color: '#1a1a2e', fontWeight: 700, fontSize: 16,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            margin: '16px auto 0'
          }}
        >
          {speaking ? <Pause size={20} /> : <Volume2 size={20} />}
          {speaking ? 'Stop Briefing' : 'Speak Briefing'}
        </motion.button>
      </motion.div>

      {/* Sections */}
      <div style={{ display: 'grid', gap: 16 }}>
        {briefing?.sections?.map((section: Section, idx: number) => {
          const Icon = iconMap[section.icon] || Sparkles;
          const isActive = speaking && currentSection === idx;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isActive ? 1 : 0.9, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: isActive ? 'var(--bg-card)' : 'var(--bg-mid)',
                borderRadius: 16, padding: 20, border: isActive ? '2px solid var(--gold)' : '1px solid rgba(212,165,116,0.15)',
                transition: 'all 0.3s',
                boxShadow: isActive ? '0 0 20px rgba(212,165,116,0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212,165,116,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color="var(--gold)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>{section.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--gold)', opacity: 0.7, margin: 0 }}>{section.summary}</p>
                </div>
              </div>

              {/* Items */}
              <div style={{ display: 'grid', gap: 6, paddingLeft: 52 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--cream)', opacity: 0.85 }}>
                    {item.priority === 'HIGH' && <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>●</span>}
                    {item.text && <span>{item.text}</span>}
                    {item.label && <><span style={{ opacity: 0.6, minWidth: 120 }}>{item.label}:</span><span style={{ fontWeight: 600, color: 'var(--gold)' }}>{item.value}</span></>}
                    {item.name && <span>{item.name} — {item.status}</span>}
                    {item.company && <span>{item.company} ({item.role}) — {item.status}</span>}
                    {item.component && <span>#{item.loop} {item.component}: <span style={{ color: 'var(--emerald)' }}>{item.status}</span></span>}
                    {item.campaign && <span>{item.platform} — {item.campaign} (${item.spend}, {item.clicks} clicks, {item.conversions} conv)</span>}
                    {item.keyword && <span>{item.keyword}: position {item.position} ({item.change})</span>}
                    {item.source && <span>{item.source}: {item.profiles} profiles, {item.dataGB}GB</span>}
                    {item.slot && <span>#{item.slot} {item.topic} — {item.status}</span>}
                    {item.module && <span>{item.module}: {item.status} ({item.progress}%)</span>}
                    {item.url && <span>{item.url} — {item.status}</span>}
                    {item.client && <span>{item.client} ${item.value?.toLocaleString() || ''} — {item.stage} ({item.probability}%) {item.action || ''}</span>}
                    {item.area && <span>{item.area}: ${item.current} → ${item.potential} (save ${item.savings}/mo)</span>}
                    {item.recipient && <span style={{ fontStyle: 'italic' }}>"{item.text}"</span>}
                    {item.schedule && <span>{item.name}: {item.schedule} → {item.deliver}</span>}
                    {item.emails !== undefined && item.name && <span>{item.name} — {item.emails} emails, {item.replied} replies</span>}
                    {item.post && <span>{item.post}: {item.likes} likes, {item.comments} comments</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--gold)', opacity: 0.5, fontSize: 13 }}>
        <p>Jarvis Morning Briefing · RIG Agent OS · Generated {briefing?.timestamp?.slice(11, 19)}</p>
      </div>
    </div>
  );
}