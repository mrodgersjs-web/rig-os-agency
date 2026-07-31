# ROT — what decays, how fast, and how to check it

A rot file belongs at v0, not "later". This app has 339 API routes standing on
external surfaces — credentials, provider APIs, a 65k-file Obsidian vault, a
signed SQLite ledger, launchd lanes, LAN inference endpoints — and **none of it
was written down**. The LinkedIn session has already died once and been
restored. When a surface rots, the dashboard does not go red; it goes quietly
wrong, which is worse.

Every row has a **check command** that returns non-zero when the surface is
dead. If a check cannot be run, the honest state is UNKNOWN — never "ok".

| Layer | Surface | Expected rot | Check | Last verified |
|---|---|---|---|---|
| Ledger | `~/.rig/gtm/ledger/actions.db` | Low — local, append-only | `sqlite3 ~/.rig/gtm/ledger/actions.db 'SELECT COUNT(*) FROM actions'` | 2026-07-31 (325 events) |
| Ledger | HMAC chain integrity | Low, but silent when broken | `python3 -m outbound.gtm_ledger.verify_chain` in `rig-gtm-studio-v2` | 2026-07-31 |
| App | Served build vs disk build | **Every rebuild** — see G5 below | `cat .next/BUILD_ID` vs `/api/agency/health` uptime | 2026-07-31 |
| App | launchd server lane | Restarts silently under `KeepAlive` | `launchctl list \| grep com.rig.agent-os-server` | 2026-07-31 |
| App | Route surface | Per deploy | sweep all 147 pages, expect 147× 200 | 2026-07-31 |
| Vault | `~/Documents/JakeStudio` (65,277 .md) | Grows daily; path stable | `ls -d ~/Documents/JakeStudio` | 2026-07-31 |
| Identity | LinkedIn session cookie | **HIGH — has already died once** | `outbound/linkedin_session.check_live()` | 2026-07-30 |
| Provider | Instantly mailboxes (15) | Medium — warmup state drifts | Instantly API `list_accounts` | 2026-07-30 |
| Provider | HeyGen | Dead — key never configured | `/api/video/heygen/avatars` → 500 "API key not configured" | 2026-07-31 (DEAD) |
| Provider | ElevenLabs | Dead — key never configured | `/api/video/voices` → 502 "not connected" | 2026-07-31 (DEAD) |
| Provider | notebooklm-mcp | **Broken path** — points at `/Users/juliangoldie/...` | `/api/notebooklm/notebooks` → 500 ENOENT | 2026-07-31 (DEAD) |
| Fleet | Blackwell vLLM `192.168.68.90:8001` | Medium — LAN-dependent | `curl -sf http://192.168.68.90:8001/v1/models` | see `~/.rig/gtm/fleet-endpoints.json` |
| Fleet | 58 `com.rig.*` launchd lanes | Medium — exit codes drift | `launchctl list \| grep com.rig` | 2026-07-31 |

## Known-dead surfaces (do not present these as working)

Three provider routes return honest errors naming the missing credential. That
is the correct behaviour — they fail loudly rather than rendering an empty
success — but the app should not advertise the features until they are wired:

- **HeyGen** — no API key at `~/.agentic-os/heygen.env`.
- **ElevenLabs** — no `ELEVENLABS_API_KEY`.
- **notebooklm-mcp** — hardcoded to `/Users/juliangoldie/.local/bin/notebooklm-mcp`,
  a path from the original template author that has never existed on this
  machine. This is a leftover, not a regression.

## G5 — the rot that bites hardest

`next build` writes into `.next`. If `next start` is serving from that same
directory, the build swaps chunks and client-reference manifests underneath the
running process and every subsequent request fails with
`Invariant: The client reference manifest for route "/x" does not exist`.
There are **298** of those in `~/.agentic-os/logs/dashboard.log`, and they are
why a route sweep once caught 101/147 pages at HTTP 500 while the same pages
returned 200 minutes later. The pages were never broken — the server was
serving a half-replaced build, and `KeepAlive` eventually restarted it, erasing
the evidence.

**Always deploy with `bash ops/redeploy.sh`.** It stages the build into
`.next-build`, verifies a `BUILD_ID` was actually produced, swaps, restarts,
and polls `/api/agency/health` until it answers — then asserts the served
build id equals the staged one. Never run a bare `npm run build` against a live
server.
