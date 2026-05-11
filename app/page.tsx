"use client";

import React, {
  Fragment,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

type Message =
  | { role: "user"; time: string; text: string }
  | {
      role: "assistant";
      time: string;
      text?: string;
      state?: "thinking";
      summary?: string[];
    };

type ClarifyOption = { label: string; selected?: boolean };

type ClarifyCard = {
  current: number;
  total: number;
  question?: string;
  options?: ClarifyOption[];
  shortcut?: string;
  somethingElseText?: string;
  status?: "answered";
  answeredText?: string;
};

type StepFile = {
  badge: string;
  badgeStyle?: "default" | "csv" | "pdf";
  fileName: string;
  section?: string;
};

type CsvRow = {
  values: string[];
  highlight?: boolean;
  outcomeAccent?: boolean;
};

type StepBody =
  | {
      kind: "csv";
      rangeText: string;
      filter: string;
      columns: string[];
      colWeights?: number[];
      rows: CsvRow[];
      moreRowsText: string;
    }
  | {
      kind: "narrative";
      sectionLabel: string;
      sectionTitle: string;
      body: string;
      footerText: string;
      definitions?: { term: string; def: string }[];
    };

type Step = {
  title: string;
  step: string;
  done: boolean;
  highlight?: boolean;
  file: StepFile;
  body?: StepBody;
};

type NarrativeDraft = {
  version: number;
  total: number;
  framing: string;
  body: string;
};

type NarrativeDraftPreview = {
  version: number;
  total: number;
  framing: string;
  preview: string;
  tags?: string[];
};

type Chip = { label: string };

type AcceptedChip = { label: string; revisit?: boolean };

type WalkthroughFocus =
  | "chrome"
  | "copilot-thread"
  | "copilot-clarify"
  | "copilot-reasoning"
  | "copilot-narrative-preview"
  | "editor-narrative"
  | "editor-tertiary"
  | "evidence-csv"
  | "split-view"
  | "tertiary-wording"
  | "trace-graph"
  | "protocol-doc"
  | "map-button";

type Walkthrough = {
  /** Feature name shown as a small kicker above the body text. */
  title: string;
  lead: string;
  active: string;
  focus: WalkthroughFocus;
};

type Frame = {
  id: string;
  // which doc-canvas template to render
  layout?: "default" | "csv-viewer" | "side-by-side" | "protocol" | "trace-map";
  messages: Message[];
  input: string;
  placeholder: string;
  avatar?: "solid" | "outline";
  preparingNarrative?: boolean;
  clarifyCard?: ClarifyCard;
  steps?: Step[];
  // doc canvas state
  tabDirty?: boolean;
  hideGrade3?: boolean;
  narrativeDraft?: NarrativeDraft;
  narrativeBody?: string;
  // appended at the bottom of the doc body (after the subgroup paragraph)
  tertiaryDocDraft?: NarrativeDraft;
  tertiaryDocParagraph?: string;
  // copilot rail
  reasonedChip?: Chip;
  draftingText?: string;
  narrativeIntroText?: string;
  narrativeDraftPreview?: NarrativeDraftPreview;
  acceptedChip?: AcceptedChip;
  followUps?: string[];
  // a secondary chat exchange that happens AFTER the accepted chip
  // (e.g. clicking a follow-up pill triggers a new user → assistant turn)
  secondaryMessages?: Message[];
  secondarySteps?: Step[];
  // a third turn appearing AFTER secondarySteps (assistant text, draft option, etc.)
  tertiaryText?: string;
  tertiaryDraftPreview?: NarrativeDraftPreview;
  tertiaryAcceptedChip?: AcceptedChip;
  tertiaryFollowUps?: string[];
};

const frames: Frame[] = [
  { id: "948-0", messages: [], input: "", placeholder: "Type here…" },
  {
    id: "998-0",
    messages: [],
    input: "Re-draft the §12.4 hepatic AE narrative.",
    placeholder: "Type here…",
  },
  {
    id: "9DM-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
    ],
    input: "",
    placeholder: "Type here…",
  },
  {
    id: "9UA-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Thinking...", state: "thinking" },
    ],
    input: "",
    placeholder: "Type here…",
  },
  {
    id: "9YY-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
  },
  {
    id: "9O5-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 1,
      total: 3,
      question: "Framing for the 2 Grade 3 cases?",
      options: [
        { label: "Lead with resolution." },
        { label: "Lead with magnitude." },
        { label: "Mirror Phase 2 phrasing." },
      ],
      somethingElseText: "Something else…",
    },
  },
  {
    id: "A8L-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 1,
      total: 3,
      question: "Framing for the 2 Grade 3 cases?",
      options: [
        { label: "Lead with resolution." },
        { label: "Lead with magnitude.", selected: true },
        { label: "Mirror Phase 2 phrasing." },
      ],
      somethingElseText: "Something else…",
    },
  },
  {
    id: "AIX-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 2,
      total: 3,
      question: "Subgroup detail?",
      options: [
        { label: "Brief mention only." },
        { label: "Standard subgroup table." },
        { label: "Full table with forest plot" },
      ],
      somethingElseText: "Something else…",
    },
  },
  {
    id: "AU3-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 2,
      total: 3,
      question: "Subgroup detail?",
      options: [
        { label: "Brief mention only." },
        { label: "Standard subgroup table.", selected: true },
        { label: "Full table with forest plot" },
      ],
      somethingElseText: "Something else…",
    },
  },
  {
    id: "BBK-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 3,
      total: 3,
      question: "Reference Phase 2 trial?",
      options: [
        { label: "Inline cross-reference." },
        { label: "Footnote only." },
        { label: "Skip." },
      ],
      somethingElseText: "Something else…",
    },
  },
  {
    id: "BHP-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 3,
      total: 3,
      question: "Reference Phase 2 trial?",
      options: [
        { label: "Inline cross-reference.", selected: true },
        { label: "Footnote only." },
        { label: "Skip." },
      ],
      somethingElseText: "Something else…",
    },
  },
  {
    id: "BWJ-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      { role: "assistant", time: "14:03", text: "Three quick choices before I draft." },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    clarifyCard: {
      current: 3,
      total: 3,
      status: "answered",
      answeredText: "3/3 questions answered…",
    },
  },
  {
    id: "GMV-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
  },
  {
    id: "HBA-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Reading Phase 2 hepatic AE baseline...",
        step: "step 1 of 4",
        done: false,
        highlight: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
        body: {
          kind: "narrative",
          sectionLabel: "§5.2",
          sectionTitle: "Hepatic AE baseline · Phase 2",
          body: "Phase 2 enrolled 237 participants on Aurora-IV with hepatic monitoring at screening, week 4, and end of cycle. Grade 1–2 transient ALT elevations occurred in 7.6% (n=18/237); a single Grade 3 DILI case (n=1/237) resolved on discontinuation. No Hy's Law cases were observed.",
          footerText: "n = 237 · cycle 1",
        },
      },
    ],
  },
  {
    id: "HBZ-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
    ],
  },
  {
    id: "I13-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulling LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: false,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
        body: {
          kind: "csv",
          rangeText: "rows 412–438",
          filter: "ALT > 3× ULN",
          columns: ["ID", "DAY", "ALT", "OUTCOME"],
          colWeights: [1.3, 0.6, 0.7, 1.5],
          rows: [
            { values: ["A4-0412", "14", "112", "G2 · resolved"] },
            { values: ["A4-0418", "21", "147", "G3 · DILI · discont."], highlight: true, outcomeAccent: true },
            { values: ["A4-0427", "28", "216", "G3 · DILI · discont."], highlight: true, outcomeAccent: true },
          ],
          moreRowsText: "+22 more rows",
        },
      },
    ],
  },
  {
    id: "II8-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
  },
  {
    id: "INT-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
      {
        title: "Cross-checking Phase 2 hepatic findings...",
        step: "step 3 of 4",
        done: false,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
        body: {
          kind: "narrative",
          sectionLabel: "§5.2",
          sectionTitle: "Hepatic safety · cross-check",
          body: "Across both trials, the hepatic AE pattern is consistent: predominantly Grade 1–2 transient ALT elevations with rapid resolution. Phase 2 reported 1 DILI case (n=1/237); Phase 3 reports 2 (n=2/598). No Hy's Law cases observed in either pivotal cohort.",
          footerText: "2 trials cross-referenced",
        },
      },
    ],
  },
  {
    id: "ISI-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
    ],
  },
  {
    id: "IWY-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciling FDA / EMA divergence on resolution time...",
        step: "step 4 of 4",
        done: false,
        highlight: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
        body: {
          kind: "narrative",
          sectionLabel: "P. 12",
          sectionTitle: "§6.3 Hepatic safety monitoring",
          body: "LFTs obtained at screening, biweekly during the first cycle, and monthly thereafter. ALT or AST > 3× ULN repeated within 72 h; sustained elevations trigger discontinuation per the rules below.",
          footerText: "p. 12 of 47",
          definitions: [
            { term: "DILI", def: "Drug-induced liver injury — ALT or AST ≥ 5× ULN, or symptomatic hepatic dysfunction." },
            { term: "Hy's Law", def: "ALT or AST ≥ 3× ULN with concurrent total bilirubin ≥ 2× ULN, no alternative cause." },
          ],
        },
      },
    ],
  },
  {
    id: "J29-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciled FDA / EMA divergence on resolution time",
        step: "step 4 of 4",
        done: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
      },
    ],
  },
  {
    id: "J75-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciled FDA / EMA divergence on resolution time",
        step: "step 4 of 4",
        done: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
      },
    ],
    draftingText: "Drafting 3 options...",
  },
  {
    id: "JON-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    preparingNarrative: true,
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    draftingText: "Drafting 3 options...",
  },
  {
    id: "JBZ-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeDraft: {
      version: 1,
      total: 3,
      framing: "conservative",
      body: "Most hepatic AEs in the Aurora-IV arm were Grade 1–2 transient ALT elevations, resolving without intervention within a median of 14 days. Although events occurred in 8.2% of recipients (n=49/598) versus 4.1% on placebo (n=12/293), no Hy's Law cases were observed. The two Grade 3 events met DILI criteria but resolved on discontinuation, supporting continued use under the existing monitoring schedule.",
    },
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    narrativeIntroText: "Three framings drafted. Cycle to compare.",
    narrativeDraftPreview: {
      version: 1,
      total: 3,
      framing: "conservative",
      preview:
        "Most events were Grade 1–2 transient ALT elevations, resolving without intervention…",
    },
  },
  {
    id: "JTR-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeDraft: {
      version: 2,
      total: 3,
      framing: "direct",
      body: "Aurora-IV recipients showed roughly 2× the placebo rate of hepatic adverse events (8.2% vs 4.1%; n=49/598 vs 12/293), driven primarily by Grade 1–2 ALT elevations consistent with CYP3A4-mediated metabolism. Two Grade 3 cases met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    },
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    narrativeIntroText: "Three framings drafted. Cycle to compare.",
    narrativeDraftPreview: {
      version: 2,
      total: 3,
      framing: "direct",
      preview:
        "Aurora-IV showed ≈2× the placebo hepatic AE rate, driven by Grade 1–2 elevations…",
    },
  },
  {
    id: "K0M-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeDraft: {
      version: 3,
      total: 3,
      framing: "comparative",
      body: "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    },
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    narrativeIntroText: "Three framings drafted. Cycle to compare.",
    narrativeDraftPreview: {
      version: 3,
      total: 3,
      framing: "comparative",
      preview:
        "Aurora-IV (8.2%) tracks the Phase 2 finding (7.6%), suggesting a stable safety profile…",
    },
  },
  {
    id: "KCS-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
  },
  {
    id: "KKW-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciled FDA / EMA divergence on resolution time",
        step: "step 4 of 4",
        done: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
      },
    ],
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
  },
  {
    id: "KUO-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
        body: {
          kind: "csv",
          rangeText: "rows 412–438",
          filter: "ALT > 3× ULN",
          columns: ["ID", "DAY", "ALT", "OUTCOME"],
          colWeights: [1.3, 0.6, 0.7, 1.5],
          rows: [
            { values: ["A4-0412", "14", "112", "G2 · resolved"] },
            {
              values: ["A4-0418", "21", "147", "G3 · DILI · discont."],
              highlight: true,
              outcomeAccent: true,
            },
            {
              values: ["A4-0427", "28", "216", "G3 · DILI · discont."],
              highlight: true,
              outcomeAccent: true,
            },
          ],
          moreRowsText: "+22 more rows",
        },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciled FDA / EMA divergence on resolution time",
        step: "step 4 of 4",
        done: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
      },
    ],
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
  },
  {
    id: "M01-0",
    layout: "csv-viewer",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
        body: {
          kind: "csv",
          rangeText: "rows 412–438",
          filter: "ALT > 3× ULN",
          columns: ["ID", "DAY", "ALT", "OUTCOME"],
          colWeights: [1.3, 0.6, 0.7, 1.5],
          rows: [
            { values: ["A4-0412", "14", "112", "G2 · resolved"] },
            {
              values: ["A4-0418", "21", "147", "G3 · DILI · discont."],
              highlight: true,
              outcomeAccent: true,
            },
            {
              values: ["A4-0427", "28", "216", "G3 · DILI · discont."],
              highlight: true,
              outcomeAccent: true,
            },
          ],
          moreRowsText: "+22 more rows",
        },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciled FDA / EMA divergence on resolution time",
        step: "step 4 of 4",
        done: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
      },
    ],
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
  },
  {
    id: "MUD-0",
    layout: "side-by-side",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    steps: [
      {
        title: "Read Phase 2 hepatic AE baseline",
        step: "step 1 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Pulled LFT rows where ALT > 3×ULN",
        step: "step 2 of 4",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
        body: {
          kind: "csv",
          rangeText: "rows 412–438",
          filter: "ALT > 3× ULN",
          columns: ["ID", "DAY", "ALT", "OUTCOME"],
          colWeights: [1.3, 0.6, 0.7, 1.5],
          rows: [
            { values: ["A4-0412", "14", "112", "G2 · resolved"] },
            {
              values: ["A4-0418", "21", "147", "G3 · DILI · discont."],
              highlight: true,
              outcomeAccent: true,
            },
            {
              values: ["A4-0427", "28", "216", "G3 · DILI · discont."],
              highlight: true,
              outcomeAccent: true,
            },
          ],
          moreRowsText: "+22 more rows",
        },
      },
      {
        title: "Cross-checked Phase 2 hepatic findings",
        step: "step 3 of 4",
        done: true,
        file: { badge: "md", fileName: "Phase2-CSR-007.md", section: "§5.2" },
      },
      {
        title: "Reconciled FDA / EMA divergence on resolution time",
        step: "step 4 of 4",
        done: true,
        file: { badge: "pdf", badgeStyle: "pdf", fileName: "Protocol_v4.2" },
      },
    ],
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
  },
  {
    id: "OFC-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
  },
  {
    id: "OL2-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
    ],
  },
  {
    id: "OON-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03", text: "Thinking...", state: "thinking" },
    ],
  },
  {
    id: "OXS-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulling resolution time data...",
        step: "",
        done: false,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
        body: {
          kind: "csv",
          rangeText: "rows 412–438",
          filter: "ALT > 3× ULN",
          columns: ["ID", "DAY", "ALT", "OUTCOME"],
          colWeights: [1.3, 0.6, 0.7, 1.5],
          rows: [
            {
              values: ["A4-0412", "14", "112", "G2 · resolved"],
              highlight: true,
            },
          ],
          moreRowsText: "+24 more rows",
        },
      },
    ],
  },
  {
    id: "P2J-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
  },
  {
    id: "P72-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
  },
  {
    id: "PAZ-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    tertiaryDocDraft: {
      version: 1,
      total: 2,
      framing: "FDA wording",
      body: "Most events resolved without intervention within a median of 14 days.",
    },
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
    tertiaryDraftPreview: {
      version: 1,
      total: 2,
      framing: "FDA wording",
      preview: '"…within a median of 14 days."',
      tags: ["FDA SCS phrasing · plain median"],
    },
  },
  {
    id: "PHY-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    tertiaryDocDraft: {
      version: 2,
      total: 2,
      framing: "EMA wording",
      body: "Most events resolved within a median of 21 days, consistent with the 14–28 day pharmacovigilance window.",
    },
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
    tertiaryDraftPreview: {
      version: 2,
      total: 2,
      framing: "EMA wording",
      preview: '"…within a median of 21 days, consistent with the 14–28 day pharmacovigilance window."',
      tags: ["EMA SmPC phrasing · with PV window"],
    },
  },
  {
    id: "PO7-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    tertiaryDocParagraph:
      "Most events resolved within a median of 21 days, consistent with the 14–28 day pharmacovigilance window.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
    tertiaryAcceptedChip: { label: "Accepted · EMA wording", revisit: true },
  },
  {
    id: "PO8-0",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    tabDirty: true,
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    tertiaryDocParagraph:
      "Most events resolved within a median of 21 days, consistent with the 14–28 day pharmacovigilance window.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
    tertiaryAcceptedChip: { label: "Accepted · EMA wording", revisit: true },
  },
  {
    id: "PTV-0",
    layout: "trace-map",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    hideGrade3: true,
    narrativeBody:
      "The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across studies. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed.",
    tertiaryDocParagraph:
      "Most events resolved within a median of 21 days, consistent with the 14–28 day pharmacovigilance window.",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
    tertiaryAcceptedChip: { label: "Accepted · EMA wording", revisit: true },
  },
  {
    id: "QAN-0",
    layout: "protocol",
    messages: [
      { role: "user", time: "14:03", text: "Re-draft the §12.4 hepatic AE narrative." },
      {
        role: "assistant",
        time: "14:03",
        summary: ["Magnitude", "Subgroup table", "Phase 2 inline"],
      },
    ],
    input: "",
    placeholder: "Type here…",
    avatar: "outline",
    reasonedChip: { label: "Reasoned · 6 steps · 12s" },
    acceptedChip: { label: "Accepted · v3 comparative", revisit: true },
    secondaryMessages: [
      { role: "user", time: "14:03", text: "Add a statement on resolution time." },
      { role: "assistant", time: "14:03" },
    ],
    secondarySteps: [
      {
        title: "Pulled resolution time data",
        step: "",
        done: true,
        file: { badge: "csv", badgeStyle: "csv", fileName: "Phase3-LFT-Listings.csv" },
      },
    ],
    tertiaryText:
      "Writing the statement. While cross-checking, I noticed FDA and EMA phrase resolution time slightly differently. Which would you like to use?",
    tertiaryAcceptedChip: { label: "Accepted · EMA wording", revisit: true },
  },
];

function walkthroughForSlideIndex(index: number): Walkthrough | null {
  const slide = index + 1; // 1-based slide number
  if (slide >= 1 && slide <= 5) {
    return {
      title: "Opening prompt",
      lead: "",
      active:
        "The medical writer types a prompt, and the agent reasons first and asks back before writing, so the writer isn't reviewing a draft built on the wrong assumption.",
      focus: "copilot-thread",
    };
  }
  if (slide >= 6 && slide <= 13) {
    return {
      title: "Clarifying questions",
      lead: "",
      active:
        "The agent asks two or three short follow-ups to pin down the writer's intent before drafting, so the wrong framing of a Grade 3 safety event doesn't land in the narrative.",
      focus: "copilot-clarify",
    };
  }
  if (slide >= 14 && slide <= 22) {
    return {
      title: "Reasoning steps",
      lead: "",
      active:
        "The agent shows its reasoning with the exact sources cited (LFT rows, protocol section, prior-phase CSR), so the writer can audit each claim against the raw data instead of trusting an unattributed number.",
      focus: "copilot-reasoning",
    };
  }
  if (slide === 23) {
    return {
      title: "Suggested narratives",
      lead: "",
      active:
        "The agent drafts three framings of §12.4 side-by-side so the writer can spot subtle bias that wouldn't show up reading one draft at a time.",
      focus: "copilot-reasoning",
    };
  }
  if (slide >= 24 && slide <= 27) {
    return {
      title: "Suggested narratives",
      lead: "",
      active:
        "Three takes on the same narrative (conservative, direct, comparative) replace the redraft-from-scratch cycle with a closest-fit pick to the sponsor's voice.",
      focus: "copilot-narrative-preview",
    };
  }
  if (slide >= 28 && slide <= 32) {
    const focus: WalkthroughFocus =
      slide === 28
        ? "editor-narrative"
        : slide === 29
        ? "copilot-reasoning"
        : slide === 30
        ? "evidence-csv"
        : slide === 31
        ? "split-view"
        : "editor-narrative";
    return {
      title: "Paper trail",
      lead: "",
      active:
        "Clicking a cited figure pops the underlying LFT listing rows next to §12.4, so the writer verifies the number in place rather than copy-pasting between tools where transcription errors creep in.",
      focus,
    };
  }
  if (slide >= 33 && slide <= 37) {
    return {
      title: "Cross-regulatory phrasing",
      lead: "",
      active:
        "On the follow-up turn, the agent reasons across FDA and EMA reference style to find phrasings each authority will accept in a single pass.",
      focus: "copilot-thread",
    };
  }
  if (slide === 38) {
    return {
      title: "Cross-regulatory phrasing",
      lead: "",
      active:
        "The agent drafts the §12.4 resolution-time statement in both FDA and EMA phrasing from one factual basis, so the two submissions don't drift apart through separate writer passes.",
      focus: "tertiary-wording",
    };
  }
  if (slide === 39) {
    return {
      title: "Cross-regulatory phrasing",
      lead: "",
      active:
        "Same fact rendered in two phrasings labeled FDA and EMA, so the writer picks once and both submissions stay locked to the same underlying data with regulator-appropriate language.",
      focus: "tertiary-wording",
    };
  }
  if (slide === 40) {
    return {
      title: "Cross-regulatory phrasing",
      lead: "",
      active:
        "The chosen EMA wording lands in §12.4 with the agent's audit trail intact, so QA can defend the number with one chain back to the source instead of stitching together emails and SAS outputs.",
      focus: "editor-tertiary",
    };
  }
  if (slide === 41) {
    return {
      title: "Traceability graph",
      lead: "",
      active:
        "Clicking the map icon in the editor opens the traceability graph: a relational view of every source listing, protocol section, and roll-up module that touches §12.4, so the writer can see what downstream documents will need to move with this edit.",
      focus: "map-button",
    };
  }
  if (slide === 42 || slide === 43) {
    return {
      title: "Traceability graph",
      lead: "",
      active:
        "A relational graph of source listings, protocol sections, and roll-up modules surfaces every Module 2.5 / 2.7 summary that quotes a §12.4 change, catching downstream inconsistencies without manual ripple-tracing.",
      focus: slide === 42 ? "trace-graph" : "protocol-doc",
    };
  }
  return null;
}

const FRAME_W = 1440;
const FRAME_H = 900;
const TOP_STRIP = 88;
const SIDE_PAD = 24;
const MAX_SCALE = 0.92;

/** Per-section dwell time for auto-advance (in ms; 1-based slide). */
function dwellMs(slide: number): number {
  if (slide === 1) return 3200;
  if (slide >= 2 && slide <= 4) return 3200;
  if (slide === 5) return 3800;
  if (slide >= 6 && slide <= 13) return 3600;
  if (slide >= 14 && slide <= 22) return 4200;
  if (slide === 23) return 3200;
  if (slide >= 24 && slide <= 27) return 5600;
  if (slide === 28) return 3600;
  if (slide === 29) return 4400;
  if (slide === 30) return 4800;
  if (slide === 31) return 6400;
  if (slide === 32) return 3600;
  if (slide >= 33 && slide <= 37) return 3600;
  if (slide === 38) return 3200;
  if (slide === 39) return 5600;
  if (slide === 40) return 3600;
  if (slide === 41) return 3200;
  if (slide === 42) return 8400;
  if (slide === 43) return 7000;
  return 4200;
}


/** White "island" on warm — editor / Copilot / split panes */
const FLOAT_COL =
  "rounded-[14px] bg-paper shadow-pop overflow-hidden flex flex-col min-h-0";

/** Side-by-side: match CSR section title ↔ listing title (same size/weight) */
const SPLIT_PANE_PAIR_TITLE =
  "font-[var(--font-display)] text-[26px] font-normal leading-[120%] tracking-[-0.01em] text-ink";

export default function PaperFramePage() {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(MAX_SCALE);
  const [walkthroughMode, setWalkthroughMode] = useState(true);
  // Arrow keys are the primary nav. Auto-advance is opt-in via `?auto=1` or the `a` key.
  const [autoMode, setAutoMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const wflag = params.get("walkthrough");
    if (wflag === "0" || wflag === "false") setWalkthroughMode(false);
    if (wflag === "1" || wflag === "true") setWalkthroughMode(true);
    const aflag = params.get("auto");
    if (aflag === "0" || aflag === "false") setAutoMode(false);
    if (aflag === "1" || aflag === "true") setAutoMode(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, frames.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "w" || e.key === "W") {
        setWalkthroughMode((v) => !v);
      } else if (e.key === "a" || e.key === "A" || e.key === " ") {
        e.preventDefault();
        setAutoMode((v) => !v);
      } else if (e.key === "Home" || e.key === "r" || e.key === "R") {
        setIndex(0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [remainingMs, setRemainingMs] = useState(0);

  // Auto-advance with per-section dwell. Click-hint flashes intentionally disabled.
  useEffect(() => {
    if (!autoMode) {
      setRemainingMs(0);
      return;
    }
    const slide = index + 1;
    const dwell = dwellMs(slide);
    setRemainingMs(dwell);
    const startedAt = performance.now();
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setRemainingMs(Math.max(0, dwell - elapsed));
    }, 100);
    const advanceTimer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, dwell);
    return () => {
      window.clearTimeout(advanceTimer);
      window.clearInterval(tick);
    };
  }, [autoMode, index]);

  useEffect(() => {
    function recalc() {
      const TOTAL_H = TOP_STRIP + FRAME_H;
      const availW = Math.max(window.innerWidth - SIDE_PAD * 2, 0);
      const availH = Math.max(window.innerHeight - 48, 0);
      const fit = Math.min(availW / FRAME_W, availH / TOTAL_H);
      setScale(Math.min(fit, MAX_SCALE));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const chipRef = useRef<HTMLDivElement | null>(null);

  const frame = frames[index];
  const walkthrough = walkthroughMode ? walkthroughForSlideIndex(index) : null;

  const sharedProps = {
    messages: frame.messages,
    input: frame.input,
    placeholder: frame.placeholder,
    avatar: frame.avatar ?? ("solid" as const),
    preparingNarrative: frame.preparingNarrative ?? false,
    clarifyCard: frame.clarifyCard,
    steps: frame.steps,
    tabDirty: frame.tabDirty ?? false,
    mapActive: index === 40,
    hideGrade3: frame.hideGrade3 ?? false,
    narrativeDraft: frame.narrativeDraft,
    narrativeBody: frame.narrativeBody,
    tertiaryDocDraft: frame.tertiaryDocDraft,
    tertiaryDocParagraph: frame.tertiaryDocParagraph,
    reasonedChip: frame.reasonedChip,
    draftingText: frame.draftingText,
    narrativeIntroText: frame.narrativeIntroText,
    narrativeDraftPreview: frame.narrativeDraftPreview,
    acceptedChip: frame.acceptedChip,
    followUps: frame.followUps,
    secondaryMessages: frame.secondaryMessages,
    secondarySteps: frame.secondarySteps,
    tertiaryText: frame.tertiaryText,
    tertiaryDraftPreview: frame.tertiaryDraftPreview,
    tertiaryAcceptedChip: frame.tertiaryAcceptedChip,
    tertiaryFollowUps: frame.tertiaryFollowUps,
    walkthrough,
  };

  return (
    <div
      className="overflow-hidden bg-warm relative"
      style={{ height: "100dvh", width: "100dvw" }}
    >
      {/* Single scaled wrapper — top strip + canvas scale together as one unit */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center",
          width: FRAME_W,
        }}
      >
        {/* Top strip — bar at its natural 940px since wrapper is 1440px */}
        <div
          className="shrink-0 w-full flex items-start justify-center px-6 relative z-30"
          style={{ minHeight: TOP_STRIP }}
        >
          {walkthrough ? (
            <WalkthroughBar
              walkthrough={walkthrough}
              index={index}
              total={frames.length}
              autoMode={autoMode}
              remainingMs={remainingMs}
              onToggleAuto={() => setAutoMode((v) => !v)}
              ref={chipRef}
            />
          ) : null}
        </div>

        {/* Canvas — intrinsic 1440 × 900 at this layer; outer wrapper scales the whole thing */}
        <div className="w-full relative" style={{ height: FRAME_H }}>
          <div className="flex gap-3 p-3 min-h-0 h-full w-full box-border overflow-hidden">
            {frame.layout === "csv-viewer" ? (
              <CsvViewerFrame {...sharedProps} />
            ) : frame.layout === "side-by-side" ? (
              <SideBySideFrame {...sharedProps} />
            ) : frame.layout === "protocol" ? (
              <ProtocolFrame {...sharedProps} />
            ) : frame.layout === "trace-map" ? (
              <TraceMapFrame {...sharedProps} />
            ) : (
              <CSRDocFrame {...sharedProps} />
            )}
          </div>
        </div>
      </div>

      {/* Connector overlay — fixed-position SVG, reads chipRef + target via getBoundingClientRect */}
      {walkthrough ? (
        <WalkthroughConnector
          chipRef={chipRef}
          focus={walkthrough.focus}
          index={index}
        />
      ) : null}
    </div>
  );
}

function WalkthroughTarget({
  walkthrough,
  match,
  children,
  className = "",
}: {
  walkthrough?: Walkthrough | null;
  match: WalkthroughFocus;
  children: React.ReactNode;
  className?: string;
}) {
  const active = !!walkthrough && walkthrough.focus === match;
  if (!active) return <>{children}</>;
  return (
    <div
      className={`relative walkthrough-spotlight rounded-[14px] ${className}`}
      data-walkthrough-focus={match}
    >
      {children}
    </div>
  );
}

const WalkthroughBar = forwardRef<
  HTMLDivElement,
  {
    walkthrough: Walkthrough;
    index: number;
    total: number;
    autoMode: boolean;
    remainingMs: number;
    onToggleAuto: () => void;
  }
>(function WalkthroughBar({ walkthrough, index, total, autoMode, remainingMs, onToggleAuto }, ref) {
  const textKey = `${walkthrough.title}|${walkthrough.lead}|${walkthrough.active}`;
  return (
    <div
      ref={ref}
      className="flex items-center gap-4 rounded-[28px] bg-[rgba(255,255,255,0.80)] backdrop-blur-md border border-hairline-strong shadow-pop select-none mt-3 px-5 py-3 min-h-[64px] w-[940px]"
    >
      <div className="flex items-center gap-2.5 font-[var(--font-inconsolata)] text-[12px] leading-[16px] tracking-[0.02em] shrink-0">
        <motion.button
          type="button"
          onClick={onToggleAuto}
          aria-label={autoMode ? "Pause auto-play" : "Resume auto-play"}
          className={`pointer-events-auto cursor-pointer flex items-center justify-center size-[22px] rounded-full transition-colors duration-200 ${
            autoMode ? "text-coral" : "text-muted"
          }`}
          style={{
            background: autoMode
              ? "rgba(255, 78, 73, 0.10)"
              : "rgba(243, 241, 237, 0.80)",
          }}
          animate={
            autoMode
              ? { scale: [1, 1.04, 1], opacity: [0.92, 1, 0.92] }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 1.6, repeat: autoMode ? Infinity : 0, ease: "easeInOut" }}
        >
          {autoMode ? (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </motion.button>
        <span className={index === 0 ? "text-faint opacity-40" : "text-muted"}>←</span>
        <span className="tabular-nums text-ink">
          {index + 1} <span className="text-faint">/</span> {total}
        </span>
        <span className={index === total - 1 ? "text-faint opacity-40" : "text-muted"}>→</span>
      </div>
      <div className="w-px h-4 bg-hairline-strong shrink-0" />
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={textKey}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex flex-col gap-1"
          >
            {walkthrough.title ? (
              <div className="font-[var(--font-inconsolata)] text-[10px] uppercase tracking-[0.14em] text-coral">
                {walkthrough.title}
              </div>
            ) : null}
            <div className="font-[var(--font-inconsolata)] text-[12.5px] leading-[18px] tracking-[0.01em]">
              {walkthrough.lead ? (
                <>
                  <span className="text-muted">{walkthrough.lead}</span>{" "}
                </>
              ) : null}
              <span className="text-ink">{walkthrough.active}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {autoMode ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-px h-4 bg-hairline-strong" />
          <div className="font-[var(--font-inconsolata)] text-[11px] leading-[14px] tracking-[0.02em] text-faint tabular-nums w-[34px] text-right">
            {(remainingMs / 1000).toFixed(1)}s
          </div>
        </div>
      ) : null}
    </div>
  );
});

function WalkthroughConnector({
  chipRef,
  focus,
  index,
}: {
  chipRef: React.RefObject<HTMLDivElement | null>;
  focus: WalkthroughFocus;
  index: number;
}) {
  const [coords, setCoords] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const chip = chipRef.current;
      if (!chip) return;
      const container = document.querySelector<HTMLElement>(
        `[data-walkthrough-focus="${focus}"]`
      );
      if (!container) {
        setCoords(null);
        return;
      }
      // For the copilot thread (a long scrollable container), point at the
      // most-recent visible child instead of the container's empty top edge —
      // that's where the user's eye actually goes when something new appears.
      let target: HTMLElement = container;
      if (focus === "copilot-thread") {
        const children = (Array.from(container.children) as HTMLElement[]).filter(
          (c) => c.offsetHeight > 0
        );
        const lastChild = children[children.length - 1];
        if (lastChild) target = lastChild;
      }
      const cRect = chip.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      setCoords({
        // Slight overlap at the chip end (-1px) so Safari sub-pixel rounding
        // doesn't render as a visible gap between bar and connector.
        from: { x: cRect.left + cRect.width / 2, y: cRect.bottom - 1 },
        to: { x: tRect.left + tRect.width / 2, y: tRect.top },
      });
    }
    measure();
    // Multi-rAF: Safari needs a couple of paint cycles after a transformed
    // ancestor settles before getBoundingClientRect returns final values.
    let raf2: number | undefined;
    const raf1 = window.requestAnimationFrame(() => {
      measure();
      raf2 = window.requestAnimationFrame(measure);
    });
    const handleResize = () => {
      measure();
      window.requestAnimationFrame(measure);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2 !== undefined) window.cancelAnimationFrame(raf2);
      window.removeEventListener("resize", handleResize);
    };
  }, [chipRef, focus, index]);

  // (path/dot rendered below)

  if (!coords) return null;

  const pathD = buildConnectorPath(coords.from, coords.to);
  const pathKey = `${focus}-${pathD}`;

  return (
    <svg
      className="fixed inset-0 w-screen h-screen pointer-events-none z-40"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <motion.path
        key={pathKey}
        d={pathD}
        stroke="var(--color-walkthrough-line)"
        strokeWidth={1}
        strokeDasharray="3 4"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />
      <motion.circle
        key={`${pathKey}-dot`}
        cx={coords.to.x}
        cy={coords.to.y}
        r={3.5}
        fill="var(--color-walkthrough-dot)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut", delay: 0.2 }}
        style={{ transformOrigin: `${coords.to.x}px ${coords.to.y}px` }}
      />
    </svg>
  );
}

function buildConnectorPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const dy = to.y - from.y;
  if (dy <= 0) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const dx = to.x - from.x;
  const absDx = Math.abs(dx);
  if (absDx < 1) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const sx = Math.sign(dx);
  const r = Math.min(20, absDx / 2, dy / 4);
  // Short vertical drop straight from the bar before turning sideways.
  const initialDrop = Math.max(r + 8, Math.min(32, dy * 0.18));
  // Path geometry can't fit if dy is too short — fall back to a smooth diagonal.
  if (dy < initialDrop + 2 * r + 8) {
    return `M ${from.x} ${from.y} L ${from.x} ${from.y + Math.min(12, dy * 0.4)} L ${to.x} ${to.y}`;
  }
  const startVerticalEndY = from.y + initialDrop;
  const horizontalY = startVerticalEndY + r;
  const firstCornerEndX = from.x + sx * r;
  const secondCornerStartX = to.x - sx * r;
  const secondCornerEndY = horizontalY + r;
  // Z-shape: vertical from chip → soft corner → horizontal across → soft corner → vertical into target.
  return [
    `M ${from.x} ${from.y}`,
    `L ${from.x} ${startVerticalEndY}`,
    `Q ${from.x} ${horizontalY} ${firstCornerEndX} ${horizontalY}`,
    `L ${secondCornerStartX} ${horizontalY}`,
    `Q ${to.x} ${horizontalY} ${to.x} ${secondCornerEndY}`,
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

function CSRDocFrame({
  messages,
  input,
  placeholder,
  avatar,
  preparingNarrative,
  clarifyCard,
  steps,
  tabDirty,
  mapActive,
  hideGrade3,
  narrativeDraft,
  narrativeBody,
  tertiaryDocDraft,
  tertiaryDocParagraph,
  reasonedChip,
  draftingText,
  narrativeIntroText,
  narrativeDraftPreview,
  acceptedChip,
  followUps,
  secondaryMessages,
  secondarySteps,
  tertiaryText,
  tertiaryDraftPreview,
  tertiaryAcceptedChip,
  tertiaryFollowUps,
  walkthrough,
}: SharedFrameProps) {
  const chromeFocused = walkthrough?.focus === "chrome";
  const mapFocused = walkthrough?.focus === "map-button";
  return (
    <div className="[font-synthesis:none] flex gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 overflow-hidden">
      {/* Editor column */}
      <div
        className={`${FLOAT_COL} flex-1 min-w-0 ${chromeFocused ? "walkthrough-spotlight" : ""}`}
        data-walkthrough-focus={chromeFocused ? "chrome" : undefined}
      >
        {/* Tab bar */}
        <DocTabBar tabDirty={tabDirty} mapActive={mapActive} mapFocused={mapFocused} />

        {/* Doc body */}
        <CSRDocBody
          hideGrade3={hideGrade3}
          preparingNarrative={preparingNarrative}
          narrativeDraft={narrativeDraft}
          narrativeBody={narrativeBody}
          tertiaryDocDraft={tertiaryDocDraft}
          tertiaryDocParagraph={tertiaryDocParagraph}
          padding="px-20"
          walkthrough={walkthrough}
        />
      </div>

      {/* Copilot rail */}
      <CopilotRail
        messages={messages}
        input={input}
        placeholder={placeholder}
        clarifyCard={clarifyCard}
        steps={steps}
        reasonedChip={reasonedChip}
        draftingText={draftingText}
        narrativeIntroText={narrativeIntroText}
        narrativeDraftPreview={narrativeDraftPreview}
        acceptedChip={acceptedChip}
        followUps={followUps}
        secondaryMessages={secondaryMessages}
        secondarySteps={secondarySteps}
        tertiaryText={tertiaryText}
        tertiaryDraftPreview={tertiaryDraftPreview}
        tertiaryAcceptedChip={tertiaryAcceptedChip}
        tertiaryFollowUps={tertiaryFollowUps}
        walkthrough={walkthrough}
      />
    </div>
  );
}

function CopilotRail({
  messages,
  input,
  placeholder,
  clarifyCard,
  steps,
  reasonedChip,
  draftingText,
  narrativeIntroText,
  narrativeDraftPreview,
  acceptedChip,
  followUps,
  secondaryMessages,
  secondarySteps,
  tertiaryText,
  tertiaryDraftPreview,
  tertiaryAcceptedChip,
  tertiaryFollowUps,
  walkthrough,
}: {
  messages: Message[];
  input: string;
  placeholder: string;
  clarifyCard?: ClarifyCard;
  steps?: Step[];
  reasonedChip?: Chip;
  draftingText?: string;
  narrativeIntroText?: string;
  narrativeDraftPreview?: NarrativeDraftPreview;
  acceptedChip?: AcceptedChip;
  followUps?: string[];
  secondaryMessages?: Message[];
  secondarySteps?: Step[];
  tertiaryText?: string;
  tertiaryDraftPreview?: NarrativeDraftPreview;
  tertiaryAcceptedChip?: AcceptedChip;
  tertiaryFollowUps?: string[];
  walkthrough?: Walkthrough | null;
}) {
  const hasInput = input.length > 0;
  // For slide 13 there's no clarifyCard; the summary chip lives on the last
  // assistant message. Spotlight shifts onto that message in that case.
  const lastSummaryIndex = !clarifyCard
    ? (() => {
        let found = -1;
        for (let i = 0; i < messages.length; i++) {
          const m = messages[i];
          if (m.role === "assistant" && "summary" in m && m.summary) found = i;
        }
        return found;
      })()
    : -1;
  return (
    <div
      className={`[font-synthesis:none] antialiased text-xs/4 ${FLOAT_COL} w-[360px] shrink-0`}
    >
      <div className="flex flex-col shrink-0">
        <div className="flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full shrink-0 bg-coral size-1.5" />
            <div className="font-[var(--font-inter)] font-medium text-ink text-[16px] leading-[22px] tracking-[-0.01em]">
              Copilot
            </div>
          </div>
          <div className="font-[var(--font-inconsolata)] text-faint text-[11px] leading-[14px] tracking-[0.02em]">
            peer-csr-v3
          </div>
        </div>
        <div className="hairline-fade" />
      </div>

      <div
        className={`flex flex-col grow pt-5 overflow-auto gap-3.5 px-5 min-h-0 relative scroll-tame ${
          walkthrough?.focus === "copilot-thread" ? "walkthrough-spotlight" : ""
        }`}
        data-walkthrough-focus={
          walkthrough?.focus === "copilot-thread" ? "copilot-thread" : undefined
        }
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m, i) => (
            <motion.div key={`${i}-${m.role}`} {...fadeIn}>
              {i === lastSummaryIndex ? (
                <WalkthroughTarget walkthrough={walkthrough} match="copilot-clarify">
                  <MessageBubble message={m} />
                </WalkthroughTarget>
              ) : (
                <MessageBubble message={m} />
              )}
            </motion.div>
          ))}
          {clarifyCard ? (
            <motion.div key="clarify" {...fadeIn}>
              <WalkthroughTarget walkthrough={walkthrough} match="copilot-clarify">
                <ClarifyCardView card={clarifyCard} />
              </WalkthroughTarget>
            </motion.div>
          ) : null}
          {reasonedChip ? (
            <motion.div key="reasoned" {...fadeIn} className="self-start">
              {walkthrough?.focus === "copilot-reasoning" && !steps?.length ? (
                <WalkthroughTarget walkthrough={walkthrough} match="copilot-reasoning">
                  <ReasonedChipView label={reasonedChip.label} expanded={!!steps?.length} />
                </WalkthroughTarget>
              ) : (
                <ReasonedChipView label={reasonedChip.label} expanded={!!steps?.length} />
              )}
            </motion.div>
          ) : null}
          {(steps ?? []).map((step, i) => {
            const stepWithBody = (steps ?? []).findIndex((s) => !!s.body);
            const focusStepIdx = stepWithBody !== -1 ? stepWithBody : (steps!.length - 1);
            const isFocused = walkthrough?.focus === "copilot-reasoning" && i === focusStepIdx;
            return (
              <motion.div key={`step-${i}`} {...fadeIn}>
                {isFocused ? (
                  <WalkthroughTarget walkthrough={walkthrough} match="copilot-reasoning">
                    <StepRow step={step} />
                  </WalkthroughTarget>
                ) : (
                  <StepRow step={step} />
                )}
              </motion.div>
            );
          })}
          {narrativeIntroText ? (
            <motion.div
              key="intro"
              {...fadeIn}
              className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#14161A]"
            >
              {narrativeIntroText}
            </motion.div>
          ) : null}
          {narrativeDraftPreview ? (
            <motion.div key="preview" {...fadeIn}>
              <WalkthroughTarget walkthrough={walkthrough} match="copilot-narrative-preview">
                <NarrativeDraftPreviewCard preview={narrativeDraftPreview} />
              </WalkthroughTarget>
            </motion.div>
          ) : null}
          {acceptedChip ? (
            <motion.div key="accepted" {...fadeIn} className="self-start">
              <AcceptedChipView chip={acceptedChip} />
            </motion.div>
          ) : null}
          {followUps && followUps.length > 0 ? (
            <motion.div key="followups" {...fadeIn} className="flex flex-col items-start pt-2 gap-1.5">
              {followUps.map((f) => (
                <FollowUpPill key={f} label={f} />
              ))}
            </motion.div>
          ) : null}
          {(secondaryMessages ?? []).map((m, i) => (
            <motion.div key={`sec-msg-${i}-${m.role}`} {...fadeIn}>
              <MessageBubble message={m} />
            </motion.div>
          ))}
          {(secondarySteps ?? []).map((step, i) => (
            <motion.div key={`sec-step-${i}`} {...fadeIn}>
              <StepRow step={step} />
            </motion.div>
          ))}
          {tertiaryText ? (
            <motion.div
              key="tertiary-text"
              {...fadeIn}
              className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#14161A]"
            >
              {tertiaryText}
            </motion.div>
          ) : null}
          {tertiaryDraftPreview ? (
            <motion.div key="tertiary-preview" {...fadeIn}>
              <WalkthroughTarget walkthrough={walkthrough} match="tertiary-wording">
                <NarrativeDraftPreviewCard preview={tertiaryDraftPreview} />
              </WalkthroughTarget>
            </motion.div>
          ) : null}
          {tertiaryAcceptedChip ? (
            <motion.div key="tertiary-accepted" {...fadeIn} className="self-start">
              <AcceptedChipView chip={tertiaryAcceptedChip} />
            </motion.div>
          ) : null}
          {tertiaryFollowUps && tertiaryFollowUps.length > 0 ? (
            <motion.div
              key="tertiary-followups"
              {...fadeIn}
              className="flex flex-col items-start pt-2 gap-1.5"
            >
              {tertiaryFollowUps.map((f) => (
                <FollowUpPill key={f} label={f} />
              ))}
            </motion.div>
          ) : null}
          {draftingText ? (
            <motion.div
              key="drafting"
              {...fadeIn}
              className="text-[13px] leading-[155%] font-[var(--font-inter)] italic text-[#9C9EA3]"
            >
              {draftingText}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col shrink-0 pt-3 pb-4 gap-1.5 px-5">
        <div className="hairline-fade mb-3" />
        <div className="flex items-center rounded-[12px] py-2.5 px-3.5 gap-2 bg-[rgba(243,241,237,0.60)] backdrop-blur-sm border border-hairline">
          <div className="grow relative h-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={hasInput ? `typed:${input}` : "placeholder"}
                {...fadeIn}
                className={`font-[var(--font-inter)] text-[13px] leading-4 ${
                  hasInput ? "text-ink" : "text-faint"
                }`}
              >
                {hasInput ? input : placeholder}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-center rounded-[8px] shrink-0 bg-coral size-7 shadow-card">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13,6 19,12 13,18" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopNav({ avatar }: { avatar: "solid" | "outline" }) {
  return (
    <div className="flex items-center h-14 w-full shrink-0 px-7 gap-5 bg-paper border-b border-hairline">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center shrink-0 size-6">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF4E49"
            strokeWidth="1.6"
            strokeLinecap="round"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <circle cx="9" cy="12" r="4.5" />
            <circle cx="15" cy="12" r="4.5" />
          </svg>
        </div>
        <div className="font-[var(--font-inter)] font-medium text-coral text-[17px] leading-[22px] tracking-[-0.005em]">
          Peer
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-[var(--font-inter)] text-[12.5px] leading-4 tracking-[-0.005em]">
        <span className="text-ink">Aurora-IV</span>
        <span className="text-faint">·</span>
        <span className="text-ink">Phase III CSR</span>
        <span className="text-faint">·</span>
        <span className="text-ink">Module 5.3.5</span>
        <span className="text-faint">·</span>
        <span className="text-ink">CSR-014.md</span>
      </div>

      <div className="grow" />

      <div className="flex items-center gap-1.5">
        <div className="rounded-full shrink-0 bg-green size-1.5 opacity-90" />
        <div className="font-[var(--font-inter)] text-muted text-[12px] leading-4">
          auto-saved 14:02
        </div>
      </div>
      <div
        className={`flex items-center justify-center rounded-full shrink-0 size-7 transition-colors duration-200 ${
          avatar === "outline"
            ? "bg-soft"
            : "bg-ink"
        }`}
      >
        <div
          className={`font-[var(--font-inconsolata)] font-bold text-[10.5px] leading-[14px] tracking-[0.02em] transition-colors duration-200 ${
            avatar === "outline" ? "text-ink" : "text-white"
          }`}
        >
          AN
        </div>
      </div>
    </div>
  );
}

function DocTabBar({
  tabDirty,
  mapActive = false,
  mapFocused = false,
}: {
  tabDirty: boolean;
  mapActive?: boolean;
  mapFocused?: boolean;
}) {
  return (
    <div className="flex items-end h-12 shrink-0 px-4 gap-1 border-b border-hairline">
      <Tab kind="md" name="CSR-014.md" state={tabDirty ? "active-dirty" : "active-default"} />
      <div className="grow" />
      {mapFocused ? (
        <div
          className="relative walkthrough-spotlight rounded-[8px]"
          data-walkthrough-focus="map-button"
        >
          <MapButton active={mapActive} />
        </div>
      ) : (
        <MapButton active={mapActive} />
      )}
    </div>
  );
}

function CsvActiveTabBar() {
  return (
    <div className="flex items-end h-12 shrink-0 px-4 gap-1 border-b border-hairline">
      <Tab kind="md" name="CSR-014.md" state="inactive" />
      <Tab
        kind="csv"
        name="Phase3-LFT-Listings.csv"
        state="active-selected"
      />
      <div className="grow" />
      <MapButton />
      <SideBySideButton active={false} />
    </div>
  );
}

function SplitTabBar() {
  return (
    <div className="flex items-end h-12 shrink-0 px-4 gap-1 border-b border-hairline">
      <Tab kind="md" name="CSR-014.md" state="active-dirty" />
      <Tab kind="csv" name="Phase3-LFT-Listings.csv" state="active-dirty" />
      <div className="grow" />
      <MapButton />
      <SideBySideButton active={true} />
    </div>
  );
}

function Tab({
  kind,
  name,
  state,
}: {
  kind: "md" | "csv" | "pdf";
  name: string;
  state: "inactive" | "active-default" | "active-dirty" | "active-selected";
}) {
  const isInactive = state === "inactive";
  const isActive = !isInactive;
  const bgClass = isInactive ? "bg-[rgba(243,241,237,0.60)]" : "bg-paper";
  const labelColor = isInactive ? "text-muted" : "text-ink";
  return (
    <div
      className={`relative flex items-center h-9 px-3.5 gap-2 rounded-t-[8px] transition-colors duration-200 ${bgClass}`}
    >
      <FileTypeBadge kind={kind} />
      <div
        className={`font-[var(--font-inter)] font-medium text-[12.5px] leading-4 tracking-[-0.005em] ${labelColor}`}
      >
        {name}
      </div>
      <div className="ml-0.5 font-[var(--font-inter)] text-faint text-[14px] leading-[18px] opacity-60">
        ×
      </div>
      {isActive ? (
        <div className="absolute left-2 right-2 -bottom-px h-[2px] bg-coral rounded-full" />
      ) : null}
    </div>
  );
}

function FileTypeBadge({ kind }: { kind: "md" | "csv" | "pdf" }) {
  const styles =
    kind === "csv"
      ? "bg-green-soft text-green"
      : kind === "pdf"
        ? "bg-pink text-pink-ink"
        : "bg-soft text-faint";
  return (
    <div
      className={`rounded-[4px] py-0.5 px-[5px] font-[var(--font-inconsolata)] font-bold text-[9.5px] leading-3 tracking-[0.02em] uppercase ${styles}`}
    >
      {kind}
    </div>
  );
}

function MapButton({ active = false }: { active?: boolean }) {
  return (
    <div
      data-click-hint="map-button"
      className={`flex items-center justify-center self-center rounded-[8px] shrink-0 size-8 transition-colors duration-200 ${
        active ? "bg-coral" : "bg-paper border border-hairline hover:bg-[rgba(243,241,237,0.60)]"
      }`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#FFFFFF" : "#14161A"}
        strokeWidth="1.5"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <polygon
          points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"
          strokeLinejoin="round"
        />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    </div>
  );
}

function SideBySideButton({ active }: { active: boolean }) {
  return (
    <div
      data-click-hint="side-by-side"
      className={`flex items-center self-center rounded-[8px] py-1.5 px-2.5 gap-1.5 transition-colors duration-200 ${
        active ? "bg-coral" : "bg-paper border border-hairline"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#FFFFFF" : "#14161A"}
        strokeWidth="1.5"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
      <div
        className={`font-[var(--font-inter)] font-medium text-[12px] leading-4 tracking-[-0.005em] ${
          active ? "text-white" : "text-ink"
        }`}
      >
        side-by-side
      </div>
    </div>
  );
}

function CSRDocBody({
  hideGrade3,
  preparingNarrative,
  narrativeDraft,
  narrativeBody,
  padding,
  paddingTop = "pt-8",
  tertiaryDocDraft,
  tertiaryDocParagraph,
  walkthrough,
  pairedPane = false,
}: {
  hideGrade3: boolean;
  preparingNarrative: boolean;
  narrativeDraft?: NarrativeDraft;
  narrativeBody?: string;
  padding: string;
  paddingTop?: string;
  tertiaryDocDraft?: NarrativeDraft;
  tertiaryDocParagraph?: string;
  walkthrough?: Walkthrough | null;
  pairedPane?: boolean;
}) {
  return (
    <div className={`flex flex-col grow ${paddingTop} overflow-auto ${padding} min-h-0 relative scroll-tame`}>
      <div className="flex items-center mb-4 gap-2 font-[var(--font-inconsolata)] text-[10.5px] leading-[14px] uppercase">
        <span className="tracking-[0.08em] font-bold text-muted">Section 12.4</span>
        <span className="text-faint normal-case">·</span>
        <span className="tracking-[0.04em] text-faint">Phase III</span>
        <span className="text-faint normal-case">·</span>
        <span className="tracking-[0.04em] text-faint">Aurora-IV</span>
        <span className="text-faint normal-case">·</span>
        <span className="tracking-[0.04em] text-faint">Hepatic Adverse Events</span>
      </div>

      <h1
        className={`mb-5 min-w-0 ${pairedPane ? `${SPLIT_PANE_PAIR_TITLE} break-words` : "font-[var(--font-display)] text-[40px] leading-[115%] tracking-[-0.015em] font-normal text-ink"}`}
      >
        Hepatic adverse events
      </h1>

      <p className="text-[15px] leading-[170%] mb-7 font-[var(--font-inter)] text-ink">
        Aurora-IV is administered orally once daily and is metabolized primarily through hepatic
        CYP3A4 pathways. The Phase III safety database includes 891 randomized participants across
        47 sites, with hepatic monitoring performed every two weeks during the first cycle and
        monthly thereafter, per the protocol&apos;s risk-management plan.
      </p>

      <div className="flex flex-col mb-6 rounded-[14px] overflow-clip bg-paper border border-hairline shadow-card">
        <div className="flex items-center justify-between py-3 px-5 bg-[rgba(248,246,240,0.70)] border-b border-hairline">
          <div className="flex items-baseline gap-3">
            <div className="tracking-[0.08em] uppercase font-[var(--font-inconsolata)] font-bold text-muted text-[10.5px] leading-[14px]">
              Table 12.4-1
            </div>
            <div className="font-[var(--font-inter)] text-ink text-[13.5px] leading-[18px]">
              Hepatic adverse events by grade and treatment arm
            </div>
          </div>
        </div>

        <div className="flex py-2.5 px-5 border-b border-hairline font-[var(--font-inconsolata)] font-bold text-muted text-[10.5px] leading-[14px] tracking-[0.08em] uppercase">
          <div className="basis-0 grow-[2] shrink">Grade</div>
          <div className="basis-0 grow-[1.4] shrink text-right">Aurora-IV (n=598)</div>
          <div className="basis-0 grow-[1.4] shrink text-right">Placebo (n=293)</div>
        </div>

        <Row label="Grade 1 — transient" a="34  (5.7%)" b="7  (2.4%)" />
        <Row label="Grade 2 — ALT 3–5× ULN" a="13  (2.2%)" b="4  (1.4%)" zebra />
        <AnimatePresence initial={false}>
          {!hideGrade3 ? (
            <motion.div key="grade-3" {...fadeIn}>
              <Row label="Grade 3 — ALT > 5× ULN" a="2  (0.3%)" b="1  (0.3%)" />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <Row label="Grade 4" a="0  (0.0%)" b="0  (0.0%)" zebra={!hideGrade3} muted />

        <div className="flex items-center py-3 px-5 border-t border-hairline-strong bg-[rgba(248,246,240,0.40)]">
          <div className="basis-0 grow-[2] shrink font-[var(--font-inter)] font-semibold text-ink text-[13.5px] leading-[18px]">
            Total — any grade
          </div>
          <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-ink text-[13.5px] leading-[18px]">
            49  (8.2%)
          </div>
          <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-ink text-[13.5px] leading-[18px]">
            12  (4.1%)
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {narrativeDraft ? (
          <motion.div key="narrative-draft" {...fadeIn}>
            <NarrativeDraftBlock draft={narrativeDraft} />
          </motion.div>
        ) : preparingNarrative ? (
          <motion.div key="preparing" {...fadeIn}>
            <PreparingBlock>
              Hepatic adverse events occurred in 8.2% of Aurora-IV recipients (n=49/598) versus
              4.1% on placebo (n=12/293). Most events were Grade 1–2 transient ALT elevations,
              resolving without intervention within a median of 14 days. Two Grade 3 events met
              DILI criteria; both resolved on discontinuation. No Hy&apos;s Law cases were
              observed.
            </PreparingBlock>
          </motion.div>
        ) : (
          <motion.div
            key={`paragraph:${narrativeBody ?? "default"}`}
            {...fadeIn}
            className="mt-5"
          >
            <WalkthroughTarget walkthrough={walkthrough} match="editor-narrative">
              <p className="text-[15px] leading-[170%] font-[var(--font-inter)] text-ink">
                {narrativeBody ??
                  "Hepatic adverse events occurred in 8.2% of Aurora-IV recipients (n=49/598) versus 4.1% on placebo (n=12/293). Most events were Grade 1–2 transient ALT elevations, resolving without intervention within a median of 14 days. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed."}
              </p>
            </WalkthroughTarget>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[15px] leading-[170%] mt-5 mb-5 font-[var(--font-inter)] text-ink">
        A pre-specified subgroup analysis of participants with baseline hepatic impairment (n=42)
        showed comparable event rates and no qualitative difference in time-to-resolution.
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {tertiaryDocDraft ? (
          <motion.div key={`tert-draft-${tertiaryDocDraft.version}-${tertiaryDocDraft.framing}`} {...fadeIn}>
            <NarrativeDraftBlock draft={tertiaryDocDraft} />
          </motion.div>
        ) : tertiaryDocParagraph ? (
          <motion.div
            key={`tert-paragraph:${tertiaryDocParagraph}`}
            {...fadeIn}
          >
            <WalkthroughTarget walkthrough={walkthrough} match="editor-tertiary">
              <p className="text-[15px] leading-[170%] font-[var(--font-inter)] text-ink">
                {tertiaryDocParagraph}
              </p>
            </WalkthroughTarget>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type CsvViewerRow = {
  ptId: string;
  day: string;
  alt: string;
  ast: string;
  uln: string;
  ulnAccent: "warn" | "alert" | "ok" | "muted";
};

const CSV_VIEWER_ROWS: CsvViewerRow[] = [
  { ptId: "A4-0412", day: "14", alt: "112", ast: "98", uln: "3.2", ulnAccent: "warn" },
  { ptId: "A4-0418", day: "21", alt: "147", ast: "132", uln: "4.1", ulnAccent: "warn" },
  { ptId: "A4-0421", day: "7", alt: "128", ast: "115", uln: "3.6", ulnAccent: "warn" },
  { ptId: "A4-0427", day: "28", alt: "216", ast: "189", uln: "6.0", ulnAccent: "alert" },
  { ptId: "A4-0431", day: "14", alt: "95", ast: "88", uln: "2.7", ulnAccent: "ok" },
  { ptId: "A4-0438", day: "42", alt: "122", ast: "110", uln: "3.5", ulnAccent: "warn" },
];

function ulnColorClass(accent: CsvViewerRow["ulnAccent"]) {
  if (accent === "alert") return "text-pink-ink font-medium";
  if (accent === "warn") return "text-warning";
  if (accent === "ok") return "text-green";
  return "text-faint";
}

function CsvDocBody({
  showFooterAction,
  padding,
  showHeaderActions,
  paddingTop = "pt-6",
  walkthrough,
  pairedPane = false,
}: {
  showFooterAction: boolean;
  padding: string;
  showHeaderActions: boolean;
  paddingTop?: string;
  walkthrough?: Walkthrough | null;
  pairedPane?: boolean;
}) {
  const evidenceFocused = walkthrough?.focus === "evidence-csv";
  return (
    <div
      className={`flex flex-col grow ${paddingTop} overflow-auto ${padding} min-h-0 relative ${
        evidenceFocused ? "walkthrough-spotlight" : ""
      }`}
      data-walkthrough-focus={evidenceFocused ? "evidence-csv" : undefined}
    >
      <div className="mb-4 flex items-center gap-2 self-start rounded-full px-3 py-1.5 bg-[rgba(243,241,237,0.70)] font-[var(--font-inconsolata)] text-[11px] leading-[14px] tracking-[0.02em] uppercase whitespace-nowrap">
        <span className="font-bold text-muted shrink-0">Evidence</span>
        <span className="text-faint shrink-0 normal-case">·</span>
        <span className="text-muted shrink-0 normal-case">Phase 3 LFT listings</span>
        <span className="text-faint shrink-0 normal-case">·</span>
        <span className="text-muted normal-case truncate">filtered: ALT &gt; 3×ULN · rows 412–438</span>
      </div>

      <div
        className={`mb-5 flex items-end justify-between gap-4 ${pairedPane ? "min-w-0" : ""}`}
      >
        <h2
          className={`min-w-0 text-ink ${pairedPane ? `${SPLIT_PANE_PAIR_TITLE} break-words` : "font-[var(--font-display)] text-[32px] font-normal leading-[120%] tracking-[-0.015em] whitespace-nowrap"}`}
        >
          Phase3-LFT-Listings
        </h2>
        {showHeaderActions ? (
          <div className="flex items-center gap-2">
            <div className="font-[var(--font-inconsolata)] text-faint text-[11px] leading-[14px] tracking-[0.02em]">
              27 rows · 5 cols
            </div>
            <div className="flex items-center rounded-[8px] py-1.5 px-2.5 gap-1.5 bg-paper border border-hairline font-[var(--font-inter)] text-ink text-[11.5px] leading-[14px]">
              Filter
            </div>
            <div className="flex items-center rounded-[8px] py-1.5 px-2.5 gap-1.5 bg-paper border border-hairline font-[var(--font-inter)] text-ink text-[11.5px] leading-[14px]">
              Export
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col rounded-[14px] overflow-clip bg-paper border border-hairline shadow-card">
        <div className="flex py-2.5 px-4 bg-[rgba(248,246,240,0.70)] border-b border-hairline font-[var(--font-inconsolata)] font-bold text-muted text-[10px] leading-3 tracking-[0.08em] uppercase">
          <div className="basis-0 grow-[1.4] shrink whitespace-nowrap">PT-ID</div>
          <div className="basis-0 grow-[0.8] shrink whitespace-nowrap">Day</div>
          <div className="basis-0 grow shrink text-right whitespace-nowrap">ALT (U/L)</div>
          <div className="basis-0 grow shrink text-right whitespace-nowrap">AST (U/L)</div>
          <div className="basis-0 grow shrink text-right whitespace-nowrap">×ULN</div>
        </div>
        {CSV_VIEWER_ROWS.map((row, i) => (
          <div
            key={row.ptId}
            className={`flex py-2.5 px-4 ${i % 2 === 1 ? "bg-[rgba(248,246,240,0.40)]" : ""}`}
          >
            <div className="basis-0 grow-[1.4] shrink whitespace-nowrap font-[var(--font-inconsolata)] text-ink text-[12.5px] leading-[16px] tabular-nums">
              {row.ptId}
            </div>
            <div className="basis-0 grow-[0.8] shrink whitespace-nowrap font-[var(--font-inconsolata)] text-muted text-[12.5px] leading-[16px] tabular-nums">
              {row.day}
            </div>
            <div className="basis-0 grow shrink text-right whitespace-nowrap font-[var(--font-inconsolata)] text-ink text-[12.5px] leading-[16px] tabular-nums">
              {row.alt}
            </div>
            <div className="basis-0 grow shrink text-right whitespace-nowrap font-[var(--font-inconsolata)] text-ink text-[12.5px] leading-[16px] tabular-nums">
              {row.ast}
            </div>
            <div
              className={`basis-0 grow shrink text-right whitespace-nowrap font-[var(--font-inconsolata)] text-[12.5px] leading-[16px] tabular-nums ${ulnColorClass(row.ulnAccent)}`}
            >
              {row.uln}
            </div>
          </div>
        ))}
        <div className="flex py-2.5 px-4 border-t border-hairline font-[var(--font-inconsolata)] text-faint text-[12.5px] leading-[16px]">
          <div className="basis-0 grow-[1.4] shrink">…</div>
          <div className="basis-0 grow-[0.8] shrink">…</div>
          <div className="basis-0 grow shrink text-right">…</div>
          <div className="basis-0 grow shrink text-right">…</div>
          <div className="basis-0 grow shrink text-right">…</div>
        </div>
      </div>

      {showFooterAction ? (
        <div className="flex items-center mt-4 gap-2 font-[var(--font-inter)] text-faint text-[11.5px] leading-[14px]">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <path d="M5 12h14" />
            <polyline points="12,5 19,12 12,19" />
          </svg>
          <div>opened from CSR-014.md §12.4</div>
        </div>
      ) : null}
    </div>
  );
}

type SharedFrameProps = {
  messages: Message[];
  input: string;
  placeholder: string;
  avatar: "solid" | "outline";
  preparingNarrative: boolean;
  clarifyCard?: ClarifyCard;
  steps?: Step[];
  tabDirty: boolean;
  /** Map button shows pressed (coral) state — used right before opening the trace map. */
  mapActive?: boolean;
  hideGrade3: boolean;
  narrativeDraft?: NarrativeDraft;
  narrativeBody?: string;
  tertiaryDocDraft?: NarrativeDraft;
  tertiaryDocParagraph?: string;
  reasonedChip?: Chip;
  draftingText?: string;
  narrativeIntroText?: string;
  narrativeDraftPreview?: NarrativeDraftPreview;
  acceptedChip?: AcceptedChip;
  followUps?: string[];
  secondaryMessages?: Message[];
  secondarySteps?: Step[];
  tertiaryText?: string;
  tertiaryDraftPreview?: NarrativeDraftPreview;
  tertiaryAcceptedChip?: AcceptedChip;
  tertiaryFollowUps?: string[];
  walkthrough?: Walkthrough | null;
};

function CsvViewerFrame({
  messages,
  input,
  placeholder,
  avatar,
  clarifyCard,
  steps,
  reasonedChip,
  draftingText,
  narrativeIntroText,
  narrativeDraftPreview,
  acceptedChip,
  followUps,
  secondaryMessages,
  secondarySteps,
  tertiaryText,
  tertiaryDraftPreview,
  tertiaryAcceptedChip,
  tertiaryFollowUps,
  walkthrough,
}: SharedFrameProps) {
  return (
    <div className="[font-synthesis:none] flex gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 overflow-hidden">
      <div className={`${FLOAT_COL} flex-1 min-w-0`}>
        <CsvActiveTabBar />
        <CsvDocBody
          showFooterAction={true}
          padding="px-[60px]"
          showHeaderActions={true}
          walkthrough={walkthrough}
        />
      </div>
      <CopilotRail
        messages={messages}
        input={input}
        placeholder={placeholder}
        clarifyCard={clarifyCard}
        steps={steps}
        reasonedChip={reasonedChip}
        draftingText={draftingText}
        narrativeIntroText={narrativeIntroText}
        narrativeDraftPreview={narrativeDraftPreview}
        acceptedChip={acceptedChip}
        followUps={followUps}
        secondaryMessages={secondaryMessages}
        secondarySteps={secondarySteps}
        tertiaryText={tertiaryText}
        tertiaryDraftPreview={tertiaryDraftPreview}
        tertiaryAcceptedChip={tertiaryAcceptedChip}
        tertiaryFollowUps={tertiaryFollowUps}
        walkthrough={walkthrough}
      />
    </div>
  );
}

function SideBySideFrame({
  messages,
  input,
  placeholder,
  avatar,
  preparingNarrative,
  clarifyCard,
  steps,
  hideGrade3,
  narrativeDraft,
  narrativeBody,
  tertiaryDocDraft,
  tertiaryDocParagraph,
  reasonedChip,
  draftingText,
  narrativeIntroText,
  narrativeDraftPreview,
  acceptedChip,
  followUps,
  secondaryMessages,
  secondarySteps,
  tertiaryText,
  tertiaryDraftPreview,
  tertiaryAcceptedChip,
  tertiaryFollowUps,
  walkthrough,
}: SharedFrameProps) {
  const splitFocused = walkthrough?.focus === "split-view";
  return (
    <div className="[font-synthesis:none] flex items-stretch gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 overflow-hidden">
      <div
        className={`${FLOAT_COL} relative min-h-0 min-w-0 flex-1 ${
          splitFocused ? "walkthrough-spotlight" : ""
        }`}
        data-walkthrough-focus={splitFocused ? "split-view" : undefined}
      >
        <div className="shrink-0">
          <SplitTabBar />
        </div>
        <div className="flex min-h-0 flex-1 flex-row divide-x divide-hairline">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CSRDocBody
              hideGrade3={hideGrade3}
              preparingNarrative={preparingNarrative}
              narrativeDraft={narrativeDraft}
              narrativeBody={narrativeBody}
              tertiaryDocDraft={tertiaryDocDraft}
              tertiaryDocParagraph={tertiaryDocParagraph}
              pairedPane={true}
              padding="px-12"
              paddingTop="pt-6"
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CsvDocBody
              showFooterAction={true}
              pairedPane={true}
              padding="px-12"
              showHeaderActions={false}
              paddingTop="pt-6"
            />
          </div>
        </div>
      </div>
      <CopilotRail
        messages={messages}
        input={input}
        placeholder={placeholder}
        clarifyCard={clarifyCard}
        steps={steps}
        reasonedChip={reasonedChip}
        draftingText={draftingText}
        narrativeIntroText={narrativeIntroText}
        narrativeDraftPreview={narrativeDraftPreview}
        acceptedChip={acceptedChip}
        followUps={followUps}
        secondaryMessages={secondaryMessages}
        secondarySteps={secondarySteps}
        tertiaryText={tertiaryText}
        tertiaryDraftPreview={tertiaryDraftPreview}
        tertiaryAcceptedChip={tertiaryAcceptedChip}
        tertiaryFollowUps={tertiaryFollowUps}
        walkthrough={walkthrough}
      />
    </div>
  );
}

function ProtocolTabBar() {
  return (
    <div className="flex items-end h-12 shrink-0 px-4 gap-1 border-b border-hairline">
      <Tab kind="md" name="CSR-014.md" state="inactive" />
      <Tab kind="pdf" name="Aurora-IV_Protocol_v4.2" state="active-selected" />
      <div className="grow" />
      <MapButton />
      <SideBySideButton active={false} />
    </div>
  );
}

function ProtocolDocBody({ padding }: { padding: string }) {
  return (
    <div className={`flex flex-col grow pt-10 overflow-auto ${padding} min-h-0 relative scroll-tame`}>
      <div className="flex items-center mb-4 gap-2 font-[var(--font-inconsolata)] text-[10.5px] leading-[14px] uppercase">
        <span className="tracking-[0.08em] font-bold text-muted">Section 6.3</span>
        <span className="text-faint normal-case">·</span>
        <span className="tracking-[0.04em] text-faint">Aurora-IV Protocol v4.2</span>
        <span className="text-faint normal-case">·</span>
        <span className="tracking-[0.04em] text-faint">Hepatic safety monitoring</span>
      </div>

      <h1 className="text-[36px] leading-[115%] tracking-[-0.015em] mb-5 font-[var(--font-display)] font-normal text-ink">
        Hepatic safety monitoring
      </h1>

      <p className="text-[15px] leading-[170%] mb-6 font-[var(--font-inter)] text-ink">
        Liver function tests are obtained at screening, biweekly during the first cycle, and
        monthly thereafter. Participants with ALT or AST &gt; 3× ULN repeat within 72 hours;
        sustained elevations trigger discontinuation per the rules below.
      </p>

      <div className="flex flex-col mb-6 rounded-[14px] overflow-clip bg-paper border border-hairline shadow-card">
        <div className="flex py-2.5 px-5 bg-[rgba(248,246,240,0.70)] border-b border-hairline">
          <div className="tracking-[0.08em] uppercase grow font-[var(--font-inconsolata)] font-bold text-muted text-[10.5px] leading-3">
            Definitions
          </div>
        </div>
        <DefinitionRow
          term="DILI"
          def="Drug-induced liver injury — ALT or AST ≥ 5× ULN, or symptomatic hepatic dysfunction."
        />
        <DefinitionRow
          term="Hy's Law"
          def="ALT or AST ≥ 3× ULN with concurrent total bilirubin ≥ 2× ULN, no alternative cause; predicts ≥10% mortality risk."
          zebra
        />
        <DefinitionRow
          term="ULN"
          def="Upper limit of normal for the laboratory performing the assay."
        />
      </div>

      <p className="text-[15px] leading-[165%] font-[var(--font-inter)] text-[#14161A]">
        Permanent discontinuation is required for ALT or AST &gt; 8× ULN, or for ALT or AST &gt;
        3× ULN with concurrent symptoms (fatigue, nausea, jaundice, right upper quadrant pain)
        lasting &gt; 4 weeks.
      </p>
    </div>
  );
}

function DefinitionRow({
  term,
  def,
  zebra,
}: {
  term: string;
  def: string;
  zebra?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[112px_1fr] gap-5 py-3.5 px-5 ${zebra ? "bg-[rgba(248,246,240,0.40)]" : ""}`}
    >
      <div className="font-[var(--font-display)] font-medium text-ink text-[13.5px] leading-[18px]">
        {term}
      </div>
      <div className="text-[13.5px] leading-[160%] font-[var(--font-inter)] text-muted">
        {def}
      </div>
    </div>
  );
}

function ProtocolFrame({
  messages,
  input,
  placeholder,
  avatar,
  clarifyCard,
  steps,
  reasonedChip,
  draftingText,
  narrativeIntroText,
  narrativeDraftPreview,
  acceptedChip,
  followUps,
  secondaryMessages,
  secondarySteps,
  tertiaryText,
  tertiaryDraftPreview,
  tertiaryAcceptedChip,
  tertiaryFollowUps,
  walkthrough,
}: SharedFrameProps) {
  return (
    <div className="[font-synthesis:none] flex gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 overflow-hidden">
      <div
        className={`relative ${FLOAT_COL} flex-1 min-w-0 ${
          walkthrough?.focus === "protocol-doc" ? "walkthrough-spotlight" : ""
        }`}
        data-walkthrough-focus={
          walkthrough?.focus === "protocol-doc" ? "protocol-doc" : undefined
        }
      >
        <ProtocolTabBar />
        <ProtocolDocBody padding="px-20" />
      </div>
      <CopilotRail
        messages={messages}
        input={input}
        placeholder={placeholder}
        clarifyCard={clarifyCard}
        steps={steps}
        reasonedChip={reasonedChip}
        draftingText={draftingText}
        narrativeIntroText={narrativeIntroText}
        narrativeDraftPreview={narrativeDraftPreview}
        acceptedChip={acceptedChip}
        followUps={followUps}
        secondaryMessages={secondaryMessages}
        secondarySteps={secondarySteps}
        tertiaryText={tertiaryText}
        tertiaryDraftPreview={tertiaryDraftPreview}
        tertiaryAcceptedChip={tertiaryAcceptedChip}
        tertiaryFollowUps={tertiaryFollowUps}
        walkthrough={walkthrough}
      />
    </div>
  );
}

function TraceMapModal({ walkthrough }: { walkthrough?: Walkthrough | null }) {
  const focused = walkthrough?.focus === "trace-graph";
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center px-6"
      style={{
        background: "rgba(20, 22, 26, 0.22)",
        backdropFilter: "blur(16px) saturate(120%)",
        WebkitBackdropFilter: "blur(16px) saturate(120%)",
      }}
    >
      <div
        className={`flex flex-col w-full max-w-[1090px] rounded-[20px] bg-paper shadow-modal overflow-hidden relative ${
          focused ? "walkthrough-spotlight" : ""
        }`}
        data-walkthrough-focus={focused ? "trace-graph" : undefined}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#14161A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <div className="font-[var(--font-display)] font-normal text-ink text-[18px] leading-[22px] truncate tracking-[-0.01em]">
              Aurora-IV · Phase III CSR · Traceability
            </div>
          </div>
          <div className="flex items-center gap-2 font-[var(--font-inconsolata)] text-[11px] leading-[14px] shrink-0">
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-[rgba(243,241,237,0.70)]">
              <div className="rounded-full size-1.5 bg-green" />
              <span className="text-muted">11 nodes · 14 edges</span>
            </div>
            <div className="flex items-center rounded-[8px] bg-paper border border-hairline overflow-hidden">
              <div className="px-2.5 py-1 text-muted border-r border-hairline">−</div>
              <div className="px-2.5 py-1 text-ink border-r border-hairline tabular-nums">100%</div>
              <div className="px-2.5 py-1 text-muted border-r border-hairline">+</div>
              <div className="px-2.5 py-1 text-faint">⤢ fit</div>
            </div>
            <div className="text-muted text-base leading-4 px-2 py-1">×</div>
          </div>
        </div>
        <div className="grow relative overflow-hidden bg-paper" style={{ aspectRatio: "1090 / 560" }}>
          <TraceMapCanvas />
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-hairline font-[var(--font-inter)] text-[11px] leading-[14px] text-faint shrink-0">
          <div>drag to pan · scroll to zoom · click a node to open as tab</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-[3px] border border-coral bg-coral-soft" />
              <span className="text-muted">current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] bg-coral rounded-full" />
              <span className="text-muted">strong</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-px bg-hairline-strong" />
              <span className="text-muted">moderate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TRACE_NODES: {
  x: number;
  y: number;
  w: number;
  badge: "md" | "csv" | "pdf";
  name: string;
  sub: string;
  highlight?: boolean;
}[] = [
  { x: 70, y: 50, w: 144, badge: "pdf", name: "Protocol_v4.2", sub: "§6.3 monitoring" },
  { x: 70, y: 138, w: 144, badge: "csv", name: "Phase3-LFT", sub: "27 rows · ALT > 3× ULN" },
  { x: 70, y: 226, w: 144, badge: "md", name: "Phase2-CSR-007", sub: "§5.2 hepatic" },
  { x: 70, y: 314, w: 144, badge: "csv", name: "AE-MedDRA-29.0", sub: "hepatic PT mapping" },
  { x: 270, y: 94, w: 144, badge: "pdf", name: "SAP-v2.0", sub: "analysis plan" },
  { x: 270, y: 270, w: 144, badge: "pdf", name: "IB-v3.1", sub: "Investigator Bro…" },
  { x: 462, y: 182, w: 160, badge: "md", name: "CSR-014.md", sub: "§12.4 hepatic AE", highlight: true },
  { x: 670, y: 94, w: 144, badge: "md", name: "Module-2.5", sub: "Clinical overview" },
  { x: 670, y: 270, w: 144, badge: "md", name: "Module-2.7", sub: "Safety summary" },
  { x: 870, y: 138, w: 144, badge: "md", name: "Reviewer-QA", sub: "12 internal QA" },
  { x: 870, y: 226, w: 144, badge: "pdf", name: "DSUR-2025", sub: "Annual safety update" },
];

function TraceMapCanvas() {
  // Coordinate space matches Paper artboard (1090 × 560).
  const W = 1090;
  const H = 560;
  return (
    <div className="absolute inset-0">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          <marker id="arrow-muted" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#EBE9E1" />
          </marker>
          <marker id="arrow-strong" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#FF4E49" />
          </marker>
        </defs>
        {/* incoming edges from left column → CSR-014.md */}
        <path
          d="M 214 78 L 360 78 L 360 200 L 462 200"
          stroke="#EBE9E1"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 214 166 L 380 166 L 380 206 L 462 206"
          stroke="#FF4E49"
          strokeWidth="1.6"
          fill="none"
          markerEnd="url(#arrow-strong)"
          opacity="0.85"
        />
        <path
          d="M 214 254 L 380 254 L 380 214 L 462 214"
          stroke="#EBE9E1"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 214 342 L 360 342 L 360 220 L 462 220"
          stroke="#EBE9E1"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        {/* SAP / IB → CSR */}
        <path
          d="M 414 122 L 450 122 L 450 204 L 462 204"
          stroke="#EBE9E1"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 414 298 L 450 298 L 450 216 L 462 216"
          stroke="#EBE9E1"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        {/* CSR-014.md → Module-2.5 / Module-2.7 (rolls up) */}
        <path
          d="M 622 210 L 650 210 L 650 122 L 670 122"
          stroke="#FF4E49"
          strokeWidth="1.6"
          fill="none"
          markerEnd="url(#arrow-strong)"
          opacity="0.85"
        />
        <path
          d="M 622 210 L 650 210 L 650 298 L 670 298"
          stroke="#FF4E49"
          strokeWidth="1.6"
          fill="none"
          markerEnd="url(#arrow-strong)"
          opacity="0.85"
        />
        {/* Module-2.5 → Reviewer-QA / Module-2.7 → DSUR-2025 */}
        <path
          d="M 814 122 L 850 122 L 850 166 L 870 166"
          stroke="#EBE9E1"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 814 298 L 850 298 L 850 226 L 870 226"
          stroke="#EBE9E1"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
      </svg>

      {/* nodes (HTML overlay positioned in the same 1090×560 coordinate space) */}
      {TRACE_NODES.map((n) => (
        <TraceNode
          key={n.name}
          left={(n.x / W) * 100}
          top={(n.y / H) * 100}
          width={(n.w / W) * 100}
          height={(56 / H) * 100}
          badge={n.badge}
          name={n.name}
          sub={n.sub}
          highlight={n.highlight}
        />
      ))}

      {/* edge labels */}
      <TraceEdgeLabel left={(340 / W) * 100} top={(181 / H) * 100} label="cites" />
      <TraceEdgeLabel left={(638 / W) * 100} top={(151 / H) * 100} label="rolls up" />

      {/* minimap */}
      <div
        className="absolute rounded-[8px] bg-[rgba(255,255,255,0.90)] backdrop-blur-sm border border-hairline shadow-card overflow-hidden"
        style={{
          right: `${(18 / W) * 100}%`,
          bottom: `${(18 / H) * 100}%`,
          width: `${(140 / W) * 100}%`,
          height: `${(80 / H) * 100}%`,
        }}
      >
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 gap-px p-1.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-[2px] ${
                i === 7 ? "bg-coral" : i % 3 === 0 ? "bg-hairline-strong" : "bg-soft"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TraceEdgeLabel({
  left,
  top,
  label,
}: {
  left: number;
  top: number;
  label: string;
}) {
  return (
    <div
      className="absolute rounded-full py-0.5 px-2 bg-paper border border-hairline -translate-y-1/2 shadow-card"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="font-[var(--font-inconsolata)] text-muted text-[10px] leading-3 whitespace-nowrap tracking-[0.02em]">
        {label}
      </div>
    </div>
  );
}

function TraceNode({
  left,
  top,
  width,
  height,
  badge,
  name,
  sub,
  highlight,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  badge: "md" | "csv" | "pdf";
  name: string;
  sub: string;
  highlight?: boolean;
}) {
  const badgeStyles =
    badge === "csv"
      ? "bg-green-soft text-green"
      : badge === "pdf"
        ? "bg-pink text-pink-ink"
        : "bg-soft text-faint";
  return (
    <div
      data-click-hint={highlight ? "trace-node-current" : undefined}
      className={`absolute flex items-center gap-2 px-3 rounded-[14px] bg-paper transition-shadow ${
        highlight
          ? "ring-[1.5px] ring-coral shadow-[0_0_0_6px_rgba(255,78,73,0.08),0_4px_14px_-4px_rgba(255,78,73,0.20)]"
          : "border border-hairline shadow-card"
      }`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      <div className={`rounded-[4px] py-0.5 px-[5px] shrink-0 font-[var(--font-inconsolata)] font-bold text-[9.5px] leading-3 tracking-[0.02em] uppercase ${badgeStyles}`}>
        {badge}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="font-[var(--font-inconsolata)] text-ink text-[11px] leading-[14px] truncate">
          {name}
        </div>
        <div className="font-[var(--font-inconsolata)] text-faint text-[9.5px] leading-[12px] truncate">
          {sub}
        </div>
      </div>
    </div>
  );
}

function TraceMapFrame({
  messages,
  input,
  placeholder,
  avatar,
  preparingNarrative,
  clarifyCard,
  steps,
  hideGrade3,
  narrativeDraft,
  narrativeBody,
  tertiaryDocDraft,
  tertiaryDocParagraph,
  reasonedChip,
  draftingText,
  narrativeIntroText,
  narrativeDraftPreview,
  acceptedChip,
  followUps,
  secondaryMessages,
  secondarySteps,
  tertiaryText,
  tertiaryDraftPreview,
  tertiaryAcceptedChip,
  tertiaryFollowUps,
  walkthrough,
}: SharedFrameProps) {
  return (
    <div className="[font-synthesis:none] flex gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 relative overflow-hidden">
      <div className={`${FLOAT_COL} flex-1 min-w-0`}>
        <DocTabBar tabDirty={true} />
        <CSRDocBody
          hideGrade3={hideGrade3}
          preparingNarrative={preparingNarrative}
          narrativeDraft={narrativeDraft}
          narrativeBody={narrativeBody}
          tertiaryDocDraft={tertiaryDocDraft}
          tertiaryDocParagraph={tertiaryDocParagraph}
          padding="px-16"
        />
      </div>
      <CopilotRail
        messages={messages}
        input={input}
        placeholder={placeholder}
        clarifyCard={clarifyCard}
        steps={steps}
        reasonedChip={reasonedChip}
        draftingText={draftingText}
        narrativeIntroText={narrativeIntroText}
        narrativeDraftPreview={narrativeDraftPreview}
        acceptedChip={acceptedChip}
        followUps={followUps}
        secondaryMessages={secondaryMessages}
        secondarySteps={secondarySteps}
        tertiaryText={tertiaryText}
        tertiaryDraftPreview={tertiaryDraftPreview}
        tertiaryAcceptedChip={tertiaryAcceptedChip}
        tertiaryFollowUps={tertiaryFollowUps}
        walkthrough={walkthrough}
      />
      <TraceMapModal walkthrough={walkthrough} />
    </div>
  );
}

function PreparingBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col mt-[18px] py-2.5 px-4 gap-2 bg-[rgba(255,246,224,0.70)] border-l-[2px] border-l-warning rounded-r-[8px]">
      <div className="flex items-center gap-2">
        <motion.div
          className="rounded-full shrink-0 bg-warning size-1.5"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-muted text-[10px] leading-3 uppercase">
          Preparing
        </div>
        <div className="font-[var(--font-inter)] text-muted text-[11.5px] leading-[14px]">
          §12.4 hepatic AE narrative · awaiting clarification
        </div>
      </div>
      <div className="text-[15px] leading-[165%] font-[var(--font-inter)] text-ink">
        {children}
      </div>
    </div>
  );
}

function NarrativeDraftBlock({ draft }: { draft: NarrativeDraft }) {
  const versionKey = `${draft.version}-${draft.framing}`;
  return (
    <div className="flex flex-col mt-[18px] py-3 px-[18px] gap-3 bg-[rgba(255,246,224,0.60)] border-l-[2px] border-l-warning rounded-r-[8px]">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <PrevNextNav size="md" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={versionKey}
              {...fadeIn}
              className="font-[var(--font-inconsolata)] text-ink text-[12px] leading-4"
            >
              v{draft.version} of {draft.total} · <span className="text-muted">{draft.framing}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-[8px] py-1 px-2.5 gap-1.5 bg-coral shadow-card">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polyline points="5,12 10,17 19,7" />
            </svg>
            <div className="font-[var(--font-inter)] font-medium text-white text-[11.5px] leading-[14px]">
              Accept
            </div>
          </div>
          <div className="flex items-center rounded-[8px] py-1 px-2.5 gap-1.5 bg-paper border border-hairline">
            <div className="font-[var(--font-inter)] text-muted text-[11.5px] leading-[14px]">
              Cancel
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`body-${versionKey}`}
          {...fadeIn}
          className="text-[15px] leading-[165%] font-[var(--font-inter)] text-ink"
        >
          {draft.body}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PrevNextNav({ size }: { size: "sm" | "md" }) {
  const isMd = size === "md";
  const buttonSize = isMd ? "size-7" : "size-6";
  const fontSize = isMd ? "text-[14px]" : "text-[12px]";
  return (
    <div className="flex items-center gap-1">
      <div className={`flex items-center justify-center rounded-full bg-paper border border-hairline ${buttonSize}`}>
        <div className={`font-[var(--font-inconsolata)] text-muted leading-none ${fontSize}`}>‹</div>
      </div>
      <div className={`flex items-center justify-center rounded-full bg-paper border border-hairline ${buttonSize}`}>
        <div className={`font-[var(--font-inconsolata)] text-coral leading-none ${fontSize}`}>›</div>
      </div>
    </div>
  );
}

function ReasonedChipView({ label, expanded }: { label: string; expanded?: boolean }) {
  return (
    <div
      data-click-hint="reasoned-chip"
      className="flex items-center rounded-full py-1 px-3 gap-2 bg-[rgba(243,241,237,0.70)]"
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#19A875"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <polyline points="5,12 10,17 19,7" />
      </svg>
      <div className="font-[var(--font-inter)] text-muted text-[11.5px] leading-[14px]">
        {label}
      </div>
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 text-faint transition-transform duration-200 ${
          expanded ? "rotate-180" : "rotate-0"
        }`}
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </div>
  );
}

function NarrativeDraftPreviewCard({ preview }: { preview: NarrativeDraftPreview }) {
  const key = `${preview.version}-${preview.framing}`;
  return (
    <div className="flex flex-col rounded-[14px] overflow-clip bg-paper border border-hairline-strong">
      <div className="flex items-center justify-between py-2 px-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PrevNextNav size="sm" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              {...fadeIn}
              className="font-[var(--font-inconsolata)] text-ink text-[11px] leading-[14px] truncate tracking-[0.01em]"
            >
              v{preview.version} of {preview.total} <span className="text-faint">·</span> <span className="text-muted">{preview.framing}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            data-click-hint="accept-button"
            className="flex items-center justify-center size-[26px] rounded-full bg-coral shadow-card"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polyline points="5,12 10,17 19,7" />
            </svg>
          </div>
          <div className="flex items-center justify-center size-[26px] rounded-full bg-paper border border-hairline">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#62656B"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </div>
        </div>
      </div>
      <div className="hairline-fade" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`p-${key}`} {...fadeIn} className="pt-2.5 pb-3 px-3.5">
          <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-ink">
            {preview.preview}
          </div>
          {preview.tags && preview.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {preview.tags.map((t) => (
                <div
                  key={t}
                  className="rounded-full px-2 py-0.5 bg-[rgba(243,241,237,0.80)] font-[var(--font-inconsolata)] text-faint text-[10px] leading-[14px] tracking-[0.02em] uppercase"
                >
                  {t}
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AcceptedChipView({ chip }: { chip: AcceptedChip }) {
  return (
    <div className="flex items-center rounded-full py-1 px-3 gap-2 bg-[rgba(228,246,236,0.70)]">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#19A875"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <polyline points="5,12 10,17 19,7" />
      </svg>
      <div className="font-[var(--font-inter)] text-green text-[11.5px] leading-[14px] font-medium">
        {chip.label}
      </div>
      {chip.revisit ? (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FF4E49"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 ml-0.5"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <polyline points="3,3 3,8 8,8" />
        </svg>
      ) : null}
    </div>
  );
}

function FollowUpPill({ label }: { label: string }) {
  return (
    <div className="flex items-center rounded-full py-1.5 px-3 gap-1.5 bg-paper border border-hairline">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-faint"
      >
        <polyline points="9,6 15,12 9,18" />
      </svg>
      <div className="font-[var(--font-inter)] text-ink text-[12px] leading-4">{label}</div>
    </div>
  );
}

function ClarifyCardView({ card }: { card: ClarifyCard }) {
  const tabs = Array.from({ length: card.total }, (_, i) => i + 1);
  const answered = card.status === "answered";

  return (
    <div className="flex flex-col rounded-[14px] bg-paper border border-hairline-strong">
      <div className="flex items-center justify-between pt-3.5 pb-1 px-4">
        <div className="flex items-center gap-2">
          {tabs.map((n) => {
            const completed = answered || n < card.current;
            const active = !answered && n === card.current;
            return (
              <div
                key={n}
                className="flex items-center gap-1.5 transition-colors duration-200"
              >
                <div
                  className={`size-1.5 rounded-full transition-colors duration-200 ${
                    completed ? "bg-green" : active ? "bg-coral" : "bg-hairline"
                  }`}
                />
                <div
                  className={`font-[var(--font-inconsolata)] text-[10px] leading-[14px] tracking-[0.02em] transition-colors duration-200 ${
                    completed ? "text-green" : active ? "text-coral" : "text-faint"
                  }`}
                >
                  Q{n}
                </div>
              </div>
            );
          })}
        </div>
        {!answered ? (
          <div className="font-[var(--font-inconsolata)] text-faint text-[10px] leading-[14px] tracking-[0.02em]">
            {card.current} / {card.total}
          </div>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {answered ? (
          <motion.div
            key="answered"
            {...fadeIn}
            className="flex flex-col pb-3 px-3"
          >
            <div className="flex items-center gap-2.5 px-1.5 pt-2 pb-1">
              <div className="grow font-[var(--font-inter)] italic text-muted text-[13px] leading-[155%]">
                {card.answeredText ?? "All questions answered…"}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="question" {...fadeIn}>
            <div className="pt-2 pb-3.5 px-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={card.question}
                  {...fadeIn}
                  className="text-[16px] leading-[135%] font-[var(--font-display)] font-medium text-ink tracking-[-0.01em]"
                >
                  {card.question}
                </motion.div>
              </AnimatePresence>
            </div>
            <ClarifyOptions card={card} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClarifyOptions({ card }: { card: ClarifyCard }) {
  return (
    <div className="flex flex-col pb-3 gap-1.5 px-3">
      {(card.options ?? []).map((opt, i) => (
          <motion.div
            key={i}
            whileTap={{ scale: 0.99 }}
            className={`flex items-center rounded-[10px] gap-2.5 py-2.5 px-3 transition-colors duration-200 ${
              opt.selected
                ? "bg-coral-soft"
                : "bg-[rgba(243,241,237,0.50)]"
            }`}
          >
            <div className="grow font-[var(--font-inter)] text-ink text-[13px] leading-[18px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={opt.label} {...fadeIn}>
                  {opt.label}
                </motion.div>
              </AnimatePresence>
            </div>
            <AnimatePresence initial={false}>
              {opt.selected ? (
                <motion.svg
                  key="check"
                  {...fadeIn}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF4E49"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <polyline points="5,12 10,17 19,7" />
                </motion.svg>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ))}

        {card.somethingElseText ? (
          <div className="flex items-center gap-2.5 py-2 px-3">
            {card.shortcut ? (
              <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0 rounded-[4px] border border-dashed border-hairline-strong">
                <div className="font-[var(--font-inconsolata)] font-bold text-faint text-[10px] leading-3">
                  {card.shortcut}
                </div>
              </div>
            ) : null}
            <div className="grow font-[var(--font-inter)] italic text-muted text-[13px] leading-4">
              {card.somethingElseText}
            </div>
          </div>
        ) : null}
    </div>
  );
}

function SummaryChip({ choices }: { choices: string[] }) {
  return (
    <div className="flex items-center self-start rounded-full py-1.5 px-3 gap-2 bg-[rgba(243,241,237,0.70)]">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#19A875"
        strokeWidth="2.5"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <polyline points="5,12 10,17 19,7" />
      </svg>
      <div className="font-[var(--font-inter)] text-muted text-[11.5px] leading-[14px]">
        {choices.join(" · ")}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const ringClass = step.highlight ? "ring-1 ring-[rgba(79,168,228,0.60)]" : "";
  return (
    <div className={`flex flex-col rounded-[12px] overflow-clip bg-paper border border-hairline ${ringClass}`}>
      <div className="flex items-center justify-between py-2 px-3 gap-2 border-b border-hairline">
        <div className="flex items-center gap-2 min-w-0">
          <AnimatePresence initial={false}>
            {step.done ? (
              <motion.svg
                key="check"
                {...fadeIn}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#19A875"
                strokeWidth="2.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <polyline points="5,12 10,17 19,7" />
              </motion.svg>
            ) : null}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.title}
              {...fadeIn}
              className="font-[var(--font-inter)] text-ink text-[12.5px] leading-tight truncate font-medium"
            >
              {step.title}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="font-[var(--font-inconsolata)] text-faint text-[10px] leading-3 tracking-[0.02em] shrink-0">
          {step.step}
        </div>
      </div>
      <div className="flex flex-col">
        <FileRow file={step.file} expanded={!step.done || !!step.body} />
        <AnimatePresence initial={false}>
          {step.body ? (
            <motion.div key="body" {...fadeIn}>
              {step.body.kind === "csv" ? (
                <StepBodyCsv body={step.body} />
              ) : (
                <StepBodyNarrative body={step.body} />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FileBadge({ file }: { file: StepFile }) {
  const styles =
    file.badgeStyle === "csv"
      ? "bg-green-soft text-green"
      : file.badgeStyle === "pdf"
        ? "bg-pink text-pink-ink"
        : "bg-soft text-faint";
  return (
    <div
      className={`rounded-[4px] py-0.5 px-[5px] font-[var(--font-inconsolata)] font-bold text-[9.5px] leading-3 tracking-[0.02em] uppercase ${styles}`}
    >
      {file.badge}
    </div>
  );
}

function FileRow({ file, expanded }: { file: StepFile; expanded: boolean }) {
  return (
    <div
      data-click-hint={expanded ? undefined : "file-row"}
      className={`flex items-center justify-between py-2 px-3 transition-colors duration-200 ${
        expanded ? "bg-[rgba(248,246,240,0.60)] border-b border-hairline" : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileBadge file={file} />
        <div className="font-[var(--font-inconsolata)] text-ink text-[11px] leading-[14px] truncate">
          {file.fileName}
        </div>
        {file.section ? (
          <div className="font-[var(--font-inconsolata)] text-faint text-[10px] leading-3 shrink-0">
            {file.section}
          </div>
        ) : null}
      </div>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 transition-transform duration-200 ${
          expanded ? "rotate-180 text-muted" : "rotate-0 text-faint"
        }`}
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </div>
  );
}

function StepBodyCsv({
  body,
}: {
  body: Extract<StepBody, { kind: "csv" }>;
}) {
  const weights = body.colWeights ?? body.columns.map(() => 1);
  return (
    <div className="flex flex-col">
      <div className="flex items-center py-1.5 px-2.5 gap-1.5">
        <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3 tracking-[0.04em]">
          {body.rangeText}
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#9C9EA3] text-[10px] leading-3">·</div>
        <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3 tracking-[0.04em]">
          {body.filter}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex py-1.5 px-3">
          {body.columns.map((c, i) => (
            <div
              key={c}
              style={{ flex: `${weights[i]} 1 0%` }}
              className={`tracking-[0.04em] uppercase font-[var(--font-inconsolata)] font-bold text-faint text-[9.5px] leading-3 ${
                i === 0 || i === 1 ? "" : "text-right"
              }`}
            >
              {c}
            </div>
          ))}
        </div>
        {body.rows.map((row, ri) => (
          <div
            key={ri}
            className={`flex py-1.5 px-3 ${
              row.highlight ? "bg-[rgba(255,217,229,0.40)]" : ri % 2 === 1 ? "bg-[rgba(248,246,240,0.60)]" : ""
            }`}
          >
            {row.values.map((v, vi) => {
              const isOutcome = vi === row.values.length - 1;
              const align = vi === 0 || vi === 1 ? "" : "text-right";
              const accent = row.outcomeAccent && isOutcome ? "font-bold text-pink-ink" : "text-muted";
              const muted = row.outcomeAccent && isOutcome ? false : isOutcome;
              return (
                <div
                  key={vi}
                  style={{ flex: `${weights[vi]} 1 0%` }}
                  className={`font-[var(--font-inconsolata)] text-[10.5px] leading-[13px] ${align} ${accent} ${
                    muted ? "text-muted" : ""
                  }`}
                >
                  {v}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between py-2 px-3 border-t border-hairline">
        <div className="font-[var(--font-inconsolata)] text-faint text-[10px] leading-3 tracking-[0.02em]">
          {body.moreRowsText}
        </div>
        <div className="font-[var(--font-inter)] font-medium text-coral text-[10.5px] leading-3 tracking-[-0.005em]">
          Open in editor ↗
        </div>
      </div>
    </div>
  );
}

function StepBodyNarrative({
  body,
}: {
  body: Extract<StepBody, { kind: "narrative" }>;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center py-2 px-3 gap-1.5">
        <div className="tracking-[0.04em] uppercase font-[var(--font-inconsolata)] text-faint text-[9.5px] leading-3">
          {body.sectionLabel}
        </div>
        <div className="text-faint text-[10px] leading-3">·</div>
        <div className="font-[var(--font-inter)] text-muted text-[11px] leading-[14px]">
          {body.sectionTitle}
        </div>
      </div>
      <div className="px-3 pb-2.5">
        <div className="font-[var(--font-inter)] text-muted text-[12px] leading-[155%]">
          {body.body}
        </div>
      </div>
      {body.definitions ? (
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 pt-1.5 pb-2.5 px-3 border-t border-hairline">
          {body.definitions.map((d) => (
            <Fragment key={d.term}>
              <div className="font-[var(--font-inconsolata)] text-faint text-[10px] leading-[14px] tracking-[0.04em] uppercase whitespace-nowrap">
                {d.term}
              </div>
              <div className="font-[var(--font-inter)] text-muted text-[11.5px] leading-[155%]">
                {d.def}
              </div>
            </Fragment>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between py-2 px-3 border-t border-hairline">
        <div className="font-[var(--font-inconsolata)] text-faint text-[10px] leading-3 tracking-[0.02em]">
          {body.footerText}
        </div>
        <div className="font-[var(--font-inter)] font-medium text-coral text-[10.5px] leading-3 tracking-[-0.005em]">
          Open in editor ↗
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="font-[var(--font-inter)] text-faint text-[10.5px] leading-[14px]">
          you · {message.time}
        </div>
        <div className="max-w-[280px] rounded-[14px] py-2 px-3.5 bg-[rgba(243,241,237,0.70)]">
          <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-ink">
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  const isThinking = message.state === "thinking";
  const hasSummary = !!message.summary;
  const hasBody = hasSummary || isThinking || !!message.text;
  const bodyKey = hasSummary
    ? `summary:${message.summary!.join("|")}`
    : `text:${message.text ?? ""}-${message.state ?? "final"}`;

  return (
    <div className="flex flex-col gap-1 relative">
      <div className="flex items-center gap-1.5">
        <div className="rounded-full shrink-0 bg-coral size-1.5" />
        <div className="font-[var(--font-inter)] text-faint text-[10.5px] leading-[14px]">
          peer · {message.time}
        </div>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {hasSummary ? (
          <motion.div key={bodyKey} {...fadeIn}>
            <SummaryChip choices={message.summary!} />
          </motion.div>
        ) : hasBody ? (
          <motion.div
            key={bodyKey}
            {...fadeIn}
            className={`text-[13px] leading-[155%] font-[var(--font-inter)] ${
              isThinking ? "italic text-muted" : "text-ink"
            }`}
          >
            {message.text}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  a,
  b,
  zebra,
  muted,
}: {
  label: string;
  a: string;
  b: string;
  zebra?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-center py-2.5 px-5 ${zebra ? "bg-[rgba(248,246,240,0.60)]" : ""}`}>
      <div className="basis-0 grow-[2] shrink font-[var(--font-inter)] text-ink text-[13.5px] leading-[18px]">
        {label}
      </div>
      <div
        className={`basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] text-[13.5px] leading-[18px] tabular-nums ${
          muted ? "text-faint" : "text-ink"
        }`}
      >
        {a}
      </div>
      <div
        className={`basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] text-sm leading-[18px] ${
          muted ? "text-[#9C9EA3]" : "text-[#14161A]"
        }`}
      >
        {b}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// SEP-BACK — black separator slide marking the boundary between the forward
// chat's frames (above) and the backwards chat's frames (below).
// ───────────────────────────────────────────────────────────────────────────

function SeparatorFrame() {
  return (
    <div className="flex w-full h-full items-center justify-center bg-black">
      <div className="font-[var(--font-inconsolata)] text-[rgba(255,255,255,0.40)] text-[11px] leading-[14px] tracking-[0.18em] uppercase">
        backwards section ↓
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PTV-0 — v2 · 14  Traceability map @ 100%
// Self-contained copy of the Paper artboard. Independent of CSRDocFrame so
// the forward-working chat can keep evolving CSRDocFrame without disturbing
// this layout.
// ───────────────────────────────────────────────────────────────────────────

function TraceabilityFrame() {
  return (
    <div className="[font-synthesis:none] flex overflow-hidden w-full h-full flex-col bg-white antialiased text-xs/4 relative">
      {/* Top nav */}
      <div className="flex items-center h-14 w-full shrink-0 px-6 gap-4 bg-white border-b border-[#EBE9E1]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center shrink-0 size-6">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF4E49"
              strokeWidth="1.7"
              strokeLinecap="round"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <circle cx="9" cy="12" r="4.5" />
              <circle cx="15" cy="12" r="4.5" />
            </svg>
          </div>
          <div className="font-[var(--font-inter)] font-semibold text-[#FF4E49] text-[18px] leading-[22px]">
            Peer
          </div>
        </div>

        <div className="flex items-center ml-6 gap-2 font-[var(--font-inconsolata)] text-[13px] leading-4">
          <span className="text-[#14161A]">Aurora-IV</span>
          <span className="text-[#9C9EA3]">/</span>
          <span className="text-[#14161A]">Phase III CSR</span>
          <span className="text-[#9C9EA3]">/</span>
          <span className="text-[#14161A]">Module 5.3.5</span>
          <span className="text-[#9C9EA3]">/</span>
          <span className="text-[#14161A]">CSR-014.md</span>
        </div>

        <div className="grow" />

        <div className="flex items-center gap-1.5">
          <div className="rounded-full shrink-0 bg-[#19A875] size-1.5" />
          <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[13px] leading-4">
            auto-saved · 14:02
          </div>
        </div>
        <div className="flex items-center justify-center rounded-full shrink-0 size-7 bg-white border border-[#EBE9E1]">
          <div className="font-[var(--font-inconsolata)] font-bold text-[#14161A] text-[11px] leading-[14px]">
            AN
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex grow w-full min-h-0">
        {/* Workspace sidebar */}
        <div className="flex flex-col w-[220px] shrink-0 min-h-0 bg-white border-r border-[#EBE9E1]">
          <div className="flex items-center justify-between pt-5 pb-3 px-4">
            <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#9C9EA3] text-[11px] leading-[14px]">
              WORKSPACE
            </div>
            <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0 font-[var(--font-inconsolata)] text-[#9C9EA3] text-sm leading-[18px]">
              +
            </div>
          </div>

          <WorkspaceGroup label="Drafts" count={3}>
            <WorkspaceItem badge="md" name="CSR-014.md" active />
            <WorkspaceItem badge="md" name="Module-2.7-summary.md" />
            <WorkspaceItem badge="md" name="CSR-013-narrative.md" />
          </WorkspaceGroup>

          <WorkspaceGroup label="Evidence" count={2}>
            <WorkspaceItem badge="csv" badgeStyle="csv" name="Phase3-LFT-Listings.csv" />
            <WorkspaceItem badge="csv" badgeStyle="csv" name="AE-MedDRA-29.0.csv" />
          </WorkspaceGroup>

          <WorkspaceGroup label="References" count={2}>
            <WorkspaceItem badge="pdf" badgeStyle="pdf" name="Aurora-IV_Protocol_v..." />
            <WorkspaceItem badge="md" name="Phase2-CSR-007.md" />
          </WorkspaceGroup>
        </div>

        {/* Editor column */}
        <div className="flex flex-col grow min-w-0 min-h-0 bg-white">
          {/* Tab bar — file-tree icon on left, side-by-side button on right */}
          <div className="flex items-end h-12 shrink-0 px-4 gap-1.5 border-b border-[#EBE9E1]">
            <div className="flex items-center justify-center self-center rounded-md shrink-0 bg-white ring-1 ring-[#EBE9E1] size-8">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#14161A"
                strokeWidth="1.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <polygon
                  points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"
                  strokeLinejoin="round"
                />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
            </div>
            <div className="flex items-center h-9 -mb-px px-3 gap-2 bg-white border-t border-l border-r border-t-[#FF4E49] border-l-[#EBE9E1] border-r-[#EBE9E1] rounded-t-lg">
              <div className="rounded-[3px] py-0.5 px-1 bg-[#F3F1ED]">
                <div className="font-[var(--font-inconsolata)] font-bold text-[#62656B] text-[9px] leading-3">
                  md
                </div>
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#14161A] text-[13px] leading-4">
                CSR-014.md
              </div>
              <div className="ml-1 font-[var(--font-inconsolata)] text-[#9C9EA3] text-sm leading-[18px]">
                ×
              </div>
            </div>
            <div className="grow" />
            <div className="flex items-center self-center rounded-md py-1.5 px-2.5 gap-1.5 bg-white border border-[#EBE9E1]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#14161A"
                strokeWidth="1.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <rect x="3" y="4" width="18" height="16" rx="1.5" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              <div className="font-[var(--font-inconsolata)] text-[#14161A] text-xs leading-4">
                side-by-side
              </div>
            </div>
          </div>

          {/* Doc body */}
          <div className="flex flex-col grow pt-8 overflow-auto px-20 min-h-0 relative">
            <div className="flex items-center mb-3 gap-2.5 font-[var(--font-inconsolata)] text-[11px] leading-[14px]">
              <span className="tracking-[0.06em] font-bold text-[#14161A]">SECTION 12.4</span>
              <span className="tracking-[0.04em] text-[#9C9EA3]">—</span>
              <span className="tracking-[0.04em] text-[#62656B]">Phase III</span>
              <span className="tracking-[0.04em] text-[#9C9EA3]">·</span>
              <span className="tracking-[0.04em] text-[#62656B]">Aurora-IV</span>
              <span className="tracking-[0.04em] text-[#9C9EA3]">·</span>
              <span className="tracking-[0.04em] text-[#62656B]">Hepatic Adverse Events</span>
            </div>

            <h1 className="text-[36px] leading-[115%] tracking-[-0.005em] mb-[18px] font-[var(--font-inter)] text-[#14161A]">
              Hepatic adverse events
            </h1>

            <p className="text-[15px] leading-[165%] mb-6 font-[var(--font-inter)] text-[#14161A]">
              Aurora-IV is administered orally once daily and is metabolized primarily through
              hepatic CYP3A4 pathways. The Phase III safety database includes 891 randomized
              participants across 47 sites, with hepatic monitoring performed every two weeks
              during the first cycle and monthly thereafter, per the protocol&apos;s
              risk-management plan.
            </p>

            <div className="flex flex-col mb-[18px] rounded-[10px] overflow-clip bg-white border border-[#EBE9E1]">
              <div className="flex items-center justify-between py-3.5 px-[18px] bg-[#F3F1ED] border-b border-[#EBE9E1]">
                <div className="flex items-baseline gap-2.5">
                  <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#62656B] text-[11px] leading-[14px]">
                    TABLE 12.4-1
                  </div>
                  <div className="font-[var(--font-inter)] italic text-[#14161A] text-sm leading-[18px]">
                    Hepatic adverse events by grade and treatment arm
                  </div>
                </div>
              </div>

              <div className="flex py-2.5 px-[18px] bg-white border-b border-[#EBE9E1] font-[var(--font-inconsolata)] font-bold text-[#9C9EA3] text-[11px] leading-[14px] tracking-[0.06em]">
                <div className="basis-0 grow-[2] shrink">GRADE</div>
                <div className="basis-0 grow-[1.4] shrink text-right">AURORA-IV (n=598)</div>
                <div className="basis-0 grow-[1.4] shrink text-right">PLACEBO (n=293)</div>
              </div>

              <Row label="Grade 1 — transient" a="34  (5.7%)" b="7  (2.4%)" />
              <Row label="Grade 2 — ALT 3–5× ULN" a="13  (2.2%)" b="4  (1.4%)" zebra />
              <Row label="Grade 3 — ALT > 5× ULN" a="2  (0.3%)" b="1  (0.3%)" />
              <Row label="Grade 4" a="0  (0.0%)" b="0  (0.0%)" zebra muted />

              <div className="flex items-center py-3 px-[18px] bg-white border-t border-[#14161A]">
                <div className="basis-0 grow-[2] shrink font-[var(--font-inter)] font-semibold text-[#14161A] text-sm leading-[18px]">
                  Total — any grade
                </div>
                <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-[#14161A] text-sm leading-[18px]">
                  49  (8.2%)
                </div>
                <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-[#14161A] text-sm leading-[18px]">
                  12  (4.1%)
                </div>
              </div>
            </div>

            {/* Comparative narrative — claims underlined for source provenance */}
            <p className="flex flex-wrap items-baseline mt-[18px] text-[15px] leading-[165%] font-[var(--font-inter)] text-[#14161A] gap-x-[5px]">
              <span>The hepatic AE rate in</span>
              <span className="underline-offset-[3px] [text-decoration:underline_1.5px_#19A875]">
                Aurora-IV (8.2%; n=49/598)
              </span>
              <span>tracks the</span>
              <span className="underline-offset-[3px] [text-decoration:underline_1.5px_#9C9EA3]">
                Phase 2 finding (7.6%; n=18/237)
              </span>
              <span>
                , suggesting a stable safety profile across studies. Most events
                resolved without intervention within a median of 14 days. Two Grade 3 events met
                DILI criteria; both resolved on discontinuation. No Hy&apos;s Law cases were
                observed.
              </span>
            </p>
          </div>
        </div>

        {/* Copilot rail */}
        <div className="flex flex-col w-[340px] shrink-0 min-h-0 bg-white border-l border-[#EBE9E1]">
          <div className="flex flex-col shrink-0 pt-3.5 border-b border-[#EBE9E1] px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full shrink-0 bg-[#FFEEEC]">
                  <div className="rounded-full shrink-0 bg-[#FF4E49] size-2" />
                </div>
                <div className="tracking-[-0.005em] font-[var(--font-inter)] font-medium text-[#14161A] text-xl leading-6">
                  Copilot
                </div>
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                peer-csr-v3
              </div>
            </div>
            {/* Toolbar */}
            <div className="flex items-center mb-3.5 gap-1.5">
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-white border border-[#EBE9E1]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14161A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-white border border-[#EBE9E1]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14161A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
              </div>
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-white border border-[#EBE9E1]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF4E49"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <circle cx="9" cy="12" r="4" />
                  <circle cx="15" cy="12" r="4" />
                </svg>
              </div>
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-[#FFD9E5] border border-[#FFD9E5]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C13075"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <circle cx="11.5" cy="14.5" r="2.2" />
                  <path d="m13.2 16.2 1.6 1.6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col grow pt-[18px] overflow-auto gap-3.5 px-4 min-h-0">
            {/* Context pill */}
            <div className="flex items-center self-start rounded-lg py-1.5 px-2.5 gap-2 bg-[#F3F1ED] border border-[#EBE9E1]">
              <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#9C9EA3] text-[9px] leading-3">
                CONTEXT
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#14161A] text-[11px] leading-[14px]">
                CSR-014.md · §12.4
              </div>
            </div>

            {/* User message */}
            <div className="flex flex-col items-end gap-1">
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                you · 14:03
              </div>
              <div className="max-w-[260px] rounded-[10px] py-2 px-3 bg-[#F3F1ED]">
                <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#14161A]">
                  Draft the §12.4 hepatic AE narrative.
                </div>
              </div>
            </div>

            {/* Peer message */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="rounded-full shrink-0 bg-[#FF4E49] size-1.5" />
                <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                  peer · 14:03
                </div>
              </div>
              <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#14161A]">
                Opened traceability map.
              </div>
            </div>

            {/* Accepted-state pills */}
            <div className="flex items-center self-start rounded-lg py-1.5 px-2.5 gap-2 bg-[#F3F1ED] border border-[#EBE9E1]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#19A875"
                strokeWidth="2.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <polyline points="5,12 10,17 19,7" />
              </svg>
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                Magnitude · Subgroup table · Phase 2 inline
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#9C9EA3] text-[11px] leading-[14px]">
                ▾
              </div>
            </div>
            <div className="flex items-center self-start rounded-full py-1.5 px-2.5 gap-2 bg-white border border-[#EBE9E1]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#19A875"
                strokeWidth="2.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <polyline points="5,12 10,17 19,7" />
              </svg>
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                Reasoned · 6 steps · 12s
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#9C9EA3] text-[11px] leading-[14px]">
                ▾
              </div>
            </div>
            <div className="flex items-center self-start rounded-full py-1.5 px-2.5 gap-2 bg-white border border-[#EBE9E1]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#19A875"
                strokeWidth="2.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <polyline points="5,12 10,17 19,7" />
              </svg>
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                Accepted · v3 comparative
              </div>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF4E49"
                strokeWidth="2"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <polyline points="3,3 3,8 8,8" />
              </svg>
            </div>
          </div>

          {/* Composer */}
          <div className="flex flex-col shrink-0 pt-3 pb-4 gap-1.5 bg-white border-t border-[#EBE9E1] px-4">
            <div className="flex items-center rounded-[10px] py-2.5 px-3 gap-2 bg-white ring-1 ring-[#EBE9E1]">
              <div className="grow font-[var(--font-inter)] text-[#62656B] text-[13px] leading-4">
                Type here…
              </div>
              <div className="flex items-center justify-center rounded-md shrink-0 bg-[#FF4E49] size-6">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="13,6 19,12 13,18" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal scrim */}
      <motion.div
        className="absolute inset-0 bg-[#FFFFFFC7]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />

      {/* Traceability modal */}
      <motion.div
        className="absolute left-1/2 top-[90px] -translate-x-1/2 w-[1090px] max-w-[calc(100%-100px)] flex flex-col rounded-[14px] overflow-clip shadow-[0_24px_60px_#0000002E,0_0_0_1px_#0000000A] bg-white border border-[#EBE9E1]"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between py-3.5 px-5 border-b border-[#EBE9E1]">
          <div className="flex items-center gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#14161A"
              strokeWidth="1.5"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polygon
                points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"
                strokeLinejoin="round"
              />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <div className="tracking-[-0.005em] font-[var(--font-inter)] font-semibold text-[#14161A] text-base leading-5">
              Aurora-IV — Phase III CSR · Traceability
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center rounded-md py-1 px-[9px] gap-1.5 bg-[#F3F1ED] border border-[#EBE9E1]">
              <div className="rounded-full shrink-0 bg-[#19A875] size-1.5" />
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                11 nodes · 14 edges · synced
              </div>
            </div>
            <div className="flex items-center rounded-md bg-white border border-[#EBE9E1]">
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#14161A] text-[13px] leading-4">
                  −
                </div>
              </div>
              <div className="w-px h-3.5 shrink-0 bg-[#EBE9E1]" />
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#14161A] text-[11px] leading-[14px]">
                  100%
                </div>
              </div>
              <div className="w-px h-3.5 shrink-0 bg-[#EBE9E1]" />
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#14161A] text-[13px] leading-4">
                  +
                </div>
              </div>
              <div className="w-px h-3.5 shrink-0 bg-[#EBE9E1]" />
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[11px] leading-[14px]">
                  ⤢ fit
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-md shrink-0 border border-[#EBE9E1] size-7">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#62656B"
                strokeWidth="2"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </div>
          </div>
        </div>

        {/* Graph canvas */}
        <div className="w-full h-[560px] overflow-clip relative shrink-0 bg-[#F3F1ED]">
          <svg
            width="1090"
            height="560"
            viewBox="0 0 1090 560"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-0 top-0"
          >
            <defs>
              <marker
                id="trace-arrow-muted"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#EBE9E1" />
              </marker>
              <marker
                id="trace-arrow-strong"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#4F46E5" />
              </marker>
            </defs>
            <path
              d="M 214 78 L 360 78 L 360 200 L 470 200"
              stroke="#EBE9E1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.7"
            />
            <path
              d="M 214 166 L 380 166 L 380 206 L 470 206"
              stroke="#FF4E49"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-strong)"
              opacity="0.4"
            />
            <path
              d="M 214 254 L 380 254 L 380 214 L 470 214"
              stroke="#EBE9E1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 214 342 L 360 342 L 360 220 L 470 220"
              stroke="#EBE9E1"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.7"
            />
            <path
              d="M 414 122 L 450 122 L 450 204 L 470 204"
              stroke="#EBE9E1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 414 298 L 450 298 L 450 216 L 470 216"
              stroke="#EBE9E1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 614 210 L 650 210 L 650 122 L 670 122"
              stroke="#FF4E49"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-strong)"
              opacity="0.4"
            />
            <path
              d="M 614 210 L 650 210 L 650 298 L 670 298"
              stroke="#FF4E49"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-strong)"
              opacity="0.4"
            />
            <path
              d="M 814 122 L 850 122 L 850 166 L 870 166"
              stroke="#EBE9E1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 814 298 L 850 298 L 850 254 L 870 254"
              stroke="#EBE9E1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
          </svg>

          {/* Edge labels */}
          <div className="absolute left-[340px] top-[181px] rounded-[3px] py-px px-1.5 bg-white border border-[#EBE9E1]">
            <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3">
              cites
            </div>
          </div>
          <div className="absolute left-[638px] top-[151px] rounded-[3px] py-px px-1.5 bg-white border border-[#EBE9E1]">
            <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3">
              rolls up
            </div>
          </div>

          {/* Source nodes (left column) */}
          <GraphNode
            left={70}
            top={50}
            badge="pdf"
            badgeStyle="pdf"
            name="Protocol_v4.2"
            sub="§6.3 monitoring"
          />
          <GraphNode
            left={70}
            top={138}
            badge="csv"
            badgeStyle="csv"
            name="Phase3-LFT"
            sub="27 rows · ALT > 3× ULN"
          />
          <GraphNode
            left={70}
            top={226}
            badge="md"
            name="Phase2-CSR-007"
            sub="§5.2 hepatic"
          />
          <GraphNode
            left={70}
            top={314}
            badge="csv"
            badgeStyle="csv"
            name="AE-MedDRA-29.0"
            sub="hepatic PT mapping"
          />

          {/* Middle column */}
          <GraphNode
            left={270}
            top={94}
            badge="pdf"
            badgeStyle="pdf"
            name="SAP-v2.0"
            sub="analysis plan"
          />
          <GraphNode
            left={270}
            top={270}
            badge="pdf"
            badgeStyle="pdf"
            name="IB-v3.1"
            sub="Investigator Bro."
          />

          {/* Current node (highlighted) */}
          <div className="absolute left-[462px] top-[182px] w-40 h-14 flex items-center rounded-lg px-3 gap-2 shadow-[0_0_0_8px_#FF4E4914] bg-white border-[1.5px] border-[#FF4E49]">
            <div className="rounded-[3px] py-px px-1 bg-[#F3F1ED]">
              <div className="font-[var(--font-inconsolata)] font-bold text-[#62656B] text-[9px] leading-3">
                md
              </div>
            </div>
            <div className="flex flex-col grow min-w-0 gap-px">
              <div className="font-[var(--font-inconsolata)] font-bold text-[#14161A] text-[11px] leading-[14px]">
                CSR-014.md
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#9C9EA3] text-[9px] leading-3">
                §12.4 hepatic AE
              </div>
            </div>
          </div>

          {/* Right modules */}
          <GraphNode
            left={670}
            top={94}
            badge="md"
            name="Module-2.5"
            sub="Clinical overview"
          />
          <GraphNode
            left={670}
            top={270}
            badge="md"
            name="Module-2.7"
            sub="Safety summary"
          />

          {/* Far right outputs */}
          <GraphNode
            left={870}
            top={138}
            badge="md"
            name="Reviewer-QA"
            sub="12 internal QA"
          />
          <GraphNode
            left={870}
            top={226}
            badge="pdf"
            badgeStyle="pdf"
            name="DSUR-2025"
            sub="Annual safety update"
          />

          {/* Minimap */}
          <div className="absolute right-[18px] bottom-[18px] w-[140px] h-[80px] rounded-md overflow-clip shadow-[0_2px_6px_#0000000F] bg-white border border-[#EBE9E1]">
            <div className="left-1.5 top-1.5 w-[128px] h-[68px] rounded-[3px] absolute bg-[#F3F1ED] border border-[#EBE9E1]" />
            <div className="left-2 top-2 w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-2 top-[18px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-2 top-7 w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-2 top-[38px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-6 top-[13px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-6 top-[33px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-10 top-[23px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#FF4E49]" />
            <div className="left-14 top-[13px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-14 top-[33px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-[72px] top-[18px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-[72px] top-7 w-[11px] h-1.5 rounded-[1px] absolute bg-[#EBE9E1]" />
            <div className="left-1 top-1 w-[130px] h-[72px] rounded-[3px] absolute border-[1.5px] border-[#FF4E49]" />
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between py-2.5 px-5 bg-white border-t border-[#EBE9E1]">
          <div className="font-[var(--font-inconsolata)] text-[#9C9EA3] text-[11px] leading-[14px]">
            drag to pan · scroll to zoom · click a node to open as tab
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-[5px]">
              <div className="rounded-sm shrink-0 bg-white border-[1.5px] border-[#4F46E5] size-2.5" />
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3">
                current
              </div>
            </div>
            <div className="flex items-center gap-[5px]">
              <div className="w-3.5 h-[1.5px] shrink-0 bg-[#4F46E5]" />
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3">
                strong
              </div>
            </div>
            <div className="flex items-center gap-[5px]">
              <div className="w-3.5 h-px shrink-0 bg-[#EBE9E1]" />
              <div className="font-[var(--font-inconsolata)] text-[#62656B] text-[10px] leading-3">
                moderate
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WorkspaceGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col pt-4 gap-0.5 px-2 first:pt-0">
      <div className="flex items-center justify-between py-1.5 px-2">
        <div className="flex items-center gap-1.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-faint"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
          <div className="font-[var(--font-inter)] font-medium text-ink text-[12.5px] leading-4">
            {label}
          </div>
        </div>
        <div className="font-[var(--font-inconsolata)] text-faint text-[10.5px] leading-[14px] tracking-[0.02em] tabular-nums">
          {count}
        </div>
      </div>
      {children}
    </div>
  );
}

function WorkspaceItem({
  badge,
  badgeStyle,
  name,
  active,
}: {
  badge: string;
  badgeStyle?: "default" | "csv" | "pdf";
  name: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 px-2.5 gap-2 rounded-[8px] transition-colors duration-150 ${
        active ? "bg-[rgba(243,241,237,0.70)]" : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileBadge file={{ badge, badgeStyle: badgeStyle ?? "default", fileName: name }} />
        <div
          className={`font-[var(--font-inconsolata)] text-[12px] leading-4 truncate ${
            active ? "text-ink" : "text-muted"
          }`}
        >
          {name}
        </div>
      </div>
      {active ? <div className="rounded-full shrink-0 bg-accent-indigo size-1.5" /> : null}
    </div>
  );
}

function GraphNode({
  left,
  top,
  badge,
  badgeStyle,
  name,
  sub,
}: {
  left: number;
  top: number;
  badge: string;
  badgeStyle?: "default" | "csv" | "pdf";
  name: string;
  sub: string;
}) {
  return (
    <div
      className="absolute w-36 h-14 flex items-center rounded-[12px] px-3 gap-2 bg-paper border border-hairline shadow-card"
      style={{ left, top }}
    >
      <FileBadge file={{ badge, badgeStyle: badgeStyle ?? "default", fileName: name }} />
      <div className="flex flex-col grow min-w-0 gap-0.5">
        <div className="font-[var(--font-inconsolata)] text-ink text-[11px] leading-[14px] truncate">
          {name}
        </div>
        <div className="font-[var(--font-inconsolata)] text-faint text-[9.5px] leading-3 truncate">
          {sub}
        </div>
      </div>
    </div>
  );
}
