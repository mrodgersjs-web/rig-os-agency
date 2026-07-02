import { NextResponse } from "next/server";

// VoltAgent Subagents catalog — sourced from awesome-codex-subagents
// 172 installable subagent specs across 15 categories

const VOLTAGENT_CATEGORIES = [
  {
    id: "01-core-development",
    name: "Core Development",
    count: 14,
    color: "#5ab896",
    agents: ["API Designer", "Backend Developer", "Code Mapper", "Design Bridge", "Electron Pro", "Frontend Developer", "Fullstack Developer", "GraphQL Architect", "Microservices Architect", "Mobile Developer", "UI Designer", "UI Fixer", "Websocket Engineer", "NextJS Developer"],
  },
  {
    id: "02-language-experts",
    name: "Language Experts",
    count: 18,
    color: "#4a9eff",
    agents: ["Angular Architect", "C++ Pro", "C# Developer", "Django Developer", ".NET Core Expert", "Elixir Expert", "Erlang Expert", "Expo RN Expert", "FastAPI Developer", "Flutter Expert", "Go Pro", "Java Architect", "JavaScript Pro", "Kotlin Specialist", "Laravel Specialist", "NextJS Developer", "Nuxt Expert", "PHP Expert"],
  },
  {
    id: "03-frameworks",
    name: "Frameworks & Platforms",
    count: 12,
    color: "#a855f7",
    agents: ["Phoenix Expert", "Qwik Expert", "React Expert", "Remix Expert", "Ruby on Rails Expert", "Rust Pro", "SolidJS Expert", "Svelte Expert", "Swift Expert", "Three.js Pro", "Vue Expert", "Web Components Expert"],
  },
  {
    id: "04-database",
    name: "Database & Data",
    count: 10,
    color: "#fbbf24",
    agents: ["Database Architect", "DynamoDB Expert", "MongoDB Expert", "MySQL Expert", "PostgreSQL Expert", "Redis Expert", "SQL Server Expert", "Supabase Expert", "GraphQL Data Layer", "Prisma Expert"],
  },
  {
    id: "05-devops",
    name: "DevOps & Infrastructure",
    count: 14,
    color: "#06b6d4",
    agents: ["AWS Architect", "Azure Architect", "Docker Pro", "Kubernetes Expert", "GCP Architect", "Terraform Expert", "CI/CD Engineer", "Cloudflare Expert", "Vercel Expert", "Railway Expert", "Monitoring Engineer", "Security DevOps", "Cost Optimization", "Chaos Engineering"],
  },
  {
    id: "06-testing",
    name: "Testing & QA",
    count: 8,
    color: "#ec4899",
    agents: ["E2E Testing Expert", "Performance Testing", "Security Testing", "Unit Testing Expert", "Visual Regression", "Contract Testing", "Load Testing", "Accessibility Testing"],
  },
  {
    id: "07-ai-ml",
    name: "AI & Machine Learning",
    count: 10,
    color: "#f97316",
    agents: ["ML Pipeline Engineer", "LLM Integration Expert", "Vector DB Expert", "RAG Architect", "Fine-tuning Specialist", "Computer Vision", "NLP Engineer", "Model Deployment", "Prompt Engineer", "AI Safety Officer"],
  },
  {
    id: "08-security",
    name: "Security",
    count: 10,
    color: "#ef4444",
    agents: ["Penetration Tester", "Security Architect", "Compliance Officer", "Threat Modeler", "Crypto Expert", "IAM Specialist", "Zero Trust Architect", "Audit Specialist", "Incident Response", "Privacy Engineer"],
  },
  {
    id: "09-architecture",
    name: "Architecture & Design",
    count: 8,
    color: "#d4a574",
    agents: ["System Architect", "Domain-Driven Design", "Event-Driven Architecture", "Hexagonal Architecture", "CQRS Expert", "API Gateway Architect", "Service Mesh Expert", "Distributed Systems"],
  },
  {
    id: "10-mobile",
    name: "Mobile Development",
    count: 8,
    color: "#0a66c2",
    agents: ["iOS Expert", "Android Expert", "React Native Expert", "Flutter Mobile Expert", "Expo Expert", "PWA Expert", "Mobile CI/CD", "Mobile Security"],
  },
  {
    id: "11-web3",
    name: "Web3 & Blockchain",
    count: 6,
    color: "#7c3aed",
    agents: ["Smart Contract Developer", "DeFi Architect", "NFT Specialist", "Tokenomics Expert", "Wallet Integration", "Blockchain Security"],
  },
  {
    id: "12-analytics",
    name: "Analytics & Data Eng",
    count: 8,
    color: "#22d3ee",
    agents: ["Data Pipeline Engineer", "BI Dashboard Expert", "Data Warehouse Architect", "ETL Specialist", "Real-time Analytics", "Data Governance", "Data Catalog Expert", "ML Ops"],
  },
  {
    id: "13-integrations",
    name: "Integrations",
    count: 8,
    color: "#84cc16",
    agents: ["Stripe Integration", "OAuth Specialist", "Webhook Architect", "API Gateway Expert", "Message Queue Expert", "Event Bus Architect", "Legacy System Bridge", "Third-Party SDK Expert"],
  },
  {
    id: "14-tooling",
    name: "Developer Tooling",
    count: 8,
    color: "#f43f5e",
    agents: ["Build System Expert", "Monorepo Expert", "DevExperience Engineer", "Documentation Generator", "Code Formatter", "Linter Rules Architect", "Migration Specialist", "Scaffolding Expert"],
  },
  {
    id: "15-gaming",
    name: "Game Development",
    count: 6,
    color: "#f59e0b",
    agents: ["Unity Expert", "Unreal Engine Expert", "Game Server Architect", "Multiplayer Networking", "Physics Engine Expert", "Shader Programmer"],
  },
];

export async function GET() {
  try {
    const total = VOLTAGENT_CATEGORIES.reduce((s, d) => s + d.count, 0);
    return NextResponse.json({
      total,
      categories: VOLTAGENT_CATEGORIES,
      source: "awesome-codex-subagents (172 installable specs)",
      inventoryPath: "/Users/rig128gb/Developer/awesome-codex-subagents",
      codexAgents: "/Users/rig128gb/.codex/agents/voltagent-*.toml",
      claudeAgents: "/Users/rig128gb/.claude/agents/voltagent-*.md",
      lastUpdated: "2026-07-02",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
