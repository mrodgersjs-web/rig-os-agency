> Part of the [mrodgersjs-web](https://github.com/mrodgersjs-web) FDE studio fleet — control planes, gates, fleets, proof. See [docs/public-boundary.md](docs/public-boundary.md).

# rig-os-agency

![CI status](https://img.shields.io/github/actions/workflow/status/mrodgersjs-web/rig-os-agency/smoke.yml?label=CI&logo=github-actions)

A local command centre for CLI agents: one dashboard for Claude Code, OpenClaw,
Hermes, and anything else that speaks stdio. Chat, voice input, goals, journal,
every interaction auto-logged to your Obsidian vault. Nothing leaves localhost.

![Smoke](https://github.com/mrodgersjs-web/rig-os-agency/actions/workflows/smoke.yml/badge.svg)

This is a Next.js 16 console, customised for Rodgers Intelligence Group: the
agency data layer, the `/company/*` API routes, the doctrine layer, and the
deploy paths are this fork's work (141 commits). It started life on the Agentic
OS scaffold by [Julian Goldie](https://aiprofitboardroom.com), and that base is
MIT-licensed — the credit is real and the license is on the base, not a cage.

## Verify in two minutes

```bash
git clone https://github.com/mrodgersjs-web/rig-os-agency.git
cd rig-os-agency
npm ci
npm run build        # the same build CI runs on every push
```

CI (`smoke.yml`) additionally boots the production server and probes `/` for a
200 with HTML, on a schedule as well as on every push.

## Run it locally

- **Node 22+**, macOS or Linux (Windows via WSL2)
- At least one agent CLI on `PATH`: Claude Code, OpenClaw, or Hermes
  (`pip install nousresearch-hermes`)
- Optional but recommended: an [Obsidian](https://obsidian.md) vault

```bash
npm run dev          # http://localhost:3000
```

## ⚙️ Configuration

Agentic OS reads config from (in priority order):

1. Environment variables
2. `~/.agentic-os/config.json`
3. Auto-detection (`which claude`, common Obsidian paths)
4. Sensible defaults

### Minimal config.json

```json
{
  "claude": "/Users/you/.local/bin/claude",
  "openclaw": "/Users/you/local/node/bin/openclaw",
  "hermes": "/Users/you/.local/bin/hermes",
  "vaultRoot": "/Users/you/Documents/Obsidian Vault",
  "goalCategories": ["Health", "Work", "Personal"]
}
```

Find the right paths with:

```bash
which claude     # → paste into "claude"
which openclaw   # → paste into "openclaw"
which hermes     # → paste into "hermes"
```

For your Obsidian vault, just point it at the folder you open in Obsidian.

### Environment variables (alternative)

If you'd rather not edit a JSON file, use a `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with your paths
```

---

## 🧪 First-run check

Once running, hit each route to confirm everything's wired:

- `http://localhost:3000` — Mission Control overview
- `http://localhost:3000/claude` — Claude chat (needs Claude Code installed)
- `http://localhost:3000/openclaw` — OpenClaw chat + control room
- `http://localhost:3000/hermes` — Hermes chat + control room
- `http://localhost:3000/memory` — Search your Obsidian vault
- `http://localhost:3000/goals` — Goals (writes to vault)
- `http://localhost:3000/journal` — Daily journal
- `http://localhost:3000/guide` — How-to-build-your-own guide

If an agent tile says "not installed", check `which <agent>` returns a path. If it does, paste that path into your `config.json`.

---

## 🎨 Customising

Six files for the most common changes:

| Want to... | Edit |
|---|---|
| Add a new agent | `src/lib/runner.ts` + `src/lib/config.ts` |
| Change vault location | your `config.json` or `.env.local` |
| Change colours | `src/app/globals.css` (CSS variables at the top) |
| Change goal categories | your `config.json` (`goalCategories`) |
| Add a new sidebar page | `src/components/Sidebar.tsx` + `src/app/<page>/page.tsx` |
| Tweak the build guide | `BUILD-YOUR-OWN.md` |

---

## 🔒 Privacy & data

- **Everything runs on localhost.** No accounts, no telemetry, no servers.
- Your chats are written **only** to your Obsidian vault as plain markdown.
- API routes shell out to your local CLIs via `child_process.spawn` — no shell interpolation, so prompt content can't run commands.
- `/api/run` enforces a per-agent regex allowlist for any tool-style commands.
- Path traversal blocked on vault-read endpoints.

Audit it yourself — the whole thing is about 2,500 lines.

---

## 🛠 Troubleshooting

**"agent is not installed"**
Your CLI isn't on `PATH` or auto-detection missed it. Edit `~/.agentic-os/config.json` and paste the full path from `which <agent>`.

**"no output" from chat**
Run the agent directly in your terminal first (`claude -p "hi"`). If that works, restart `npm run dev`. If it doesn't, the agent's broken, not the dashboard.

**Voice button is grey**
Voice needs Chrome or Safari. Firefox doesn't support the Web Speech API.

**Slow agents (>30s)**
Normal for some local models (ollama/deepseek). The "thinking… 18s" counter shows it's still working. If too slow, point that agent at a faster cloud model.

**Routes return 404**
Make sure you ran `npm install` and you're on Node 22+.

---

## 🤖 Building your own from scratch

The full guide for using Claude Code to build this same system is at:

- `BUILD-YOUR-OWN.md` in this repo
- `http://localhost:3000/guide` once it's running

It's 8 copy-paste prompts that walk through how this console was assembled.

---

## 📜 Licence

MIT. See [LICENSE](LICENSE). The Agentic OS scaffold this fork started from is
also MIT, by Julian Goldie — inherited openly, extended in the open.

Part of the [mrodgersjs-web](https://github.com/mrodgersjs-web) FDE studio fleet.
[rodgersintelligence.com](https://rodgersintelligence.com)