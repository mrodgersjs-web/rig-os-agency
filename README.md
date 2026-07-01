# RIG OS Agency

> Operator-grade strategic intelligence platform for $10M ARR.
> Rodgers Intelligence Group — deterministic-before-agentic. ProofPacket or it didn't happen.

## What This Is

RIG OS Agency is the production command center for RIG (Rodgers Intelligence Group).
It unifies agency operations, client management, RIG doctrine, and a 232-agent fleet
into one deployable application.

## Features

### Agency Operations ($10M ARR Engine)
- **Client Management** — 8 verticals, service tiers ($2.5K-$18K/mo), health scores
- **Sales Pipeline** — Kanban: Prospect → Qualified → Proposal → Negotiation → Closed
- **Revenue Dashboard** — ARR tracker, MRR growth, churn, cash flow projection
- **Proposals** — Generate, track, approve with ProofPacket binding
- **Contracts** — Engagements, billing cycles, renewals, SLA terms
- **Invoices** — Automated billing, payment tracking

### RIG Doctrine
- **Doctrine Engine** — IQRSQPI 7-stage loop, A1-A4 build mode routing, Gate-D
- **Agent Fleet** — 232 Agency Agents + 86 RIG experts + VoltAgent subagents
- **Goals & OKRs** — $10M ARR path with quarterly milestones
- **MCP Registry** — 15 MCP servers with health monitoring
- **Harnesses** — 50 goal loops, agent harness resolver
- **Deviation Engines** — 40 engines: Physics (±30σ), Cognitive (±20σ), Nature (±20σ)
- **Proof Packets** — Signed evidence for every action

### Studios
- LinkedIn Studio · GTM Studio · Design Studio · Strategy Studio · App Studio

## Tech Stack
- **Framework**: Next.js 16.2.6 (App Router, standalone output)
- **UI**: React 19, Tailwind CSS 4, Framer Motion, Lucide icons
- **Language**: TypeScript 5
- **Design**: Midnight Aubergine (dark purple/gold)
- **Deploy**: Docker, Railway, self-hosted

## Quick Start

### Docker (Recommended)
```bash
cp .env.docker.example .env.docker  # Fill in keys
docker compose up -d
# App live at http://localhost:3737
```

### Local Dev
```bash
npm install
npm run dev
# App at http://localhost:3000
```

### Production Build
```bash
npm run build
node server.js  # Serves on PORT (default 3737)
```

## Deploy to Railway
```bash
railway up
# Railway auto-detects railway.toml + Dockerfile
```

## Architecture
```
src/
  app/              # Next.js App Router pages
    agency/         # Agency operations (clients, pipeline, revenue)
    rig-doctrine/   # Doctrine engine
    rig-fleet/      # Agent fleet registry
    rig-goals/      # Goals & OKRs
    rig-mcp/        # MCP server registry
    rig-harness/    # Goal loop harnesses
    rig-deviation/  # 40 deviation engines
    rig-proof/      # Proof packets
    api/            # API routes
  components/       # React components
  lib/              # Business logic, types, data
```

## Doctrine
```
Code owns decisions.
LLMs assist transformation.
Gates decide if it ships.
ProofPacket or it didn't happen.
```

## License
MIT — Rodgers Intelligence Group
