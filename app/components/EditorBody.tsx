"use client";

import type { EditorBodyMode, WorkingBlockState } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { MetaLabel, MetaText, KindBadge } from "./Primitives";
import { WorkingBlock } from "./WorkingBlock";
import {
  INTRO_PARAGRAPH,
  ORIGINAL_NARRATIVE_LINES,
  SUBGROUP_PARAGRAPH,
  WORDING_VARIANTS,
  PROTOCOL_DEFINITIONS,
} from "../doc/narratives";
import { LFT_FULL, LFT_TOTAL } from "../doc/LftListings";

export function EditorBody({
  mode,
  workingBlock,
}: {
  mode: EditorBodyMode;
  workingBlock: WorkingBlockState | null;
}) {
  if (mode.kind === "csv-listing") return <CsvListingBody />;
  if (mode.kind === "side-by-side") return <SideBySideBody />;
  if (mode.kind === "pdf-protocol") return <ProtocolPdfBody />;
  return <CsrDocBody mode={mode} workingBlock={workingBlock} />;
}

/* -------------------------------------------------------------------------- */
/* CSR-014.md (the main doc)                                                  */
/* -------------------------------------------------------------------------- */

function CsrDocBody({
  mode,
  workingBlock,
}: {
  mode: Extract<EditorBodyMode, { kind: "csr-doc" }>;
  workingBlock: WorkingBlockState | null;
}) {
  return (
    <div className="flex flex-col grow shrink basis-0 px-20 pt-10 pb-12 overflow-auto scroll-tame max-w-none">
      <header className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <MetaLabel>SECTION 12.4</MetaLabel>
          <span className="text-faint">—</span>
          <MetaText className="text-muted">Phase III</MetaText>
          <span className="text-faint">·</span>
          <MetaText className="text-muted">Aurora-IV</MetaText>
          <span className="text-faint">·</span>
          <MetaText className="text-muted">Hepatic Adverse Events</MetaText>
        </div>
        <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.01em] text-ink font-medium">
          Hepatic adverse events
        </h1>
      </header>

      <p className="text-[15px] leading-[1.65] text-ink mb-8">{INTRO_PARAGRAPH}</p>

      <Table />

      {/* The committed narrative — shown when no working block (default), or after accept */}
      <AnimatePresence mode="wait">
        {!workingBlock && (
          <motion.div
            key="committed-narrative"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-7 flex flex-col gap-5"
          >
            {ORIGINAL_NARRATIVE_LINES.map((line, i) => (
              <p key={i} className="text-[15px] leading-[1.65] text-ink">
                {line}
              </p>
            ))}
            {mode.committedEMA && (
              <motion.p
                key="ema-paragraph"
                initial={{ opacity: 0, y: 4, backgroundColor: "rgba(246,166,0,0.10)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(246,166,0,0)" }}
                transition={{ duration: 1.4 }}
                className="text-[15px] leading-[1.65] text-ink rounded-md"
              >
                {WORDING_VARIANTS.ema.body}
              </motion.p>
            )}
            <p className="text-[15px] leading-[1.65] text-ink">{SUBGROUP_PARAGRAPH}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The gold working/preview block sits BELOW the table when active */}
      <AnimatePresence>
        {workingBlock && (
          <motion.div
            key="working-block"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-7"
          >
            <WorkingBlock state={workingBlock} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* When no working block but we're showing the regular subgroup paragraph it sits above; ensure layout is stable */}
    </div>
  );
}

function Table() {
  return (
    <div className="rounded-[10px] overflow-hidden border border-hairline bg-white">
      <div className="flex items-baseline gap-3 px-5 py-3 bg-stripe border-b border-hairline">
        <MetaLabel>TABLE 12.4-1</MetaLabel>
        <span className="font-display italic text-[14px] text-ink">
          Hepatic adverse events by grade and treatment arm
        </span>
      </div>
      <div className="grid grid-cols-[2fr_1fr_1fr] divide-y divide-hairline">
        <Row header label="GRADE" v1="AURORA-IV (n=598)" v2="PLACEBO (n=293)" />
        <Row label="Grade 1 — transient" v1="34  (5.7%)" v2="7  (2.4%)" />
        <Row stripe label="Grade 2 — moderate ALT↑" v1="13  (2.2%)" v2="4  (1.4%)" />
        <Row label="Grade 3 — DILI criteria" v1="2  (0.3%)" v2="1  (0.3%)" />
        <Row stripe muted label="Grade 4" v1="0  (0.0%)" v2="0  (0.0%)" />
        <Row total label="Total — any grade" v1="49  (8.2%)" v2="12  (4.1%)" />
      </div>
    </div>
  );
}

function Row({
  header,
  stripe,
  total,
  muted,
  label,
  v1,
  v2,
}: {
  header?: boolean;
  stripe?: boolean;
  total?: boolean;
  muted?: boolean;
  label: string;
  v1: string;
  v2: string;
}) {
  const cell = "px-5 py-3 text-[14px] leading-[1.4]";
  const bg = total ? "bg-white border-t-[1.5px] border-ink" : stripe ? "bg-stripe" : "bg-white";
  const labelClass = total
    ? "font-semibold text-ink"
    : header
    ? "font-mono uppercase tracking-[0.06em] text-[11px] font-bold text-faint"
    : "text-ink";
  const numClass = total
    ? "font-mono font-bold text-ink"
    : header
    ? "font-mono uppercase tracking-[0.06em] text-[11px] font-bold text-faint"
    : muted
    ? "font-mono text-faint"
    : "font-mono text-ink";

  return (
    <>
      <div className={`${cell} ${bg} ${labelClass}`}>{label}</div>
      <div className={`${cell} ${bg} ${numClass} text-right`}>{v1}</div>
      <div className={`${cell} ${bg} ${numClass} text-right`}>{v2}</div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Phase3-LFT-Listings.csv (full csv tab)                                     */
/* -------------------------------------------------------------------------- */

export function CsvListingBody({ split = false }: { split?: boolean }) {
  return (
    <div className={`flex flex-col grow shrink basis-0 ${split ? "px-8 pt-10" : "px-12 pt-10"} pb-12 overflow-auto scroll-tame`}>
      <div className="flex items-center gap-2 mb-3">
        <MetaLabel>EVIDENCE</MetaLabel>
        <span className="text-faint">·</span>
        <MetaText className="text-muted">Phase 3 LFT listings</MetaText>
        <span className="text-faint">·</span>
        <MetaText className="text-muted">filtered: ALT &gt; 3×ULN · rows 412-438</MetaText>
      </div>
      <div className="flex items-baseline justify-between mb-5 gap-4">
        <h2 className="font-display text-[26px] leading-[1.15] tracking-[-0.01em] text-ink font-medium">
          Phase3-LFT-Listings
        </h2>
        <div className="flex items-center gap-3">
          <MetaText className="text-muted">{LFT_TOTAL} rows · 5 cols</MetaText>
          <button className="px-2.5 py-1 rounded-md ring-1 ring-hairline bg-white text-[12px] font-mono text-ink hover:ring-ink/30 transition">
            filter
          </button>
          <button className="px-2.5 py-1 rounded-md ring-1 ring-hairline bg-white text-[12px] font-mono text-ink hover:ring-ink/30 transition">
            export
          </button>
        </div>
      </div>
      <div className="grid grid-cols-[1.5fr_0.7fr_0.9fr_0.9fr_0.9fr] divide-y divide-soft text-[12px]">
        <CsvHeader />
        {LFT_FULL.map((r) => (
          <CsvRow key={r.id} row={r} />
        ))}
        <div className="px-3 py-3 text-faint font-mono col-span-5 border-t border-hairline">…</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-faint">
          <line x1={5} y1={12} x2={19} y2={12} />
          <polyline points="13,6 19,12 13,18" />
        </svg>
        <MetaText className="text-muted">opened from CSR-014.md §12.4</MetaText>
      </div>
    </div>
  );
}

function CsvHeader() {
  const cell = "px-3 py-3 font-mono uppercase tracking-[0.06em] text-[10px] font-bold text-faint";
  return (
    <>
      <div className={cell}>PT-ID</div>
      <div className={cell}>DAY</div>
      <div className={cell}>ALT (U/L)</div>
      <div className={cell}>AST (U/L)</div>
      <div className={cell}>×ULN</div>
    </>
  );
}

function CsvRow({ row }: { row: import("../doc/LftListings").LftRow }) {
  const flagged = row.flagged;
  const cell = `px-3 py-3 ${flagged ? "bg-pink/40 text-pink-ink" : "text-ink"}`;
  return (
    <>
      <div className={`${cell} font-mono`}>{row.id}</div>
      <div className={`${cell} font-mono`}>{row.day}</div>
      <div className={`${cell} font-mono ${flagged ? "font-bold" : ""}`}>{row.alt}</div>
      <div className={`${cell} font-mono`}>{row.ast}</div>
      <div className={`${cell} font-mono ${flagged ? "font-bold" : ""}`}>{row.uln?.toFixed(1)}</div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Side-by-side                                                               */
/* -------------------------------------------------------------------------- */

function SideBySideBody() {
  return (
    <div className="flex grow shrink basis-0 overflow-hidden">
      <div className="flex flex-col grow basis-1/2 min-w-0 border-r border-hairline overflow-auto scroll-tame px-8 pt-10 pb-12">
        <div className="flex items-center gap-2 mb-3">
          <MetaLabel>SECTION 12.4</MetaLabel>
          <span className="text-faint">·</span>
          <MetaText className="text-muted">Hepatic Adverse Events</MetaText>
        </div>
        <h2 className="font-display text-[26px] leading-[1.15] tracking-[-0.01em] text-ink font-medium mb-5">
          Hepatic adverse events
        </h2>
        <p className="text-[14px] leading-[1.65] text-ink mb-6">{INTRO_PARAGRAPH}</p>
        <div className="rounded-[10px] overflow-hidden border border-hairline bg-white mb-6">
          <div className="px-4 py-2.5 bg-stripe border-b border-hairline">
            <MetaLabel>TABLE 12.4-1</MetaLabel>
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr] divide-y divide-hairline">
            <Row label="Grade 1 — transient" v1="34  (5.7%)" v2="7  (2.4%)" />
            <Row stripe label="Grade 2" v1="13  (2.2%)" v2="4  (1.4%)" />
            <Row label="Grade 3 — DILI" v1="2  (0.3%)" v2="1  (0.3%)" />
            <Row total label="Total" v1="49  (8.2%)" v2="12  (4.1%)" />
          </div>
        </div>
        <p className="text-[14px] leading-[1.65] text-ink mb-4">
          The hepatic AE rate in Aurora-IV (8.2%; n=49/598) tracks the Phase 2 finding (7.6%; n=18/237 in Phase2-CSR-007 §5.2), suggesting a stable safety profile across exposure cohorts.
        </p>
        <p className="text-[14px] leading-[1.65] text-ink">{SUBGROUP_PARAGRAPH}</p>
      </div>
      <div className="flex flex-col grow basis-1/2 min-w-0 overflow-auto scroll-tame">
        <CsvListingBody split />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Aurora-IV_Protocol_v4.2 PDF tab                                            */
/* -------------------------------------------------------------------------- */

function ProtocolPdfBody() {
  return (
    <div className="flex flex-col grow shrink basis-0 px-20 pt-10 pb-12 overflow-auto scroll-tame max-w-[920px]">
      <div className="flex items-center gap-2 mb-3">
        <MetaLabel>SECTION 6.3</MetaLabel>
        <span className="text-faint">·</span>
        <MetaText className="text-muted">Aurora-IV Protocol v4.2</MetaText>
        <span className="text-faint">·</span>
        <MetaText className="text-muted">Hepatic safety monitoring</MetaText>
      </div>
      <h1 className="font-display text-[32px] leading-[1.15] tracking-[-0.01em] text-ink font-medium mb-6">
        Hepatic safety monitoring
      </h1>
      <p className="text-[15px] leading-[1.65] text-ink mb-6">
        Liver function tests are obtained at screening, biweekly during the first cycle, and monthly thereafter. Subjects with ALT or AST &gt; 3× ULN repeat within 72 hours; sustained elevations trigger discontinuation per the rules below.
      </p>

      <div className="rounded-[10px] overflow-hidden border border-hairline bg-white mb-6">
        <div className="px-5 py-3 bg-stripe border-b border-hairline">
          <MetaLabel>DEFINITIONS</MetaLabel>
        </div>
        <div className="divide-y divide-hairline">
          {PROTOCOL_DEFINITIONS.map((d) => (
            <div key={d.term} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-4">
              <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
                {d.term}
              </span>
              <p className="text-[14px] leading-[1.55] text-ink">{d.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[15px] leading-[1.65] text-ink">
        Permanent discontinuation is required for ALT or AST &gt; 8× ULN, or for ALT or AST &gt; 3× ULN with concurrent symptoms (fatigue, nausea, jaundice, right upper quadrant pain) lasting &gt; 4 weeks.
      </p>
    </div>
  );
}
