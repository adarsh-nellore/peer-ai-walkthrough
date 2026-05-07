"use client";

import type { TabConfig } from "../types";
import { KindBadge } from "./Primitives";
import { motion, AnimatePresence } from "framer-motion";

export function EditorToolbar({
  tabs,
  sideBySide,
  onMapClick,
}: {
  tabs: TabConfig[];
  sideBySide: boolean;
  onMapClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 h-12 shrink-0 border-b border-hairline bg-white px-3">
      <button
        type="button"
        onClick={onMapClick}
        title="Open traceability map"
        className="flex items-center justify-center size-8 rounded-md ring-1 ring-hairline bg-white hover:ring-ink/30 transition"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-ink">
          <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" strokeLinejoin="round" />
          <line x1={9} y1={3} x2={9} y2={18} />
          <line x1={15} y1={6} x2={15} y2={21} />
        </svg>
      </button>

      <div className="flex items-end h-full gap-2 self-end -mb-px">
        <AnimatePresence initial={false}>
          {tabs.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <EditorTab tab={t} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grow" />

      <AnimatePresence initial={false}>
        {(tabs.length > 1 || sideBySide) && (
          <motion.button
            type="button"
            layout
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className={`inline-flex items-center gap-2 h-8 px-3 rounded-md text-[12px] font-mono ring-1 transition-colors ${
              sideBySide
                ? "bg-coral text-white ring-coral"
                : "bg-white text-ink ring-hairline hover:ring-ink/30"
            }`}
            title="Toggle side-by-side"
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <rect x={3} y={4} width={8} height={16} rx={1} />
              <rect x={13} y={4} width={8} height={16} rx={1} />
            </svg>
            side-by-side
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditorTab({ tab }: { tab: TabConfig }) {
  return (
    <div
      className={`relative flex items-center h-9 px-3 gap-2 rounded-t-lg ${
        tab.active
          ? "bg-white ring-1 ring-hairline ring-b-0 border-t-2 border-t-coral"
          : "bg-soft text-muted"
      }`}
    >
      <KindBadge kind={tab.kind} />
      <span
        className={`font-mono text-[13px] leading-none ${
          tab.active ? "text-ink" : "text-muted"
        }`}
      >
        {tab.label}
      </span>
      {tab.fromMap && (
        <span className="ml-1 inline-flex items-center rounded-sm px-1.5 py-px font-mono text-[8px] uppercase tracking-[0.08em] bg-coral-soft text-coral">
          from map
        </span>
      )}
      <span className="ml-1 text-faint text-[14px] leading-none cursor-default">×</span>
    </div>
  );
}
