// ── RIG OS Agency — Harness Registry ───────────────────────────────
// 50 goal loops, agent harness resolver, session-type matching.

export type HarnessType =
  | "reasoning" | "deviation" | "gtm" | "strategy" | "operations"
  | "finance" | "product" | "studios";

export interface GoalLoop {
  number: number;
  name: string;
  group: HarnessType;
  anchor: string;
  gate: string;
  emits: string;
  launchCommand: string;
}

export interface SessionHarness {
  sessionType: string;
  harnessFile: string;
  keyGates: string[];
  description: string;
}

// ── Session Harnesses ──────────────────────────────────────────────
export const SESSION_HARNESSES: SessionHarness[] = [
  { sessionType: "hermes-conductor", harnessFile: "~/.hermes/jake/goal-harnesses/hermes-conductor.md", keyGates: ["Identity lock", "BMS", "IQRSQPI", "ProofPacket", "Gate-D"], description: "Routing, strategy, approvals" },
  { sessionType: "jake-execution", harnessFile: "~/.jake/goal-harnesses/jake-execution.md", keyGates: ["Harness H=(E,T,C,S,L,V)", "tool diversity", "deviate engines"], description: "Building, coding, missions" },
  { sessionType: "verification", harnessFile: "~/.jake/goal-harnesses/verification.md", keyGates: ["10 verification gates"], description: "Tests, gates, GO/NO-GO" },
  { sessionType: "studio", harnessFile: "~/.jake/goal-harnesses/studio.md", keyGates: ["Studio method", "expert dispatch", "anti-generic"], description: "LinkedIn, GTM, App, Design" },
  { sessionType: "thought-partner", harnessFile: "~/.jake/goal-harnesses/thought-partner.md", keyGates: ["CEO Work Grid", "time constraints", "one owner", "MathExec", "Anti-Median repair"], description: "Decisions, CEO work, tilt, identity, delegation" },
];

// ── 50 Goal Loops ──────────────────────────────────────────────────
export const GOAL_LOOPS: GoalLoop[] = [
  { number: 1, name: "reason-hard", group: "reasoning", anchor: "48gb", gate: "RIG-L", emits: "ProofPacket", launchCommand: "hermes /goal --spec reason-hard.yaml --anchor 48gb --watch" },
  { number: 2, name: "tot-search", group: "reasoning", anchor: "48gb", gate: "E_tot<=theta", emits: "ReasoningTreePacket", launchCommand: "hermes /goal --spec tot-search.yaml --anchor 48gb --watch" },
  { number: 3, name: "got-synthesize", group: "reasoning", anchor: "96gb", gate: "E_total min", emits: "ReasoningGraphPacket", launchCommand: "hermes /goal --spec got-synthesize.yaml --anchor 96gb --watch" },
  { number: 4, name: "gear-train", group: "reasoning", anchor: "blackwell", gate: "Brier", emits: "RouterAdapter", launchCommand: "hermes /goal --spec gear-train.yaml --anchor blackwell --watch" },
  { number: 5, name: "reason-evolve", group: "reasoning", anchor: "48gb", gate: "A1-crystallize", emits: "LearningPacket", launchCommand: "hermes /goal --spec reason-evolve.yaml --anchor 48gb --watch" },
  { number: 6, name: "consensus-vote", group: "reasoning", anchor: "blackwell", gate: "consensus>=0.65", emits: "DecisionPacket", launchCommand: "hermes /goal --spec consensus-vote.yaml --anchor blackwell --watch" },
  { number: 7, name: "score-artifact", group: "deviation", anchor: "256gb", gate: "Physics->Cog->Nature", emits: "DeviationReport", launchCommand: "hermes /goal --spec score-artifact.yaml --anchor 256gb --watch" },
  { number: 8, name: "repair-rescore", group: "deviation", anchor: "96gb", gate: ">=3sigma lift", emits: "RepairPacket", launchCommand: "hermes /goal --spec repair-rescore.yaml --anchor 96gb --watch" },
  { number: 9, name: "physics-audit", group: "deviation", anchor: "256gb", gate: "+/-30sigma", emits: "StateGateVerdict", launchCommand: "hermes /goal --spec physics-audit.yaml --anchor 256gb --watch" },
  { number: 10, name: "baseline-recalibrate", group: "deviation", anchor: "256gb", gate: "drift<5%", emits: "BaselineUpdate", launchCommand: "hermes /goal --spec baseline-recalibrate.yaml --anchor 256gb --watch" },
  { number: 11, name: "gate-promote", group: "deviation", anchor: "48gb", gate: "3+ repeats", emits: "SkillCard", launchCommand: "hermes /goal --spec gate-promote.yaml --anchor 48gb --watch" },
  { number: 12, name: "engine-verify", group: "deviation", anchor: "256gb", gate: "RIG-L+/-0.1", emits: "FINAL_REPORT", launchCommand: "hermes /goal --spec engine-verify.yaml --anchor 256gb --watch" },
  { number: 13, name: "lead-score", group: "gtm", anchor: "36gb", gate: "AntiGeneric>=80", emits: "LeadPacket", launchCommand: "hermes /goal --spec lead-score.yaml --anchor 36gb --watch" },
  { number: 14, name: "operator-dossier", group: "gtm", anchor: "96gb", gate: "12-gate", emits: "DossierPacket", launchCommand: "hermes /goal --spec operator-dossier.yaml --anchor 96gb --watch" },
  { number: 15, name: "cold-email", group: "gtm", anchor: "48gb", gate: "PredictedEmailSuccess>=0.82", emits: "EmailPacket", launchCommand: "hermes /goal --spec cold-email.yaml --anchor 48gb --watch" },
  { number: 16, name: "followup-cascade", group: "gtm", anchor: "48gb", gate: "reply-gate", emits: "CadencePacket", launchCommand: "hermes /goal --spec followup-cascade.yaml --anchor 48gb --watch" },
  { number: 17, name: "proposal-factory", group: "gtm", anchor: "96gb", gate: "score>=8/10", emits: "ProposalPacket", launchCommand: "hermes /goal --spec proposal-factory.yaml --anchor 96gb --watch" },
  { number: 18, name: "competitor-audit", group: "gtm", anchor: "96gb", gate: "-30 to +30 sigma", emits: "AuditPacket", launchCommand: "hermes /goal --spec competitor-audit.yaml --anchor 96gb --watch" },
  { number: 19, name: "gtm-forecast", group: "gtm", anchor: "256gb", gate: "calibration", emits: "ForecastPacket", launchCommand: "hermes /goal --spec gtm-forecast.yaml --anchor 256gb --watch" },
  { number: 20, name: "gtm-distill", group: "gtm", anchor: "blackwell", gate: "schema", emits: "TrainingSet", launchCommand: "hermes /goal --spec gtm-distill.yaml --anchor blackwell --watch" },
  { number: 21, name: "strategy-7powers", group: "strategy", anchor: "96gb", gate: "premortem", emits: "StrategyPacket", launchCommand: "hermes /goal --spec strategy-7powers.yaml --anchor 96gb --watch" },
  { number: 22, name: "orthodoxy-map", group: "strategy", anchor: "96gb", gate: ">=20 named", emits: "OrthodoxyPacket", launchCommand: "hermes /goal --spec orthodoxy-map.yaml --anchor 96gb --watch" },
  { number: 23, name: "scenario-tree", group: "strategy", anchor: "256gb", gate: "regret-min", emits: "ScenarioPacket", launchCommand: "hermes /goal --spec scenario-tree.yaml --anchor 256gb --watch" },
  { number: 24, name: "mechanism-map", group: "strategy", anchor: "48gb", gate: "mechanism-gate", emits: "MechanismPacket", launchCommand: "hermes /goal --spec mechanism-map.yaml --anchor 48gb --watch" },
  { number: 25, name: "decision-memo", group: "strategy", anchor: "48gb", gate: "RIG-L>=5", emits: "DecisionMemo", launchCommand: "hermes /goal --spec decision-memo.yaml --anchor 48gb --watch" },
  { number: 26, name: "strategy-evolve", group: "strategy", anchor: "256gb", gate: "Brier", emits: "LearningPacket", launchCommand: "hermes /goal --spec strategy-evolve.yaml --anchor 256gb --watch" },
  { number: 27, name: "ops-cadence", group: "operations", anchor: "36gb", gate: "Simplicity Gate", emits: "OpsPacket", launchCommand: "hermes /goal --spec ops-cadence.yaml --anchor 36gb --watch" },
  { number: 28, name: "exception-route", group: "operations", anchor: "48gb", gate: "exception-gate", emits: "ExceptionPacket", launchCommand: "hermes /goal --spec exception-route.yaml --anchor 48gb --watch" },
  { number: 29, name: "bottleneck-find", group: "operations", anchor: "96gb", gate: "constraint", emits: "ConstraintPacket", launchCommand: "hermes /goal --spec bottleneck-find.yaml --anchor 96gb --watch" },
  { number: 30, name: "sop-compile", group: "operations", anchor: "48gb", gate: "3+ repeats", emits: "SOPCard", launchCommand: "hermes /goal --spec sop-compile.yaml --anchor 48gb --watch" },
  { number: 31, name: "incident-triage", group: "operations", anchor: "48gb", gate: "classify", emits: "IncidentPacket", launchCommand: "hermes /goal --spec incident-triage.yaml --anchor 48gb --watch" },
  { number: 32, name: "ops-healthcheck", group: "operations", anchor: "256gb", gate: "green/halt", emits: "HealthReport", launchCommand: "hermes /goal --spec ops-healthcheck.yaml --anchor 256gb --watch" },
  { number: 33, name: "unit-economics", group: "finance", anchor: "96gb", gate: "cost-ceiling", emits: "FinancePacket", launchCommand: "hermes /goal --spec unit-economics.yaml --anchor 96gb --watch" },
  { number: 34, name: "three-statement", group: "finance", anchor: "96gb", gate: "schema-integrity", emits: "ModelPacket", launchCommand: "hermes /goal --spec three-statement.yaml --anchor 96gb --watch" },
  { number: 35, name: "valuation", group: "finance", anchor: "256gb", gate: "source-per-claim", emits: "ValuationPacket", launchCommand: "hermes /goal --spec valuation.yaml --anchor 256gb --watch" },
  { number: 36, name: "finops-meter", group: "finance", anchor: "48gb", gate: "Cost Ceiling Enforcer", emits: "CostLedger", launchCommand: "hermes /goal --spec finops-meter.yaml --anchor 48gb --watch" },
  { number: 37, name: "risk-sim", group: "finance", anchor: "blackwell", gate: "tail-risk", emits: "RiskPacket", launchCommand: "hermes /goal --spec risk-sim.yaml --anchor blackwell --watch" },
  { number: 38, name: "finance-forecast", group: "finance", anchor: "256gb", gate: "calibration", emits: "ForecastPacket", launchCommand: "hermes /goal --spec finance-forecast.yaml --anchor 256gb --watch" },
  { number: 39, name: "spec-synthesize", group: "product", anchor: "96gb", gate: "forced-guess=0", emits: "SpecPacket", launchCommand: "hermes /goal --spec spec-synthesize.yaml --anchor 96gb --watch" },
  { number: 40, name: "plan-chunk", group: "product", anchor: "48gb", gate: "no-big-bang", emits: "PlanPacket", launchCommand: "hermes /goal --spec plan-chunk.yaml --anchor 48gb --watch" },
  { number: 41, name: "build-evolve", group: "product", anchor: "96gb", gate: "no-self-verify", emits: "CandidatePacket", launchCommand: "hermes /goal --spec build-evolve.yaml --anchor 96gb --watch" },
  { number: 42, name: "digital-twin-test", group: "product", anchor: "96gb", gate: "sim-pass", emits: "TwinReport", launchCommand: "hermes /goal --spec digital-twin-test.yaml --anchor 96gb --watch" },
  { number: 43, name: "build-vs-buy", group: "product", anchor: "48gb", gate: "EV", emits: "DecisionPacket", launchCommand: "hermes /goal --spec build-vs-buy.yaml --anchor 48gb --watch" },
  { number: 44, name: "retrofit-studio", group: "product", anchor: "48gb", gate: "12-phase", emits: "RetrofitProof", launchCommand: "hermes /goal --spec retrofit-studio.yaml --anchor 48gb --watch" },
  { number: 45, name: "design-studio", group: "studios", anchor: "96gb", gate: "+5sigma signature", emits: "SitePacket", launchCommand: "hermes /goal --spec design-studio.yaml --anchor 96gb --watch" },
  { number: 46, name: "linkedin-studio", group: "studios", anchor: "48gb", gate: "+/-30sigma", emits: "PostPacket", launchCommand: "hermes /goal --spec linkedin-studio.yaml --anchor 48gb --watch" },
  { number: 47, name: "research-studio", group: "studios", anchor: "96gb", gate: "source-per-claim", emits: "ResearchPacket", launchCommand: "hermes /goal --spec research-studio.yaml --anchor 96gb --watch" },
  { number: 48, name: "website-goal", group: "studios", anchor: "96gb", gate: "12-gate", emits: "SitePacket", launchCommand: "hermes /goal --spec website-goal.yaml --anchor 96gb --watch" },
  { number: 49, name: "mission-control", group: "studios", anchor: "256gb", gate: "7-day-clean", emits: "StatusReport", launchCommand: "hermes /goal --spec mission-control.yaml --anchor 256gb --watch" },
  { number: 50, name: "rig-fullbuild", group: "studios", anchor: "48gb", gate: "lattice-pass", emits: "FINAL_REPORT", launchCommand: "hermes /goal --spec rig-fullbuild.yaml --anchor 48gb --watch" },
];

// ── Helper Functions ──────────────────────────────────────────────
export function getGoalLoop(name: string): GoalLoop | undefined {
  return GOAL_LOOPS.find((l) => l.name === name || (l as any).id === name);
}

export function getGoalLoops(): GoalLoop[] {
  return GOAL_LOOPS;
}

export function getLoopsByGroup(group: HarnessType): GoalLoop[] {
  return GOAL_LOOPS.filter((l) => l.group === group);
}

export function getSessionHarnesses(): SessionHarness[] {
  return SESSION_HARNESSES;
}

export function selectHarness(sessionType: string): SessionHarness | undefined {
  return SESSION_HARNESSES.find((h) => h.sessionType === sessionType);
}

export function getHarnessStats() {
  const byGroup: Record<string, number> = {};
  GOAL_LOOPS.forEach((l) => {
    byGroup[l.group] = (byGroup[l.group] || 0) + 1;
  });
  return {
    totalLoops: GOAL_LOOPS.length,
    sessionHarnesses: SESSION_HARNESSES.length,
    byGroup,
  };
}