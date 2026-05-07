"use client";

import type { ReactNode } from "react";
import type {
  ThreadEntry,
  SuggestionPill,
  ComposerState,
  ReasoningStep,
  SourceRef,
} from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { CheckGlyph, Chev, Dot, KindBadge, MetaLabel, MetaText, Pill, Sparkle } from "./Primitives";
import { ClarifyCard } from "./ClarifyCard";
import { NarrativeCarouselCard, WordingCarouselCard } from "./CarouselCard";
import {
  PHASE2_BASELINE_EXCERPT,
  PHASE2_CROSSCHECK_EXCERPT,
  PROTOCOL_DEFINITIONS,
  PROTOCOL_MONITORING_EXCERPT,
} from "../doc/narratives";
import { LFT_PREVIEW, LFT_TOTAL } from "../doc/LftListings";

export function CopilotPanel({
  thread,
  composer,
  suggestions,
}: {
  thread: ThreadEntry[];
  composer: ComposerState;
  suggestions: SuggestionPill[];
}) {
  return (
    <aside className="flex flex-col w-[360px] shrink-0 border-l border-hairline bg-white">
      <CopilotHeader />
      <div className="flex grow shrink basis-0 min-h-0 flex-col overflow-y-auto scroll-tame px-5 py-5 gap-4">
        <motion.div layout className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {thread.map((entry, i) => (
              <ThreadRow key={`${i}-${entry.kind}`} entry={entry} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-2 px-5 pt-3 pb-3 border-t border-hairline bg-white"
          >
            {suggestions.map((s, i) => (
              <Pill key={i} variant="suggestion" className="self-start">
                <span className="text-coral">
                  <Sparkle size={9} />
                </span>
                <span className="font-sans text-[12px] text-ink">{s.label}</span>
              </Pill>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <Composer state={composer} />
    </aside>
  );
}

function CopilotHeader() {
  return (
    <div className="flex items-center justify-between h-14 shrink-0 px-5 border-b border-hairline bg-white">
      <div className="flex items-center gap-2.5">
        <span className="size-2 rounded-full bg-coral" />
        <span className="font-display text-[18px] tracking-[-0.005em] text-ink font-medium">
          Copilot
        </span>
      </div>
      <span className="font-mono text-[11px] tracking-[0.04em] text-faint">peer-csr-v3</span>
    </div>
  );
}

function ThreadRow({ entry }: { entry: ThreadEntry }) {
  const wrap = (children: ReactNode) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );

  switch (entry.kind) {
    case "user":
      return wrap(<UserBubble text={entry.text} timestamp={entry.timestamp} />);
    case "peer-text":
      return wrap(
        <PeerRow timestamp={entry.timestamp}>
          {entry.thinking ? (
            <span className="text-[13px] italic text-faint">Thinking…</span>
          ) : (
            <p className="text-[13px] leading-[1.55] text-ink">{entry.text}</p>
          )}
        </PeerRow>
      );
    case "summary-pill":
      return wrap(<SummaryPill />);
    case "reasoned-pill":
      return wrap(<ReasonedPill expanded={entry.expanded} />);
    case "reasoning-steps":
      return wrap(<ReasoningSteps steps={entry.steps} />);
    case "single-step":
      return wrap(
        <ReasoningStepBlock
          step={{ n: 1, total: 4, caption: entry.caption, source: entry.source, status: entry.status }}
          singleton
        />
      );
    case "clarify-card":
      return wrap(<ClarifyCard data={entry.data} />);
    case "narrative-carousel-card":
      return wrap(<NarrativeCarouselCard current={entry.current} />);
    case "wording-carousel-card":
      return wrap(<WordingCarouselCard current={entry.current} />);
    case "accepted-pill":
      return wrap(<AcceptedPill label={entry.label} revisit={entry.revisit} />);
    case "drafting-text":
      return wrap(
        <p className="text-[13px] italic text-faint">Drafting 3 options…</p>
      );
  }
}

function UserBubble({ text, timestamp = "14:03" }: { text: string; timestamp?: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="font-mono text-[10px] tracking-[0.04em] text-faint">you · {timestamp}</span>
      <div className="max-w-[75%] rounded-[10px] py-2 px-3 bg-soft">
        <p className="text-[13px] leading-[1.55] text-ink">{text}</p>
      </div>
    </div>
  );
}

function PeerRow({
  timestamp = "14:03",
  children,
}: {
  timestamp?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Dot color="coral" size={6} />
        <span className="font-mono text-[10px] tracking-[0.04em] text-faint">peer · {timestamp}</span>
      </div>
      {children}
    </div>
  );
}

function SummaryPill() {
  return (
    <Pill variant="summary" className="self-start">
      <span className="text-green">
        <CheckGlyph size={10} />
      </span>
      <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
        Magnitude · Subgroup table · Phase 2 inline
      </span>
    </Pill>
  );
}

function ReasonedPill({ expanded }: { expanded?: boolean }) {
  return (
    <Pill variant="reasoned" className="self-start">
      <span className="text-green">
        <CheckGlyph size={10} />
      </span>
      <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
        Reasoned · 6 steps · 12s
      </span>
      <Chev open={!!expanded} />
    </Pill>
  );
}

function AcceptedPill({ label, revisit = true }: { label: string; revisit?: boolean }) {
  return (
    <Pill variant="accepted" className="self-start">
      <span className="text-green">
        <CheckGlyph size={10} />
      </span>
      <span className="font-mono text-[11px] tracking-[0.04em] text-muted">{label}</span>
      {revisit && (
        <>
          <span className="w-px h-3 bg-hairline" />
          <span className="inline-flex items-center gap-1 text-coral font-mono text-[11px]">
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="3,12 7,8 7,11 17,11 17,8 21,12 17,16 17,13 7,13 7,16" />
            </svg>
            revisit
          </span>
        </>
      )}
    </Pill>
  );
}

/* -------------------------------------------------------------------------- */
/* Reasoning steps                                                            */
/* -------------------------------------------------------------------------- */

function ReasoningSteps({ steps }: { steps: ReasoningStep[] }) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((s) => (
        <ReasoningStepBlock key={s.n} step={s} />
      ))}
    </div>
  );
}

function ReasoningStepBlock({
  step,
  singleton = false,
}: {
  step: ReasoningStep;
  singleton?: boolean;
}) {
  const isActive = step.status === "active";
  const total = step.total ?? 4;
  return (
    <div
      className={`flex flex-col rounded-md border ${
        isActive ? "border-hairline bg-stripe" : "border-hairline bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {isActive ? (
            <motion.span
              className="size-1.5 rounded-full bg-coral shrink-0"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          ) : (
            <span className="text-green shrink-0">
              <CheckGlyph size={10} />
            </span>
          )}
          <span className={`text-[12px] leading-tight ${isActive ? "text-ink" : "text-muted"} truncate`}>
            {isActive ? `${step.caption}…` : step.caption}
          </span>
        </div>
        {!singleton && (
          <span className="font-mono text-[10px] tracking-[0.04em] text-faint shrink-0">
            step {step.n} of {total}
          </span>
        )}
      </div>
      {step.source && <SourceChip source={step.source} />}
    </div>
  );
}

function SourceChip({ source }: { source: SourceRef }) {
  return (
    <div className="border-t border-hairline">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-b-md">
        <div className="flex items-center gap-2">
          <KindBadge kind={source.kind} />
          <span className="font-mono text-[12px] text-ink">{source.file}</span>
          {(source.kind === "md" && source.section) && (
            <span className="font-mono text-[11px] text-faint">{source.section}</span>
          )}
          {(source.kind === "pdf" && source.section) && (
            <span className="font-mono text-[11px] text-faint">{source.section}</span>
          )}
        </div>
        <Chev open={!!source.expanded} />
      </div>
      {source.expanded && <ExpandedSource source={source} />}
    </div>
  );
}

function ExpandedSource({ source }: { source: SourceRef }) {
  if (source.kind === "csv") {
    return (
      <div className="border-t border-hairline">
        <div className="px-3 pt-2 pb-2">
          <MetaText className="text-faint">rows 412-438 · ALT &gt; 3× ULN</MetaText>
        </div>
        <div className="grid grid-cols-[1.2fr_0.5fr_0.7fr_1.4fr] divide-y divide-soft text-[11px] border-y border-hairline">
          <div className="px-3 py-2 font-mono uppercase tracking-[0.06em] text-[10px] font-bold text-faint">ID</div>
          <div className="px-3 py-2 font-mono uppercase tracking-[0.06em] text-[10px] font-bold text-faint">DAY</div>
          <div className="px-3 py-2 font-mono uppercase tracking-[0.06em] text-[10px] font-bold text-faint">ALT</div>
          <div className="px-3 py-2 font-mono uppercase tracking-[0.06em] text-[10px] font-bold text-faint text-right">OUTCOME</div>
          {LFT_PREVIEW.map((r) => {
            const flagged = r.flagged;
            const cell = `px-3 py-2 ${flagged ? "bg-pink/40 text-pink-ink" : "text-ink"}`;
            return (
              <>
                <div key={`${r.id}-id`} className={`${cell} font-mono`}>{r.id}</div>
                <div key={`${r.id}-d`} className={`${cell} font-mono`}>{r.day}</div>
                <div key={`${r.id}-a`} className={`${cell} font-mono ${flagged ? "font-bold" : ""}`}>{r.alt}</div>
                <div key={`${r.id}-o`} className={`${cell} font-mono text-right ${flagged ? "font-bold" : ""}`}>{r.outcome}</div>
              </>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <MetaText className="text-faint">+{LFT_TOTAL - LFT_PREVIEW.length} more rows</MetaText>
          <button className="inline-flex items-center gap-1 font-mono text-[11px] text-coral">
            Open in editor
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="7,17 17,7" />
              <polyline points="9,7 17,7 17,15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
  if (source.kind === "md") {
    const isCrossCheck = source.section === "§5.2 cross-check";
    return (
      <div className="border-t border-hairline px-3 py-3">
        <p className="text-[11.5px] leading-[1.55] text-ink">
          {isCrossCheck ? PHASE2_CROSSCHECK_EXCERPT : PHASE2_BASELINE_EXCERPT}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <MetaText className="text-faint">
            {isCrossCheck ? "2 trials cross-referenced" : "12 paragraphs"}
          </MetaText>
          <button className="inline-flex items-center gap-1 font-mono text-[11px] text-coral">
            Open in editor
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="7,17 17,7" />
              <polyline points="9,7 17,7 17,15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
  if (source.kind === "pdf") {
    return (
      <div className="border-t border-hairline px-3 py-3">
        <MetaLabel className="block mb-2">{source.page ?? "P. 12"} · §6.3 Hepatic safety monitoring</MetaLabel>
        <p className="text-[11.5px] leading-[1.55] text-ink mb-3">{PROTOCOL_MONITORING_EXCERPT}</p>
        <div className="rounded-md bg-stripe border border-hairline divide-y divide-hairline mb-2">
          {PROTOCOL_DEFINITIONS.slice(0, 2).map((d) => (
            <div key={d.term} className="grid grid-cols-[64px_1fr] gap-3 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-faint">
                {d.term}
              </span>
              <span className="text-[11px] leading-[1.45] text-ink">{d.body}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <MetaText className="text-faint">p. 12 of 47</MetaText>
          <button className="inline-flex items-center gap-1 font-mono text-[11px] text-coral">
            Open in editor
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="7,17 17,7" />
              <polyline points="9,7 17,7 17,15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Composer                                                                   */
/* -------------------------------------------------------------------------- */

function Composer({ state }: { state: ComposerState }) {
  const filled = state.mode === "typed" && !!state.value;
  const text = state.mode === "typed" ? state.value : "Type here…";
  const grey = state.mode !== "typed";

  return (
    <div className="border-t border-hairline px-5 py-3 bg-white">
      <div
        className={`flex items-center gap-2 rounded-[10px] ring-1 ${
          filled ? "ring-ink/20" : "ring-hairline"
        } bg-white px-3 py-2.5`}
      >
        <span
          className={`grow font-sans text-[13px] leading-[1.4] ${
            grey ? "text-faint" : "text-ink"
          }`}
        >
          {text}
        </span>
        <button
          className={`inline-flex items-center justify-center size-6 rounded-md ${
            filled ? "bg-coral text-white" : "bg-soft text-faint"
          } transition-colors`}
        >
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <line x1={5} y1={12} x2={19} y2={12} />
            <polyline points="13,6 19,12 13,18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
