import { NextResponse } from "next/server";

// Agency Agents catalog — sourced from the real inventory
// 232 installable Agency specs across 8 departments

const AGENCY_DEPARTMENTS = [
  {
    id: "engineering",
    name: "Engineering",
    count: 18,
    color: "#5ab896",
    roles: ["Fullstack", "Backend", "Frontend", "C/C++", "Python", "Rust", "Go", "React", "ML/Data", "Cloud/DevOps", "Mobile", "WebGL/3D"],
    highlights: ["fullstack-developer", "backend-developer", "frontend-developer", "python-pro", "rust-pro", "golang-pro"],
  },
  {
    id: "design",
    name: "Design",
    count: 16,
    color: "#ec4899",
    roles: ["UX Research", "UI Design", "Brand", "Visual Storytelling", "Motion", "Image Prompts", "Inclusive Visuals", "Persona Walkthrough"],
    highlights: ["design-ux-researcher", "design-ui-designer", "design-brand-guardian", "design-visual-storyteller", "design-image-prompt-engineer"],
  },
  {
    id: "marketing",
    name: "Marketing",
    count: 15,
    color: "#f97316",
    roles: ["Growth", "Content", "SEO", "Paid Media", "Email", "Community", "Social"],
    highlights: ["marketing-growth-strategist", "marketing-content-strategist", "marketing-seo-specialist"],
  },
  {
    id: "sales",
    name: "Sales",
    count: 8,
    color: "#4a9eff",
    roles: ["Discovery", "Coaching", "Proposals", "Pipeline", "Outbound", "Deal Strategy", "Account Strategy"],
    highlights: ["sales-discovery-coach", "sales-proposal-strategist", "sales-outbound-strategist", "sales-pipeline-analyst"],
  },
  {
    id: "security",
    name: "Security",
    count: 10,
    color: "#ef4444",
    roles: ["AppSec", "Cloud Security", "Threat Intel", "Compliance", "Pen Testing", "Detection Engineering"],
    highlights: ["security-architect", "security-threat-intelligence-analyst", "security-cloud-security-architect"],
  },
  {
    id: "product",
    name: "Product",
    count: 6,
    color: "#a855f7",
    roles: ["Strategy", "PM Coaching", "Market Fit", "Agile", "Roadmap"],
    highlights: ["product-strategist", "product-pm-coach"],
  },
  {
    id: "spatial",
    name: "Spatial Computing",
    count: 4,
    color: "#06b6d4",
    roles: ["AR/VR/XR Cockpit", "Immersive", "Terminal Integration", "3D Experiences"],
    highlights: ["spatial-xr-cockpit-designer"],
  },
  {
    id: "paid-media",
    name: "Paid Media",
    count: 7,
    color: "#fbbf24",
    roles: ["Programmatic", "PPC", "Search Query", "Creative", "Tracking", "Paid Social"],
    highlights: ["paid-media-programmatic-buyer", "paid-media-ppc-strategist", "paid-media-creative-strategist"],
  },
];

export async function GET() {
  try {
    const total = AGENCY_DEPARTMENTS.reduce((s, d) => s + d.count, 0);
    return NextResponse.json({
      total,
      departments: AGENCY_DEPARTMENTS,
      source: "agency-agents (232 installable specs)",
      inventoryPath: "/Users/rig128gb/Developer/agency-agents",
      codexAgents: "/Users/rig128gb/.codex/agents/agency-*.toml",
      claudeAgents: "/Users/rig128gb/.claude/agents/agency-*.md",
      lastUpdated: "2026-07-02",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
