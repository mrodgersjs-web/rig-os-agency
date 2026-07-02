// ── RIG OS Agency — Goal Harness Registry (50 /goal loops) ──────────

export interface GoalLoop {
  id: number;
  name: string;
  group: string;
  anchor: string;
  gate: string;
  emits: string;
}

export const GOAL_LOOPS: GoalLoop[] = [
  {
    "id": 1,
    "name": "reason-hard",
    "group": "Reasoning",
    "anchor": "48gb",
    "gate": "RIG-L",
    "emits": "ProofPacket"
  },
  {
    "id": 2,
    "name": "tot-search",
    "group": "Reasoning",
    "anchor": "48gb",
    "gate": "E_tot\u2264\u03b8",
    "emits": "ReasoningTreePacket"
  },
  {
    "id": 3,
    "name": "got-synthesize",
    "group": "Reasoning",
    "anchor": "96gb",
    "gate": "E_total min",
    "emits": "ReasoningGraphPacket"
  },
  {
    "id": 4,
    "name": "gear-train",
    "group": "Reasoning",
    "anchor": "blackwell",
    "gate": "Brier",
    "emits": "RouterAdapter"
  },
  {
    "id": 5,
    "name": "reason-evolve",
    "group": "Reasoning",
    "anchor": "48gb",
    "gate": "A1-crystallize",
    "emits": "LearningPacket"
  },
  {
    "id": 6,
    "name": "consensus-vote",
    "group": "Reasoning",
    "anchor": "blackwell",
    "gate": "consensus\u22650.65",
    "emits": "DecisionPacket"
  },
  {
    "id": 7,
    "name": "score-artifact",
    "group": "Deviation",
    "anchor": "256gb",
    "gate": "Physics\u2192Cog\u2192Nature",
    "emits": "DeviationReport"
  },
  {
    "id": 8,
    "name": "repair-rescore",
    "group": "Deviation",
    "anchor": "96gb",
    "gate": "\u22653\u03c3 lift",
    "emits": "RepairPacket"
  },
  {
    "id": 9,
    "name": "physics-audit",
    "group": "Deviation",
    "anchor": "256gb",
    "gate": "\u00b130\u03c3",
    "emits": "StateGateVerdict"
  },
  {
    "id": 10,
    "name": "baseline-recalibrate",
    "group": "Deviation",
    "anchor": "256gb",
    "gate": "drift<5%",
    "emits": "BaselineUpdate"
  },
  {
    "id": 11,
    "name": "gate-promote",
    "group": "Deviation",
    "anchor": "48gb",
    "gate": "3+ repeats",
    "emits": "SkillCard"
  },
  {
    "id": 12,
    "name": "engine-verify",
    "group": "Deviation",
    "anchor": "256gb",
    "gate": "RIG-L\u00b10.1",
    "emits": "FINAL_REPORT"
  },
  {
    "id": 13,
    "name": "lead-score",
    "group": "GTM",
    "anchor": "36gb",
    "gate": "AntiGeneric\u226580",
    "emits": "LeadPacket"
  },
  {
    "id": 14,
    "name": "operator-dossier",
    "group": "GTM",
    "anchor": "96gb",
    "gate": "12-gate",
    "emits": "DossierPacket"
  },
  {
    "id": 15,
    "name": "cold-email",
    "group": "GTM",
    "anchor": "48gb",
    "gate": "PredictedEmailSuccess\u22650.82",
    "emits": "EmailPacket"
  },
  {
    "id": 16,
    "name": "followup-cascade",
    "group": "GTM",
    "anchor": "48gb",
    "gate": "reply-gate",
    "emits": "CadencePacket"
  },
  {
    "id": 17,
    "name": "proposal-factory",
    "group": "GTM",
    "anchor": "96gb",
    "gate": "score\u22658/10",
    "emits": "ProposalPacket"
  },
  {
    "id": 18,
    "name": "competitor-audit",
    "group": "GTM",
    "anchor": "96gb",
    "gate": "\u221230\u2192+30\u03c3",
    "emits": "AuditPacket"
  },
  {
    "id": 19,
    "name": "gtm-forecast",
    "group": "GTM",
    "anchor": "256gb",
    "gate": "calibration",
    "emits": "ForecastPacket"
  },
  {
    "id": 20,
    "name": "gtm-distill",
    "group": "GTM",
    "anchor": "blackwell",
    "gate": "schema",
    "emits": "TrainingSet"
  },
  {
    "id": 21,
    "name": "strategy-7powers",
    "group": "Strategy",
    "anchor": "96gb",
    "gate": "premortem",
    "emits": "StrategyPacket"
  },
  {
    "id": 22,
    "name": "orthodoxy-map",
    "group": "Strategy",
    "anchor": "96gb",
    "gate": "\u226520 named",
    "emits": "OrthodoxyPacket"
  },
  {
    "id": 23,
    "name": "scenario-tree",
    "group": "Strategy",
    "anchor": "256gb",
    "gate": "regret-min",
    "emits": "ScenarioPacket"
  },
  {
    "id": 24,
    "name": "mechanism-map",
    "group": "Strategy",
    "anchor": "48gb",
    "gate": "mechanism-gate",
    "emits": "MechanismPacket"
  },
  {
    "id": 25,
    "name": "decision-memo",
    "group": "Strategy",
    "anchor": "48gb",
    "gate": "RIG-L\u22655",
    "emits": "DecisionMemo"
  },
  {
    "id": 26,
    "name": "strategy-evolve",
    "group": "Strategy",
    "anchor": "256gb",
    "gate": "Brier",
    "emits": "LearningPacket"
  },
  {
    "id": 27,
    "name": "ops-cadence",
    "group": "Operations",
    "anchor": "36gb",
    "gate": "Simplicity Gate",
    "emits": "OpsPacket"
  },
  {
    "id": 28,
    "name": "exception-route",
    "group": "Operations",
    "anchor": "48gb",
    "gate": "exception-gate",
    "emits": "ExceptionPacket"
  },
  {
    "id": 29,
    "name": "bottleneck-find",
    "group": "Operations",
    "anchor": "96gb",
    "gate": "constraint",
    "emits": "ConstraintPacket"
  },
  {
    "id": 30,
    "name": "sop-compile",
    "group": "Operations",
    "anchor": "48gb",
    "gate": "3+ repeats",
    "emits": "SOPCard"
  },
  {
    "id": 31,
    "name": "incident-triage",
    "group": "Operations",
    "anchor": "48gb",
    "gate": "classify",
    "emits": "IncidentPacket"
  },
  {
    "id": 32,
    "name": "ops-healthcheck",
    "group": "Operations",
    "anchor": "256gb",
    "gate": "green/halt",
    "emits": "HealthReport"
  },
  {
    "id": 33,
    "name": "unit-economics",
    "group": "Finance",
    "anchor": "96gb",
    "gate": "cost-ceiling",
    "emits": "FinancePacket"
  },
  {
    "id": 34,
    "name": "three-statement",
    "group": "Finance",
    "anchor": "96gb",
    "gate": "schema-integrity",
    "emits": "ModelPacket"
  },
  {
    "id": 35,
    "name": "valuation",
    "group": "Finance",
    "anchor": "256gb",
    "gate": "source-per-claim",
    "emits": "ValuationPacket"
  },
  {
    "id": 36,
    "name": "finops-meter",
    "group": "Finance",
    "anchor": "48gb",
    "gate": "Cost Ceiling Enforcer",
    "emits": "CostLedger"
  },
  {
    "id": 37,
    "name": "risk-sim",
    "group": "Finance",
    "anchor": "blackwell",
    "gate": "tail-risk",
    "emits": "RiskPacket"
  },
  {
    "id": 38,
    "name": "finance-forecast",
    "group": "Finance",
    "anchor": "256gb",
    "gate": "calibration",
    "emits": "ForecastPacket"
  },
  {
    "id": 39,
    "name": "spec-synthesize",
    "group": "Product",
    "anchor": "96gb",
    "gate": "forced-guess=0",
    "emits": "SpecPacket"
  },
  {
    "id": 40,
    "name": "plan-chunk",
    "group": "Product",
    "anchor": "48gb",
    "gate": "no-big-bang",
    "emits": "PlanPacket"
  },
  {
    "id": 41,
    "name": "build-evolve",
    "group": "Product",
    "anchor": "96gb",
    "gate": "no-self-verify",
    "emits": "CandidatePacket"
  },
  {
    "id": 42,
    "name": "digital-twin-test",
    "group": "Product",
    "anchor": "96gb",
    "gate": "sim-pass",
    "emits": "TwinReport"
  },
  {
    "id": 43,
    "name": "build-vs-buy",
    "group": "Product",
    "anchor": "48gb",
    "gate": "EV",
    "emits": "DecisionPacket"
  },
  {
    "id": 44,
    "name": "retrofit-studio",
    "group": "Product",
    "anchor": "48gb",
    "gate": "12-phase",
    "emits": "RetrofitProof"
  },
  {
    "id": 45,
    "name": "design-studio",
    "group": "Studios",
    "anchor": "96gb",
    "gate": "+5\u03c3 signature",
    "emits": "SitePacket"
  },
  {
    "id": 46,
    "name": "linkedin-studio",
    "group": "Studios",
    "anchor": "48gb",
    "gate": "\u00b130\u03c3",
    "emits": "PostPacket"
  },
  {
    "id": 47,
    "name": "research-studio",
    "group": "Studios",
    "anchor": "96gb",
    "gate": "source-per-claim",
    "emits": "ResearchPacket"
  },
  {
    "id": 48,
    "name": "website-goal",
    "group": "Studios",
    "anchor": "96gb",
    "gate": "12-gate",
    "emits": "SitePacket"
  },
  {
    "id": 49,
    "name": "mission-control",
    "group": "Studios",
    "anchor": "256gb",
    "gate": "7-day-clean",
    "emits": "StatusReport"
  },
  {
    "id": 50,
    "name": "rig-fullbuild",
    "group": "Studios",
    "anchor": "48gb",
    "gate": "lattice-pass",
    "emits": "FINAL_REPORT"
  }
];

export function getGoalStats() {
  return { total: 50, groups: {'Reasoning': 6, 'Deviation': 6, 'GTM': 8, 'Strategy': 6, 'Operations': 6, 'Finance': 6, 'Product': 6, 'Studios': 6} };
}
