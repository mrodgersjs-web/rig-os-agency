const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Wrote', file);
}

function safeTitle(title) {
  return title.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

const listPage = (opts) => `"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ${safeTitle(opts.title)}List() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("${opts.api}");
      const d = await r.json();
      setRows(d.${opts.itemKey} || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = ${JSON.stringify(opts.columns)};

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={${JSON.stringify(opts.breadcrumbs)}} />
      <PageHeader
        title="${opts.title}"
        subtitle="${opts.subtitle}"
        action={{ label: "New", onClick: () => openDetail({ id: "new-${opts.title.toLowerCase().replace(/\s+/g, '-')}", type: "system", title: "Create ${opts.title.replace(/s$/, '')}", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "${opts.detailType || 'deal'}", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="${opts.emptyTitle}"
        emptyDescription="${opts.emptyDesc}"
      />
    </div>
  );
}
`;

const actionsPage = (opts) => `"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";

const ACTIONS = ${JSON.stringify(opts.actions)};

export default function ${safeTitle(opts.title)}Actions() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const runAction = useCallback(async (action: typeof ACTIONS[0]) => {
    setRunning(action.id);
    setResult(null);
    try {
      const r = await fetch(action.api.replace('[id]', id), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setResult(await r.json());
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setRunning(null);
  }, [id]);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={${JSON.stringify(opts.breadcrumbs)}} />
      <PageHeader title="${opts.title}" subtitle="Execute actions" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => runAction(action)}
            disabled={running === action.id}
            className="text-left rounded-lg p-4 border transition hover:shadow-md disabled:opacity-50"
            style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}
          >
            <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--rig-text)" }}>{action.label}</div>
            <div className="text-[12px]" style={{ color: "var(--rig-text-3)" }}>{action.description}</div>
          </button>
        ))}
      </div>
      {running && <div className="text-[12px]" style={{ color: "var(--rig-text-mute)" }}>Running {running}...</div>}
      {result && (
        <div className="rounded-lg border p-4" style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--rig-text-mute)" }}>Result</div>
          <pre className="text-[10px] overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
`;

// ─── REVENUE ───
write(path.join(root, "src/app/agency/revenue/invoices/list/page.tsx"), listPage({
  title: "Invoices",
  subtitle: "Create, send, and manage customer invoices",
  breadcrumbs: [{ label: "Revenue", href: "/agency/revenue" }, { label: "Invoices" }],
  api: "/api/agency/invoices",
  itemKey: "invoices",
  detailType: "revenue",
  columns: [
    { key: "number", label: "Invoice #" },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Amount", align: "right", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
    { key: "dueDate", label: "Due", width: "100px" },
  ],
  emptyTitle: "No invoices",
  emptyDesc: "Create your first invoice to bill a customer",
}));

write(path.join(root, "src/app/agency/revenue/charges/list/page.tsx"), listPage({
  title: "Charges",
  subtitle: "Recent successful charges and receipts",
  breadcrumbs: [{ label: "Revenue", href: "/agency/revenue" }, { label: "Charges" }],
  api: "/api/stripe/revenue",
  itemKey: "recentCharges",
  detailType: "revenue",
  columns: [
    { key: "email", label: "Customer" },
    { key: "amount", label: "Amount", align: "right", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
    { key: "date", label: "Date", width: "120px" },
  ],
  emptyTitle: "No charges",
  emptyDesc: "Charges appear here when Stripe is connected",
}));

write(path.join(root, "src/app/agency/revenue/customers/list/page.tsx"), listPage({
  title: "Customers",
  subtitle: "Stripe customer records and billing details",
  breadcrumbs: [{ label: "Revenue", href: "/agency/revenue" }, { label: "Customers" }],
  api: "/api/agency/clients",
  itemKey: "clients",
  detailType: "client",
  columns: [
    { key: "name", label: "Name" },
    { key: "vertical", label: "Vertical", width: "120px" },
    { key: "monthlyFee", label: "MRR", align: "right", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No customers",
  emptyDesc: "Customers appear when Stripe is connected",
}));

write(path.join(root, "src/app/agency/revenue/subscriptions/list/page.tsx"), listPage({
  title: "Subscriptions",
  subtitle: "Active subscriptions and renewal dates",
  breadcrumbs: [{ label: "Revenue", href: "/agency/revenue" }, { label: "Subscriptions" }],
  api: "/api/agency/invoices",
  itemKey: "invoices",
  detailType: "revenue",
  columns: [
    { key: "customer", label: "Customer" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Amount", align: "right", width: "100px" },
    { key: "renewal", label: "Renewal", width: "120px" },
  ],
  emptyTitle: "No subscriptions",
  emptyDesc: "Subscriptions appear when Stripe is connected",
}));

write(path.join(root, "src/app/agency/revenue/failed-payments/list/page.tsx"), listPage({
  title: "Failed Payments",
  subtitle: "Failed charges and retry status",
  breadcrumbs: [{ label: "Revenue", href: "/agency/revenue" }, { label: "Failed Payments" }],
  api: "/api/stripe/revenue",
  itemKey: "recentCharges",
  detailType: "revenue",
  columns: [
    { key: "email", label: "Customer" },
    { key: "amount", label: "Amount", align: "right", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
    { key: "date", label: "Date", width: "120px" },
  ],
  emptyTitle: "No failed payments",
  emptyDesc: "Failed payments appear when Stripe is connected",
}));

write(path.join(root, "src/app/agency/revenue/invoices/[id]/actions/page.tsx"), actionsPage({
  title: "Invoice Actions",
  entity: "invoice",
  breadcrumbs: [{ label: "Revenue", href: "/agency/revenue" }, { label: "Invoices", href: "/agency/revenue/invoices/list" }, { label: "Actions" }],
  actions: [
    { id: "send", label: "Send Invoice", description: "Email invoice to customer", api: "/api/agency/invoices/[id]/send" },
    { id: "mark-paid", label: "Mark Paid", description: "Record payment manually", api: "/api/agency/invoices/[id]/paid" },
    { id: "void", label: "Void Invoice", description: "Cancel open invoice", api: "/api/agency/invoices/[id]/void" },
    { id: "refund", label: "Refund", description: "Issue a refund", api: "/api/agency/invoices/[id]/refund" },
  ],
}));

// ─── PIPELINE ───
write(path.join(root, "src/app/agency/pipeline/deals/list/page.tsx"), listPage({
  title: "Deals",
  subtitle: "All active opportunities and their stages",
  breadcrumbs: [{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Deals" }],
  api: "/api/agency/pipeline-deals",
  itemKey: "deals",
  detailType: "deal",
  columns: [
    { key: "name", label: "Deal" },
    { key: "client", label: "Client" },
    { key: "value", label: "Value", align: "right", width: "100px" },
    { key: "stage", label: "Stage", width: "120px" },
    { key: "probability", label: "Probability", width: "100px" },
  ],
  emptyTitle: "No deals",
  emptyDesc: "Create a deal to start tracking opportunities",
}));

write(path.join(root, "src/app/agency/pipeline/forecast/list/page.tsx"), listPage({
  title: "Forecast",
  subtitle: "Weighted pipeline forecast by stage",
  breadcrumbs: [{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Forecast" }],
  api: "/api/agency/pipeline-deals",
  itemKey: "deals",
  detailType: "deal",
  columns: [
    { key: "name", label: "Deal" },
    { key: "stage", label: "Stage", width: "120px" },
    { key: "value", label: "Value", align: "right", width: "100px" },
    { key: "probability", label: "Probability", width: "100px" },
    { key: "weighted", label: "Weighted", align: "right", width: "100px" },
  ],
  emptyTitle: "No forecast data",
  emptyDesc: "Add deals to generate a forecast",
}));

write(path.join(root, "src/app/agency/pipeline/proposals/list/page.tsx"), listPage({
  title: "Proposals",
  subtitle: "Draft and sent proposals",
  breadcrumbs: [{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Proposals" }],
  api: "/api/agency/proposals",
  itemKey: "proposals",
  detailType: "deal",
  columns: [
    { key: "title", label: "Title" },
    { key: "client", label: "Client" },
    { key: "value", label: "Value", align: "right", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No proposals",
  emptyDesc: "Generate a proposal from a deal",
}));

write(path.join(root, "src/app/agency/pipeline/activities/list/page.tsx"), listPage({
  title: "Activities",
  subtitle: "Calls, emails, meetings, and follow-ups",
  breadcrumbs: [{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Activities" }],
  api: "/api/agency/connections",
  itemKey: "connections",
  detailType: "deal",
  columns: [
    { key: "name", label: "Contact" },
    { key: "company", label: "Company" },
    { key: "type", label: "Type", width: "100px" },
    { key: "date", label: "Date", width: "120px" },
  ],
  emptyTitle: "No activities",
  emptyDesc: "Log activities to track deal momentum",
}));

write(path.join(root, "src/app/agency/pipeline/deals/[id]/actions/page.tsx"), actionsPage({
  title: "Deal Actions",
  entity: "deal",
  breadcrumbs: [{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Deals", href: "/agency/pipeline/deals/list" }, { label: "Actions" }],
  actions: [
    { id: "advance", label: "Advance Stage", description: "Move deal to next pipeline stage", api: "/api/agency/pipeline-deals/[id]/advance" },
    { id: "proposal", label: "Generate Proposal", description: "Draft a proposal for this deal", api: "/api/agency/pipeline-deals/[id]/proposal" },
    { id: "email", label: "Send Follow-up", description: "Email the prospect", api: "/api/agency/pipeline-deals/[id]/email" },
    { id: "close-won", label: "Mark Closed Won", description: "Close deal as won", api: "/api/agency/pipeline-deals/[id]/close-won" },
    { id: "close-lost", label: "Mark Closed Lost", description: "Close deal as lost", api: "/api/agency/pipeline-deals/[id]/close-lost" },
  ],
}));

// ─── CLIENTS ───
write(path.join(root, "src/app/agency/clients/active/list/page.tsx"), listPage({
  title: "Active Clients",
  subtitle: "Currently paying and engaged clients",
  breadcrumbs: [{ label: "Clients", href: "/agency/clients" }, { label: "Active" }],
  api: "/api/agency/clients",
  itemKey: "clients",
  detailType: "client",
  columns: [
    { key: "name", label: "Client" },
    { key: "vertical", label: "Vertical", width: "120px" },
    { key: "serviceTier", label: "Tier", width: "100px" },
    { key: "monthlyFee", label: "MRR", align: "right", width: "100px" },
    { key: "health", label: "Health", width: "80px" },
  ],
  emptyTitle: "No active clients",
  emptyDesc: "Activate a prospect to see them here",
}));

write(path.join(root, "src/app/agency/clients/prospects/list/page.tsx"), listPage({
  title: "Prospects",
  subtitle: "Potential clients not yet contracted",
  breadcrumbs: [{ label: "Clients", href: "/agency/clients" }, { label: "Prospects" }],
  api: "/api/agency/clients",
  itemKey: "clients",
  detailType: "client",
  columns: [
    { key: "name", label: "Prospect" },
    { key: "vertical", label: "Vertical", width: "120px" },
    { key: "contactName", label: "Contact" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No prospects",
  emptyDesc: "Add prospects to your pipeline",
}));

write(path.join(root, "src/app/agency/clients/[id]/actions/page.tsx"), actionsPage({
  title: "Client Actions",
  entity: "client",
  breadcrumbs: [{ label: "Clients", href: "/agency/clients" }, { label: "Actions" }],
  actions: [
    { id: "proposal", label: "Create Proposal", description: "Generate a new proposal", api: "/api/agency/clients/[id]/proposal" },
    { id: "email", label: "Send Email", description: "Email primary contact", api: "/api/agency/clients/[id]/email" },
    { id: "meeting", label: "Schedule Meeting", description: "Book a calendar slot", api: "/api/agency/clients/[id]/meeting" },
    { id: "note", label: "Add Note", description: "Log a client note", api: "/api/agency/clients/[id]/note" },
    { id: "renew", label: "Renew Contract", description: "Renew or upgrade service tier", api: "/api/agency/clients/[id]/renew" },
  ],
}));

// ─── AGENTS ───
write(path.join(root, "src/app/agency/agents/catalog/list/page.tsx"), listPage({
  title: "Agent Catalog",
  subtitle: "All 410 agents across departments",
  breadcrumbs: [{ label: "Agents", href: "/agency/agents" }, { label: "Catalog" }],
  api: "/api/agency/agents",
  itemKey: "agents",
  detailType: "agent",
  columns: [
    { key: "name", label: "Agent" },
    { key: "category", label: "Category", width: "120px" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No agents",
  emptyDesc: "Agents are loaded from the unified registry",
}));

write(path.join(root, "src/app/agency/agents/departments/list/page.tsx"), listPage({
  title: "Departments",
  subtitle: "Agent teams by function",
  breadcrumbs: [{ label: "Agents", href: "/agency/agents" }, { label: "Departments" }],
  api: "/api/agency-agents",
  itemKey: "departments",
  detailType: "agent",
  columns: [
    { key: "name", label: "Department" },
    { key: "count", label: "Agents", align: "right", width: "80px" },
    { key: "roles", label: "Roles" },
  ],
  emptyTitle: "No departments",
  emptyDesc: "Department data comes from agency-agents catalog",
}));

write(path.join(root, "src/app/agency/agents/assignments/list/page.tsx"), listPage({
  title: "Assignments",
  subtitle: "Tasks and work assigned to agents",
  breadcrumbs: [{ label: "Agents", href: "/agency/agents" }, { label: "Assignments" }],
  api: "/api/paperclip/tasks",
  itemKey: "today",
  detailType: "task",
  columns: [
    { key: "title", label: "Task" },
    { key: "assignee", label: "Assignee", width: "120px" },
    { key: "priority", label: "Priority", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No assignments",
  emptyDesc: "Assign tasks to agents from Paperclip",
}));

write(path.join(root, "src/app/agency/agents/[id]/actions/page.tsx"), actionsPage({
  title: "Agent Actions",
  entity: "agent",
  breadcrumbs: [{ label: "Agents", href: "/agency/agents" }, { label: "Catalog", href: "/agency/agents/catalog/list" }, { label: "Actions" }],
  actions: [
    { id: "assign", label: "Assign Task", description: "Give this agent a task", api: "/api/agency/agents/[id]/assign" },
    { id: "run", label: "Run Now", description: "Execute agent on demand", api: "/api/agency/agents/[id]/run" },
    { id: "configure", label: "Configure", description: "Edit agent settings", api: "/api/agency/agents/[id]/configure" },
    { id: "logs", label: "View Logs", description: "See recent agent runs", api: "/api/agency/agents/[id]/logs" },
  ],
}));

// ─── PAPERCLIP ───
write(path.join(root, "src/app/paperclip/inbox/list/page.tsx"), listPage({
  title: "Inbox",
  subtitle: "New and unassigned tasks",
  breadcrumbs: [{ label: "Paperclip", href: "/paperclip" }, { label: "Inbox" }],
  api: "/api/paperclip/tasks",
  itemKey: "inbox",
  detailType: "task",
  columns: [
    { key: "title", label: "Task" },
    { key: "priority", label: "Priority", width: "100px" },
    { key: "assignee", label: "Assignee", width: "120px" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "Inbox zero",
  emptyDesc: "No new items need triage",
}));

write(path.join(root, "src/app/paperclip/today/list/page.tsx"), listPage({
  title: "Today",
  subtitle: "Tasks scheduled for today",
  breadcrumbs: [{ label: "Paperclip", href: "/paperclip" }, { label: "Today" }],
  api: "/api/paperclip/tasks",
  itemKey: "today",
  detailType: "task",
  columns: [
    { key: "title", label: "Task" },
    { key: "priority", label: "Priority", width: "100px" },
    { key: "assignee", label: "Assignee", width: "120px" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No tasks today",
  emptyDesc: "You're clear for the day",
}));

write(path.join(root, "src/app/paperclip/upcoming/list/page.tsx"), listPage({
  title: "Upcoming",
  subtitle: "Tasks due in the future",
  breadcrumbs: [{ label: "Paperclip", href: "/paperclip" }, { label: "Upcoming" }],
  api: "/api/paperclip/tasks",
  itemKey: "today",
  detailType: "task",
  columns: [
    { key: "title", label: "Task" },
    { key: "due_date", label: "Due", width: "120px" },
    { key: "priority", label: "Priority", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
  ],
  emptyTitle: "No upcoming tasks",
  emptyDesc: "Plan ahead by scheduling tasks",
}));

write(path.join(root, "src/app/paperclip/projects/list/page.tsx"), listPage({
  title: "Projects",
  subtitle: "Grouped initiatives and deliverables",
  breadcrumbs: [{ label: "Paperclip", href: "/paperclip" }, { label: "Projects" }],
  api: "/api/agency/goals",
  itemKey: "goals",
  detailType: "task",
  columns: [
    { key: "title", label: "Project" },
    { key: "status", label: "Status", width: "100px" },
    { key: "progress", label: "Progress", width: "100px" },
  ],
  emptyTitle: "No projects",
  emptyDesc: "Create a project to group tasks",
}));

write(path.join(root, "src/app/paperclip/tasks/[id]/actions/page.tsx"), actionsPage({
  title: "Task Actions",
  entity: "task",
  breadcrumbs: [{ label: "Paperclip", href: "/paperclip" }, { label: "Task Actions" }],
  actions: [
    { id: "complete", label: "Mark Complete", description: "Finish the task", api: "/api/paperclip/tasks/[id]/complete" },
    { id: "delegate", label: "Delegate", description: "Reassign to another agent", api: "/api/paperclip/tasks/[id]/delegate" },
    { id: "jake", label: "Ask Jake", description: "Get Jake's help with this task", api: "/api/paperclip/tasks/[id]/jake" },
    { id: "terminal", label: "Run Terminal", description: "Execute a related command", api: "/api/paperclip/tasks/[id]/terminal" },
    { id: "note", label: "Attach Note", description: "Add a note or file", api: "/api/paperclip/tasks/[id]/note" },
  ],
}));

console.log("\nGenerated 30+ deep navigation pages.");
