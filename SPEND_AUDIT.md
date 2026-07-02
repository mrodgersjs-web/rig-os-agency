# RIG Spend Audit + Open Source Migration Plan
**Date:** 2026-07-02 | **Owner:** Mike Rodgers | **Goal:** Reduce spend by replacing paid SaaS with open source on RIG nodes

---

## 1. CURRENT PAID SERVICES INVENTORY

| Service | Purpose | Monthly Cost (est.) | Key in env | Open Source Replacement | Migration Difficulty |
|---------|---------|-------------------|------------|------------------------|---------------------|
| **OpenAI** | GPT-4 API calls | $50-200/mo | `OPENAI_API_KEY` | Local Ollama (ornith:35b, qwen3-coder:30b) | LOW — models already running |
| **Anthropic** | Claude API | $50-200/mo | `ANTHROPIC_API_KEY` | Local Ollama (ornith:35b) | LOW — already have local models |
| **OpenRouter** | Model routing | $20-100/mo | `OPENROUTER_API_KEY` | Hermes local model routing (already configured) | LOW — providers already in config |
| **Resend** | Email sending | $20/mo (free tier: 3k/mo) | `RESEND_API_KEY` | Postal, Mailtrap, or self-hosted SMTP | MEDIUM — need DKIM/SPF setup |
| **Postiz** | Social scheduling | $29/mo | `postiz.json` | Postiz IS open source (self-hosted) | ✅ ALREADY OPEN SOURCE |
| **Higgsfield** | AI image generation | Credits-based | `HIGGSFIELD_API_KEY` | Stable Diffusion XL / Flux on local GPU | MEDIUM — need model download |
| **FAL.ai** | Image generation | $0 (exhausted) | — | Same as Higgsfield replacement | ALREADY ZERO |
| **Apollo.io** | Lead enrichment | $49-99/mo | `APOLLO_API_KEY` | Scrapling (already in repo), open CSV | MEDIUM — need enrichment pipeline |
| **Apify** | Web scraping | $49/mo | `APIFY_API_KEY` | Playwright (already installed), Scrapling | LOW — already have scrapers |
| **Notion** | Notes/docs | $10/mo | `NOTION_API_TOKEN` | Obsidian (already using JakeStudio vault) | ✅ ALREADY HAVE OBSIDIAN |
| **Supabase** | Database/auth | $25/mo (free tier available) | `SUPABASE_URL` | Self-hosted Postgres on RIG node | MEDIUM — data migration |
| **Vercel** | Hosting | $20/mo (pro) | CLI installed | Self-host Next.js on RIG node | LOW — already running on 3737 |
| **Exa** | Web search API | $10/mo | `EXA_API_KEY` | SearxNG self-hosted, Brave Search | LOW — Brave key already present |
| **Brave Search** | Web search | Free (2k/mo) | `BRAVE_SEARCH_API_KEY` | SearxNG | ✅ ALREADY FREE |
| **Groq** | Fast inference | Free tier | `GROQ_API_KEY` | Local Ollama | ✅ ALREADY FREE |
| **Stripe** | Payments | Pay per use | `stripe-test.env` | No replacement needed | N/A |
| **N8N** | Workflow automation | Self-hosted (free) | localhost:5678 | ✅ ALREADY OPEN SOURCE | N/A |
| **GitHub** | Code hosting | $4/mo (pro) | `GITHUB_PERSONAL_ACCESS_TOKEN` | Gitea/Forgejo on RIG node | MEDIUM — repo migration |
| **Firecrawl/Tavily** | Web scraping | $20-40/mo | `FIREHOSE_API_KEY` | Playwright + local crawler | LOW — already have scrapers |
| **Kit (ConvertKit)** | Email marketing | $29/mo | — | Listmonk (self-hosted) | MEDIUM — list migration |
| **Calendly** | Booking | $10/mo | URL only | Cal.com (open source) | MEDIUM — needs deployment |

**Estimated total monthly spend: $300-600/mo**
**Estimated savings with migration: $200-400/mo**

---

## 2. GOOGLE ACCOUNT MANAGEMENT

### Accounts to Manage
| Account | Purpose | OAuth Source | Scopes |
|---------|---------|-------------|--------|
| mike@rodgersintelligence.com | Business email + calendar | `~/.jake-vault/google_oauth_tokens.json` | gmail.readonly, calendar.readonly |
| mrodgerjs@gmail.com | Personal + job search | `~/.gemini/google_accounts.json` (active) | needs OAuth setup |
| rodgemd1@gmail.com | Legacy/business | needs OAuth setup | needs OAuth setup |

### What's Needed
1. Generate OAuth tokens for mrodgerjs@gmail.com and rodgemd1@gmail.com
2. Need Gmail API + Calendar API access for all three
3. Consolidated inbox view in RIG OS Agency
4. Calendar merge across all three accounts

---

## 3. OPEN SOURCE MIGRATION PRIORITY

### TIER 1 — Immediate (Today, Zero Cost)
| Replace | With | How | Savings |
|---------|------|-----|---------|
| OpenAI API calls | Ollama local models (ornith:35b, qwen3-coder:30b) | Route Hermes config to local providers | $50-200/mo |
| Anthropic API calls | Ollama local models | Route through Hermes local providers | $50-200/mo |
| OpenRouter paid models | Ollama Cloud free tier + local | Already configured in Hermes | $20-100/mo |
| Notion | Obsidian (already using JakeStudio) | Migrate notes, cancel Notion | $10/mo |
| FAL.ai | Stable Diffusion local | Download SDXL or Flux model | Already $0 |

### TIER 2 — This Week (Self-Hosted)
| Replace | With | How | Savings |
|---------|------|-----|---------|
| Calendly | Cal.com (open source) | Deploy on RIG node via Docker | $10/mo |
| Kit/ConvertKit | Listmonk (open source) | Deploy on RIG node via Docker | $29/mo |
| Apollo.io | Scrapling + open enrichment | Already have scraper stack, add email validation | $49-99/mo |
| Apify | Playwright + local scrapers | Already installed, route all scraping locally | $49/mo |
| Firecrawl/Tavily | SearxNG + Playwright | Deploy SearxNG on RIG node | $20-40/mo |
| Exa search | SearxNG | Same as above | $10/mo |

### TIER 3 — Next Week (Infrastructure)
| Replace | With | How | Savings |
|---------|------|-----|---------|
| Vercel Pro | Self-host Next.js on RIG node | Already running on port 3737, add nginx reverse proxy | $20/mo |
| Supabase Pro | Self-hosted Postgres | Deploy Postgres on RIG node, migrate data | $25/mo |
| GitHub Pro | Gitea/Forgejo on RIG node | Mirror repos, keep GitHub for public visibility | $4/mo |
| Resend | Self-hosted SMTP (Postal) | Deploy Postal on RIG node, configure DKIM/SPF | $20/mo |
| Higgsfield | Stable Diffusion XL local | Download SDXL on 256GB node, run via Diffusers | Credits cost |

---

## 4. LOCAL COMPUTE INVENTORY (RIG Nodes)

| Node | RAM | Role | Ollama Models | Available For |
|------|-----|------|---------------|---------------|
| rig-128gb (this machine) | 128GB | Primary workstation + Hermes | ornith:35b, qwen3-coder:30b, 6 custom models | Local inference, RIG OS Agency |
| rig-256gb (LAN) | 256GB | Heavy inference | Check needed | SDXL image gen, large model hosting |
| rig-96gb (LAN) | 96GB | GTM orchestrator | Check needed | Cal.com, Listmonk, SearxNG |
| rig-36gb (LAN) | 36GB | Builder node | Check needed | Gitea, Postgres, SMTP |
| blackwell (LAN) | Unknown | Specialized inference | ornith-35b-fp8 | Fast inference, image gen |

---

## 5. MIGRATION BUILD JOBS

### Build Job 1: Multi-Account Google OAuth Setup
- Generate OAuth tokens for mrodgerjs@gmail.com and rodgemd1@gmail.com
- Add gmail.readonly + calendar.readonly scopes
- Store in ~/.jake-vault/
- Update email_calendar_manager.py to handle 3 accounts

### Build Job 2: Route Cron Jobs to Free Local Models
- Update all cron jobs using `zai/glm-5.2` to use local Ollama models
- Priority: ornith:35b for reasoning, qwen3-coder:30b for code
- Keep zai as fallback only
- Target: $0 model API spend

### Build Job 3: Deploy Cal.com on RIG Node
- Docker deploy on rig-96gb (LAN 192.168.68.86)
- Configure with mike@rodgersintelligence.com
- Import existing Calendly bookings
- Update all CTAs from Calendly to Cal.com

### Build Job 4: Deploy SearxNG on RIG Node
- Docker deploy on rig-36gb (LAN 192.168.68.67)
- Replace Exa + Brave + Firecrawl search calls
- Configure as Hermes web_search backend

### Build Job 5: Deploy Listmonk on RIG Node
- Docker deploy on rig-96gb
- Import email list from Kit/ConvertKit
- Configure sending via self-hosted SMTP or Resend free tier

### Build Job 6: Stable Diffusion XL on 256GB Node
- Download SDXL base + refiner models
- Install Diffusers Python library
- Create API endpoint for image generation
- Replace Higgsfield calls with local SDXL

### Build Job 7: Self-Hosted Postgres on RIG Node
- Deploy Postgres on rig-36gb
- Migrate Supabase data
- Update connection strings in all projects

### Build Job 8: Gitea/Forgejo on RIG Node
- Deploy on rig-36gb
- Mirror RIGIntelligence repos
- Keep GitHub for public profile, push to both

---

## 6. SAVINGS SUMMARY

| Tier | Services Cut | Monthly Savings | Effort |
|------|-------------|----------------|--------|
| Tier 1 (Today) | OpenAI, Anthropic, OpenRouter, Notion, FAL | $130-410/mo | Config changes only |
| Tier 2 (This Week) | Calendly, Kit, Apollo, Apify, Firecrawl, Exa | $167-227/mo | Docker deploys |
| Tier 3 (Next Week) | Vercel, Supabase, GitHub Pro, Resend, Higgsfield | $79/mo + credits | Infrastructure |
| **TOTAL** | | **$376-716/mo** | |