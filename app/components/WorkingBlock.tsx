"use client";

import type { WorkingBlockState } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { MetaLabel, MetaText } from "./Primitives";
import { NARRATIVE_VARIANTS, WORDING_VARIANTS } from "../doc/narratives";

export function WorkingBlock({ state }: { state: WorkingBlockState }) {
  if (state.kind === "preparing") {
    return (
      <div className="rounded-md bg-gold-soft border-l-[3px] border-gold pl-4 pr-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <motion.span
            className="size-1.5 rounded-full bg-gold shrink-0"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <MetaLabel>PREPARING</MetaLabel>
          <MetaText className="text-muted">
            §12.4 hepatic AE narrative · {state.sublabel ?? "awaiting clarification"}
          </MetaText>
        </div>
        <p className="text-[15px] leading-[1.65] text-ink">
          Hepatic adverse events occurred in 8.2% of Aurora-IV recipients (n=49/598) versus 4.1% on placebo (n=12/293). Most events were Grade 1–2 transient ALT elevations, resolving without intervention within a median of 14 days. Two Grade 3 events met DILI criteria; both resolved on discontinuation. No Hy&apos;s Law cases were observed.
        </p>
      </div>
    );
  }

  if (state.kind === "narrative-carousel") {
    const v = NARRATIVE_VARIANTS[state.current];
    return (
      <div className="rounded-md bg-gold-soft border-l-[3px] border-gold pl-4 pr-5 py-4">
        <CarouselHeader
          label={`${v.label} · ${v.framing}`}
          accept
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={state.current}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-[15px] leading-[1.65] text-ink"
          >
            {v.body}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  if (state.kind === "wording-carousel") {
    const w = WORDING_VARIANTS[state.current];
    return (
      <div className="rounded-md bg-gold-soft border-l-[3px] border-gold pl-4 pr-5 py-4">
        <CarouselHeader label={`${w.label} · ${w.region}`} accept />
        <AnimatePresence mode="wait">
          <motion.p
            key={state.current}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-[15px] leading-[1.65] text-ink"
          >
            {w.body}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

function CarouselHeader({ label, accept }: { label: string; accept?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-3 gap-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-md ring-1 ring-hairline bg-white">
          <button className="w-7 h-6 inline-flex items-center justify-center text-faint hover:text-ink">
            ‹
          </button>
          <div className="w-px h-3.5 bg-hairline" />
          <button className="w-7 h-6 inline-flex items-center justify-center text-coral">›</button>
        </div>
        <span className="font-mono text-[12px] text-ink">{label}</span>
      </div>
      {accept && (
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-coral text-white text-[12px] font-mono font-semibold">
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5,12 10,17 19,7" />
            </svg>
            accept
          </button>
          <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white ring-1 ring-hairline text-[12px] font-mono text-muted">
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1={6} y1={6} x2={18} y2={18} />
              <line x1={18} y1={6} x2={6} y2={18} />
            </svg>
            cancel
          </button>
        </div>
      )}
    </div>
  );
}
