

export interface PipelineDeal {
  id: string;
  deal_name: string;
  company_name?: string;
  value_usd: number;
  source: 'linkedin' | 'website' | 'referral' | 'cold_outreach' | 'other';
  last_activity: string;
  stages: PipelineStage[];
}

export type PipelineStage = 
  | 'Prospecting'
  | 'Discovery'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed-Won'
  | 'Closed-Lost';
