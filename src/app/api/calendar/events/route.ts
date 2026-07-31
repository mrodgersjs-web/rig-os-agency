import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO-8601
  end: string;
  source: "google" | "calendly";
  location?: string;
  attendees?: string[];
  color?: string;
  status: "confirmed" | "tentative" | "cancelled";
}

interface BookingSlot {
  id: string;
  name: string;
  email: string;
  eventType: string;
  start: string;
  end: string;
  status: "upcoming" | "completed" | "cancelled" | "no_show";
  notes?: string;
  calendlyEventUri: string;
}

interface CalendarResponse {
  _real: boolean;
  _source: string;
  /** True when the payload is a hardcoded fixture rather than a real backend read. */
  _mock?: boolean;
  events: CalendarEvent[];
  bookings: BookingSlot[];
  weeklyStats: {
    totalEvents: number;
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    noShows: number;
  };
}

function getMockCalendar(): CalendarResponse {
  // Week of July 2, 2026
  const today = new Date("2026-07-02T08:00:00-06:00");
  const day = (d: number, h: number, m: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + d, h, m, 0).toISOString();

  const events: CalendarEvent[] = [
    {
      id: "ev_001",
      title: "RIG OS Agency Daily Standup",
      start: day(0, 9, 0),
      end: day(0, 9, 30),
      source: "google",
      location: "Google Meet: agency-standup",
      color: "#d4a574",
      status: "confirmed",
    },
    {
      id: "ev_002",
      title: "TechFlow SaaS — Phase 2 Demo",
      start: day(0, 11, 0),
      end: day(0, 12, 0),
      source: "google",
      location: "Zoom: mike.rodgers/techflow",
      attendees: ["sarah.chen@techflow.io"],
      color: "#5ab896",
      status: "confirmed",
    },
    {
      id: "ev_003",
      title: "FinEdge Compliance — One-Pager Review",
      start: day(0, 14, 0),
      end: day(0, 15, 0),
      source: "google",
      color: "#4a9eff",
      status: "tentative",
    },
    {
      id: "ev_004",
      title: "HealthBridge — Patient Data Sync Call",
      start: day(1, 10, 0),
      end: day(1, 10, 30),
      source: "google",
      attendees: ["dr.emily@healthbridge.med"],
      color: "#c084fc",
      status: "confirmed",
    },
    {
      id: "ev_005",
      title: "Contract Drafting — EduScale Onboarding",
      start: day(1, 14, 0),
      end: day(1, 16, 0),
      source: "google",
      color: "#f97316",
      status: "confirmed",
    },
    {
      id: "ev_006",
      title: "Q3 Strategy Review — Internal",
      start: day(2, 9, 0),
      end: day(2, 11, 0),
      source: "google",
      location: "Boardroom",
      color: "#d4a574",
      status: "confirmed",
    },
    {
      id: "ev_007",
      title: "ForgeWorks Q3 QBR",
      start: day(2, 13, 0),
      end: day(2, 14, 0),
      source: "google",
      attendees: ["tom.anderson@forgeworks.com"],
      color: "#5ab896",
      status: "confirmed",
    },
    {
      id: "ev_008",
      title: "SecureNet Threat Detection — Incident Call",
      start: day(0, 17, 0),
      end: day(0, 18, 0),
      source: "google",
      attendees: ["aisha.patel@securenet.io"],
      color: "#ef4444",
      status: "confirmed",
    },
  ];

  const bookings: BookingSlot[] = [
    {
      id: "bk_001",
      name: "Sarah Chen",
      email: "sarah.chen@techflow.io",
      eventType: "AI Strategy Consultation (60 min)",
      start: day(0, 10, 0),
      end: day(0, 11, 0),
      status: "completed",
      notes: "Discussed Phase 2 AI pipeline. Ready to send SOW.",
      calendlyEventUri: "https://calendly.com/mike-rodgers/ai-consult/event-001",
    },
    {
      id: "bk_002",
      name: "Marcus Webb",
      email: "marcus.webb@finedge.com",
      eventType: "Enterprise Discovery Call (30 min)",
      start: day(3, 10, 0),
      end: day(3, 10, 30),
      status: "upcoming",
      calendlyEventUri: "https://calendly.com/mike-rodgers/discovery/event-002",
    },
    {
      id: "bk_003",
      name: "David Okafor",
      email: "david.okafor@shopwave.com",
      eventType: "Technical Deep Dive (45 min)",
      start: day(4, 11, 0),
      end: day(4, 11, 45),
      status: "upcoming",
      calendlyEventUri: "https://calendly.com/mike-rodgers/tech-deep/event-003",
    },
    {
      id: "bk_004",
      name: "Aisha Patel",
      email: "aisha.patel@securenet.io",
      eventType: "Emergency Response Call (30 min)",
      start: day(0, 17, 30),
      end: day(0, 18, 0),
      status: "upcoming",
      calendlyEventUri: "https://calendly.com/mike-rodgers/emergency/event-004",
    },
    {
      id: "bk_005",
      name: "Tom Anderson",
      email: "tom.anderson@forgeworks.com",
      eventType: "Quarterly Business Review (60 min)",
      start: day(1, 9, 0),
      end: day(1, 10, 0),
      status: "completed",
      notes: "Reviewed Q2 metrics. Pipeline maintenance ROI at 37% cost reduction.",
      calendlyEventUri: "https://calendly.com/mike-rodgers/qbr/event-005",
    },
    {
      id: "bk_006",
      name: "Rachel Kim",
      email: "rachel.kim@proptech.ai",
      eventType: "Partnership Exploration (45 min)",
      start: day(5, 13, 0),
      end: day(5, 13, 45),
      status: "upcoming",
      calendlyEventUri: "https://calendly.com/mike-rodgers/partner/event-006",
    },
    {
      id: "bk_007",
      name: "James Park",
      email: "james.park@shipright.io",
      eventType: "Cold Intro → Discovery (30 min)",
      start: day(0, 15, 30),
      end: day(0, 16, 0),
      status: "no_show",
      notes: "No-show. James had a logistics emergency. Suggested reschedule via DM.",
      calendlyEventUri: "https://calendly.com/mike-rodgers/discovery/event-007",
    },
  ];

  const upcomingBookings = bookings.filter((b) => b.status === "upcoming").length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const noShows = bookings.filter((b) => b.status === "no_show").length;

  return {
    // Was `_real: true` while _source admitted "(mock data pending backend)"
    // in the same object. A consumer checking `_real` would have trusted it.
    // The flag now tells the truth: this is fixture data, not a calendar.
    _real: false,
    _mock: true,
    _source: "HARDCODED FIXTURE — no calendar backend is connected. Not real events.",
    events,
    bookings,
    weeklyStats: {
      totalEvents: events.length,
      totalBookings: bookings.length,
      upcomingBookings,
      completedBookings,
      noShows,
    },
  };
}

export async function GET() {
  const data = getMockCalendar();
  return NextResponse.json(data);
}