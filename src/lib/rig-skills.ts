// ── RIG OS Agency — Skills Registry ────────────────────────────────

export interface RIGSkill {
  id: string;
  name: string;
  description: string;
  path: string;
}

export const RIG_SKILLS: RIGSkill[] = [
  {
    "id": "Agents",
    "name": "Agents",
    "description": "Compose CUSTOM agents from Base Traits + Voice + Specialization, and manage predefined functional TEAMS. Traits combine expertise (security, technical, research), personality (skeptical, analytical, e",
    "path": "/Users/rig128gb/.hermes/skills/Agents/SKILL.md"
  },
  {
    "id": "ApertureOscillation",
    "name": "Apertureoscillation",
    "description": "3-pass scope oscillation that holds a question constant while shifting the scope envelope \u2014 narrow/tactical, wide/strategic, then synthesis \u2014 to surface design tensions invisible at any single zoom le",
    "path": "/Users/rig128gb/.hermes/skills/ApertureOscillation/SKILL.md"
  },
  {
    "id": "Aphorisms",
    "name": "Aphorisms",
    "description": "Manages a curated aphorism collection with full CRUD \u2014 content-based matching, themed search, thinker research, and database maintenance. Organizes quotes by author, theme, context, and newsletter usa",
    "path": "/Users/rig128gb/.hermes/skills/Aphorisms/SKILL.md"
  },
  {
    "id": "Apify",
    "name": "Apify",
    "description": "Scrape social media platforms, business data, and e-commerce via Apify actors \u2014 Instagram profiles/posts/hashtags/comments, LinkedIn profiles/jobs/posts, TikTok profiles/hashtags/videos/comments, YouT",
    "path": "/Users/rig128gb/.hermes/skills/Apify/SKILL.md"
  },
  {
    "id": "ArXiv",
    "name": "Arxiv",
    "description": "Search and retrieve arXiv academic papers by topic, category, or paper ID \u2014 with AlphaXiv-enriched AI-generated overviews. Uses arXiv Atom API (no auth) for discovery and search across cs.AI, cs.LG, c",
    "path": "/Users/rig128gb/.hermes/skills/ArXiv/SKILL.md"
  },
  {
    "id": "Art",
    "name": "Art",
    "description": "Generates static visual content across 20+ formats via Flux, Nano Banana Pro (Gemini 3 Pro), and GPT-Image-1. Covers blog header illustrations, editorial art, Mermaid flowcharts, technical architectur",
    "path": "/Users/rig128gb/.hermes/skills/Art/SKILL.md"
  },
  {
    "id": "AudioEditor",
    "name": "Audioeditor",
    "description": "AI-powered audio and video editing pipeline: Whisper word-level transcription (insanely-fast-whisper on MPS) \u2192 Claude segment classification (KEEP / CUT_FILLER / CUT_FALSE_START / CUT_STUTTER / CUT_DE",
    "path": "/Users/rig128gb/.hermes/skills/AudioEditor/SKILL.md"
  },
  {
    "id": "BeCreative",
    "name": "Becreative",
    "description": "Divergent ideation and corpus expansion using Verbalized Sampling + extended thinking. Single-shot mode generates 5 internally diverse candidates (p<0.10 each) and surfaces the strongest. Multi-turn m",
    "path": "/Users/rig128gb/.hermes/skills/BeCreative/SKILL.md"
  },
  {
    "id": "BitterPillEngineering",
    "name": "Bitterpillengineering",
    "description": "Audits any AI instruction set for over-prompting using the core test: would a smarter model make this rule unnecessary? Applies Five Questions to every rule \u2014 Does Claude already do this? Contradictio",
    "path": "/Users/rig128gb/.hermes/skills/BitterPillEngineering/SKILL.md"
  },
  {
    "id": "BrightData",
    "name": "Brightdata",
    "description": "4-tier progressive scraping with automatic escalation: Tier 1 WebFetch (fast, built-in), Tier 2 curl with Chrome headers (basic bot bypass), Tier 3 agent-browser (headless JavaScript rendering via Rus",
    "path": "/Users/rig128gb/.hermes/skills/BrightData/SKILL.md"
  },
  {
    "id": "Browser",
    "name": "Browser",
    "description": "Headless browser automation via agent-browser \u2014 Rust CLI daemon with persistent auth profiles for fast, scriptable, parallel browser work. Supports batch commands, network interception, device emulati",
    "path": "/Users/rig128gb/.hermes/skills/Browser/SKILL.md"
  },
  {
    "id": "ContextSearch",
    "name": "Contextsearch",
    "description": "2-phase context search across the PAI session registry, work directories, and ISAs for instant cold-start recovery. Phase 1 (always): parallel scan of work.json session registry, session-names.json, M",
    "path": "/Users/rig128gb/.hermes/skills/ContextSearch/SKILL.md"
  },
  {
    "id": "Council",
    "name": "Council",
    "description": "Multi-agent collaborative debate that produces visible round-by-round transcripts with genuine intellectual friction. All council members are custom-composed via ComposeAgent (Agents skill) with domai",
    "path": "/Users/rig128gb/.hermes/skills/Council/SKILL.md"
  },
  {
    "id": "CreateCLI",
    "name": "Createcli",
    "description": "Generate production-ready TypeScript CLIs using a 3-tier template system: Tier 1 llcli-style manual arg parsing (zero deps, Bun + TypeScript, ~300-400 lines \u2014 80% of cases), Tier 2 Commander.js (subco",
    "path": "/Users/rig128gb/.hermes/skills/CreateCLI/SKILL.md"
  },
  {
    "id": "CreateSkill",
    "name": "Createskill",
    "description": "Complete PAI skill development lifecycle across two tracks. Structure track: scaffold new skills (TitleCase dirs, flat 2-level max, Workflows/ + Tools/ + References/ only), validate against canonical ",
    "path": "/Users/rig128gb/.hermes/skills/CreateSkill/SKILL.md"
  },
  {
    "id": "CredentialControlPlane",
    "name": "Credentialcontrolplane",
    "description": "Use whenever an agent, CLI, MCP server, app, or workflow needs API keys, OAuth credentials, passwords, secret repair, or credential refresh.",
    "path": "/Users/rig128gb/.hermes/skills/CredentialControlPlane/SKILL.md"
  },
  {
    "id": "Daemon",
    "name": "Daemon",
    "description": "Manage the public daemon profile \u2014 a living digital representation of what you're working on, thinking about, reading, and building. DaemonAggregator.ts reads PAI sources (TELOS missions/goals/books/w",
    "path": "/Users/rig128gb/.hermes/skills/Daemon/SKILL.md"
  },
  {
    "id": "Delegation",
    "name": "Delegation",
    "description": "Parallelize work via six patterns: built-in agents (Engineer/Architect/Algorithm/Explore/Plan via Task), worktree-isolated agents (conflict-free parallel file edits), background agents (run_in_backgro",
    "path": "/Users/rig128gb/.hermes/skills/Delegation/SKILL.md"
  },
  {
    "id": "Evals",
    "name": "Evals",
    "description": "Comprehensive AI agent evaluation framework with three grader types (code-based: deterministic/fast; model-based: nuanced/LLM rubric; human: gold standard) and pass@k / pass^k scoring. Evaluates agent",
    "path": "/Users/rig128gb/.hermes/skills/Evals/SKILL.md"
  },
  {
    "id": "ExtractWisdom",
    "name": "Extractwisdom",
    "description": "Content-adaptive wisdom extraction that reads the content first, detects what wisdom domains are actually present, then builds custom sections around what it finds \u2014 instead of forcing static headers ",
    "path": "/Users/rig128gb/.hermes/skills/ExtractWisdom/SKILL.md"
  },
  {
    "id": "Fabric",
    "name": "Fabric",
    "description": "Execute any of 240+ specialized prompt patterns natively (no CLI required for most) across categories: Extraction (30+), Summarization (20+), Analysis (35+), Creation (50+), Improvement (10+), Securit",
    "path": "/Users/rig128gb/.hermes/skills/Fabric/SKILL.md"
  },
  {
    "id": "FirstPrinciples",
    "name": "Firstprinciples",
    "description": "Physics-based reasoning framework (Musk/Elon methodology) that deconstructs problems to irreducible fundamental truths rather than reasoning by analogy. Three-step structure: DECONSTRUCT (break to con",
    "path": "/Users/rig128gb/.hermes/skills/FirstPrinciples/SKILL.md"
  },
  {
    "id": "ISA",
    "name": "Isa",
    "description": "Owns the Ideal State Artifact \u2014 the universal primitive that holds the articulated ideal state of any thing (project, task, application, library, infrastructure, work session) as a hard-to-vary explan",
    "path": "/Users/rig128gb/.hermes/skills/ISA/SKILL.md"
  },
  {
    "id": "Ideate",
    "name": "Ideate",
    "description": "Evolutionary ideation engine \u2014 loop-controlled multi-cycle idea generation through 9 phases (CONSUME, DREAM at noise=0.9, DAYDREAM at noise=0.5, CONTEMPLATE at noise=0.1, STEAL cross-domain borrowing,",
    "path": "/Users/rig128gb/.hermes/skills/Ideate/SKILL.md"
  },
  {
    "id": "Interceptor",
    "name": "Interceptor",
    "description": "Real Chrome browser automation via Interceptor extension \u2014 controls the actual browser from inside (zero CDP fingerprint, passes all major bot detection checks including BrowserScan, Pixelscan, CreepJ",
    "path": "/Users/rig128gb/.hermes/skills/Interceptor/SKILL.md"
  },
  {
    "id": "Interview",
    "name": "Interview",
    "description": "Runs a phased conversational interview across all PAI context files using InterviewScan.ts, which orders targets by PHASE and assigns conversation mode per file. Phase 1 (foundational TELOS) always ru",
    "path": "/Users/rig128gb/.hermes/skills/Interview/SKILL.md"
  },
  {
    "id": "IterativeDepth",
    "name": "Iterativedepth",
    "description": "Structured multi-angle exploration that runs 2-8 sequential passes through the same problem, each from a systematically different scientific lens, to surface requirements and edge cases invisible from",
    "path": "/Users/rig128gb/.hermes/skills/IterativeDepth/SKILL.md"
  },
  {
    "id": "JakeRigAgent",
    "name": "Jakerigagent",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/JakeRigAgent/SKILL.md"
  },
  {
    "id": "Knowledge",
    "name": "Knowledge",
    "description": "Manage the PAI Knowledge Archive \u2014 a curated, typed graph of notes across four entity domains: People, Companies, Ideas, and Research. Operations: search (3-pass: lexical + frontmatter + wikilink), ad",
    "path": "/Users/rig128gb/.hermes/skills/Knowledge/SKILL.md"
  },
  {
    "id": "Loop",
    "name": "Loop",
    "description": "Iterative improvement loop \u2014 revisit and refine a target across multiple Algorithm cycles toward an ideal state. USE WHEN loop, iterate, refine, improve iteratively, multiple passes, keep improving, l",
    "path": "/Users/rig128gb/.hermes/skills/Loop/SKILL.md"
  },
  {
    "id": "Migrate",
    "name": "Migrate",
    "description": "Intakes existing content from external sources, classifies each chunk against the PAI destination taxonomy, and commits approved chunks with provenance. Sources: .md/.markdown/.txt, stdin, PAI TELOS/M",
    "path": "/Users/rig128gb/.hermes/skills/Migrate/SKILL.md"
  },
  {
    "id": "Optimize",
    "name": "Optimize",
    "description": "Autonomous optimization loop \u2014 hill-climb any target. Code with metrics, or skills/prompts/agents with LLM-as-judge eval. USE WHEN optimize, autoresearch, hill climb, improve metric, reduce latency, i",
    "path": "/Users/rig128gb/.hermes/skills/Optimize/SKILL.md"
  },
  {
    "id": "PAIUpgrade",
    "name": "Paiupgrade",
    "description": "Generate prioritized PAI upgrade recommendations via 4 parallel threads: Thread 0 (prior-work audit \u2014 reads current Algorithm, PATTERNS.yaml, hooks, settings, recent ISAs, and KNOWLEDGE to assign Prio",
    "path": "/Users/rig128gb/.hermes/skills/PAIUpgrade/SKILL.md"
  },
  {
    "id": "PrivateInvestigator",
    "name": "Privateinvestigator",
    "description": "Ethical people-finding and identity verification using 15 parallel research agents (5 types x 3 each = 45 concurrent search threads) across people search aggregators, social media, public records, and",
    "path": "/Users/rig128gb/.hermes/skills/PrivateInvestigator/SKILL.md"
  },
  {
    "id": "Prompting",
    "name": "Prompting",
    "description": "Meta-prompting standard library \u2014 the PAI system for generating, optimizing, and composing prompts programmatically. Owns three pillars: Standards (Anthropic Claude 4.x best practices, context enginee",
    "path": "/Users/rig128gb/.hermes/skills/Prompting/SKILL.md"
  },
  {
    "id": "RIGCreativeContext",
    "name": "Rigcreativecontext",
    "description": "Automatic RIG context gathering for Hermes/OpenClaw/Codex/Claude Code before creative strategy, product ideation, architecture, coding plans, research synthesis, agent design, process design, or any a",
    "path": "/Users/rig128gb/.hermes/skills/RIGCreativeContext/SKILL.md"
  },
  {
    "id": "RIGFleetExecution",
    "name": "Rigfleetexecution",
    "description": "Route work across the RIG fleet when a task should use multiple nodes, local models, Nomad, Open WebUI, Hermes, PyCode/OpenClaw, swarms, long-running jobs, parallel research/coding/testing, spec-sheet",
    "path": "/Users/rig128gb/.hermes/skills/RIGFleetExecution/SKILL.md"
  },
  {
    "id": "RIGOperatorDoctrine",
    "name": "Rigoperatordoctrine",
    "description": "Use for any RIG, Jake, Hermes, OpenClaw, Claude Code, Codex, Pi/PyCoding, model/fleet, QNAP, Recall, Obsidian, Susan, product-build, app-studio, native-build, personal-brand, public-proof, skill-syste",
    "path": "/Users/rig128gb/.hermes/skills/RIGOperatorDoctrine/SKILL.md"
  },
  {
    "id": "RedTeam",
    "name": "Redteam",
    "description": "Military-grade adversarial analysis that deploys 32 parallel expert agents (engineers, architects, pentesters, interns) to stress-test ideas, strategies, and plans \u2014 not systems or infrastructure. Two",
    "path": "/Users/rig128gb/.hermes/skills/RedTeam/SKILL.md"
  },
  {
    "id": "RootCauseAnalysis",
    "name": "Rootcauseanalysis",
    "description": "Structured incident investigation grounded in Toyota Production System, Kaoru Ishikawa, James Reason's Swiss Cheese model, Dean Gano's Apollo method, and Google SRE blameless-postmortem culture. Five ",
    "path": "/Users/rig128gb/.hermes/skills/RootCauseAnalysis/SKILL.md"
  },
  {
    "id": "Sales",
    "name": "Sales",
    "description": "Transforms product documentation into sales-ready narrative packages combining story explanation, charcoal gestural sketch art, and talking points. Pipeline: extract narrative arc \u2192 determine emotiona",
    "path": "/Users/rig128gb/.hermes/skills/Sales/SKILL.md"
  },
  {
    "id": "Science",
    "name": "Science",
    "description": "The scientific method as a universal problem-solving algorithm \u2014 goal-first, hypothesis-plural, falsifiable experiments, honest measurement. Seven core workflows: DefineGoal, GenerateHypotheses (minim",
    "path": "/Users/rig128gb/.hermes/skills/Science/SKILL.md"
  },
  {
    "id": "SystemsThinking",
    "name": "Systemsthinking",
    "description": "Structural analysis of complex systems grounded in Donella Meadows, Peter Senge, Jay Forrester, Russell Ackoff, and the Santa Fe Institute tradition. Five workflows: Iceberg (walk Events \u2192 Patterns \u2192 ",
    "path": "/Users/rig128gb/.hermes/skills/SystemsThinking/SKILL.md"
  },
  {
    "id": "Telos",
    "name": "Telos",
    "description": "Dual-context Life OS and organizational analysis skill. Personal TELOS: read and update goals, beliefs, wisdom, books, movies, challenges, narratives, strategies, mission, mental models, predictions, ",
    "path": "/Users/rig128gb/.hermes/skills/Telos/SKILL.md"
  },
  {
    "id": "USMetrics",
    "name": "Usmetrics",
    "description": "Analyze and update 68 US economic and social indicators from five government APIs: FRED, EIA, Treasury FiscalData, BLS, Census. Ten categories: Economic Output & Growth (GDP, industrial production, re",
    "path": "/Users/rig128gb/.hermes/skills/USMetrics/SKILL.md"
  },
  {
    "id": "Webdesign",
    "name": "Webdesign",
    "description": "Design and integrate web interfaces using Anthropic's Claude Design (claude.ai/design) as the primary engine, with optional downstream handoff to the frontend-design plugin for production code. Drives",
    "path": "/Users/rig128gb/.hermes/skills/Webdesign/SKILL.md"
  },
  {
    "id": "WorldThreatModel",
    "name": "Worldthreatmodel",
    "description": "Persistent world-model harness that stress-tests ideas, strategies, and investments against 11 time horizons from 6 months to 50 years. Each horizon model is a deep (~10 page) analysis of geopolitics,",
    "path": "/Users/rig128gb/.hermes/skills/WorldThreatModel/SKILL.md"
  },
  {
    "id": "WriteStory",
    "name": "Writestory",
    "description": "Constructs fiction across seven simultaneous narrative layers (Meaning, Character Change, Plot, Mystery, World, Relationships, Prose) powered by Will Storr's Science of Storytelling, Pressfield's stru",
    "path": "/Users/rig128gb/.hermes/skills/WriteStory/SKILL.md"
  },
  {
    "id": "accessibility",
    "name": "Accessibility",
    "description": "Audit and improve web accessibility following WCAG 2.1 guidelines. Use when asked to \"improve accessibility\", \"a11y audit\", \"WCAG compliance\", \"screen reader support\", \"keyboard navigation\", or \"make ",
    "path": "/Users/rig128gb/.hermes/skills/accessibility/SKILL.md"
  },
  {
    "id": "accessibility-compliance__screen-reader-testing",
    "name": "Accessibility Compliance__Screen Reader Testing",
    "description": "Test web applications with screen readers including VoiceOver, NVDA, and JAWS. Use when validating screen reader compatibility, debugging accessibility issues, or ensuring assistive technology support",
    "path": "/Users/rig128gb/.hermes/skills/accessibility-compliance__screen-reader-testing/SKILL.md"
  },
  {
    "id": "accessibility-compliance__wcag-audit-patterns",
    "name": "Accessibility Compliance__Wcag Audit Patterns",
    "description": "Conduct WCAG 2.2 accessibility audits with automated testing, manual verification, and remediation guidance. Use when auditing websites for accessibility, fixing WCAG violations, or implementing acces",
    "path": "/Users/rig128gb/.hermes/skills/accessibility-compliance__wcag-audit-patterns/SKILL.md"
  },
  {
    "id": "agency-agents",
    "name": "Agency Agents",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/agency-agents/SKILL.md"
  },
  {
    "id": "agent-browser",
    "name": "Agent Browser",
    "description": "Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web a",
    "path": "/Users/rig128gb/.hermes/skills/agent-browser/SKILL.md"
  },
  {
    "id": "agent-harness",
    "name": "Agent Harness",
    "description": "Select the right RIG agent harness across Claude, Codex, and Hermes, or scaffold a governed local harness when none exists.",
    "path": "/Users/rig128gb/.hermes/skills/agent-harness/SKILL.md"
  },
  {
    "id": "agent-introspection-debugging",
    "name": "Agent Introspection Debugging",
    "description": "Structured self-debugging workflow for AI agent failures using capture, diagnosis, contained recovery, and introspection reports.",
    "path": "/Users/rig128gb/.hermes/skills/agent-introspection-debugging/SKILL.md"
  },
  {
    "id": "agent-reach",
    "name": "Agent Reach",
    "description": ">",
    "path": "/Users/rig128gb/.hermes/skills/agent-reach/SKILL.md"
  },
  {
    "id": "agent-sort",
    "name": "Agent Sort",
    "description": "Build an evidence-backed ECC install plan for a specific repo by sorting skills, commands, rules, hooks, and extras into DAILY vs LIBRARY buckets using parallel repo-aware review passes. Use when ECC ",
    "path": "/Users/rig128gb/.hermes/skills/agent-sort/SKILL.md"
  },
  {
    "id": "agent-teams__multi-reviewer-patterns",
    "name": "Agent Teams__Multi Reviewer Patterns",
    "description": "Coordinate parallel code reviews across multiple quality dimensions with finding deduplication, severity calibration, and consolidated reporting. Use this skill when organizing multi-reviewer code rev",
    "path": "/Users/rig128gb/.hermes/skills/agent-teams__multi-reviewer-patterns/SKILL.md"
  },
  {
    "id": "agent-teams__parallel-debugging",
    "name": "Agent Teams__Parallel Debugging",
    "description": "Debug complex issues using competing hypotheses with parallel investigation, evidence collection, and root cause arbitration. Use this skill when debugging bugs with multiple potential causes, perform",
    "path": "/Users/rig128gb/.hermes/skills/agent-teams__parallel-debugging/SKILL.md"
  },
  {
    "id": "agent-teams__parallel-feature-development",
    "name": "Agent Teams__Parallel Feature Development",
    "description": "Coordinate parallel feature development with file ownership strategies, conflict avoidance rules, and integration patterns for multi-agent implementation. Use this skill when decomposing a large featu",
    "path": "/Users/rig128gb/.hermes/skills/agent-teams__parallel-feature-development/SKILL.md"
  },
  {
    "id": "agent-teams__task-coordination-strategies",
    "name": "Agent Teams__Task Coordination Strategies",
    "description": "Decompose complex tasks, design dependency graphs, and coordinate multi-agent work with proper task descriptions and workload balancing. Use this skill when breaking down work for agent teams, managin",
    "path": "/Users/rig128gb/.hermes/skills/agent-teams__task-coordination-strategies/SKILL.md"
  },
  {
    "id": "agent-teams__team-communication-protocols",
    "name": "Agent Teams__Team Communication Protocols",
    "description": "Structured messaging protocols for agent team communication including message type selection, plan approval, shutdown procedures, and anti-patterns to avoid. Use this skill when establishing communica",
    "path": "/Users/rig128gb/.hermes/skills/agent-teams__team-communication-protocols/SKILL.md"
  },
  {
    "id": "agent-teams__team-composition-patterns",
    "name": "Agent Teams__Team Composition Patterns",
    "description": "Design optimal agent team compositions with sizing heuristics, preset configurations, and agent type selection. Use this skill when deciding how many agents to spawn for a task, when choosing between ",
    "path": "/Users/rig128gb/.hermes/skills/agent-teams__team-composition-patterns/SKILL.md"
  },
  {
    "id": "agents-sdk",
    "name": "Agents Sdk",
    "description": "Build AI agents on Cloudflare Workers using the Agents SDK. Load when creating stateful agents, durable workflows, real-time WebSocket apps, scheduled tasks, MCP servers, chat applications, voice agen",
    "path": "/Users/rig128gb/.hermes/skills/agents-sdk/SKILL.md"
  },
  {
    "id": "ai-regression-testing",
    "name": "Ai Regression Testing",
    "description": "Regression testing strategies for AI-assisted development. Sandbox-mode API testing without database dependencies, automated bug-check workflows, and patterns to catch AI blind spots where the same mo",
    "path": "/Users/rig128gb/.hermes/skills/ai-regression-testing/SKILL.md"
  },
  {
    "id": "ai-slop-cleaner",
    "name": "Ai Slop Cleaner",
    "description": "Run an anti-slop cleanup/refactor/deslop workflow",
    "path": "/Users/rig128gb/.hermes/skills/ai-slop-cleaner/SKILL.md"
  },
  {
    "id": "airunway-aks-setup",
    "name": "Airunway Aks Setup",
    "description": "Set up AI Runway on AKS \u2014 from bare cluster to running model. Covers cluster verification, controller install, GPU assessment, provider setup, and first deployment. WHEN: \\\"setup AI Runway\\\", \\\"onboar",
    "path": "/Users/rig128gb/.hermes/skills/airunway-aks-setup/SKILL.md"
  },
  {
    "id": "aisdkagents",
    "name": "Aisdkagents",
    "description": "Use this whenever building AI SDK agents, chat apps, tool-calling workflows, human-in-the-loop systems, streaming UIs, artifact generation, evaluator-optimizer loops, multi-agent orchestration, struct",
    "path": "/Users/rig128gb/.hermes/skills/aisdkagents/SKILL.md"
  },
  {
    "id": "analytics-dashboard",
    "name": "Analytics Dashboard",
    "description": ">",
    "path": "/Users/rig128gb/.hermes/skills/analytics-dashboard/SKILL.md"
  },
  {
    "id": "api-design",
    "name": "Api Design",
    "description": "Design or review an HTTP/REST/GraphQL API for versioning, pagination, error shapes, idempotency, auth, and evolvability. Use when asked to \"design an API\", \"shape the endpoints\", \"design the schema\", ",
    "path": "/Users/rig128gb/.hermes/skills/api-design/SKILL.md"
  },
  {
    "id": "api-scaffolding__fastapi-templates",
    "name": "Api Scaffolding__Fastapi Templates",
    "description": "Create production-ready FastAPI projects with async patterns, dependency injection, and comprehensive error handling. Use when building new FastAPI applications or setting up backend API projects.",
    "path": "/Users/rig128gb/.hermes/skills/api-scaffolding__fastapi-templates/SKILL.md"
  },
  {
    "id": "appinsights-instrumentation",
    "name": "Appinsights Instrumentation",
    "description": "Guidance for instrumenting webapps with Azure Application Insights. Provides telemetry patterns, SDK setup, and configuration references. WHEN: how to instrument app, App Insights SDK, telemetry patte",
    "path": "/Users/rig128gb/.hermes/skills/appinsights-instrumentation/SKILL.md"
  },
  {
    "id": "archon",
    "name": "Archon",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/archon/SKILL.md"
  },
  {
    "id": "article-writing",
    "name": "Article Writing",
    "description": "Write articles, guides, blog posts, tutorials, newsletter issues, and other long-form content in a distinctive voice derived from supplied examples or brand guidance. Use when the user wants polished ",
    "path": "/Users/rig128gb/.hermes/skills/article-writing/SKILL.md"
  },
  {
    "id": "ask-claude",
    "name": "Ask Claude",
    "description": "Ask Claude via local CLI and capture a reusable artifact",
    "path": "/Users/rig128gb/.hermes/skills/ask-claude/SKILL.md"
  },
  {
    "id": "ask-docs",
    "name": "Ask Docs",
    "description": "Query the official CrewAI documentation for answers. Use when the user has a CrewAI question that isn't fully covered by the getting-started, design-agent, design-task skills \u2014 e.g., specific API deta",
    "path": "/Users/rig128gb/.hermes/skills/ask-docs/SKILL.md"
  },
  {
    "id": "ask-gemini",
    "name": "Ask Gemini",
    "description": "Ask Gemini via local CLI and capture a reusable artifact",
    "path": "/Users/rig128gb/.hermes/skills/ask-gemini/SKILL.md"
  },
  {
    "id": "ast-grep",
    "name": "Ast Grep",
    "description": "Guide for writing ast-grep rules to perform structural code search and analysis. Use when users need to search codebases using Abstract Syntax Tree (AST) patterns, find specific code structures, or pe",
    "path": "/Users/rig128gb/.hermes/skills/ast-grep/SKILL.md"
  },
  {
    "id": "autopilot",
    "name": "Autopilot",
    "description": "Run a founder-grade autonomous execution lane from the canonical stack pack.",
    "path": "/Users/rig128gb/.hermes/skills/autopilot/SKILL.md"
  },
  {
    "id": "autoplan",
    "name": "Autoplan",
    "description": "Wrapper alias for the Hermes GStack autoplan skill. Canonical instructions live at /Users/rig128gb/.hermes/skills/gstack/autoplan/SKILL.md.",
    "path": "/Users/rig128gb/.hermes/skills/autoplan/SKILL.md"
  },
  {
    "id": "awesome-codex-subagents",
    "name": "Awesome Codex Subagents",
    "description": "Use when Mike mentions VoltAgent, awesome-codex-subagents, Codex subagents, or wants a specialist Codex/Claude/Hermes role from the VoltAgent catalog.",
    "path": "/Users/rig128gb/.hermes/skills/awesome-codex-subagents/SKILL.md"
  },
  {
    "id": "azure-ai",
    "name": "Azure Ai",
    "description": "Use for Azure AI: Search, Speech, OpenAI, Document Intelligence. Helps with search, vector/hybrid search, speech-to-text, text-to-speech, transcription, OCR. WHEN: AI Search, query search, vector sear",
    "path": "/Users/rig128gb/.hermes/skills/azure-ai/SKILL.md"
  },
  {
    "id": "azure-aigateway",
    "name": "Azure Aigateway",
    "description": "Configure Azure API Management as an AI Gateway for AI models, MCP tools, and agents. WHEN: semantic caching, token limit, content safety, load balancing, AI model governance, MCP rate limiting, jailb",
    "path": "/Users/rig128gb/.hermes/skills/azure-aigateway/SKILL.md"
  },
  {
    "id": "azure-cloud-migrate",
    "name": "Azure Cloud Migrate",
    "description": "Assess and migrate cross-cloud workloads to Azure with reports and code conversion. Supports Lambda\u2192Functions, Beanstalk/Heroku/App Engine\u2192App Service, Fargate/Kubernetes/Cloud Run/Spring Boot\u2192Contain",
    "path": "/Users/rig128gb/.hermes/skills/azure-cloud-migrate/SKILL.md"
  },
  {
    "id": "azure-compliance",
    "name": "Azure Compliance",
    "description": "Run Azure compliance and security audits with azqr plus Key Vault expiration checks. Covers best-practice assessment, resource review, policy/compliance validation, and security posture checks. WHEN: ",
    "path": "/Users/rig128gb/.hermes/skills/azure-compliance/SKILL.md"
  },
  {
    "id": "azure-compute",
    "name": "Azure Compute",
    "description": "Azure VM/VMSS router. WHEN: create / provision / deploy / spin-up VM, recommend VM size, compare VM pricing, VMSS, scale set, autoscale, burstable, lightweight server, website, backend, GPU, machine l",
    "path": "/Users/rig128gb/.hermes/skills/azure-compute/SKILL.md"
  },
  {
    "id": "azure-cost",
    "name": "Azure Cost",
    "description": "Azure cost management: query costs, forecast spending, optimize to reduce waste. WHEN: \\\"Azure costs\\\", \\\"Azure bill\\\", \\\"cost breakdown\\\", \\\"how much am I spending\\\", \\\"forecast spending\\\", \\\"optimiz",
    "path": "/Users/rig128gb/.hermes/skills/azure-cost/SKILL.md"
  },
  {
    "id": "azure-deploy",
    "name": "Azure Deploy",
    "description": "Execute Azure deployments for ALREADY-PREPARED applications that have existing .azure/deployment-plan.md and infrastructure files. DO NOT use this skill when the user asks to CREATE a new application ",
    "path": "/Users/rig128gb/.hermes/skills/azure-deploy/SKILL.md"
  },
  {
    "id": "azure-diagnostics",
    "name": "Azure Diagnostics",
    "description": "Debug Azure production issues on Azure using AppLens, Azure Monitor, resource health, and safe triage. WHEN: debug production issues, troubleshoot app service, app service high CPU, app service deploy",
    "path": "/Users/rig128gb/.hermes/skills/azure-diagnostics/SKILL.md"
  },
  {
    "id": "azure-enterprise-infra-planner",
    "name": "Azure Enterprise Infra Planner",
    "description": "Architect and provision enterprise Azure infrastructure from workload descriptions. For cloud architects and platform engineers planning networking, identity, security, compliance, and multi-resource ",
    "path": "/Users/rig128gb/.hermes/skills/azure-enterprise-infra-planner/SKILL.md"
  },
  {
    "id": "azure-hosted-copilot-sdk",
    "name": "Azure Hosted Copilot Sdk",
    "description": "Build, deploy, and modify GitHub Copilot SDK apps on Azure. MANDATORY when codebase contains @github/copilot-sdk or CopilotClient in package.json. PREFER OVER azure-prepare when copilot-sdk markers de",
    "path": "/Users/rig128gb/.hermes/skills/azure-hosted-copilot-sdk/SKILL.md"
  },
  {
    "id": "azure-kubernetes",
    "name": "Azure Kubernetes",
    "description": "Plan, create, and configure production-ready Azure Kubernetes Service (AKS) clusters. Covers Day-0 checklist, SKU selection (Automatic vs Standard), networking options (private API server, Azure CNI O",
    "path": "/Users/rig128gb/.hermes/skills/azure-kubernetes/SKILL.md"
  },
  {
    "id": "azure-kusto",
    "name": "Azure Kusto",
    "description": "Query and analyze data in Azure Data Explorer (Kusto/ADX) using KQL for log analytics, telemetry, and time series analysis. WHEN: KQL queries, Kusto database queries, Azure Data Explorer, ADX clusters",
    "path": "/Users/rig128gb/.hermes/skills/azure-kusto/SKILL.md"
  },
  {
    "id": "azure-messaging",
    "name": "Azure Messaging",
    "description": "Troubleshoot and resolve issues with Azure Messaging SDKs for Event Hubs and Service Bus. Covers connection failures, authentication errors, message processing issues, and SDK configuration problems. ",
    "path": "/Users/rig128gb/.hermes/skills/azure-messaging/SKILL.md"
  },
  {
    "id": "azure-prepare",
    "name": "Azure Prepare",
    "description": "Prepare Azure apps for deployment (infra Bicep/Terraform, azure.yaml, Dockerfiles). Use for create/modernize or create+deploy; not cross-cloud migration (use azure-cloud-migrate). DO NOT USE FOR: copi",
    "path": "/Users/rig128gb/.hermes/skills/azure-prepare/SKILL.md"
  },
  {
    "id": "azure-quotas",
    "name": "Azure Quotas",
    "description": "Check/manage Azure quotas and usage across providers. For deployment planning, capacity validation, region selection. WHEN: \\\"check quotas\\\", \\\"service limits\\\", \\\"current usage\\\", \\\"request quota inc",
    "path": "/Users/rig128gb/.hermes/skills/azure-quotas/SKILL.md"
  },
  {
    "id": "azure-rbac",
    "name": "Azure Rbac",
    "description": "Helps users find the right Azure RBAC role for an identity with least privilege access, then generate CLI commands and Bicep code to assign it. Also provides guidance on permissions required to grant ",
    "path": "/Users/rig128gb/.hermes/skills/azure-rbac/SKILL.md"
  },
  {
    "id": "azure-reliability",
    "name": "Azure Reliability",
    "description": "Assess and improve the reliability posture of PaaS Applications (Azure Functions and Azure App Service). Scans deployed resources for zone redundancy, ZRS storage, health probes, and multi-region fail",
    "path": "/Users/rig128gb/.hermes/skills/azure-reliability/SKILL.md"
  },
  {
    "id": "azure-resource-lookup",
    "name": "Azure Resource Lookup",
    "description": "List, find, and show Azure resources across subscriptions or resource groups. Handles prompts like \\\"list the websites in my subscription\\\", \\\"list my web apps\\\", \\\"show my app services\\\", \\\"list virt",
    "path": "/Users/rig128gb/.hermes/skills/azure-resource-lookup/SKILL.md"
  },
  {
    "id": "azure-resource-visualizer",
    "name": "Azure Resource Visualizer",
    "description": "Analyze Azure resource groups and generate detailed Mermaid architecture diagrams showing the relationships between individual resources. WHEN: create architecture diagram, visualize Azure resources, ",
    "path": "/Users/rig128gb/.hermes/skills/azure-resource-visualizer/SKILL.md"
  },
  {
    "id": "azure-storage",
    "name": "Azure Storage",
    "description": "Azure Storage Services including Blob Storage, File Shares, Queue Storage, Table Storage, and Data Lake. Answers questions about storage access tiers (hot, cool, cold, archive), when to use each tier,",
    "path": "/Users/rig128gb/.hermes/skills/azure-storage/SKILL.md"
  },
  {
    "id": "azure-upgrade",
    "name": "Azure Upgrade",
    "description": "Assess and upgrade Azure workloads between plans, tiers, or SKUs, or modernize Azure SDK dependencies in source code. WHEN: upgrade Consumption to Flex Consumption, upgrade Azure Functions plan, chang",
    "path": "/Users/rig128gb/.hermes/skills/azure-upgrade/SKILL.md"
  },
  {
    "id": "azure-validate",
    "name": "Azure Validate",
    "description": "Pre-deployment validation for Azure readiness. Run deep checks on configuration, infrastructure (Bicep or Terraform), RBAC role assignments, managed identity permissions, and prerequisites before depl",
    "path": "/Users/rig128gb/.hermes/skills/azure-validate/SKILL.md"
  },
  {
    "id": "backend-development__api-design-principles",
    "name": "Backend Development__Api Design Principles",
    "description": "Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs that delight developers. Use when designing new APIs, reviewing API specifications, or establishing AP",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__api-design-principles/SKILL.md"
  },
  {
    "id": "backend-development__architecture-patterns",
    "name": "Backend Development__Architecture Patterns",
    "description": "Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design. Use this skill when designing clean architecture for a new microservice, ",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__architecture-patterns/SKILL.md"
  },
  {
    "id": "backend-development__cqrs-implementation",
    "name": "Backend Development__Cqrs Implementation",
    "description": "Implement Command Query Responsibility Segregation for scalable architectures. Use when separating read and write models, optimizing query performance, or building event-sourced systems.",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__cqrs-implementation/SKILL.md"
  },
  {
    "id": "backend-development__event-store-design",
    "name": "Backend Development__Event Store Design",
    "description": "Design and implement event stores for event-sourced systems. Use when building event sourcing infrastructure, choosing event store technologies, or implementing event persistence patterns.",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__event-store-design/SKILL.md"
  },
  {
    "id": "backend-development__microservices-patterns",
    "name": "Backend Development__Microservices Patterns",
    "description": "Design microservices architectures with service boundaries, event-driven communication, and resilience patterns. Use when building distributed systems, decomposing monoliths, or implementing microserv",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__microservices-patterns/SKILL.md"
  },
  {
    "id": "backend-development__projection-patterns",
    "name": "Backend Development__Projection Patterns",
    "description": "Build read models and projections from event streams. Use when implementing CQRS read sides, building materialized views, or optimizing query performance in event-sourced systems.",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__projection-patterns/SKILL.md"
  },
  {
    "id": "backend-development__saga-orchestration",
    "name": "Backend Development__Saga Orchestration",
    "description": "Implement saga patterns for distributed transactions and cross-aggregate workflows. Use this skill when implementing distributed transactions across microservices where 2PC is unavailable, designing c",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__saga-orchestration/SKILL.md"
  },
  {
    "id": "backend-development__temporal-python-testing",
    "name": "Backend Development__Temporal Python Testing",
    "description": "Test Temporal workflows with pytest, time-skipping, and mocking strategies. Covers unit testing, integration testing, replay testing, and local development setup. Use when implementing Temporal workfl",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__temporal-python-testing/SKILL.md"
  },
  {
    "id": "backend-development__workflow-orchestration-patterns",
    "name": "Backend Development__Workflow Orchestration Patterns",
    "description": "Design durable workflows with Temporal for distributed systems. Covers workflow vs activity separation, saga patterns, state management, and determinism constraints. Use when building long-running pro",
    "path": "/Users/rig128gb/.hermes/skills/backend-development__workflow-orchestration-patterns/SKILL.md"
  },
  {
    "id": "benchmark",
    "name": "Benchmark",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/benchmark/SKILL.md"
  },
  {
    "id": "benchmark-models",
    "name": "Benchmark Models",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/benchmark-models/SKILL.md"
  },
  {
    "id": "best-practices",
    "name": "Best Practices",
    "description": "Apply modern web development best practices for security, compatibility, and code quality. Use when asked to \"apply best practices\", \"security audit\", \"modernize code\", \"code quality review\", or \"chec",
    "path": "/Users/rig128gb/.hermes/skills/best-practices/SKILL.md"
  },
  {
    "id": "blackwell-vllm-smoke",
    "name": "Blackwell Vllm Smoke",
    "description": "Use when verifying Blackwell, Blackwell combined, local Blackwell proxy, vLLM/OpenAI-compatible Blackwell endpoints, or Blackwell model selector drift.",
    "path": "/Users/rig128gb/.hermes/skills/blackwell-vllm-smoke/SKILL.md"
  },
  {
    "id": "block-no-verify__block-no-verify-hook",
    "name": "Block No Verify__Block No Verify Hook",
    "description": "Configure a PreToolUse hook to prevent AI agents from skipping git pre-commit hooks with --no-verify and other bypass flags. Use when setting up Claude Code projects that enforce commit quality gates.",
    "path": "/Users/rig128gb/.hermes/skills/block-no-verify__block-no-verify-hook/SKILL.md"
  },
  {
    "id": "blockchain-web3__defi-protocol-templates",
    "name": "Blockchain Web3__Defi Protocol Templates",
    "description": "Implement DeFi protocols with production-ready templates for staking, AMMs, governance, and lending systems. Use when building decentralized finance applications or smart contract protocols.",
    "path": "/Users/rig128gb/.hermes/skills/blockchain-web3__defi-protocol-templates/SKILL.md"
  },
  {
    "id": "blockchain-web3__nft-standards",
    "name": "Blockchain Web3__Nft Standards",
    "description": "Implement NFT standards (ERC-721, ERC-1155) with proper metadata handling, minting strategies, and marketplace integration. Use when creating NFT contracts, building NFT marketplaces, or implementing ",
    "path": "/Users/rig128gb/.hermes/skills/blockchain-web3__nft-standards/SKILL.md"
  },
  {
    "id": "blockchain-web3__solidity-security",
    "name": "Blockchain Web3__Solidity Security",
    "description": "Master smart contract security best practices to prevent common vulnerabilities and implement secure Solidity patterns. Use when writing smart contracts, auditing existing contracts, or implementing s",
    "path": "/Users/rig128gb/.hermes/skills/blockchain-web3__solidity-security/SKILL.md"
  },
  {
    "id": "blockchain-web3__web3-testing",
    "name": "Blockchain Web3__Web3 Testing",
    "description": "Test smart contracts comprehensively using Hardhat and Foundry with unit tests, integration tests, and mainnet forking. Use when testing Solidity contracts, setting up blockchain test suites, or valid",
    "path": "/Users/rig128gb/.hermes/skills/blockchain-web3__web3-testing/SKILL.md"
  },
  {
    "id": "blog-post-template",
    "name": "Blog Post Template",
    "description": "\u6742\u5fd7\u611f\u957f\u6587, \u542b masthead\u3001hero\u3001figures\u3001pull quote\u3001\u4f5c\u8005\u7f72\u540d",
    "path": "/Users/rig128gb/.hermes/skills/blog-post-template/SKILL.md"
  },
  {
    "id": "brand-landingpage__brand-landingpage",
    "name": "Brand Landingpage__Brand Landingpage",
    "description": ">",
    "path": "/Users/rig128gb/.hermes/skills/brand-landingpage__brand-landingpage/SKILL.md"
  },
  {
    "id": "bridgespace-bridge-skill-bridgemind-mcp",
    "name": "Bridgespace Bridge Skill Bridgemind Mcp",
    "description": "How to use the BridgeMind MCP (mcp__bridgemind__*) effectively \u2014 projects, tasks, agents, knowledge, attachments, messaging, and the strict task lifecycle.",
    "path": "/Users/rig128gb/.hermes/skills/bridgespace-bridge-skill-bridgemind-mcp/SKILL.md"
  },
  {
    "id": "bridgespace-bridge-skill-github-commit",
    "name": "Bridgespace Bridge Skill Github Commit",
    "description": "Universal commit-and-push methodology. Stages every local change in the current repo, writes a clean conventional commit, and pushes to the GitHub remote.",
    "path": "/Users/rig128gb/.hermes/skills/bridgespace-bridge-skill-github-commit/SKILL.md"
  },
  {
    "id": "bridgespace-bridge-skill-obsidian",
    "name": "Bridgespace Bridge Skill Obsidian",
    "description": "Operate an Obsidian vault as an agent \u2014 vault structure, frontmatter, wikilinks, daily notes, and the three integration paths (filesystem, URI scheme, Local REST API).",
    "path": "/Users/rig128gb/.hermes/skills/bridgespace-bridge-skill-obsidian/SKILL.md"
  },
  {
    "id": "bridgespace-bridge-skill-security-audit",
    "name": "Bridgespace Bridge Skill Security Audit",
    "description": "Senior security-engineer instincts for any agent that reads, writes, or reviews code. OWASP Top 10, CWE Top 25, and supply-chain coverage.",
    "path": "/Users/rig128gb/.hermes/skills/bridgespace-bridge-skill-security-audit/SKILL.md"
  },
  {
    "id": "bridgespace-bridge-skill-seo",
    "name": "Bridgespace Bridge Skill Seo",
    "description": "Modern (2025/2026) SEO methodology for auditing and writing pages \u2014 title tags, meta, headings, structured data, Core Web Vitals, and AI-search citation patterns.",
    "path": "/Users/rig128gb/.hermes/skills/bridgespace-bridge-skill-seo/SKILL.md"
  },
  {
    "id": "briefing",
    "name": "Briefing",
    "description": "Run Jake's morning briefing pipeline \u2014 pulls unread email from iCloud + Exchange, today's calendar events via Orchard, and produces a prioritized summary with VIP detection and urgency scoring.",
    "path": "/Users/rig128gb/.hermes/skills/briefing/SKILL.md"
  },
  {
    "id": "browse",
    "name": "Browse",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/browse/SKILL.md"
  },
  {
    "id": "browser-harness",
    "name": "Browser Harness",
    "description": "Direct browser control via CDP. Use when the user wants to automate, scrape, test, or interact with web pages. Connects to the user's already-running Chrome.",
    "path": "/Users/rig128gb/.hermes/skills/browser-harness/SKILL.md"
  },
  {
    "id": "btw",
    "name": "Btw",
    "description": "Ask a quick side question about your current work without derailing the main task. Answers from existing conversation context only \u2014 no tool calls, no file reads, single concise response. Use when you",
    "path": "/Users/rig128gb/.hermes/skills/btw/SKILL.md"
  },
  {
    "id": "buildcards",
    "name": "Buildcards",
    "description": "Shared RIG agent capabilities via the `buildcards` CLI \u2014 parse documents (LiteParse), generate decks (Presenton), run sandboxed (OpenShell), port Cursor plugins, and track work on a persistent kanban.",
    "path": "/Users/rig128gb/.hermes/skills/buildcards/SKILL.md"
  },
  {
    "id": "business-analytics__data-storytelling",
    "name": "Business Analytics__Data Storytelling",
    "description": "Transform data into compelling narratives using visualization, context, and persuasive structure. Use when presenting analytics to stakeholders, creating data reports, or building executive presentati",
    "path": "/Users/rig128gb/.hermes/skills/business-analytics__data-storytelling/SKILL.md"
  },
  {
    "id": "business-analytics__kpi-dashboard-design",
    "name": "Business Analytics__Kpi Dashboard Design",
    "description": "Design effective KPI dashboards with metrics selection, visualization best practices, and real-time monitoring patterns. Use this skill when building an executive SaaS metrics dashboard tracking MRR, ",
    "path": "/Users/rig128gb/.hermes/skills/business-analytics__kpi-dashboard-design/SKILL.md"
  },
  {
    "id": "canary",
    "name": "Canary",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/canary/SKILL.md"
  },
  {
    "id": "cancel",
    "name": "Cancel",
    "description": "Cancel any active OMX mode (autopilot, ralph, ultrawork, ecomode, ultraqa, swarm, ultrapilot, pipeline, team)",
    "path": "/Users/rig128gb/.hermes/skills/cancel/SKILL.md"
  },
  {
    "id": "capability-gap-map",
    "name": "Capability Gap Map",
    "description": "Use when the task is to map current vs target capabilities, identify gaps, assign ownership, or create a capability roadmap.",
    "path": "/Users/rig128gb/.hermes/skills/capability-gap-map/SKILL.md"
  },
  {
    "id": "careful",
    "name": "Careful",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/careful/SKILL.md"
  },
  {
    "id": "choose-process",
    "name": "Choose Process",
    "description": "Rank Startup Intelligence OS process cards and recommend the best slash command or agentic workflow for a goal.",
    "path": "/Users/rig128gb/.hermes/skills/choose-process/SKILL.md"
  },
  {
    "id": "cicd-automation__deployment-pipeline-design",
    "name": "Cicd Automation__Deployment Pipeline Design",
    "description": "Design multi-stage CI/CD pipelines with approval gates, security checks, and deployment orchestration. Use this skill when designing zero-downtime deployment pipelines, implementing canary rollout str",
    "path": "/Users/rig128gb/.hermes/skills/cicd-automation__deployment-pipeline-design/SKILL.md"
  },
  {
    "id": "cicd-automation__github-actions-templates",
    "name": "Cicd Automation__Github Actions Templates",
    "description": "Create production-ready GitHub Actions workflows for automated testing, building, and deploying applications. Use when setting up CI/CD with GitHub Actions, automating development workflows, or creati",
    "path": "/Users/rig128gb/.hermes/skills/cicd-automation__github-actions-templates/SKILL.md"
  },
  {
    "id": "cicd-automation__gitlab-ci-patterns",
    "name": "Cicd Automation__Gitlab Ci Patterns",
    "description": "Build GitLab CI/CD pipelines with multi-stage workflows, caching, and distributed runners for scalable automation. Use when implementing GitLab CI/CD, optimizing pipeline performance, or setting up au",
    "path": "/Users/rig128gb/.hermes/skills/cicd-automation__gitlab-ci-patterns/SKILL.md"
  },
  {
    "id": "cicd-automation__secrets-management",
    "name": "Cicd Automation__Secrets Management",
    "description": "Implement secure secrets management for CI/CD pipelines using Vault, AWS Secrets Manager, or native platform solutions. Use when handling sensitive credentials, rotating secrets, or securing CI/CD env",
    "path": "/Users/rig128gb/.hermes/skills/cicd-automation__secrets-management/SKILL.md"
  },
  {
    "id": "claude-commands",
    "name": "Claude Commands",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/claude-commands/SKILL.md"
  },
  {
    "id": "clawteam",
    "name": "Clawteam",
    "description": ">",
    "path": "/Users/rig128gb/.hermes/skills/clawteam/SKILL.md"
  },
  {
    "id": "cli-anything",
    "name": "Cli Anything",
    "description": "Use when the user wants Codex to build, refine, test, or validate a CLI-Anything harness for a GUI application or source repository. Adapts the CLI-Anything methodology to Codex without changing the g",
    "path": "/Users/rig128gb/.hermes/skills/cli-anything/SKILL.md"
  },
  {
    "id": "clickhouse-io",
    "name": "Clickhouse Io",
    "description": "ClickHouse database patterns, query optimization, analytics, and data engineering best practices for high-performance analytical workloads.",
    "path": "/Users/rig128gb/.hermes/skills/clickhouse-io/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__cost-optimization",
    "name": "Cloud Infrastructure__Cost Optimization",
    "description": "Optimize cloud costs across AWS, Azure, GCP, and OCI through resource rightsizing, tagging strategies, reserved instances, and spending analysis. Use when reducing cloud expenses, analyzing infrastruc",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__cost-optimization/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__hybrid-cloud-networking",
    "name": "Cloud Infrastructure__Hybrid Cloud Networking",
    "description": "Configure secure, high-performance connectivity between on-premises infrastructure and cloud platforms using VPN and dedicated connections. Use when building hybrid cloud architectures, connecting dat",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__hybrid-cloud-networking/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__istio-traffic-management",
    "name": "Cloud Infrastructure__Istio Traffic Management",
    "description": "Configure Istio traffic management including routing, load balancing, circuit breakers, and canary deployments. Use when implementing service mesh traffic policies, progressive delivery, or resilience",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__istio-traffic-management/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__linkerd-patterns",
    "name": "Cloud Infrastructure__Linkerd Patterns",
    "description": "Implement Linkerd service mesh patterns for lightweight, security-focused service mesh deployments. Use when setting up Linkerd, configuring traffic policies, or implementing zero-trust networking wit",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__linkerd-patterns/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__mtls-configuration",
    "name": "Cloud Infrastructure__Mtls Configuration",
    "description": "Configure mutual TLS (mTLS) for zero-trust service-to-service communication. Use when implementing zero-trust networking, certificate management, or securing internal service communication.",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__mtls-configuration/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__multi-cloud-architecture",
    "name": "Cloud Infrastructure__Multi Cloud Architecture",
    "description": "Design multi-cloud architectures using a decision framework to select and integrate services across AWS, Azure, GCP, and OCI. Use when building multi-cloud systems, avoiding vendor lock-in, or leverag",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__multi-cloud-architecture/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__service-mesh-observability",
    "name": "Cloud Infrastructure__Service Mesh Observability",
    "description": "Implement comprehensive observability for service meshes including distributed tracing, metrics, and visualization. Use when setting up mesh monitoring, debugging latency issues, or implementing SLOs ",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__service-mesh-observability/SKILL.md"
  },
  {
    "id": "cloud-infrastructure__terraform-module-library",
    "name": "Cloud Infrastructure__Terraform Module Library",
    "description": "Build reusable Terraform modules for AWS, Azure, GCP, and OCI infrastructure following infrastructure-as-code best practices. Use when creating infrastructure modules, standardizing cloud provisioning",
    "path": "/Users/rig128gb/.hermes/skills/cloud-infrastructure__terraform-module-library/SKILL.md"
  },
  {
    "id": "cloudflare",
    "name": "Cloudflare",
    "description": "Comprehensive Cloudflare platform skill covering Workers, Pages, storage (KV, D1, R2), AI (Workers AI, Vectorize, Agents SDK), feature flags (Flagship), networking (Tunnel, Spectrum), security (WAF, D",
    "path": "/Users/rig128gb/.hermes/skills/cloudflare/SKILL.md"
  },
  {
    "id": "cloudflare-email-service",
    "name": "Cloudflare Email Service",
    "description": "Send and receive transactional emails with Cloudflare Email Service (Email Sending + Email Routing). Use when building email sending (Workers binding or REST API), email routing, Agents SDK email hand",
    "path": "/Users/rig128gb/.hermes/skills/cloudflare-email-service/SKILL.md"
  },
  {
    "id": "cloudflare-one",
    "name": "Cloudflare One",
    "description": "Guides Cloudflare One Zero Trust and SASE work across Access, Gateway, WARP, Tunnel, Cloudflare WAN, DLP, CASB, device posture, and identity. Use when designing, configuring, troubleshooting, or revie",
    "path": "/Users/rig128gb/.hermes/skills/cloudflare-one/SKILL.md"
  },
  {
    "id": "cloudflare-one-migrations",
    "name": "Cloudflare One Migrations",
    "description": "Plans migrations from Zscaler ZIA/ZPA, Palo Alto, legacy VPN, SWG, or SASE stacks to Cloudflare One. Use for migration assessments, policy mapping, rollout plans, and parity/gap analysis.",
    "path": "/Users/rig128gb/.hermes/skills/cloudflare-one-migrations/SKILL.md"
  },
  {
    "id": "code-optimizer",
    "name": "Code Optimizer",
    "description": ">",
    "path": "/Users/rig128gb/.hermes/skills/code-optimizer/SKILL.md"
  },
  {
    "id": "code-review",
    "name": "Code Review",
    "description": "Run a comprehensive code review",
    "path": "/Users/rig128gb/.hermes/skills/code-review/SKILL.md"
  },
  {
    "id": "code-tour",
    "name": "Code Tour",
    "description": "Create CodeTour `.tour` files \u2014 persona-targeted, step-by-step walkthroughs with real file and line anchors. Use for onboarding tours, architecture walkthroughs, PR tours, RCA tours, and structured \"e",
    "path": "/Users/rig128gb/.hermes/skills/code-tour/SKILL.md"
  },
  {
    "id": "codex",
    "name": "Codex",
    "description": "Wrapper alias for the Hermes GStack codex skill. Canonical instructions live at /Users/rig128gb/.hermes/skills/gstack/codex/SKILL.md.",
    "path": "/Users/rig128gb/.hermes/skills/codex/SKILL.md"
  },
  {
    "id": "codex-autoresearch",
    "name": "Codex Autoresearch",
    "description": "Autonomous long-running iteration for Codex CLI. Use when the user wants Codex to plan or run an unattended improve-verify loop toward a measurable or verifiable outcome, especially for overnight runs",
    "path": "/Users/rig128gb/.hermes/skills/codex-autoresearch/SKILL.md"
  },
  {
    "id": "comfyui",
    "name": "Comfyui",
    "description": "Generate images, video, and audio with ComfyUI \u2014 install, launch, manage nodes/models, run workflows with parameter injection. Uses the official comfy-cli for lifecycle and direct REST/WebSocket API f",
    "path": "/Users/rig128gb/.hermes/skills/comfyui/SKILL.md"
  },
  {
    "id": "company-builder",
    "name": "Company Builder",
    "description": "Use when the user is building a new company, startup concept, wedge, or operating plan and needs a structured artifact rather than loose brainstorming.",
    "path": "/Users/rig128gb/.hermes/skills/company-builder/SKILL.md"
  },
  {
    "id": "composio-cli",
    "name": "Composio Cli",
    "description": "Help users operate the published Composio CLI to find the right tool, connect accounts, inspect schemas, execute tools, subscribe to trigger events with `composio listen`, script workflows with `compo",
    "path": "/Users/rig128gb/.hermes/skills/composio-cli/SKILL.md"
  },
  {
    "id": "computer-use",
    "name": "Computer Use",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/computer-use/SKILL.md"
  },
  {
    "id": "conductor__context-driven-development",
    "name": "Conductor__Context Driven Development",
    "description": ">-",
    "path": "/Users/rig128gb/.hermes/skills/conductor__context-driven-development/SKILL.md"
  },
  {
    "id": "conductor__track-management",
    "name": "Conductor__Track Management",
    "description": "Use this skill when creating, managing, or working with Conductor tracks - the logical work units for features, bugs, and refactors. Applies to spec.md, plan.md, and track lifecycle operations.",
    "path": "/Users/rig128gb/.hermes/skills/conductor__track-management/SKILL.md"
  },
  {
    "id": "conductor__workflow-patterns",
    "name": "Conductor__Workflow Patterns",
    "description": "Use this skill when implementing tasks according to Conductor's TDD workflow, handling phase checkpoints, managing git commits for tasks, or understanding the verification protocol.",
    "path": "/Users/rig128gb/.hermes/skills/conductor__workflow-patterns/SKILL.md"
  },
  {
    "id": "configure-ecc",
    "name": "Configure Ecc",
    "description": "Interactive installer for Everything Claude Code \u2014 guides users through selecting and installing skills and rules to user-level or project-level directories, verifies paths, and optionally optimizes i",
    "path": "/Users/rig128gb/.hermes/skills/configure-ecc/SKILL.md"
  },
  {
    "id": "configure-notifications",
    "name": "Configure Notifications",
    "description": "Configure OMX notifications - unified entry point for all platforms",
    "path": "/Users/rig128gb/.hermes/skills/configure-notifications/SKILL.md"
  },
  {
    "id": "connect-chrome",
    "name": "Connect Chrome",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/connect-chrome/SKILL.md"
  },
  {
    "id": "content-matrix",
    "name": "Content Matrix",
    "description": ">",
    "path": "/Users/rig128gb/.hermes/skills/content-matrix/SKILL.md"
  },
  {
    "id": "context-guardian",
    "name": "Context Guardian",
    "description": "Use Startup Intelligence OS context rollover policy, handoff schema, and process registry to keep sessions below the 65% context threshold.",
    "path": "/Users/rig128gb/.hermes/skills/context-guardian/SKILL.md"
  },
  {
    "id": "context-restore",
    "name": "Context Restore",
    "description": "Wrapper alias for the Hermes GStack context-restore skill. Canonical instructions live at /Users/rig128gb/.hermes/skills/gstack/context-restore/SKILL.md.",
    "path": "/Users/rig128gb/.hermes/skills/context-restore/SKILL.md"
  },
  {
    "id": "context-save",
    "name": "Context Save",
    "description": "Wrapper alias for the Hermes GStack context-save skill. Canonical instructions live at /Users/rig128gb/.hermes/skills/gstack/context-save/SKILL.md.",
    "path": "/Users/rig128gb/.hermes/skills/context-save/SKILL.md"
  },
  {
    "id": "continuous-learning",
    "name": "Continuous Learning",
    "description": "[DEPRECATED - use continuous-learning-v2] Legacy v1 stop-hook skill extractor. v2 is a strict superset with instinct-based, project-scoped, hook-reliable learning. Do not invoke v1; route continuous l",
    "path": "/Users/rig128gb/.hermes/skills/continuous-learning/SKILL.md"
  },
  {
    "id": "continuous-learning-v2",
    "name": "Continuous Learning V2",
    "description": "Instinct-based learning system that observes sessions via hooks, creates atomic instincts with confidence scoring, and evolves them into skills/commands/agents. v2.1 adds project-scoped instincts to p",
    "path": "/Users/rig128gb/.hermes/skills/continuous-learning-v2/SKILL.md"
  },
  {
    "id": "core-web-vitals",
    "name": "Core Web Vitals",
    "description": "Optimize Core Web Vitals (LCP, INP, CLS) for better page experience and search ranking. Use when asked to \"improve Core Web Vitals\", \"fix LCP\", \"reduce CLS\", \"optimize INP\", \"page experience optimizat",
    "path": "/Users/rig128gb/.hermes/skills/core-web-vitals/SKILL.md"
  },
  {
    "id": "create-gsd-extension",
    "name": "Create Gsd Extension",
    "description": "Create, debug, and iterate on GSD extensions (TypeScript modules that add tools, commands, event hooks, custom UI, and providers to GSD). Use when asked to build an extension, add a tool the LLM can c",
    "path": "/Users/rig128gb/.hermes/skills/create-gsd-extension/SKILL.md"
  },
  {
    "id": "create-mcp-server",
    "name": "Create Mcp Server",
    "description": "Build, iterate, and evaluate Model Context Protocol (MCP) servers that expose external services as tools an LLM can call. Use when asked to \"build an MCP server\", \"create an MCP tool\", \"wrap this API ",
    "path": "/Users/rig128gb/.hermes/skills/create-mcp-server/SKILL.md"
  },
  {
    "id": "create-skill",
    "name": "Create Skill",
    "description": "Expert guidance for creating, writing, building, and refining GSD skills. Use when working with SKILL.md files, authoring new skills, improving existing skills, or understanding skill structure and be",
    "path": "/Users/rig128gb/.hermes/skills/create-skill/SKILL.md"
  },
  {
    "id": "create-workflow",
    "name": "Create Workflow",
    "description": "Conversational guide for creating valid YAML workflow definitions. Use when asked to \"create a workflow\", \"new workflow definition\", \"build a workflow\", \"workflow YAML\", \"define workflow steps\", or \"w",
    "path": "/Users/rig128gb/.hermes/skills/create-workflow/SKILL.md"
  },
  {
    "id": "cso",
    "name": "Cso",
    "description": "|",
    "path": "/Users/rig128gb/.hermes/skills/cso/SKILL.md"
  },
  {
    "id": "cua-driver",
    "name": "Cua Driver",
    "description": "Drive a native GUI app (macOS, Windows, Linux) via the cua-driver CLI (default) or MCP server \u2014 snapshot its accessibility tree, click/type/scroll by element_index or pixel coords, verify via re-snaps",
    "path": "/Users/rig128gb/.hermes/skills/cua-driver/SKILL.md"
  },
  {
    "id": "daily-brief",
    "name": "Daily Brief",
    "description": "Build Mike's readable daily brief with goals, accomplishments, intel, and next actions.",
    "path": "/Users/rig128gb/.hermes/skills/daily-brief/SKILL.md"
  },
  {
    "id": "dashboard-template",
    "name": "Dashboard Template",
    "description": "\u56fa\u5b9a\u4fa7\u680f + \u9876\u680f + KPI \u7f51\u683c + 1-2 \u5f20\u56fe",
    "path": "/Users/rig128gb/.hermes/skills/dashboard-template/SKILL.md"
  },
  {
    "id": "data-engineering__airflow-dag-patterns",
    "name": "Data Engineering__Airflow Dag Patterns",
    "description": "Build production Apache Airflow DAGs with best practices for operators, sensors, testing, and deployment. Use when creating data pipelines, orchestrating workflows, or scheduling batch jobs.",
    "path": "/Users/rig128gb/.hermes/skills/data-engineering__airflow-dag-patterns/SKILL.md"
  },
  {
    "id": "data-engineering__data-quality-frameworks",
    "name": "Data Engineering__Data Quality Frameworks",
    "description": "Implement data quality validation with Great Expectations, dbt tests, and data contracts. Use when building data quality pipelines, implementing validation rules, or establishing data contracts.",
    "path": "/Users/rig128gb/.hermes/skills/data-engineering__data-quality-frameworks/SKILL.md"
  },
  {
    "id": "data-engineering__dbt-transformation-patterns",
    "name": "Data Engineering__Dbt Transformation Patterns",
    "description": "Master dbt (data build tool) for analytics engineering with model organization, testing, documentation, and incremental strategies. Use when building data transformations, creating data models, or imp",
    "path": "/Users/rig128gb/.hermes/skills/data-engineering__dbt-transformation-patterns/SKILL.md"
  },
  {
    "id": "data-engineering__spark-optimization",
    "name": "Data Engineering__Spark Optimization",
    "description": "Optimize Apache Spark jobs with partitioning, caching, shuffle optimization, and memory tuning. Use when improving Spark performance, debugging slow jobs, or scaling data processing pipelines.",
    "path": "/Users/rig128gb/.hermes/skills/data-engineering__spark-optimization/SKILL.md"
  },
  {
    "id": "data-report-template",
    "name": "Data Report Template",
    "description": "\u628a CSV/Excel/JSON \u6570\u636e\u8f6c\u6210\u6f02\u4eae\u7684\u53ef\u89c6\u5316\u62a5\u544a\u9875",
    "path": "/Users/rig128gb/.hermes/skills/data-report-template/SKILL.md"
  },
  {
    "id": "database-design__postgresql",
    "name": "Database Design__Postgresql",
    "description": "Use this skill when designing or reviewing a PostgreSQL-specific schema. Covers best-practices, data types, indexing, constraints, performance patterns, and advanced features",
    "path": "/Users/rig128gb/.hermes/skills/database-design__postgresql/SKILL.md"
  },
  {
    "id": "database-migrations",
    "name": "Database Migrations",
    "description": "Database migration best practices for schema changes, data migrations, rollbacks, and zero-downtime deployments across PostgreSQL, MySQL, and common ORMs (Prisma, Drizzle, Kysely, Django, TypeORM, gol",
    "path": "/Users/rig128gb/.hermes/skills/database-migrations/SKILL.md"
  },
  {
    "id": "debug-like-expert",
    "name": "Debug Like Expert",
    "description": "Deep analysis debugging mode for complex issues. Activates methodical investigation protocol with evidence gathering, hypothesis testing, and rigorous verification. Use when standard troubleshooting f",
    "path": "/Users/rig128gb/.hermes/skills/debug-like-expert/SKILL.md"
  },
  {
    "id": "decision-room",
    "name": "Decision Room",
    "description": "Use when the task requires framing a business or product decision, generating alternatives, comparing options, or producing a recommendation with assumptions and reversal criteria.",
    "path": "/Users/rig128gb/.hermes/skills/decision-room/SKILL.md"
  },
  {
    "id": "deck-pitch-template",
    "name": "Deck Pitch Template",
    "description": "10 \u9875\u878d\u8d44 deck, \u767d\u5e95 + \u84dd\u7d2b\u6e10\u53d8 hero, traction \u67f1\u72b6, $X.XM ask",
    "path": "/Users/rig128gb/.hermes/skills/deck-pitch-template/SKILL.md"
  }
];

export const RIG_SKILL_COUNT = 896;

export function getSkillStats() {
  return { total: 896 };
}
