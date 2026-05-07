export type TabKind = "md" | "csv" | "pdf";

export type TabConfig = {
  id: string;
  kind: TabKind;
  label: string;
  active: boolean;
  fromMap?: boolean;
};

export type SuggestionPill = {
  label: string;
};

export type SourceRef =
  | { kind: "md"; file: string; section?: string; expanded?: boolean }
  | { kind: "csv"; file: string; expanded?: boolean }
  | { kind: "pdf"; file: string; section?: string; page?: string; expanded?: boolean };

export type ReasoningStepStatus = "active" | "done";

export type ReasoningStep = {
  n: 1 | 2 | 3 | 4;
  total?: 4;
  caption: string;
  status: ReasoningStepStatus;
  source?: SourceRef;
};

export type ClarifyOption = {
  letter: "A" | "B" | "C";
  text: string;
};

export type ClarifyCardData = {
  qN: 1 | 2 | 3;
  total: 3;
  question: string;
  options: ClarifyOption[];
  selected?: "A" | "B" | "C";
  prevAnswered?: number[];
};

export type NarrativeVariant = "v1" | "v2" | "v3";
export type WordingVariant = "fda" | "ema";

export type WorkingBlockState =
  | { kind: "preparing"; sublabel?: string }
  | { kind: "narrative-carousel"; current: NarrativeVariant }
  | { kind: "wording-carousel"; current: WordingVariant };

export type ThreadEntry =
  | { kind: "user"; text: string; timestamp?: string }
  | { kind: "peer-text"; text: string; thinking?: boolean; timestamp?: string }
  | { kind: "summary-pill" }
  | { kind: "reasoning-steps"; steps: ReasoningStep[] }
  | { kind: "reasoned-pill"; expanded?: boolean }
  | { kind: "clarify-card"; data: ClarifyCardData }
  | { kind: "narrative-carousel-card"; current: NarrativeVariant }
  | { kind: "wording-carousel-card"; current: WordingVariant }
  | { kind: "accepted-pill"; label: string; revisit?: boolean }
  | { kind: "drafting-text" }
  | { kind: "single-step"; caption: string; source?: SourceRef; status: ReasoningStepStatus };

export type ComposerState = {
  mode: "idle" | "typed" | "sent";
  value?: string;
};

export type EditorBodyMode =
  | { kind: "csr-doc"; commitedNarrative?: NarrativeVariant; committedEMA?: boolean }
  | { kind: "csv-listing" }
  | { kind: "side-by-side" }
  | { kind: "pdf-protocol" };

export type Beat = {
  id: string;
  paperId: string;
  label: string;
  cta?: string;
  composer: ComposerState;
  tabs: TabConfig[];
  sideBySide: boolean;
  editorMode: EditorBodyMode;
  workingBlock: WorkingBlockState | null;
  thread: ThreadEntry[];
  suggestions: SuggestionPill[];
  modal: "map" | null;
};
