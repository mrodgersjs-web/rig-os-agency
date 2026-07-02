'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Users, TrendingUp, Calendar } from 'lucide-react';
import { LinkedinIcon, InstagramIcon, TwitterIcon } from '@/components/BrandIcons';

export default function SocialPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/agency/social').then(r => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }} />;

  const li = data.linkedin || {};
  const ig = data.instagram || {};
  const tw = data.twitter || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--cream)', marginBottom: 24 }}>Social Media Hub</h1>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* LinkedIn Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(10,102,194,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <LinkedinIcon size={28} color="#0a66c2" />
            <h2 style={{ color: 'var(--cream)', fontWeight: 700, margin: 0 }}>LinkedIn</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Followers</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{li.followers}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Engagement</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{li.engagementRate}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Posts Queued</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{li.postsQueued}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>This Week</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{li.postsThisWeek}</p></div>
          </div>
          <div style={{ marginTop: 16, maxHeight: 300, overflowY: 'auto' }}>
            {li.posts?.map((p: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(212,165,116,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cream)', fontSize: 13 }}>{p.topic}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: p.status === 'ready' ? 'rgba(16,185,129,0.15)' : 'rgba(212,165,116,0.1)', color: p.status === 'ready' ? '#10b981' : 'var(--gold)' }}>{p.status}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--cream)', opacity: 0.4 }}>{p.scheduledDate}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Instagram Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(236,72,153,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <InstagramIcon size={28} color="#ec4899" />
            <h2 style={{ color: 'var(--cream)', fontWeight: 700, margin: 0 }}>Instagram</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Followers</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{ig.followers}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Engagement</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{ig.engagementRate}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Posts/Week</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{ig.postsThisWeek}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Story Views</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{ig.storyViews}</p></div>
          </div>
          <h3 style={{ color: 'var(--cream)', fontSize: 14, marginTop: 16, marginBottom: 8 }}>Recent Posts</h3>
          {ig.posts?.map((p: any, i: number) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(212,165,116,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--cream)', fontSize: 13 }}>{p.caption}</span>
                  <span style={{ fontSize: 11, color: 'var(--gold)', opacity: 0.5, marginLeft: 8 }}>[{p.type}]</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: '#ec4899' }}><Heart size={11} /> {p.likes}</span>
                <span style={{ fontSize: 12, color: 'var(--gold)' }}><MessageCircle size={11} /> {p.comments}</span>
                <span style={{ fontSize: 12, color: 'var(--emerald)' }}><Share2 size={11} /> {p.shares}</span>
              </div>
            </div>
          ))}
          <h3 style={{ color: 'var(--cream)', fontSize: 14, marginTop: 16, marginBottom: 8 }}>Next 10 Posts</h3>
          {ig.nextPosts?.map((p: any, i: number) => (
            <div key={i} style={{ padding: '6px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--cream)', fontSize: 13 }}>{p.type}: {p.topic}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: p.status === 'ready' ? 'rgba(16,185,129,0.15)' : 'rgba(212,165,116,0.1)', color: p.status === 'ready' ? '#10b981' : 'var(--gold)' }}>{p.status}</span>
            </div>
          ))}
        </motion.div>

        {/* Twitter Card */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(29,155,240,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <TwitterIcon size={28} color="#1d9bf0" />
            <h2 style={{ color: 'var(--cream)', fontWeight: 700, margin: 0 }}>Twitter/X</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Followers</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{tw.followers}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Posts/Week</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{tw.postsThisWeek}</p></div>
            <div><p style={{ color: 'var(--cream)', opacity: 0.5, fontSize: 12 }}>Engagement</p><p style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>{tw.engagementRate}</p></div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--cream)', opacity: 0.6 }}>
            <p>{tw.scheduled} posts scheduled for the coming week</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}