"use client";

import type { NarrativeVariant, WordingVariant } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { NARRATIVE_VARIANTS, WORDING_VARIANTS } from "../doc/narratives";

export function NarrativeCarouselCard({ current }: { current: NarrativeVariant }) {
  const v = NARRATIVE_VARIANTS[current];
  return (
    <motion.div
      layout
      className="flex flex-col rounded-[14px] bg-white ring-1 ring-hairline shadow-card"
    >
      <Header label={`${v.label} · ${v.framing}`} cycler />
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="px-3.5 pb-3"
        >
          <p className="text-[12.5px] leading-[1.55] text-ink">{v.body}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-3 px-3.5 pb-3 pt-1 border-t border-hairline">
        {v.pros.map((p, i) => (
          <span key={`p-${i}`} className="font-mono text-[10px] text-green">
            ✓ {p}
          </span>
        ))}
        {v.cons.map((c, i) => (
          <span key={`c-${i}`} className="font-mono text-[10px] text-faint">
            · {c}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function WordingCarouselCard({ current }: { current: WordingVariant }) {
  const w = WORDING_VARIANTS[current];
  return (
    <motion.div
      layout
      className="flex flex-col rounded-[14px] bg-white ring-1 ring-hairline shadow-card"
    >
      <Header label={`${w.label} · ${w.region}`} cycler />
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="px-3.5 pb-3"
        >
          <p className="text-[12.5px] leading-[1.55] italic text-muted">{w.quoted}</p>
        </motion.div>
      </AnimatePresence>
      <div className="px-3.5 pb-3 pt-2 border-t border-hairline">
        <span className="font-mono text-[10px] tracking-[0.04em] text-faint">
          Justification / diff short explanation here
        </span>
      </div>
    </motion.div>
  );
}

function Header({ label, cycler }: { label: string; cycler?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 pt-3 pb-2">
      <div className="flex items-center gap-3">
        {cycler && (
          <div className="inline-flex items-center rounded-md ring-1 ring-hairline bg-white">
            <button className="w-7 h-6 inline-flex items-center justify-center text-faint">‹</button>
            <div className="w-px h-3.5 bg-hairline" />
            <button className="w-7 h-6 inline-flex items-center justify-center text-coral">›</button>
          </div>
        )}
        <span className="font-mono text-[12px] text-ink">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-coral-soft text-coral font-mono text-[11px]">
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5,12 10,17 19,7" />
          </svg>
          accept
        </button>
        <button className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-white ring-1 ring-hairline text-muted font-mono text-[11px]">
          <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1={6} y1={6} x2={18} y2={18} />
            <line x1={18} y1={6} x2={6} y2={18} />
          </svg>
          cancel
        </button>
      </div>
    </div>
  );
}
