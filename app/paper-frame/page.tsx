"use client";

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
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
  | "copilot-clarify"
  | "copilot-reasoning"
  | "copilot-narrative-preview"
  | "editor-narrative"
  | "evidence-csv"
  | "split-view"
  | "tertiary-wording"
  | "trace-graph"
  | "protocol-doc";

type Walkthrough = {
  statement: string;
  focus: WalkthroughFocus;
};

const WalkthroughAnchorContext = createContext<{
  registerAnchor: (el: HTMLElement | null) => void;
} | null>(null);

function useWalkthroughAnchorRegister() {
  return useContext(WalkthroughAnchorContext);
}

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
  if (slide >= 6 && slide <= 13) {
    return {
      statement: "Peer narrows the draft with a few targeted questions first.",
      focus: "copilot-clarify",
    };
  }
  if (slide >= 14 && slide <= 21) {
    return {
      statement: "Every reasoning step opens the file and rows behind the narrative.",
      focus: "copilot-reasoning",
    };
  }
  if (slide >= 23 && slide <= 26) {
    return {
      statement: "You compare three framings, then accept the one you want in the CSR.",
      focus: "copilot-narrative-preview",
    };
  }
  if (slide === 28) {
    return {
      statement: "Jump from the draft back to the LFT rows it came from.",
      focus: "copilot-reasoning",
    };
  }
  if (slide === 29) {
    return {
      statement: "The full listing opens when you need more than a rail snippet.",
      focus: "evidence-csv",
    };
  }
  if (slide === 30) {
    return {
      statement: "Side-by-side pairs the section with the source data it cites.",
      focus: "split-view",
    };
  }
  if (slide === 31) {
    return {
      statement: "Accepted copy lands in §12.4 as soon as you confirm it.",
      focus: "editor-narrative",
    };
  }
  if (slide >= 37 && slide <= 38) {
    return {
      statement: "A follow-up resolves FDA vs EMA wording in one aligned sentence.",
      focus: "tertiary-wording",
    };
  }
  if (slide === 39) {
    return {
      statement: "Your choice is written straight into the CSR.",
      focus: "tertiary-wording",
    };
  }
  if (slide === 40) {
    return {
      statement: "Traceability shows how protocol, listings, and prior reports feed §12.4.",
      focus: "trace-graph",
    };
  }
  if (slide === 41) {
    return {
      statement: "Opening a graph node drops you into the source so you can verify language.",
      focus: "protocol-doc",
    };
  }
  return null;
}

const FRAME_W = 1440;
const FRAME_H = 900;
const OUTER_PAD = 40;
const MAX_SCALE = 0.92;

/** White “island” on warm — editor / Copilot / split panes */
const FLOAT_COL =
  "rounded-[10px] border border-hairline bg-white shadow-card overflow-hidden flex flex-col min-h-0";

const GlassWalkthroughRibbon = forwardRef<HTMLDivElement, { statement: string }>(
  function GlassWalkthroughRibbon({ statement }, ref) {
    return (
      <div
        ref={ref}
        className="shrink-0 z-20 flex items-center justify-center px-8 py-3 shadow-pop backdrop-blur-md rounded-b-[14px]"
        style={{ backgroundColor: "rgba(59, 130, 246, 0.14)" }}
      >
        <p className="max-w-[54rem] text-center font-[var(--font-inter)] text-[13px] font-medium leading-snug text-[var(--color-ink)] tracking-[-0.012em]">
          {statement}
        </p>
      </div>
    );
  },
);

function WalkthroughConnectorLayer({
  rootRef,
  ribbonRef,
  anchorEl,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  ribbonRef: React.RefObject<HTMLDivElement | null>;
  anchorEl: HTMLElement | null;
}) {
  const [geom, setGeom] = useState<{
    w: number;
    h: number;
    pathD: string;
    cx: number;
    cy: number;
    r: number;
  } | null>(null);

  const recompute = useCallback(() => {
    const root = rootRef.current;
    const ribbon = ribbonRef.current;
    if (!root || !ribbon || !anchorEl) {
      setGeom(null);
      return;
    }
    const rr = root.getBoundingClientRect();
    const br = ribbon.getBoundingClientRect();
    const ar = anchorEl.getBoundingClientRect();
    const w = Math.max(1, rr.width);
    const h = Math.max(1, rr.height);
    const sx = br.left + br.width / 2 - rr.left;
    const sy = br.bottom - rr.top;
    const ax = ar.left + ar.width / 2 - rr.left;
    const ay = ar.top - rr.top + 6;
    const midY = sy + Math.max(24, (ay - sy) * 0.38);
    const pathD = `M ${sx} ${sy} L ${sx} ${midY} L ${ax} ${midY} L ${ax} ${ay}`;
    const strokeR = 3.75;
    setGeom({ w, h, pathD, cx: ax, cy: ay, r: strokeR });
  }, [rootRef, ribbonRef, anchorEl]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !anchorEl || !ribbonRef.current) return;
    window.addEventListener("scroll", recompute, true);
    const ro = new ResizeObserver(recompute);
    ro.observe(root);
    ro.observe(ribbonRef.current);
    ro.observe(anchorEl);
    return () => {
      window.removeEventListener("scroll", recompute, true);
      ro.disconnect();
    };
  }, [rootRef, ribbonRef, anchorEl, recompute]);

  if (!geom) return null;
  const stroke = "rgba(37, 99, 235, 0.4)";

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[55] overflow-visible"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geom.w} ${geom.h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={geom.pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={geom.cx} cy={geom.cy} r={geom.r} fill={stroke} />
    </svg>
  );
}

export default function PaperFramePage() {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(MAX_SCALE);
  const [walkthroughMode, setWalkthroughMode] = useState(true);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const connectorRootRef = useRef<HTMLDivElement>(null);

  const registerAnchor = useCallback((el: HTMLElement | null) => {
    setAnchorEl(el);
  }, []);

  const anchorCtxValue = useMemo(
    () => ({ registerAnchor }),
    [registerAnchor],
  );

  useEffect(() => {
    setAnchorEl(null);
  }, [index]);

  useEffect(() => {
    if (!walkthroughMode) setAnchorEl(null);
  }, [walkthroughMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("walkthrough");
    if (flag === "0" || flag === "false") setWalkthroughMode(false);
    if (flag === "1" || flag === "true") setWalkthroughMode(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, frames.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "w" || e.key === "W") {
        setWalkthroughMode((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function recalc() {
      const availW = Math.max(window.innerWidth - OUTER_PAD * 2, 0);
      const availH = Math.max(window.innerHeight - OUTER_PAD * 2, 0);
      const fit = Math.min(availW / FRAME_W, availH / FRAME_H);
      setScale(Math.min(fit, MAX_SCALE));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

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
      className="h-screen w-screen overflow-hidden bg-warm relative"
      style={{ padding: OUTER_PAD }}
    >
      <div
        className="absolute left-1/2 top-1/2 overflow-visible"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <WalkthroughAnchorContext.Provider value={anchorCtxValue}>
          <div
            ref={connectorRootRef}
            className="relative flex min-h-0 h-full w-full flex-col overflow-hidden"
          >
            {walkthrough ? (
              <GlassWalkthroughRibbon ref={ribbonRef} statement={walkthrough.statement} />
            ) : null}
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {walkthrough ? (
                <WalkthroughConnectorLayer
                  rootRef={connectorRootRef}
                  ribbonRef={ribbonRef}
                  anchorEl={anchorEl}
                />
              ) : null}
              <div className="relative z-10 box-border flex min-h-0 min-w-0 flex-1 gap-3 overflow-hidden p-3">
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
        </WalkthroughAnchorContext.Provider>
      </div>

      {/* frame indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-3 py-1.5 bg-[#1A1B1F]/85 text-white font-[var(--font-inconsolata)] text-[11px] leading-[14px] tracking-[0.04em] backdrop-blur-sm pointer-events-none select-none">
        <span className={index === 0 ? "opacity-30" : "opacity-90"}>←</span>
        <span>
          {index + 1} / {frames.length}
        </span>
        <span className={index === frames.length - 1 ? "opacity-30" : "opacity-90"}>→</span>
      </div>
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
  const ctx = useWalkthroughAnchorRegister();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!active || !ctx) {
      ctx?.registerAnchor(null);
      return;
    }
    ctx.registerAnchor(ref.current);
    return () => {
      ctx.registerAnchor(null);
    };
  }, [active, ctx]);

  if (!active) return <>{children}</>;
  return (
    <div ref={ref} className={`relative walkthrough-spotlight ${className}`}>
      {children}
    </div>
  );
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
    <div className="[font-synthesis:none] flex gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 overflow-hidden">
      {/* Editor column */}
      <div className={`${FLOAT_COL} flex-1 min-w-0`}>
        {/* Tab bar */}
        <DocTabBar tabDirty={tabDirty} />

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
      className={`[font-synthesis:none] antialiased text-xs/4 ${FLOAT_COL} w-[340px] shrink-0`}
    >
      <div className="flex items-center justify-between h-14 shrink-0 px-5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full shrink-0 bg-[#FF4E49] size-2" />
          <div className="font-[var(--font-inter)] font-medium text-[#1A1B1F] text-[18px] leading-[22px] tracking-[-0.005em]">
            Copilot
          </div>
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px] tracking-[0.04em]">
          peer-csr-v3
        </div>
      </div>

      <div className="flex flex-col grow pt-[18px] overflow-auto gap-3.5 px-4 min-h-0 relative">
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
              className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#1A1B1F]"
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
              className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#1A1B1F]"
            >
              {tertiaryText}
            </motion.div>
          ) : null}
          {tertiaryDraftPreview ? (
            <motion.div key="tertiary-preview" {...fadeIn}>
              <NarrativeDraftPreviewCard preview={tertiaryDraftPreview} />
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
              className="text-[13px] leading-[155%] font-[var(--font-inter)] italic text-[#8E939A]"
            >
              {draftingText}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col shrink-0 pt-3 pb-4 gap-1.5 border-t border-[#E5E7EB] px-4">
        <div className="flex items-center rounded-[10px] py-2.5 px-3 gap-2 bg-white ring-1 ring-[#E5E7EB]">
          <div className="grow relative h-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={hasInput ? `typed:${input}` : "placeholder"}
                {...fadeIn}
                className={`font-[var(--font-inter)] text-[13px] leading-4 ${
                  hasInput ? "text-black" : "text-[#5A5E66]"
                }`}
              >
                {hasInput ? input : placeholder}
              </motion.div>
            </AnimatePresence>
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
  );
}

function TopNav({ avatar }: { avatar: "solid" | "outline" }) {
  return (
    <div className="flex items-center h-14 w-full shrink-0 px-6 gap-4 bg-white border-b border-[#E5E7EB]">
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
        <span className="text-[#1A1B1F]">Aurora-IV</span>
        <span className="text-[#8E939A]">/</span>
        <span className="text-[#1A1B1F]">Phase III CSR</span>
        <span className="text-[#8E939A]">/</span>
        <span className="text-[#1A1B1F]">Module 5.3.5</span>
        <span className="text-[#8E939A]">/</span>
        <span className="text-[#1A1B1F]">CSR-014.md</span>
      </div>

      <div className="grow" />

      <div className="flex items-center gap-1.5">
        <div className="rounded-full shrink-0 bg-[#19A875] size-1.5" />
        <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[13px] leading-4">
          auto-saved · 14:02
        </div>
      </div>
      <div
        className={`flex items-center justify-center rounded-full shrink-0 size-7 transition-colors duration-200 ${
          avatar === "outline"
            ? "bg-white border border-[#E5E7EB]"
            : "bg-[#1A1B1F] border border-transparent"
        }`}
      >
        <div
          className={`font-[var(--font-inconsolata)] font-bold text-[11px] leading-[14px] transition-colors duration-200 ${
            avatar === "outline" ? "text-[#1A1B1F]" : "text-white"
          }`}
        >
          AN
        </div>
      </div>
    </div>
  );
}

function DocTabBar({ tabDirty }: { tabDirty: boolean }) {
  return (
    <div className="flex items-end h-12 shrink-0 px-4 gap-1.5 border-b border-[#E5E7EB]">
      <Tab kind="md" name="CSR-014.md" state={tabDirty ? "active-dirty" : "active-default"} />
      <div className="grow" />
      <MapButton />
    </div>
  );
}

function CsvActiveTabBar() {
  return (
    <div className="flex items-end h-12 shrink-0 px-4 gap-1.5 border-b border-[#E5E7EB]">
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
    <div className="flex items-end h-12 shrink-0 px-4 gap-1.5 border-b border-[#E5E7EB]">
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
  const topBorderClass =
    state === "active-dirty"
      ? "border-t-[#FF4E49]"
      : state === "active-selected"
        ? "border-t-[#FF4E49]"
        : state === "active-default"
          ? "border-t-[#FF4E49]"
          : "border-t-transparent";
  const sideBorderClass = isInactive
    ? "border-l-[#E5E7EB] border-r-[#E5E7EB]"
    : "border-l-[#E5E7EB] border-r-[#E5E7EB]";
  const bgClass = isInactive ? "bg-[#F1F2F4]" : "bg-white";
  const labelColor = isInactive ? "text-[#5A5E66]" : "text-[#1A1B1F]";
  const badgeBg =
    kind === "csv"
      ? "bg-[#E6FFF5]"
      : kind === "pdf"
        ? "bg-[#FFE0EC]"
        : "bg-[#F6F6F6]";
  const badgeColor =
    kind === "csv"
      ? "text-[#19A875]"
      : kind === "pdf"
        ? "text-[#FF4488]"
        : "text-[#5A5E66]";
  return (
    <div
      className={`flex items-center h-9 -mb-px px-3 gap-2 rounded-t-lg border-t border-l border-r transition-colors duration-200 ${bgClass} ${topBorderClass} ${sideBorderClass}`}
    >
      <div className={`rounded-[3px] py-0.5 px-1 ${badgeBg}`}>
        <div
          className={`font-[var(--font-inconsolata)] font-bold ${badgeColor} text-[9px] leading-3`}
        >
          {kind}
        </div>
      </div>
      <div
        className={`font-[var(--font-inconsolata)] font-medium text-[13px] leading-4 ${labelColor}`}
      >
        {name}
      </div>
      <div className="ml-1 font-[var(--font-inconsolata)] text-[#8E939A] text-sm leading-[18px]">
        ×
      </div>
    </div>
  );
}

function MapButton() {
  return (
    <div className="flex items-center justify-center self-center rounded-md shrink-0 bg-white ring-1 ring-[#E5E7EB] size-8">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1A1B1F"
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
      className={`flex items-center self-center rounded-md py-1.5 px-2.5 gap-1.5 transition-colors duration-200 ${
        active ? "bg-[#FF4E49]" : "bg-white ring-1 ring-[#E5E7EB]"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#FFFFFF" : "#1A1B1F"}
        strokeWidth="1.5"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
      <div
        className={`font-[var(--font-inconsolata)] text-xs leading-4 ${
          active ? "text-white" : "text-[#1A1B1F]"
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
}) {
  return (
    <div className={`flex flex-col grow ${paddingTop} overflow-auto ${padding} min-h-0 relative`}>
      <div className="flex items-center mb-3 gap-2.5 font-[var(--font-inconsolata)] text-[11px] leading-[14px]">
        <span className="tracking-[0.06em] font-bold text-[#1A1B1F]">SECTION 12.4</span>
        <span className="tracking-[0.04em] text-[#8E939A]">—</span>
        <span className="tracking-[0.04em] text-[#5A5E66]">Phase III</span>
        <span className="tracking-[0.04em] text-[#8E939A]">·</span>
        <span className="tracking-[0.04em] text-[#5A5E66]">Aurora-IV</span>
        <span className="tracking-[0.04em] text-[#8E939A]">·</span>
        <span className="tracking-[0.04em] text-[#5A5E66]">Hepatic Adverse Events</span>
      </div>

      <h1 className="text-[36px] leading-[115%] tracking-[-0.005em] mb-[18px] font-[var(--font-inter)] text-[#1A1B1F]">
        Hepatic adverse events
      </h1>

      <p className="text-[15px] leading-[165%] mb-6 font-[var(--font-inter)] text-[#1A1B1F]">
        Aurora-IV is administered orally once daily and is metabolized primarily through hepatic
        CYP3A4 pathways. The Phase III safety database includes 891 randomized participants across
        47 sites, with hepatic monitoring performed every two weeks during the first cycle and
        monthly thereafter, per the protocol&apos;s risk-management plan.
      </p>

      <div className="flex flex-col mb-[18px] rounded-[10px] overflow-clip bg-white border border-[#E5E7EB]">
        <div className="flex items-center justify-between py-3.5 px-[18px] bg-[#F1F2F4] border-b border-[#E5E7EB]">
          <div className="flex items-baseline gap-2.5">
            <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[11px] leading-[14px]">
              TABLE 12.4-1
            </div>
            <div className="font-[var(--font-inter)] italic text-[#1A1B1F] text-sm leading-[18px]">
              Hepatic adverse events by grade and treatment arm
            </div>
          </div>
        </div>

        <div className="flex py-2.5 px-[18px] bg-white border-b border-[#E5E7EB] font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[11px] leading-[14px] tracking-[0.06em]">
          <div className="basis-0 grow-[2] shrink">GRADE</div>
          <div className="basis-0 grow-[1.4] shrink text-right">AURORA-IV (n=598)</div>
          <div className="basis-0 grow-[1.4] shrink text-right">PLACEBO (n=293)</div>
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

        <div className="flex items-center py-3 px-[18px] bg-white border-t border-[#1A1B1F]">
          <div className="basis-0 grow-[2] shrink font-[var(--font-inter)] font-semibold text-[#1A1B1F] text-sm leading-[18px]">
            Total — any grade
          </div>
          <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-sm leading-[18px]">
            49  (8.2%)
          </div>
          <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-sm leading-[18px]">
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
            className="mt-[18px]"
          >
            <WalkthroughTarget walkthrough={walkthrough} match="editor-narrative">
              <p className="text-[15px] leading-[165%] font-[var(--font-inter)] text-[#1A1B1F]">
                {narrativeBody ??
                  "Hepatic adverse events occurred in 8.2% of Aurora-IV recipients (n=49/598) versus 4.1% on placebo (n=12/293). Most events were Grade 1–2 transient ALT elevations, resolving without intervention within a median of 14 days. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy's Law cases were observed."}
              </p>
            </WalkthroughTarget>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[15px] leading-[165%] mt-[18px] mb-[18px] font-[var(--font-inter)] text-[#1A1B1F]">
        A pre-specified subgroup analysis of participants with baseline hepatic impairment (n=42)
        showed comparable event rates and no qualitative difference in time-to-resolution.
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {tertiaryDocDraft ? (
          <motion.div key={`tert-draft-${tertiaryDocDraft.version}-${tertiaryDocDraft.framing}`} {...fadeIn}>
            <WalkthroughTarget walkthrough={walkthrough} match="tertiary-wording">
              <NarrativeDraftBlock draft={tertiaryDocDraft} />
            </WalkthroughTarget>
          </motion.div>
        ) : tertiaryDocParagraph ? (
          <motion.div
            key={`tert-paragraph:${tertiaryDocParagraph}`}
            {...fadeIn}
          >
            <WalkthroughTarget walkthrough={walkthrough} match="tertiary-wording">
              <p className="text-[15px] leading-[165%] font-[var(--font-inter)] text-[#1A1B1F]">
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
  if (accent === "alert") return "text-[#FF4488]";
  if (accent === "warn") return "text-[#FFAF04]";
  if (accent === "ok") return "text-[#19A875]";
  return "text-[#8E939A]";
}

function CsvDocBody({
  showFooterAction,
  padding,
  showHeaderActions,
  paddingTop = "pt-6",
}: {
  showFooterAction: boolean;
  padding: string;
  showHeaderActions: boolean;
  paddingTop?: string;
}) {
  return (
    <div className={`flex flex-col grow ${paddingTop} overflow-auto ${padding} min-h-0 relative`}>
      <div className="flex items-center mb-3 gap-2.5 font-[var(--font-inconsolata)] text-[11px] leading-[14px] whitespace-nowrap overflow-hidden">
        <span className="tracking-[0.06em] font-bold text-[#1A1B1F] shrink-0">EVIDENCE</span>
        <span className="tracking-[0.04em] text-[#8E939A] shrink-0">·</span>
        <span className="tracking-[0.04em] text-[#5A5E66] shrink-0">Phase 3 LFT listings</span>
        <span className="tracking-[0.04em] text-[#8E939A] shrink-0">·</span>
        <span className="tracking-[0.04em] text-[#5A5E66] truncate">filtered: ALT &gt; 3×ULN · rows 412–438</span>
      </div>

      <div className="flex items-end justify-between mb-4 gap-4">
        <div className="text-[28px] leading-[120%] tracking-[-0.005em] font-[var(--font-inter)] font-light text-[#1A1B1F] whitespace-nowrap">
          Phase3-LFT-Listings
        </div>
        {showHeaderActions ? (
          <div className="flex items-center gap-2">
            <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px]">
              27 rows · 5 cols
            </div>
            <div className="flex items-center rounded-md py-1 px-2 gap-1.5 bg-white border border-[#E5E7EB] font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px]">
              filter
            </div>
            <div className="flex items-center rounded-md py-1 px-2 gap-1.5 bg-white border border-[#E5E7EB] font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px]">
              export
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col rounded-[10px] overflow-clip bg-white border border-[#E5E7EB]">
        <div className="flex py-2.5 px-4 bg-[#F1F2F4] border-b border-[#E5E7EB] font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[10px] leading-3 tracking-[0.06em]">
          <div className="basis-0 grow-[1.4] shrink whitespace-nowrap">PT-ID</div>
          <div className="basis-0 grow-[0.8] shrink whitespace-nowrap">DAY</div>
          <div className="basis-0 grow shrink text-right whitespace-nowrap">ALT (U/L)</div>
          <div className="basis-0 grow shrink text-right whitespace-nowrap">AST (U/L)</div>
          <div className="basis-0 grow shrink text-right whitespace-nowrap">×ULN</div>
        </div>
        {CSV_VIEWER_ROWS.map((row, i) => (
          <div
            key={row.ptId}
            className={`flex py-[9px] px-4 border-b border-[#F0F0F0] ${i % 2 === 1 ? "bg-[#F1F2F4]" : ""}`}
          >
            <div className="basis-0 grow-[1.4] shrink whitespace-nowrap font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
              {row.ptId}
            </div>
            <div className="basis-0 grow-[0.8] shrink whitespace-nowrap font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
              {row.day}
            </div>
            <div className="basis-0 grow shrink text-right whitespace-nowrap font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
              {row.alt}
            </div>
            <div className="basis-0 grow shrink text-right whitespace-nowrap font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
              {row.ast}
            </div>
            <div
              className={`basis-0 grow shrink text-right whitespace-nowrap font-[var(--font-inconsolata)] text-[13px] leading-4 ${ulnColorClass(row.ulnAccent)}`}
            >
              {row.uln}
            </div>
          </div>
        ))}
        <div className="flex py-[9px] px-4 font-[var(--font-inconsolata)] text-[#8E939A] text-[13px] leading-4">
          <div className="basis-0 grow-[1.4] shrink">…</div>
          <div className="basis-0 grow-[0.8] shrink">…</div>
          <div className="basis-0 grow shrink text-right">…</div>
          <div className="basis-0 grow shrink text-right">…</div>
          <div className="basis-0 grow shrink text-right">…</div>
        </div>
      </div>

      {showFooterAction ? (
        <div className="flex items-center mt-3.5 gap-2 font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px]">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8E939A"
            strokeWidth="1.5"
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
      <WalkthroughTarget walkthrough={walkthrough} match="evidence-csv">
        <div className={`${FLOAT_COL} flex-1 min-w-0`}>
          <CsvActiveTabBar />
          <CsvDocBody
            showFooterAction={true}
            padding="px-[60px]"
            showHeaderActions={true}
          />
        </div>
      </WalkthroughTarget>
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
  return (
    <div className="[font-synthesis:none] flex gap-3 w-full h-full min-h-0 bg-transparent antialiased text-xs/4 overflow-hidden">
      <div className="flex flex-1 min-w-0 min-h-0 flex-col gap-3">
        <div className={`${FLOAT_COL} shrink-0`}>
          <SplitTabBar />
        </div>
        <WalkthroughTarget walkthrough={walkthrough} match="split-view" className="flex flex-1 min-h-0 min-w-0 gap-3">
          <div className={`${FLOAT_COL} flex-1 min-w-0`}>
            <CSRDocBody
              hideGrade3={hideGrade3}
              preparingNarrative={preparingNarrative}
              narrativeDraft={narrativeDraft}
              narrativeBody={narrativeBody}
              tertiaryDocDraft={tertiaryDocDraft}
              tertiaryDocParagraph={tertiaryDocParagraph}
              padding="px-6"
              paddingTop="pt-6"
            />
          </div>
          <div className={`${FLOAT_COL} flex-1 min-w-0`}>
            <CsvDocBody
              showFooterAction={true}
              padding="px-6"
              showHeaderActions={false}
              paddingTop="pt-6"
            />
          </div>
        </WalkthroughTarget>
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
    <div className="flex items-end h-12 shrink-0 px-4 gap-1.5 border-b border-[#E5E7EB]">
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
    <div className={`flex flex-col grow pt-8 overflow-auto ${padding} min-h-0 relative`}>
      <div className="flex items-center mb-3 gap-2.5 font-[var(--font-inconsolata)] text-[11px] leading-[14px]">
        <span className="tracking-[0.06em] font-bold text-[#1A1B1F]">SECTION 6.3</span>
        <span className="tracking-[0.04em] text-[#8E939A]">·</span>
        <span className="tracking-[0.04em] text-[#5A5E66]">Aurora-IV Protocol v4.2</span>
        <span className="tracking-[0.04em] text-[#8E939A]">·</span>
        <span className="tracking-[0.04em] text-[#5A5E66]">Hepatic safety monitoring</span>
      </div>

      <h1 className="text-[34px] leading-[115%] tracking-[-0.005em] mb-[18px] font-[var(--font-inter)] text-[#1A1B1F]">
        Hepatic safety monitoring
      </h1>

      <p className="text-[15px] leading-[165%] mb-[18px] font-[var(--font-inter)] text-[#1A1B1F]">
        Liver function tests are obtained at screening, biweekly during the first cycle, and
        monthly thereafter. Participants with ALT or AST &gt; 3× ULN repeat within 72 hours;
        sustained elevations trigger discontinuation per the rules below.
      </p>

      <div className="flex flex-col mb-[18px] rounded-[10px] overflow-clip bg-white border border-[#E5E7EB]">
        <div className="flex py-3 px-[18px] bg-[#F1F2F4] border-b border-[#E5E7EB]">
          <div className="tracking-[0.06em] grow font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[10px] leading-3">
            DEFINITIONS
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

      <p className="text-[15px] leading-[165%] font-[var(--font-inter)] text-[#1A1B1F]">
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
      className={`flex py-3.5 px-[18px] gap-[18px] ${zebra ? "bg-[#F1F2F4]" : ""}`}
    >
      <div className="w-20 shrink-0 font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-[11px] leading-[14px]">
        {term}
      </div>
      <div className="text-[13px] leading-[155%] grow font-[var(--font-inter)] text-[#1A1B1F]">
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
      <WalkthroughTarget walkthrough={walkthrough} match="protocol-doc">
        <div className={`${FLOAT_COL} flex-1 min-w-0`}>
          <ProtocolTabBar />
          <ProtocolDocBody padding="px-20" />
        </div>
      </WalkthroughTarget>
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
  const ctx = useWalkthroughAnchorRegister();
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!focused || !ctx) {
      ctx?.registerAnchor(null);
      return;
    }
    ctx.registerAnchor(cardRef.current);
    return () => {
      ctx.registerAnchor(null);
    };
  }, [focused, ctx]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-warm/65 backdrop-blur-[1px] px-6">
      <div
        ref={cardRef}
        className={`flex flex-col w-full max-w-[1090px] rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_24px_48px_rgba(15,18,22,0.18)] overflow-hidden relative ${
          focused ? "walkthrough-spotlight" : ""
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1B1F"
              strokeWidth="1.5"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" strokeLinejoin="round" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <div className="font-[var(--font-inter)] font-medium text-[#1A1B1F] text-[15px] leading-5 truncate">
              Aurora-IV — Phase III CSR · Traceability
            </div>
          </div>
          <div className="flex items-center gap-2 font-[var(--font-inconsolata)] text-[11px] leading-[14px] shrink-0">
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-[#F6F6F6]">
              <div className="rounded-full size-1.5 bg-[#19A875]" />
              <span className="text-[#5A5E66]">11 nodes · 14 edges · synced</span>
            </div>
            <div className="flex items-center rounded-md border border-[#E5E7EB]">
              <div className="px-2 py-1 text-[#1A1B1F] border-r border-[#E5E7EB]">−</div>
              <div className="px-2 py-1 text-[#1A1B1F] border-r border-[#E5E7EB]">100%</div>
              <div className="px-2 py-1 text-[#1A1B1F] border-r border-[#E5E7EB]">+</div>
              <div className="px-2 py-1 text-[#1A1B1F]">⤢ fit</div>
            </div>
            <div className="text-[#1A1B1F] text-sm leading-4 px-1.5 py-1">×</div>
          </div>
        </div>
        <div className="grow relative overflow-hidden bg-white" style={{ aspectRatio: "1090 / 560" }}>
          <TraceMapCanvas />
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#E5E7EB] font-[var(--font-inconsolata)] text-[11px] leading-[14px] text-[#8E939A] shrink-0">
          <div>drag to pan · scroll to zoom · click a node to open as tab</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-[2px] border border-[#1A1B1F] bg-white" />
              <span className="text-[#5A5E66]">current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] bg-[#FF4E49]" />
              <span className="text-[#5A5E66]">strong</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-px bg-[#E5E7EB]" />
              <span className="text-[#5A5E66]">moderate</span>
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
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#E5E7EB" />
          </marker>
          <marker id="arrow-strong" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#FF4E49" />
          </marker>
        </defs>
        {/* incoming edges from left column → CSR-014.md */}
        <path
          d="M 214 78 L 360 78 L 360 200 L 462 200"
          stroke="#E5E7EB"
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
          stroke="#E5E7EB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 214 342 L 360 342 L 360 220 L 462 220"
          stroke="#E5E7EB"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        {/* SAP / IB → CSR */}
        <path
          d="M 414 122 L 450 122 L 450 204 L 462 204"
          stroke="#E5E7EB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 414 298 L 450 298 L 450 216 L 462 216"
          stroke="#E5E7EB"
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
          stroke="#E5E7EB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-muted)"
          opacity="0.85"
        />
        <path
          d="M 814 298 L 850 298 L 850 226 L 870 226"
          stroke="#E5E7EB"
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
        className="absolute rounded-md border border-[#E5E7EB] bg-white shadow-sm overflow-hidden"
        style={{
          right: `${(18 / W) * 100}%`,
          bottom: `${(18 / H) * 100}%`,
          width: `${(140 / W) * 100}%`,
          height: `${(80 / H) * 100}%`,
        }}
      >
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 gap-px p-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-[1px] ${
                i === 7 ? "bg-[#FF4E49]" : i % 3 === 0 ? "bg-[#E5E7EB]" : "bg-[#F6F6F6]"
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
      className="absolute rounded-[3px] py-px px-1.5 bg-white border border-[#E5E7EB] -translate-y-1/2"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3 whitespace-nowrap">
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
  const badgeBg =
    badge === "csv"
      ? "bg-[#E6FFF5]"
      : badge === "pdf"
        ? "bg-[#FFE0EC]"
        : "bg-[#F6F6F6]";
  const badgeColor =
    badge === "csv"
      ? "text-[#19A875]"
      : badge === "pdf"
        ? "text-[#FF4488]"
        : "text-[#5A5E66]";
  return (
    <div
      className={`absolute flex items-center gap-2 px-3 rounded-lg bg-white border transition-shadow ${
        highlight
          ? "border-[1.5px] border-[#FF4E49] shadow-[0_0_0_8px_rgba(255,78,73,0.08),0_2px_8px_rgba(255,78,73,0.15)]"
          : "border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      }`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      <div className={`rounded-[3px] py-0.5 px-1 shrink-0 ${badgeBg}`}>
        <div className={`font-[var(--font-inconsolata)] font-bold text-[9px] leading-3 ${badgeColor}`}>
          {badge}
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px] truncate">
          {name}
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3 truncate">
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
    <div className="flex flex-col mt-[18px] py-3 px-4 gap-2.5 bg-[#FFF8E5] border-l-[3px] border-l-[#FFAF04] rounded-r-md">
      <div className="flex items-center gap-2">
        <div className="rounded-full shrink-0 bg-[#FFAF04] size-1.5" />
        <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[10px] leading-3">
          PREPARING
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
          §12.4 hepatic AE narrative · awaiting clarification
        </div>
      </div>
      <div className="text-[15px] leading-[165%] font-[var(--font-inter)] text-[#1A1B1F]">
        {children}
      </div>
    </div>
  );
}

function NarrativeDraftBlock({ draft }: { draft: NarrativeDraft }) {
  const versionKey = `${draft.version}-${draft.framing}`;
  return (
    <div className="flex flex-col mt-[18px] py-3.5 px-[18px] gap-3 bg-[#FFF8E5] border-l-[3px] border-l-[#FFAF04] rounded-r-md">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <PrevNextNav size="md" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={versionKey}
              {...fadeIn}
              className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-xs leading-4"
            >
              v{draft.version} of {draft.total} · {draft.framing}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-md py-[5px] px-2.5 gap-[5px] bg-[#FF4E49]">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polyline points="5,12 10,17 19,7" />
            </svg>
            <div className="font-[var(--font-inconsolata)] font-bold text-white text-[11px] leading-[14px]">
              accept
            </div>
          </div>
          <div className="flex items-center rounded-md py-[5px] px-2.5 gap-[5px] bg-white border border-[#E5E7EB]">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5A5E66"
              strokeWidth="2.5"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
            <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
              cancel
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`body-${versionKey}`}
          {...fadeIn}
          className="text-[15px] leading-[165%] font-[var(--font-inter)] text-[#1A1B1F]"
        >
          {draft.body}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PrevNextNav({ size }: { size: "sm" | "md" }) {
  const isMd = size === "md";
  const padX = isMd ? "px-[9px]" : "px-2";
  const padY = isMd ? "py-1" : "py-[3px]";
  const fontSize = isMd ? "text-sm leading-[18px]" : "text-[13px] leading-4";
  const sepHeight = isMd ? "h-3.5" : "h-3";
  return (
    <div className="flex items-center rounded-md bg-white border border-[#E5E7EB]">
      <div className={`${padY} ${padX}`}>
        <div className={`font-[var(--font-inconsolata)] text-[#1A1B1F] ${fontSize}`}>‹</div>
      </div>
      <div className={`w-px ${sepHeight} shrink-0 bg-[#E5E7EB]`} />
      <div className={`${padY} ${padX}`}>
        <div className={`font-[var(--font-inconsolata)] text-[#FF4E49] ${fontSize}`}>›</div>
      </div>
    </div>
  );
}

function ReasonedChipView({ label, expanded }: { label: string; expanded?: boolean }) {
  return (
    <div className="flex items-center rounded-full py-1.5 px-2.5 gap-2 bg-white border border-[#E5E7EB]">
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
      <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
        {label}
      </div>
      <div
        className={`font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px] transition-transform duration-200 ${
          expanded ? "rotate-0" : "rotate-180"
        }`}
      >
        ▾
      </div>
    </div>
  );
}

function NarrativeDraftPreviewCard({ preview }: { preview: NarrativeDraftPreview }) {
  const key = `${preview.version}-${preview.framing}`;
  return (
    <div className="flex flex-col rounded-[10px] overflow-clip bg-white border border-[#E5E7EB]">
      <div className="flex items-center justify-between py-2 px-3 gap-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2 min-w-0">
          <PrevNextNav size="sm" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              {...fadeIn}
              className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px] truncate"
            >
              v{preview.version} of {preview.total} · {preview.framing}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center justify-center size-[22px] rounded-md bg-[#FF4E49]">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <polyline points="5,12 10,17 19,7" />
            </svg>
          </div>
          <div className="flex items-center justify-center size-[22px] rounded-md bg-white border border-[#E5E7EB]">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5A5E66"
              strokeWidth="2.5"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`p-${key}`} {...fadeIn} className="py-2.5 px-3">
          <div className="text-[12px] leading-[150%] font-[var(--font-inter)] text-[#5A5E66]">
            {preview.preview}
          </div>
          {preview.tags && preview.tags.length > 0 ? (
            <div className="mt-1.5 font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-[14px] tracking-[0.04em] truncate">
              {preview.tags.join(" · ")}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AcceptedChipView({ chip }: { chip: AcceptedChip }) {
  return (
    <div className="flex items-center rounded-full py-1.5 px-2.5 gap-2 bg-white border border-[#E5E7EB]">
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
      <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
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
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
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
    <div className="flex items-center rounded-full py-1.5 px-[11px] gap-2 bg-white border border-[#E5E7EB]">
      <div className="font-[var(--font-inter)] font-semibold text-[#FF4E49] text-[11px] leading-[14px]">
        ✻
      </div>
      <div className="font-[var(--font-inter)] text-[#1A1B1F] text-xs leading-4">
        {label}
      </div>
    </div>
  );
}

function ClarifyCardView({ card }: { card: ClarifyCard }) {
  const tabs = Array.from({ length: card.total }, (_, i) => i + 1);
  const answered = card.status === "answered";

  return (
    <div className="flex flex-col rounded-[10px] bg-white border border-[#E5E7EB]">
      <div className="flex items-center justify-between pt-3 pb-1 px-3.5">
        <div className="flex items-center gap-1.5">
          {tabs.map((n) => {
            const completed = answered || n < card.current;
            const active = !answered && n === card.current;
            const symbol = completed ? "✓" : String(n);
            return (
              <div
                key={n}
                className={`w-[14px] h-[14px] flex items-center justify-center rounded-sm shrink-0 transition-colors duration-200 ${
                  completed
                    ? "bg-[#19A875] border border-transparent"
                    : active
                    ? "bg-[#FF4E49] border border-transparent"
                    : "bg-white border border-[#E5E7EB]"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={symbol}
                    {...fadeIn}
                    className={`font-[var(--font-inconsolata)] font-bold text-[9px] leading-3 ${
                      completed || active ? "text-white" : "text-[#8E939A]"
                    }`}
                  >
                    {symbol}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        {!answered ? (
          <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-[14px] tracking-[0.04em]">
            {card.current} / {card.total}
          </div>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {answered ? (
          <motion.div
            key="answered"
            {...fadeIn}
            className="flex flex-col pb-2 px-2.5"
          >
            <div className="flex items-center gap-2.5 p-2.5">
              <div className="grow font-[var(--font-inter)] italic text-[#5A5E66] text-[13px] leading-4">
                {card.answeredText ?? "All questions answered…"}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="question" {...fadeIn}>
            <div className="pt-1.5 pb-2.5 px-3.5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={card.question}
                  {...fadeIn}
                  className="text-[15px] leading-[140%] font-[var(--font-inter)] font-medium text-[#1A1B1F]"
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
    <div className="flex flex-col pb-2 gap-1 px-2.5">
      {(card.options ?? []).map((opt, i) => (
          <div
            key={i}
            className={`flex items-center rounded-md gap-2.5 p-2.5 transition-colors duration-200 ${
              opt.selected
                ? "bg-[#FFF5F4] border border-[#FF4E49]"
                : "bg-white border border-[#E5E7EB]"
            }`}
          >
            <div className="grow font-[var(--font-inter)] text-[#1A1B1F] text-[13px] leading-4">
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
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF4E49"
                  strokeWidth="2"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <polyline points="5,12 10,17 19,7" />
                </motion.svg>
              ) : null}
            </AnimatePresence>
          </div>
        ))}

        {card.somethingElseText ? (
          <div className="flex items-center gap-2.5 p-2.5">
            {card.shortcut ? (
              <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0 rounded-sm border border-dashed border-[#E5E7EB]">
                <div className="font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[10px] leading-3">
                  {card.shortcut}
                </div>
              </div>
            ) : null}
            <div className="grow font-[var(--font-inter)] italic text-[#5A5E66] text-[13px] leading-4">
              {card.somethingElseText}
            </div>
          </div>
        ) : null}
    </div>
  );
}

function SummaryChip({ choices }: { choices: string[] }) {
  return (
    <div className="flex items-center self-start rounded-lg py-1.5 px-2.5 gap-2 bg-[#F1F2F4] border border-[#E5E7EB]">
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
      <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
        {choices.join(" · ")}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const borderClass = step.highlight ? "border-[#5CBFFF]" : "border-[#E5E7EB]";
  return (
    <div className={`flex flex-col rounded-md overflow-clip bg-white border ${borderClass}`}>
      <div className="flex items-center justify-between py-2 px-3 gap-2 border-b border-[#E5E7EB]">
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
              className="font-[var(--font-inter)] text-[#1A1B1F] text-[12px] leading-tight truncate"
            >
              {step.title}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3 tracking-[0.04em] shrink-0">
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
  if (file.badgeStyle === "csv") {
    return (
      <div className="rounded-[3px] py-0.5 px-1 bg-[#E6FFF5]">
        <div className="font-[var(--font-inconsolata)] font-bold text-[#19A875] text-[9px] leading-3">
          {file.badge}
        </div>
      </div>
    );
  }
  if (file.badgeStyle === "pdf") {
    return (
      <div className="rounded-[2px] py-px px-[3px] bg-[#FFE0EC]">
        <div className="font-[var(--font-inconsolata)] font-bold text-[#FF4488] text-[8px] leading-[10px]">
          {file.badge}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-[3px] py-px px-1 bg-white border border-[#E5E7EB]">
      <div className="font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[9px] leading-3">
        {file.badge}
      </div>
    </div>
  );
}

function FileRow({ file, expanded }: { file: StepFile; expanded: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-[7px] px-2.5 transition-colors duration-200 ${
        expanded ? "bg-[#FAFBFC] border-b border-[#E5E7EB]" : ""
      }`}
    >
      <div className="flex items-center gap-[7px] min-w-0">
        <FileBadge file={file} />
        <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px] truncate">
          {file.fileName}
        </div>
        {file.section ? (
          <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3 shrink-0">
            {file.section}
          </div>
        ) : null}
      </div>
      <div
        className={`font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px] shrink-0 transition-transform duration-200 ${
          expanded ? "rotate-0" : "rotate-180"
        }`}
      >
        ▾
      </div>
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
        <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3 tracking-[0.04em]">
          {body.rangeText}
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3">·</div>
        <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3 tracking-[0.04em]">
          {body.filter}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex py-[5px] px-2.5">
          {body.columns.map((c, i) => (
            <div
              key={c}
              style={{ flex: `${weights[i]} 1 0%` }}
              className={`tracking-[0.04em] font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[9px] leading-3 ${
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
            className={`flex py-[5px] px-2.5 ${
              row.highlight ? "bg-[#FFE0EC]" : ri % 2 === 1 ? "bg-[#FAFBFC]" : ""
            }`}
          >
            {row.values.map((v, vi) => {
              const isOutcome = vi === row.values.length - 1;
              const align = vi === 0 || vi === 1 ? "" : "text-right";
              const accent = row.outcomeAccent && isOutcome ? "font-bold text-[#FF4488]" : "text-[#1A1B1F]";
              const muted = row.outcomeAccent && isOutcome ? false : isOutcome;
              return (
                <div
                  key={vi}
                  style={{ flex: `${weights[vi]} 1 0%` }}
                  className={`font-[var(--font-inconsolata)] text-[10px] leading-3 ${align} ${accent} ${
                    muted ? "text-[#5A5E66]" : ""
                  }`}
                >
                  {v}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between py-1.5 px-2.5">
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3 tracking-[0.04em]">
          {body.moreRowsText}
        </div>
        <div className="font-[var(--font-inter)] font-medium text-[#FF4E49] text-[10px] leading-3">
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
      <div className="flex items-center py-1.5 px-3 gap-1.5">
        <div className="tracking-[0.04em] font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3">
          {body.sectionLabel}
        </div>
        <div className="font-sans text-[#8E939A] text-[10px] leading-3">·</div>
        <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
          {body.sectionTitle}
        </div>
      </div>
      <div className="py-2 px-3">
        <div className="font-[var(--font-inter)] text-[#1A1B1F] text-[11px] leading-4">
          {body.body}
        </div>
      </div>
      {body.definitions ? (
        <div className="flex flex-col pt-1.5 pb-2 gap-1 px-3">
          {body.definitions.map((d) => (
            <div key={d.term} className="flex items-baseline gap-2">
              <div className="min-w-14 inline-block font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3 tracking-[0.04em]">
                {d.term}
              </div>
              <div className="inline-block font-[var(--font-inter)] text-[#1A1B1F] text-[10px] leading-[14px]">
                {d.def}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between py-1.5 px-3">
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-3 tracking-[0.04em]">
          {body.footerText}
        </div>
        <div className="font-[var(--font-inter)] font-medium text-[#FF4E49] text-[10px] leading-3">
          Open in editor ↗
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-[14px] tracking-[0.04em]">
          you · {message.time}
        </div>
        <div className="max-w-[260px] rounded-[10px] py-2 px-3 bg-[#F1F2F4]">
          <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#1A1B1F]">
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
    <div className="flex flex-col gap-1.5 relative">
      <div className="flex items-center gap-1.5">
        <div className="rounded-full shrink-0 bg-[#FF4E49] size-1.5" />
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[10px] leading-[14px] tracking-[0.04em]">
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
              isThinking ? "italic text-[#5A5E66]" : "text-[#1A1B1F]"
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
    <div className={`flex items-center py-2.5 px-[18px] ${zebra ? "bg-[#F1F2F4]" : ""}`}>
      <div className="basis-0 grow-[2] shrink font-[var(--font-inter)] text-[#1A1B1F] text-sm leading-[18px]">
        {label}
      </div>
      <div
        className={`basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] text-sm leading-[18px] ${
          muted ? "text-[#8E939A]" : "text-[#1A1B1F]"
        }`}
      >
        {a}
      </div>
      <div
        className={`basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] text-sm leading-[18px] ${
          muted ? "text-[#8E939A]" : "text-[#1A1B1F]"
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
      <div className="font-[var(--font-inconsolata)] text-white/40 text-[11px] leading-[14px] tracking-[0.18em] uppercase">
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
      <div className="flex items-center h-14 w-full shrink-0 px-6 gap-4 bg-white border-b border-[#E5E7EB]">
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
          <span className="text-[#1A1B1F]">Aurora-IV</span>
          <span className="text-[#8E939A]">/</span>
          <span className="text-[#1A1B1F]">Phase III CSR</span>
          <span className="text-[#8E939A]">/</span>
          <span className="text-[#1A1B1F]">Module 5.3.5</span>
          <span className="text-[#8E939A]">/</span>
          <span className="text-[#1A1B1F]">CSR-014.md</span>
        </div>

        <div className="grow" />

        <div className="flex items-center gap-1.5">
          <div className="rounded-full shrink-0 bg-[#19A875] size-1.5" />
          <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[13px] leading-4">
            auto-saved · 14:02
          </div>
        </div>
        <div className="flex items-center justify-center rounded-full shrink-0 size-7 bg-white border border-[#E5E7EB]">
          <div className="font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-[11px] leading-[14px]">
            AN
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex grow w-full min-h-0">
        {/* Workspace sidebar */}
        <div className="flex flex-col w-[220px] shrink-0 min-h-0 bg-white border-r border-[#E5E7EB]">
          <div className="flex items-center justify-between pt-5 pb-3 px-4">
            <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[11px] leading-[14px]">
              WORKSPACE
            </div>
            <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0 font-[var(--font-inconsolata)] text-[#8E939A] text-sm leading-[18px]">
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
          <div className="flex items-end h-12 shrink-0 px-4 gap-1.5 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-center self-center rounded-md shrink-0 bg-white ring-1 ring-[#E5E7EB] size-8">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1B1F"
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
            <div className="flex items-center h-9 -mb-px px-3 gap-2 bg-white border-t border-l border-r border-t-[#FF4E49] border-l-[#E5E7EB] border-r-[#E5E7EB] rounded-t-lg">
              <div className="rounded-[3px] py-0.5 px-1 bg-[#F6F6F6]">
                <div className="font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[9px] leading-3">
                  md
                </div>
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
                CSR-014.md
              </div>
              <div className="ml-1 font-[var(--font-inconsolata)] text-[#8E939A] text-sm leading-[18px]">
                ×
              </div>
            </div>
            <div className="grow" />
            <div className="flex items-center self-center rounded-md py-1.5 px-2.5 gap-1.5 bg-white border border-[#E5E7EB]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1B1F"
                strokeWidth="1.5"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <rect x="3" y="4" width="18" height="16" rx="1.5" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-xs leading-4">
                side-by-side
              </div>
            </div>
          </div>

          {/* Doc body */}
          <div className="flex flex-col grow pt-8 overflow-auto px-20 min-h-0 relative">
            <div className="flex items-center mb-3 gap-2.5 font-[var(--font-inconsolata)] text-[11px] leading-[14px]">
              <span className="tracking-[0.06em] font-bold text-[#1A1B1F]">SECTION 12.4</span>
              <span className="tracking-[0.04em] text-[#8E939A]">—</span>
              <span className="tracking-[0.04em] text-[#5A5E66]">Phase III</span>
              <span className="tracking-[0.04em] text-[#8E939A]">·</span>
              <span className="tracking-[0.04em] text-[#5A5E66]">Aurora-IV</span>
              <span className="tracking-[0.04em] text-[#8E939A]">·</span>
              <span className="tracking-[0.04em] text-[#5A5E66]">Hepatic Adverse Events</span>
            </div>

            <h1 className="text-[36px] leading-[115%] tracking-[-0.005em] mb-[18px] font-[var(--font-inter)] text-[#1A1B1F]">
              Hepatic adverse events
            </h1>

            <p className="text-[15px] leading-[165%] mb-6 font-[var(--font-inter)] text-[#1A1B1F]">
              Aurora-IV is administered orally once daily and is metabolized primarily through
              hepatic CYP3A4 pathways. The Phase III safety database includes 891 randomized
              participants across 47 sites, with hepatic monitoring performed every two weeks
              during the first cycle and monthly thereafter, per the protocol&apos;s
              risk-management plan.
            </p>

            <div className="flex flex-col mb-[18px] rounded-[10px] overflow-clip bg-white border border-[#E5E7EB]">
              <div className="flex items-center justify-between py-3.5 px-[18px] bg-[#F1F2F4] border-b border-[#E5E7EB]">
                <div className="flex items-baseline gap-2.5">
                  <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[11px] leading-[14px]">
                    TABLE 12.4-1
                  </div>
                  <div className="font-[var(--font-inter)] italic text-[#1A1B1F] text-sm leading-[18px]">
                    Hepatic adverse events by grade and treatment arm
                  </div>
                </div>
              </div>

              <div className="flex py-2.5 px-[18px] bg-white border-b border-[#E5E7EB] font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[11px] leading-[14px] tracking-[0.06em]">
                <div className="basis-0 grow-[2] shrink">GRADE</div>
                <div className="basis-0 grow-[1.4] shrink text-right">AURORA-IV (n=598)</div>
                <div className="basis-0 grow-[1.4] shrink text-right">PLACEBO (n=293)</div>
              </div>

              <Row label="Grade 1 — transient" a="34  (5.7%)" b="7  (2.4%)" />
              <Row label="Grade 2 — ALT 3–5× ULN" a="13  (2.2%)" b="4  (1.4%)" zebra />
              <Row label="Grade 3 — ALT > 5× ULN" a="2  (0.3%)" b="1  (0.3%)" />
              <Row label="Grade 4" a="0  (0.0%)" b="0  (0.0%)" zebra muted />

              <div className="flex items-center py-3 px-[18px] bg-white border-t border-[#1A1B1F]">
                <div className="basis-0 grow-[2] shrink font-[var(--font-inter)] font-semibold text-[#1A1B1F] text-sm leading-[18px]">
                  Total — any grade
                </div>
                <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-sm leading-[18px]">
                  49  (8.2%)
                </div>
                <div className="basis-0 grow-[1.4] shrink text-right font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-sm leading-[18px]">
                  12  (4.1%)
                </div>
              </div>
            </div>

            {/* Comparative narrative — claims underlined for source provenance */}
            <p className="flex flex-wrap items-baseline mt-[18px] text-[15px] leading-[165%] font-[var(--font-inter)] text-[#1A1B1F] gap-x-[5px]">
              <span>The hepatic AE rate in</span>
              <span className="underline-offset-[3px] [text-decoration:underline_1.5px_#19A875]">
                Aurora-IV (8.2%; n=49/598)
              </span>
              <span>tracks the</span>
              <span className="underline-offset-[3px] [text-decoration:underline_1.5px_#8E939A]">
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
        <div className="flex flex-col w-[340px] shrink-0 min-h-0 bg-white border-l border-[#E5E7EB]">
          <div className="flex flex-col shrink-0 pt-3.5 border-b border-[#E5E7EB] px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full shrink-0 bg-[#FFF5F4]">
                  <div className="rounded-full shrink-0 bg-[#FF4E49] size-2" />
                </div>
                <div className="tracking-[-0.005em] font-[var(--font-inter)] font-medium text-[#1A1B1F] text-xl leading-6">
                  Copilot
                </div>
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                peer-csr-v3
              </div>
            </div>
            {/* Toolbar */}
            <div className="flex items-center mb-3.5 gap-1.5">
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-white border border-[#E5E7EB]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1A1B1F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-white border border-[#E5E7EB]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1A1B1F"
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
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-white border border-[#E5E7EB]">
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
              <div className="w-[30px] h-[30px] flex items-center justify-center rounded-md shrink-0 bg-[#FFE9F0] border border-[#FFC4D7]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF4488"
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
            <div className="flex items-center self-start rounded-lg py-1.5 px-2.5 gap-2 bg-[#F1F2F4] border border-[#E5E7EB]">
              <div className="tracking-[0.06em] font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[9px] leading-3">
                CONTEXT
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px]">
                CSR-014.md · §12.4
              </div>
            </div>

            {/* User message */}
            <div className="flex flex-col items-end gap-1">
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                you · 14:03
              </div>
              <div className="max-w-[260px] rounded-[10px] py-2 px-3 bg-[#F1F2F4]">
                <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#1A1B1F]">
                  Draft the §12.4 hepatic AE narrative.
                </div>
              </div>
            </div>

            {/* Peer message */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="rounded-full shrink-0 bg-[#FF4E49] size-1.5" />
                <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                  peer · 14:03
                </div>
              </div>
              <div className="text-[13px] leading-[155%] font-[var(--font-inter)] text-[#1A1B1F]">
                Opened traceability map.
              </div>
            </div>

            {/* Accepted-state pills */}
            <div className="flex items-center self-start rounded-lg py-1.5 px-2.5 gap-2 bg-[#F1F2F4] border border-[#E5E7EB]">
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
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                Magnitude · Subgroup table · Phase 2 inline
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px]">
                ▾
              </div>
            </div>
            <div className="flex items-center self-start rounded-full py-1.5 px-2.5 gap-2 bg-white border border-[#E5E7EB]">
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
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                Reasoned · 6 steps · 12s
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px]">
                ▾
              </div>
            </div>
            <div className="flex items-center self-start rounded-full py-1.5 px-2.5 gap-2 bg-white border border-[#E5E7EB]">
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
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
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
          <div className="flex flex-col shrink-0 pt-3 pb-4 gap-1.5 bg-white border-t border-[#E5E7EB] px-4">
            <div className="flex items-center rounded-[10px] py-2.5 px-3 gap-2 bg-white ring-1 ring-[#E5E7EB]">
              <div className="grow font-[var(--font-inter)] text-[#5A5E66] text-[13px] leading-4">
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
        className="absolute left-1/2 top-[90px] -translate-x-1/2 w-[1090px] max-w-[calc(100%-100px)] flex flex-col rounded-[14px] overflow-clip shadow-[0_24px_60px_#0000002E,0_0_0_1px_#0000000A] bg-white border border-[#E5E7EB]"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between py-3.5 px-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1B1F"
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
            <div className="tracking-[-0.005em] font-[var(--font-inter)] font-semibold text-[#1A1B1F] text-base leading-5">
              Aurora-IV — Phase III CSR · Traceability
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center rounded-md py-1 px-[9px] gap-1.5 bg-[#F1F2F4] border border-[#E5E7EB]">
              <div className="rounded-full shrink-0 bg-[#19A875] size-1.5" />
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                11 nodes · 14 edges · synced
              </div>
            </div>
            <div className="flex items-center rounded-md bg-white border border-[#E5E7EB]">
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
                  −
                </div>
              </div>
              <div className="w-px h-3.5 shrink-0 bg-[#E5E7EB]" />
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px]">
                  100%
                </div>
              </div>
              <div className="w-px h-3.5 shrink-0 bg-[#E5E7EB]" />
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[13px] leading-4">
                  +
                </div>
              </div>
              <div className="w-px h-3.5 shrink-0 bg-[#E5E7EB]" />
              <div className="py-1 px-2.5">
                <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[11px] leading-[14px]">
                  ⤢ fit
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-md shrink-0 border border-[#E5E7EB] size-7">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5A5E66"
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
        <div className="w-full h-[560px] overflow-clip relative shrink-0 bg-[#F1F2F4]">
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
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#E5E7EB" />
              </marker>
              <marker
                id="trace-arrow-strong"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#3935FF" />
              </marker>
            </defs>
            <path
              d="M 214 78 L 360 78 L 360 200 L 470 200"
              stroke="#E4E4E4"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.7"
            />
            <path
              d="M 214 166 L 380 166 L 380 206 L 470 206"
              stroke="#FF4E4A"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-strong)"
              opacity="0.4"
            />
            <path
              d="M 214 254 L 380 254 L 380 214 L 470 214"
              stroke="#E4E4E4"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 214 342 L 360 342 L 360 220 L 470 220"
              stroke="#E4E4E4"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.7"
            />
            <path
              d="M 414 122 L 450 122 L 450 204 L 470 204"
              stroke="#E4E4E4"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 414 298 L 450 298 L 450 216 L 470 216"
              stroke="#E4E4E4"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 614 210 L 650 210 L 650 122 L 670 122"
              stroke="#FF4E4A"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-strong)"
              opacity="0.4"
            />
            <path
              d="M 614 210 L 650 210 L 650 298 L 670 298"
              stroke="#FF4E4A"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-strong)"
              opacity="0.4"
            />
            <path
              d="M 814 122 L 850 122 L 850 166 L 870 166"
              stroke="#E4E4E4"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
            <path
              d="M 814 298 L 850 298 L 850 254 L 870 254"
              stroke="#E4E4E4"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#trace-arrow-muted)"
              opacity="0.4"
            />
          </svg>

          {/* Edge labels */}
          <div className="absolute left-[340px] top-[181px] rounded-[3px] py-px px-1.5 bg-white border border-[#E5E7EB]">
            <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3">
              cites
            </div>
          </div>
          <div className="absolute left-[638px] top-[151px] rounded-[3px] py-px px-1.5 bg-white border border-[#E5E7EB]">
            <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3">
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
            <div className="rounded-[3px] py-px px-1 bg-[#F6F6F6]">
              <div className="font-[var(--font-inconsolata)] font-bold text-[#5A5E66] text-[9px] leading-3">
                md
              </div>
            </div>
            <div className="flex flex-col grow min-w-0 gap-px">
              <div className="font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-[11px] leading-[14px]">
                CSR-014.md
              </div>
              <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[9px] leading-3">
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
          <div className="absolute right-[18px] bottom-[18px] w-[140px] h-[80px] rounded-md overflow-clip shadow-[0_2px_6px_#0000000F] bg-white border border-[#E5E7EB]">
            <div className="left-1.5 top-1.5 w-[128px] h-[68px] rounded-[3px] absolute bg-[#F1F2F4] border border-[#E5E7EB]" />
            <div className="left-2 top-2 w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-2 top-[18px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-2 top-7 w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-2 top-[38px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-6 top-[13px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-6 top-[33px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-10 top-[23px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#FF4E4A]" />
            <div className="left-14 top-[13px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-14 top-[33px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-[72px] top-[18px] w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-[72px] top-7 w-[11px] h-1.5 rounded-[1px] absolute bg-[#E5E7EB]" />
            <div className="left-1 top-1 w-[130px] h-[72px] rounded-[3px] absolute border-[1.5px] border-[#FF4E4A]" />
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between py-2.5 px-5 bg-white border-t border-[#E5E7EB]">
          <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[11px] leading-[14px]">
            drag to pan · scroll to zoom · click a node to open as tab
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-[5px]">
              <div className="rounded-sm shrink-0 bg-white border-[1.5px] border-[#3935FF] size-2.5" />
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3">
                current
              </div>
            </div>
            <div className="flex items-center gap-[5px]">
              <div className="w-3.5 h-[1.5px] shrink-0 bg-[#3935FF]" />
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3">
                strong
              </div>
            </div>
            <div className="flex items-center gap-[5px]">
              <div className="w-3.5 h-px shrink-0 bg-[#E5E7EB]" />
              <div className="font-[var(--font-inconsolata)] text-[#5A5E66] text-[10px] leading-3">
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
    <div className="flex flex-col pt-3.5 gap-0.5 px-2 first:pt-0">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-1.5">
          <div className="shrink-0 size-0 origin-center [transform:rotate(45deg)] border-y-[3px] border-y-transparent border-l-[4px] border-l-[#1A1B1F]" />
          <div className="font-[var(--font-inconsolata)] font-bold text-[#1A1B1F] text-[13px] leading-4">
            {label}
          </div>
        </div>
        <div className="font-[var(--font-inconsolata)] font-bold text-[#8E939A] text-[11px] leading-[14px]">
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
      className={`flex items-center justify-between py-2 px-2.5 gap-2 rounded-md ${
        active ? "bg-[#EEF0F4]" : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileBadge file={{ badge, badgeStyle: badgeStyle ?? "default", fileName: name }} />
        <div
          className={`font-[var(--font-inconsolata)] text-[13px] leading-4 truncate ${
            active ? "text-[#1A1B1F]" : "text-[#5A5E66]"
          }`}
        >
          {name}
        </div>
      </div>
      {active ? <div className="rounded-full shrink-0 bg-[#3935FF] size-1.5" /> : null}
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
      className="absolute w-36 h-14 flex items-center rounded-lg px-3 gap-2 shadow-[0_1px_2px_#0000000A] bg-white border border-[#E5E7EB]"
      style={{ left, top }}
    >
      <FileBadge file={{ badge, badgeStyle: badgeStyle ?? "default", fileName: name }} />
      <div className="flex flex-col grow min-w-0 gap-px">
        <div className="font-[var(--font-inconsolata)] text-[#1A1B1F] text-[11px] leading-[14px] truncate">
          {name}
        </div>
        <div className="font-[var(--font-inconsolata)] text-[#8E939A] text-[9px] leading-3">
          {sub}
        </div>
      </div>
    </div>
  );
}
