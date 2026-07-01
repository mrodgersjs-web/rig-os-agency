# RIG OS Agency — Claude Code Instructions

This project is a Next.js 16.2.6 standalone app. See AGENTS.md for full rules.

Key points for Claude:
1. `npx next build` must pass after every change
2. Use CSS variables (--bg-deep, --bg-mid, --cream, --gold, etc.) not hardcoded hex
3. Server components by default; `"use client"` only for interactive pages
4. All new pages go in src/app/{route}/page.tsx
5. API routes in src/app/api/{route}/route.ts
6. Midnight Aubergine design system — dark purple background, gold accents