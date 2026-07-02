import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const teasers = Array.from({ length: 50 }, (_, i) => {
  const verticals = ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'Real Estate', 'Manufacturing', 'Law', 'Dental', 'CPA'];
  const v = verticals[i % verticals.length];
  const sent = i < 34;
  const replied = i < 12;
  const meeting = i < 5;
  return {
    id: `T${(i+1).toString().padStart(3,'0')}`,
    slot: i + 1,
    vertical: v,
    title: [
      `How ${v} companies lose $500K to manual processes`,
      `The AI automation gap in ${v}: 3 blind spots`,
      `Why your ${v} competitors are already using AI`,
      `${v} growth without adding headcount: the AI path`,
      `The 3-step AI playbook for ${v} firms`,
      `Stop leaving money on the table: ${v} automation audit`,
      `How we cut ${v} operational costs 40% with AI`,
      `${v} decision-makers: are you falling behind?`,
      `The proof-packet approach to ${v} AI transformation`,
      `Your ${v} firm's hidden AI advantage`
    ][i % 10],
    antiGenericScore: 85 + (i % 8),
    status: meeting ? 'meeting_booked' : replied ? 'replied' : sent ? 'sent' : 'drafting',
    sentDate: sent ? `2026-07-${(i % 28) + 1}` : null,
    replyDate: replied ? `2026-07-${(i % 20) + 5}` : null,
    meetingDate: meeting ? `2026-07-${(i % 15) + 10}` : null,
    estimatedValue: 30000 + (i * 2500)
  };
});

export async function GET() {
  return NextResponse.json({
    total: 50, sent: 34, replied: 12, meetings: 5, drafting: 16,
    replyRate: '35.3%', meetingRate: '14.7%', avgAntiGeneric: 87,
    pipelineValue: teasers.filter(t => t.status !== 'drafting').reduce((s, t) => s + t.estimatedValue, 0),
    teasers
  });
}