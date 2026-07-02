import { NextResponse } from "next/server";
import {
  getOutreachKPIs,
  getCampaigns,
  getEmails,
  getSequences,
  getContacts,
} from "@/lib/outreach-data";

export async function GET() {
  const kpis = getOutreachKPIs();
  const campaigns = getCampaigns();
  const emails = getEmails();
  const sequences = getSequences();
  const contacts = getContacts();

  return NextResponse.json({
    kpis,
    campaigns,
    emails,
    sequences,
    contacts,
    summary: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalEmails: emails.length,
      totalContacts: contacts.length,
      openRate: `${(kpis.openRate * 100).toFixed(0)}%`,
      replyRate: `${(kpis.replyRate * 100).toFixed(0)}%`,
      pipelineValue: kpis.pipelineValue,
    },
  });
}
