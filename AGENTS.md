# RIG OS Agency — Agent Instructions

## Build & Deploy
- **Build**: `npx next build` (must pass clean)
- **Dev**: `npm run dev`
- **Docker**: `docker compose up -d` (port 3737)
- **Railway**: `railway up`

## Architecture Rules
- App Router (src/app/) — no Pages Router
- Server components by default, `"use client"` only when needed
- API routes in src/app/api/*/route.ts
- Types in src/lib/*.ts, components in src/components/*.tsx
- Use CSS variables (Midnight Aubergine), not hardcoded colors
- Fonts: Bricolage Grotesque, Manrope, JetBrains Mono, Caveat
- Icons: lucide-react only
- Animations: framer-motion

## RIG Doctrine
- IQRSQPI: Intent → Question → Research → Solution → Quality → Proof → Integrate
- A1-A4 build mode routing with BMS thresholds
- Gate-D: Mike's scoped instruction approves outward/irreversible actions
- ProofPacket: signed evidence required for every meaningful action

## $10M ARR Target
- 8 verticals: construction, law, healthcare, dental, CPA, services, manufacturing, PE/CFO
- Service tiers: Starter $2.5K, Growth $5K, Scale $8K, Enterprise $18K per month
- Path: Q4 2027 = 120 clients x $8.3K avg = $10M ARR

## No Fabrication
- No ledger entry = no claim
- No screenshot = no send claim
- Timeout = failure, not success
- "Loaded" does not mean "running"