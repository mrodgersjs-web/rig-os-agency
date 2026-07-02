/**
 * Email Outreach Tracking Data Layer
 * Tracks cold email campaigns, sequences, reply rates, meetings booked, and ROI.
 */

export type OutreachStatus =
  | "sent"
  | "opened"
  | "replied"
  | "meeting_booked"
  | "closed_won"
  | "closed_lost"
  | "bounced"
  | "unsubscribed";

export type CampaignStatus = "active" | "paused" | "draft" | "completed";

export type EmailPriority = "high" | "medium" | "low";

export interface OutreachContact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedinUrl: string;
  industry: string;
  source: "LinkedIn" | "Apollo" | "Referral" | "Manual" | "Lusha" | "Clearbit";
  verified: boolean;
}

export interface OutreachEmail {
  id: string;
  campaignId: string;
  contactId: string;
  contactName: string;
  contactCompany: string;
  subject: string;
  preview: string; // first ~80 chars of body
  sentDate: string; // ISO
  status: OutreachStatus;
  openCount: number;
  replyDate: string | null;
  replySentiment: "positive" | "neutral" | "negative" | null;
  priority: EmailPriority;
  step: number; // which step in the sequence (1, 2, 3...)
  meetingDate: string | null;
  notes: string;
}

export interface OutreachSequence {
  id: string;
  campaignId: string;
  step: number;
  subject: string;
  bodyPreview: string;
  delayDays: number; // days after previous step
  openRate: number; // 0-1
  replyRate: number; // 0-1
}

export interface OutreachCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  targetSegment: string;
  pitch: string;
  startDate: string;
  endDate: string | null;
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  totalMeetings: number;
  totalClosed: number;
}

export interface OutreachKPI {
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  totalMeetings: number;
  totalClosedWon: number;
  totalBounced: number;
  totalUnsubscribed: number;
  openRate: number;
  replyRate: number;
  meetingRate: number;
  closeRate: number;
  bounceRate: number;
  activeCampaigns: number;
  totalContacts: number;
  avgReplyHours: number;
  pipelineValue: number;
}

export const getCampaigns = (): OutreachCampaign[] => [
  {
    id: "camp_construction",
    name: "Construction GCs — Q3 Land Grab",
    status: "active",
    targetSegment: "Construction GC $20M-$100M rev",
    pitch: "Fractional CMO for construction: pipeline visibility + lead gen system in 90 days",
    startDate: "2026-06-15T00:00:00.000Z",
    endDate: null,
    totalSent: 84,
    totalOpened: 61,
    totalReplied: 18,
    totalMeetings: 7,
    totalClosed: 2,
  },
  {
    id: "camp_dental",
    name: "DSO Patient Acquisition Blitz",
    status: "active",
    targetSegment: "Multi-location dental groups (10+ locations)",
    pitch: "Patient acquisition engine: Google Ads + LTV tracking + retention automations",
    startDate: "2026-06-20T00:00:00.000Z",
    endDate: null,
    totalSent: 52,
    totalOpened: 39,
    totalReplied: 12,
    totalMeetings: 5,
    totalClosed: 1,
  },
  {
    id: "camp_manufacturing",
    name: "Manufacturing Digital Transformation",
    status: "active",
    targetSegment: "Mid-market manufacturers $30M-$200M",
    pitch: "Digital transformation: ERP-integrated CRM + automated quoting + SEO",
    startDate: "2026-06-10T00:00:00.000Z",
    endDate: null,
    totalSent: 67,
    totalOpened: 44,
    totalReplied: 9,
    totalMeetings: 3,
    totalClosed: 0,
  },
  {
    id: "camp_legal",
    name: "Law Firms — Practice Area Growth",
    status: "paused",
    targetSegment: "Boutique law firms (10-50 attorneys)",
    pitch: "Practice-area-specific growth: targeted SEO + intake optimization",
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2026-06-15T00:00:00.000Z",
    totalSent: 38,
    totalOpened: 24,
    totalReplied: 5,
    totalMeetings: 2,
    totalClosed: 1,
  },
  {
    id: "camp_saas",
    name: "B2B SaaS GTM Partner",
    status: "draft",
    targetSegment: "Series A-B SaaS companies",
    pitch: "GTM partner: ICP refinement + outbound engine + revenue ops",
    startDate: "2026-07-01T00:00:00.000Z",
    endDate: null,
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    totalMeetings: 0,
    totalClosed: 0,
  },
];

export const getSequences = (): OutreachSequence[] => [
  {
    id: "seq_c1_s1",
    campaignId: "camp_construction",
    step: 1,
    subject: "Quick question about {company}'s project pipeline",
    bodyPreview: "Hi {firstName}, noticed {company} is scaling fast — are you still relying on referrals for new bids?",
    delayDays: 0,
    openRate: 0.74,
    replyRate: 0.21,
  },
  {
    id: "seq_c1_s2",
    campaignId: "camp_construction",
    step: 2,
    subject: "Re: Quick question about {company}'s project pipeline",
    bodyPreview: "Following up — I built a lead gen system for a $60M GC that added $4.2M in qualified bids in 6 months.",
    delayDays: 3,
    openRate: 0.58,
    replyRate: 0.14,
  },
  {
    id: "seq_c1_s3",
    campaignId: "camp_construction",
    step: 3,
    subject: "Last one — 15-minute teardown for {company}?",
    bodyPreview: "Happy to do a quick call to share 3 specific things your competitors are doing that you aren't.",
    delayDays: 4,
    openRate: 0.49,
    replyRate: 0.09,
  },
  {
    id: "seq_c2_s1",
    campaignId: "camp_dental",
    step: 1,
    subject: "22 locations but no patient LTV tracking?",
    bodyPreview: "Hi {firstName}, most DSOs we work with are leaving 30% of patient value on the table...",
    delayDays: 0,
    openRate: 0.71,
    replyRate: 0.19,
  },
  {
    id: "seq_c2_s2",
    campaignId: "camp_dental",
    step: 2,
    subject: "Re: 22 locations but no patient LTV tracking?",
    bodyPreview: "Quick case study: we helped a 15-location DSO cut CAC by 38% in 90 days.",
    delayDays: 3,
    openRate: 0.55,
    replyRate: 0.12,
  },
];

export const getEmails = (): OutreachEmail[] => [
  {
    id: "email_001",
    campaignId: "camp_construction",
    contactId: "con_001",
    contactName: "Sarah Chen",
    contactCompany: "BuildRight Construction Group",
    subject: "Quick question about BuildRight's project pipeline",
    preview: "Hi Sarah, noticed BuildRight is scaling fast — are you still relying on referrals for new bids?",
    sentDate: "2026-06-28T09:30:00.000Z",
    status: "meeting_booked",
    openCount: 4,
    replyDate: "2026-06-29T14:00:00.000Z",
    replySentiment: "positive",
    priority: "high",
    step: 1,
    meetingDate: "2026-07-03T15:00:00.000Z",
    notes: "Meeting booked for Thursday. She's evaluating 3 agencies.",
  },
  {
    id: "email_002",
    campaignId: "camp_construction",
    contactId: "con_002",
    contactName: "Mike Reynolds",
    contactCompany: "Apex Builders Inc",
    subject: "Quick question about Apex's project pipeline",
    preview: "Hi Mike, noticed Apex is scaling fast — are you still relying on referrals for new bids?",
    sentDate: "2026-06-28T09:35:00.000Z",
    status: "replied",
    openCount: 3,
    replyDate: "2026-07-01T10:15:00.000Z",
    replySentiment: "neutral",
    priority: "high",
    step: 1,
    meetingDate: null,
    notes: "Asked for case studies. Sent PDF, awaiting response.",
  },
  {
    id: "email_003",
    campaignId: "camp_construction",
    contactId: "con_003",
    contactName: "Jennifer Torres",
    contactCompany: "Torres Contracting LLC",
    subject: "Quick question about Torres's project pipeline",
    preview: "Hi Jennifer, noticed Torres Contracting is scaling fast — are you still relying on referrals?",
    sentDate: "2026-06-28T09:40:00.000Z",
    status: "opened",
    openCount: 2,
    replyDate: null,
    replySentiment: null,
    priority: "medium",
    step: 1,
    meetingDate: null,
    notes: "",
  },
  {
    id: "email_004",
    campaignId: "camp_dental",
    contactId: "con_004",
    contactName: "Dr. Marcus Webb",
    contactCompany: "Coastal Dental Partners",
    subject: "22 locations but no patient LTV tracking?",
    preview: "Hi Marcus, most DSOs we work with are leaving 30% of patient value on the table...",
    sentDate: "2026-06-29T08:00:00.000Z",
    status: "closed_won",
    openCount: 5,
    replyDate: "2026-06-29T16:30:00.000Z",
    replySentiment: "positive",
    priority: "high",
    step: 1,
    meetingDate: "2026-07-01T14:00:00.000Z",
    notes: "CLOSED: $12K/mo retainer signed. Onboarding starts July 8.",
  },
  {
    id: "email_005",
    campaignId: "camp_dental",
    contactId: "con_005",
    contactName: "Dr. Lisa Park",
    contactCompany: "BrightSmile Dental Group",
    subject: "15 locations but no patient LTV tracking?",
    preview: "Hi Lisa, most DSOs we work with are leaving 30% of patient value on the table...",
    sentDate: "2026-06-29T08:05:00.000Z",
    status: "replied",
    openCount: 3,
    replyDate: "2026-06-30T11:00:00.000Z",
    replySentiment: "positive",
    priority: "high",
    step: 1,
    meetingDate: null,
    notes: "Wants to schedule next week. Coordinating calendars.",
  },
  {
    id: "email_006",
    campaignId: "camp_manufacturing",
    contactId: "con_006",
    contactName: "Robert Kowalski",
    contactCompany: "Ironclad Manufacturing",
    subject: "Digital transformation for Ironclad — 3 quick wins",
    preview: "Hi Robert, most manufacturers we work with are losing deals to competitors with faster quoting...",
    sentDate: "2026-06-25T10:00:00.000Z",
    status: "replied",
    openCount: 4,
    replyDate: "2026-06-27T09:00:00.000Z",
    replySentiment: "neutral",
    priority: "medium",
    step: 2,
    meetingDate: null,
    notes: "Asked about pricing range. Sent tier options.",
  },
  {
    id: "email_007",
    campaignId: "camp_manufacturing",
    contactId: "con_007",
    contactName: "David Chen",
    contactCompany: "PrecisionMold Corp",
    subject: "Digital transformation for PrecisionMold — 3 quick wins",
    preview: "Hi David, most manufacturers we work with are losing deals to competitors with faster quoting...",
    sentDate: "2026-06-25T10:10:00.000Z",
    status: "bounced",
    openCount: 0,
    replyDate: null,
    replySentiment: null,
    priority: "low",
    step: 1,
    meetingDate: null,
    notes: "Email bounced — needs enrichment/verification.",
  },
  {
    id: "email_008",
    campaignId: "camp_construction",
    contactId: "con_008",
    contactName: "Tony Marchetti",
    contactCompany: "Marchetti & Sons Construction",
    subject: "Following up — 15-minute teardown for Marchetti?",
    preview: "Happy to do a quick call to share 3 specific things your competitors are doing...",
    sentDate: "2026-07-01T09:00:00.000Z",
    status: "sent",
    openCount: 0,
    replyDate: null,
    replySentiment: null,
    priority: "medium",
    step: 3,
    meetingDate: null,
    notes: "",
  },
];

export const getContacts = (): OutreachContact[] => [
  { id: "con_001", name: "Sarah Chen", title: "VP Operations", company: "BuildRight Construction Group", email: "sarah.chen@buildright.co", linkedinUrl: "https://linkedin.com/in/sarahchen", industry: "Construction", source: "Apollo", verified: true },
  { id: "con_002", name: "Mike Reynolds", title: "President", company: "Apex Builders Inc", email: "mreynolds@apexbuilders.com", linkedinUrl: "https://linkedin.com/in/mikereynolds", industry: "Construction", source: "LinkedIn", verified: true },
  { id: "con_003", name: "Jennifer Torres", title: "Owner", company: "Torres Contracting LLC", email: "jennifer@torrescontracting.com", linkedinUrl: "", industry: "Construction", source: "Manual", verified: false },
  { id: "con_004", name: "Dr. Marcus Webb", title: "CEO", company: "Coastal Dental Partners", email: "mwebb@coastaldental.com", linkedinUrl: "https://linkedin.com/in/marcuswebb", industry: "Healthcare / Dental", source: "Referral", verified: true },
  { id: "con_005", name: "Dr. Lisa Park", title: "Managing Partner", company: "BrightSmile Dental Group", email: "lpark@brightsmile.com", linkedinUrl: "https://linkedin.com/in/lisapark", industry: "Healthcare / Dental", source: "Lusha", verified: true },
  { id: "con_006", name: "Robert Kowalski", title: "COO", company: "Ironclad Manufacturing", email: "rkowalski@ironcladmfg.com", linkedinUrl: "https://linkedin.com/in/rkowalski", industry: "Manufacturing", source: "Apollo", verified: true },
  { id: "con_007", name: "David Chen", title: "VP Engineering", company: "PrecisionMold Corp", email: "dchen@precisionmold.com", linkedinUrl: "", industry: "Manufacturing", source: "Clearbit", verified: false },
  { id: "con_008", name: "Tony Marchetti", title: "Owner", company: "Marchetti & Sons Construction", email: "tony@marchetticons.com", linkedinUrl: "https://linkedin.com/in/tonymarchetti", industry: "Construction", source: "LinkedIn", verified: true },
];

export function getOutreachKPIs(): OutreachKPI {
  const campaigns = getCampaigns();
  const emails = getEmails();

  const totalSent = emails.length;
  const totalOpened = emails.filter(e => e.openCount > 0 || e.status === "opened" || e.status === "replied" || e.status === "meeting_booked" || e.status === "closed_won").length;
  const totalReplied = emails.filter(e => e.status === "replied" || e.status === "meeting_booked" || e.status === "closed_won").length;
  const totalMeetings = emails.filter(e => e.status === "meeting_booked" || e.status === "closed_won").length;
  const totalClosedWon = emails.filter(e => e.status === "closed_won").length;
  const totalBounced = emails.filter(e => e.status === "bounced").length;
  const totalUnsubscribed = emails.filter(e => e.status === "unsubscribed").length;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalContacts = getContacts().length;

  const repliedEmails = emails.filter(e => e.replyDate && e.sentDate);
  const avgReplyHours = repliedEmails.length > 0
    ? repliedEmails.reduce((sum, e) => {
        const diff = new Date(e.replyDate!).getTime() - new Date(e.sentDate).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0) / repliedEmails.length
    : 0;

  // Estimate pipeline value from meetings (avg deal $120K/yr)
  const pipelineValue = (totalMeetings + totalClosedWon) * 120000;

  return {
    totalSent,
    totalOpened,
    totalReplied,
    totalMeetings,
    totalClosedWon,
    totalBounced,
    totalUnsubscribed,
    openRate: totalSent > 0 ? totalOpened / totalSent : 0,
    replyRate: totalSent > 0 ? totalReplied / totalSent : 0,
    meetingRate: totalSent > 0 ? totalMeetings / totalSent : 0,
    closeRate: totalMeetings > 0 ? totalClosedWon / totalMeetings : 0,
    bounceRate: totalSent > 0 ? totalBounced / totalSent : 0,
    activeCampaigns,
    totalContacts,
    avgReplyHours: Math.round(avgReplyHours),
    pipelineValue,
  };
}
