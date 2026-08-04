# Public Boundary

This studio is a **public professional surface**. Anything outside this boundary stays on private infrastructure (local disk, QNAP Gitea, archived old GitHub).

## Allowed

- Original code and docs you own or have rights to publish
- Synthetic fixtures and redacted examples
- Architecture diagrams without private IPs/hostnames
- Benchmarks that run offline with seeded data
- MIT/Apache-licensed upstream attribution

## Forbidden

- Customer PII, prospect lists, CRM exports, email sequences with real recipients
- Auth cookies, OAuth refresh tokens, API keys, `.env` files, private keys
- Client-confidential monorepos and unpaid/unclear IP
- ToS-risk automation (auto-DM, engagement bots, cloaked browsers sold as evasion)
- Personal legal/benefits/health/family-minor operating systems
- Full knowledge corpora dumps (Phronema, raw Recall cards, scrapers' bulk output)
- Internal LAN/Tailscale node inventories with addresses

## Redaction rules

| If you see… | Do… |
|---|---|
| Real email/phone | Replace with `operator@example.com` / `+1-555-0100` |
| Customer name (unapproved) | Use sector pseudonym (`Healthcare DSO Demo`) |
| IP / hostname | Use `node-a.local` |
| Token-like string | Delete; rotate if it was ever real |
| Screenshot with UI chrome logged-in | Crop or reshoot logged-out |

## Approval

Publishing a new public path requires:

1. `flag-gate.sh` PASS  
2. Human skim of `git log` and largest blobs  
3. README Public Boundary section present  
4. No deploy keys/webhooks copied from old repos  
