// ── RIG OS Agency — Ultraplan: Phased Build Plan ──────────────────────
// The master plan to move from scaffolding to fully tested and operational.

export type PhaseStatus = "completed" | "in_progress" | "pending" | "blocked";

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  test: string;
}

export interface PlanPhase {
  id: number;
  name: string;
  status: PhaseStatus;
  goal: string;
  tasks: PlanTask[];
  doneTest: string;
}

export const ULTRAPLAN: PlanPhase[] = [
  {
    id: 1,
    name: "SQLite Persistence Layer",
    status: "completed",
    goal: "Replace all in-memory data with a real SQLite database that persists across restarts.",
    doneTest: "Add a client via API, restart Docker container, verify client still exists via API.",
    tasks: [
      { id: "1.1", title: "Create SQLite schema", description: "Tables for clients, proposals, contracts, invoices, pipeline_deals, goals, agents, mcp_servers", deliverable: "src/lib/db/schema.ts", test: "Schema compiles, types match agency-types.ts" },
      { id: "1.2", title: "Seed database on first run", description: "Migrate seed data from agency-data.ts into SQLite on startup", deliverable: "src/lib/db/seed.ts", test: "First run creates DB with 10 clients, 8 verticals, 4 tiers" },
      { id: "1.3", title: "Replace agency-data.ts with DB queries", description: "All getClients(), getDashboardKPIs() etc. read from SQLite instead of in-memory arrays", deliverable: "src/lib/db/queries.ts", test: "API returns same data shape but from DB" },
      { id: "1.4", title: "Write DB to Docker volume", description: "SQLite file at /app/data/rigos.db, persisted via Docker volume", deliverable: "docker-compose.yml volume mount", test: "Data survives container restart" },
    ],
  },
  {
    id: 2,
    name: "Client CRUD with Real Forms",
    status: "pending",
    goal: "Full create-read-update-delete for clients with real form inputs, validation, and persistence.",
    doneTest: "Create a client via the UI form, edit it, delete it, verify all changes persist in DB.",
    tasks: [
      { id: "2.1", title: "Add client form component", description: "Modal form with all client fields: name, vertical, contact, tier, fee, services, notes", deliverable: "src/components/ClientForm.tsx", test: "Form renders all fields, validates required inputs" },
      { id: "2.2", title: "Wire POST/PUT/DELETE API routes", description: "Real CRUD operations against SQLite, not just mock responses", deliverable: "src/app/api/agency/clients/route.ts (POST), [id]/route.ts (PUT, DELETE)", test: "curl POST creates row, PUT updates it, DELETE removes it" },
      { id: "2.3", title: "Client detail page", description: "Dedicated page per client showing services, contracts, invoices, assigned agents, health history", deliverable: "src/app/agency/clients/[id]/page.tsx", test: "Navigate to client detail, see all related data" },
      { id: "2.4", title: "Inline editing on client table", description: "Click any field in the table to edit inline (health, status, tier)", deliverable: "src/components/ClientTable.tsx", test: "Click health field, change green→yellow, verify DB updates" },
    ],
  },
  {
    id: 3,
    name: "Proposal Generator",
    status: "pending",
    goal: "Generate professional proposals with per-vertical templates, pricing, scope, and ProofPacket binding.",
    doneTest: "Create a proposal for a healthcare client, generate PDF, verify it includes correct template and pricing.",
    tasks: [
      { id: "3.1", title: "Vertical proposal templates", description: "8 templates (construction, law, healthcare, dental, cpa, services, manufacturing, pe_cfo) with scope, deliverables, pricing", deliverable: "src/lib/proposal-templates.ts", test: "Each template has unique scope and deliverables" },
      { id: "3.2", title: "Proposal creation form", description: "Select client → auto-fill template → edit scope/pricing → save", deliverable: "src/components/ProposalForm.tsx", test: "Selecting a healthcare client fills healthcare template" },
      { id: "3.3", title: "Proposal PDF generation", description: "Generate downloadable PDF with RIG branding, client info, scope, pricing, terms", deliverable: "src/app/api/agency/proposals/[id]/pdf/route.ts", test: "curl returns PDF with correct content" },
      { id: "3.4", title: "Proposal status tracking", description: "Draft → Sent → Accepted/Rejected with timestamps and ProofPacket binding", deliverable: "DB status column + UI badges", test: "Change status sent→accepted, verify timestamp recorded" },
    ],
  },
  {
    id: 4,
    name: "Contract Management",
    status: "pending",
    goal: "Track contracts with auto-renewal alerts, SLA terms, and expiration warnings.",
    doneTest: "Create a contract with 30-day auto-renew, verify renewal alert appears 30 days before expiry.",
    tasks: [
      { id: "4.1", title: "Contract CRUD with terms", description: "Create contracts linked to clients with start/end dates, monthly fee, auto-renew flag, SLA hours", deliverable: "src/app/api/agency/contracts/route.ts (full CRUD)", test: "Create contract, verify all fields persist" },
      { id: "4.2", title: "Renewal alert system", description: "Query contracts expiring within 30/60/90 days, display alerts on dashboard", deliverable: "src/lib/renewal-alerts.ts + dashboard widget", test: "Create contract ending in 25 days, verify alert appears" },
      { id: "4.3", title: "Contract status lifecycle", description: "Draft → Active → Expiring → Expired → Terminated with auto-transitions", deliverable: "src/lib/contract-lifecycle.ts", test: "Set contract end date to past, verify status auto-changes to expired" },
    ],
  },
  {
    id: 5,
    name: "Invoice Generation & Billing",
    status: "pending",
    goal: "Automated monthly invoice generation, payment tracking, and PDF export.",
    doneTest: "Generate monthly invoices for all active clients, verify PDFs are correct, mark one as paid.",
    tasks: [
      { id: "5.1", title: "Auto-generate monthly invoices", description: "Cron or API endpoint that creates invoices for all active clients on the 1st of each month", deliverable: "src/app/api/agency/invoices/generate/route.ts", test: "Call generate endpoint, verify invoices created for all active clients" },
      { id: "5.2", title: "Invoice PDF with line items", description: "Professional invoice PDF with RIG branding, line items, totals, due date, payment terms", deliverable: "src/app/api/agency/invoices/[id]/pdf/route.ts", test: "Download invoice PDF, verify line items and totals match" },
      { id: "5.3", title: "Payment tracking", description: "Mark invoices as sent/paid/overdue with timestamps", deliverable: "Invoice status in DB + UI", test: "Mark invoice as paid, verify paidDate recorded" },
      { id: "5.4", title: "Revenue recognition", description: "Recognize revenue when invoice is paid, update ARR/MRR on dashboard", deliverable: "src/lib/revenue-recognition.ts", test: "Pay an invoice, verify MRR increases on dashboard" },
    ],
  },
  {
    id: 6,
    name: "Real Agent Inventory Loading",
    status: "pending",
    goal: "Load all 232 agency agents, 86 RIG experts, and VoltAgent subagents from real JSON files.",
    doneTest: "Open Fleet page, see 232+ agents listed with real names, roles, and capabilities from JSON files.",
    tasks: [
      { id: "6.1", title: "Server-side JSON loading", description: "API route that reads agency_agents_inventory.json, rig_domain_experts_inventory.json, voltagent_inventory.json from disk", deliverable: "src/app/api/agency/fleet/route.ts (updated)", test: "API returns 232+ agents with real names" },
      { id: "6.2", title: "Fleet page with real data", description: "Fleet page fetches from API and displays all agents grouped by category with search and filter", deliverable: "src/app/rig-fleet/page.tsx (updated)", test: "Search for 'backend' returns matching agents" },
      { id: "6.3", title: "Agent detail cards", description: "Click any agent to see full spec: capabilities, invocation path, status, linked skills", deliverable: "src/components/AgentDetailCard.tsx", test: "Click agent, verify spec details display" },
    ],
  },
  {
    id: 7,
    name: "Live MCP Health Checks",
    status: "pending",
    goal: "Real-time health checking of all 15 MCP servers with status updates.",
    doneTest: "Open MCP Registry page, see live green/red status for each MCP, click one to see its tools.",
    tasks: [
      { id: "7.1", title: "MCP health check endpoint", description: "API that pings each MCP server and returns real connected/disconnected status", deliverable: "src/app/api/agency/mcp/health/route.ts", test: "Call endpoint, verify status matches actual MCP availability" },
      { id: "7.2", title: "MCP page with live status", description: "MCP Registry page fetches health and shows green/red indicators, tool counts, last-checked time", deliverable: "src/app/rig-mcp/page.tsx (updated)", test: "Stop an MCP server, verify its status turns red" },
      { id: "7.3", title: "MCP detail with tool list", description: "Click any MCP to see its full tool list, capabilities, and configuration", deliverable: "src/components/MCPDetailCard.tsx", test: "Click cua-driver, verify 8 tools listed" },
    ],
  },
  {
    id: 8,
    name: "Multi-Tenant Client Portals",
    status: "pending",
    goal: "Each client gets their own branded portal with their metrics, reports, and ProofPackets.",
    doneTest: "Log in as a client, see only their data, branded with their company name and color.",
    tasks: [
      { id: "8.1", title: "Client authentication", description: "Simple token-based auth: each client gets a unique URL token for their portal", deliverable: "src/lib/client-auth.ts", test: "Visit /portal/[token], verify correct client data loads" },
      { id: "8.2", title: "Client portal page", description: "Branded dashboard showing client's services, agents, ProofPackets, invoices, KPIs", deliverable: "src/app/portal/[token]/page.tsx", test: "Visit portal, verify only that client's data shows" },
      { id: "8.3", title: "Automated weekly reports", description: "Cron that generates a weekly ProofPacket report per client and makes it available in their portal", deliverable: "src/lib/weekly-report.ts + cron route", test: "Trigger report generation, verify it appears in client portal" },
    ],
  },
];

export function getPlan() {
  return ULTRAPLAN;
}

export function getPhase(id: number): PlanPhase | undefined {
  return ULTRAPLAN.find((p) => p.id === id);
}

export function getPlanStats() {
  const total = ULTRAPLAN.length;
  const completed = ULTRAPLAN.filter((p) => p.status === "completed").length;
  const inProgress = ULTRAPLAN.filter((p) => p.status === "in_progress").length;
  const pending = ULTRAPLAN.filter((p) => p.status === "pending").length;
  const totalTasks = ULTRAPLAN.reduce((sum, p) => sum + p.tasks.length, 0);
  return { total, completed, inProgress, pending, totalTasks };
}