import type { ReactNode } from "react";

/** The raw §12.4 narrative — present in the doc from beat 0 onward. */
export const ORIGINAL_NARRATIVE_LINES: ReactNode[] = [
  <>Hepatic adverse events occurred in 8.2% of Aurora-IV recipients (n=49/598) versus 4.1% on placebo (n=12/293). Most events were Grade 1–2 transient ALT elevations, resolving without intervention within a median of 14 days. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy&apos;s Law cases were observed.</>,
];

export const SUBGROUP_PARAGRAPH = (
  <>A pre-specified subgroup analysis of participants with baseline hepatic impairment (n=42) showed comparable event rates and no qualitative difference in time-to-resolution.</>
);

export const INTRO_PARAGRAPH = (
  <>Aurora-IV is administered orally once daily and is metabolized primarily through hepatic CYP3A4 pathways. The Phase III safety database includes 891 randomized participants across 47 sites, with hepatic monitoring performed every two weeks during the first cycle and monthly thereafter, per the protocol&apos;s risk-management plan.</>
);

/** Three narrative variants offered in the carousel. */
export const NARRATIVE_VARIANTS = {
  v1: {
    label: "v1 of 3",
    framing: "conservative",
    body: (
      <>Most hepatic AEs in the Aurora-IV arm were Grade 1–2 transient ALT elevations, resolving without intervention within a median of 14 days. Although events occurred in 8.2% of recipients (n=49/598) versus 4.1% on placebo (n=12/293), no Hy&apos;s Law cases were observed. The two Grade 3 events met DILI criteria but resolved on discontinuation, supporting continued use under the existing monitoring schedule.</>
    ),
    pros: ["Resolution-led", "Low alarm"],
    cons: ["Buries magnitude", "Soft on DILI"],
  },
  v2: {
    label: "v2 of 3",
    framing: "direct",
    body: (
      <>Aurora-IV recipients showed roughly 2× the placebo rate of hepatic adverse events (8.2% vs 4.1%; n=49/598 vs 12/293), driven primarily by Grade 1–2 ALT elevations consistent with CYP3A4-mediated metabolism. Two Grade 3 cases met DILI criteria; both resolved on discontinuation. No Hy&apos;s Law cases were observed.</>
    ),
    pros: ["Magnitude-led", "Mechanistic"],
    cons: ["Reads adversarial", "No Phase 2 anchor"],
  },
  v3: {
    label: "v3 of 3",
    framing: "comparative",
    body: (
      <>The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across exposure cohorts. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy&apos;s Law cases were observed.</>
    ),
    pros: ["Phase 2 anchor", "Reads as continuity"],
    cons: ["Less mechanistic"],
  },
} as const;

/** Two wording variants for the resolution-time addendum. */
export const WORDING_VARIANTS = {
  fda: {
    label: "v1 of 2",
    region: "FDA wording",
    body: <>Most events resolved without intervention within a median of 14 days.</>,
    quoted: '"…within a median of 14 days."',
  },
  ema: {
    label: "v2 of 2",
    region: "EMA wording",
    body: (
      <>Most events resolved within a median of 21 days, consistent with the 14–28 day pharmacovigilance window.</>
    ),
    quoted:
      '"…within a median of 21 days, consistent with the 14–28 day pharmacovigilance window."',
  },
} as const;

/** Phase 2 baseline excerpt — used as Step 1 source preview body. */
export const PHASE2_BASELINE_EXCERPT = (
  <>Hepatic AEs occurred in 7.6% of pivotal recipients (n=18/237) vs 3.2% on placebo (n=4/124). All Grade 1–2 events resolved without intervention; one Grade 3 case met DILI criteria and resolved on discontinuation. Median time to resolution: 14 days.</>
);

/** Phase 2 cross-check excerpt — used as Step 3 source preview body. */
export const PHASE2_CROSSCHECK_EXCERPT = (
  <>Across both trials, the hepatic AE pattern is consistent: predominantly Grade 1–2 transient ALT elevations with rapid resolution. Phase 2 reported 1 DILI case (n=1/237); Phase 3 reports 2 (n=2/598). No Hy&apos;s Law cases observed in either pivotal cohort.</>
);

/** Protocol §6.3 excerpt — used as Step 4 source preview body. */
export const PROTOCOL_MONITORING_EXCERPT = (
  <>LFTs obtained at screening, biweekly during the first cycle, and monthly thereafter. ALT or AST &gt; 3× ULN repeated within 72 h; sustained elevations trigger discontinuation per the rules below.</>
);

/** Definitions block embedded in the Step 4 PDF preview and the Protocol PDF tab. */
export const PROTOCOL_DEFINITIONS = [
  { term: "DILI", body: "ALT > 3× ULN with concurrent total bilirubin > 2× ULN." },
  { term: "Hy's Law", body: "Hepatocellular injury with jaundice; no alternative cause." },
  { term: "ULN", body: "Upper limit of normal for the laboratory performing the assay." },
] as const;
