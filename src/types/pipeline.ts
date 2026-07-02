

export interface PipelineDeal {
  id: string;
  deal_name: string;
  value_usd: number;
  status: 'Prospecting' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed_Won' | 'Closed_Lost';
  company_name: string;
  source: 'linkedin' | 'website' | 'referral' | 'cold_outreach' | 'other';
  last_activity_date?: string;
  next_action?: string;
  assigned_to?: string;
  notes?: string;
}
