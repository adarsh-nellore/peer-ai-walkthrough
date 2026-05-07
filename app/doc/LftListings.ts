// Phase 3 LFT listings — synthetic dataset for the §12.4 evidence reference.

export type LftRow = {
  id: string;
  day: number;
  alt: number;
  ast?: number;
  uln?: number;
  outcome: string;
  flagged: boolean;
};

export const LFT_FULL: LftRow[] = [
  { id: "A4-0412", day: 14, alt: 112, ast: 98, uln: 3.2, outcome: "G2 · resolved", flagged: false },
  { id: "A4-0418", day: 21, alt: 147, ast: 132, uln: 4.1, outcome: "G3 · DILI · discont.", flagged: true },
  { id: "A4-0421", day: 7, alt: 128, ast: 115, uln: 3.6, outcome: "G2 · resolved", flagged: false },
  { id: "A4-0427", day: 28, alt: 216, ast: 189, uln: 6.0, outcome: "G3 · DILI · discont.", flagged: true },
  { id: "A4-0431", day: 14, alt: 95, ast: 88, uln: 2.7, outcome: "G1 · resolved", flagged: false },
  { id: "A4-0438", day: 42, alt: 122, ast: 110, uln: 3.5, outcome: "G2 · resolved", flagged: false },
];

export const LFT_PREVIEW = LFT_FULL.slice(0, 3);

export const LFT_TOTAL = 27;
