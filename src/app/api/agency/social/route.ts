import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    linkedin: {
      followers: 4823, postsQueued: 20, postsThisWeek: 5, engagementRate: '7.2%',
      posts: Array.from({ length: 20 }, (_, i) => ({
        slot: i + 1,
        topic: [
          'How AI is transforming construction bid estimation', 'The $10M ARR playbook for AI agencies',
          'Why generic AI content is killing your brand', '3 AI automations every law firm needs',
          'How we achieved 89% OR utilization for a client', 'The RIG deviation engine framework explained',
          'Why your CRM data is your biggest AI asset', 'Building anti-generic GTM pipelines',
          'The future of dental AI scheduling', 'How to score leads with 87% accuracy',
          'Cold email that actually converts: our framework', 'The 12-gate operator dossier system',
          'Why most AI agencies fail (and how we won\'t)', 'Construction safety compliance with AI monitoring',
          'The proof packet system: trust through evidence', 'How we reduced contract review time 70%',
          'Building a $10M AI agency: month 4 update', 'The RIG 3D lattice: 588 execution cells',
          'Why local-first beats cloud for AI ops', 'Our 50 goal loop fleet: how it works'
        ][i],
        status: i < 5 ? 'ready' : i < 12 ? 'drafting' : 'planned',
        scheduledDate: `2026-07-${(i % 28) + 1}`
      }))
    },
    instagram: {
      followers: 1247, postsThisWeek: 12, engagementRate: '8.4%', storyViews: 3400,
      posts: [
        { id: 'IG001', type: 'Reel', caption: 'AI fitness transformation reel', likes: 234, comments: 18, shares: 12, date: '2026-07-01' },
        { id: 'IG002', type: 'Carousel', caption: 'Before/after workout AI', likes: 412, comments: 31, shares: 28, date: '2026-06-30' },
        { id: 'IG003', type: 'Reel', caption: 'TransformFit demo walkthrough', likes: 189, comments: 14, shares: 8, date: '2026-06-29' },
        { id: 'IG004', type: 'Story', caption: 'Daily motivation + app tip', likes: 67, comments: 5, shares: 3, date: '2026-06-28' },
        { id: 'IG005', type: 'Post', caption: 'TransformFit: AI meets fitness', likes: 298, comments: 22, shares: 15, date: '2026-06-27' }
      ],
      nextPosts: [
        { slot: 1, type: 'Reel', topic: 'TransformFit AI Coach demo', status: 'ready', scheduledDate: '2026-07-02' },
        { slot: 2, type: 'Carousel', topic: '5 AI fitness trends for 2026', status: 'drafting', scheduledDate: '2026-07-03' },
        { slot: 3, type: 'Story', topic: 'User transformation spotlight', status: 'ready', scheduledDate: '2026-07-03' },
        { slot: 4, type: 'Reel', topic: 'How AI personalizes your workout', status: 'drafting', scheduledDate: '2026-07-04' },
        { slot: 5, type: 'Post', topic: 'TransformFit x RIG partnership', status: 'planned', scheduledDate: '2026-07-05' },
        { slot: 6, type: 'Story', topic: 'Behind the scenes: building TransformFit', status: 'planned', scheduledDate: '2026-07-05' },
        { slot: 7, type: 'Reel', topic: '30-day AI fitness challenge', status: 'planned', scheduledDate: '2026-07-06' },
        { slot: 8, type: 'Carousel', topic: 'Why AI coaching beats generic plans', status: 'planned', scheduledDate: '2026-07-07' },
        { slot: 9, type: 'Story', topic: 'Community spotlight + Q&A', status: 'planned', scheduledDate: '2026-07-07' },
        { slot: 10, type: 'Reel', topic: 'TransformFit results compilation', status: 'planned', scheduledDate: '2026-07-08' }
      ]
    },
    twitter: { followers: 2103, postsThisWeek: 8, engagementRate: '4.1%', scheduled: 15 }
  });
}