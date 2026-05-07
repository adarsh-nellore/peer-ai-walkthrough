"use client";

import type { ClarifyCardData } from "../types";
import { CheckGlyph } from "./Primitives";
import { motion } from "framer-motion";

export function ClarifyCard({ data }: { data: ClarifyCardData }) {
  return (
    <motion.div
      layout
      className="flex flex-col rounded-[14px] bg-white ring-1 ring-hairline shadow-card"
    >
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <QChips qN={data.qN} prevAnswered={data.prevAnswered ?? []} />
        <span className="font-mono text-[11px] tracking-[0.04em] text-faint">
          Question {data.qN} of {data.total}
        </span>
      </div>
      <div className="px-3.5 pb-2">
        <p className="font-display text-[17px] leading-[1.3] tracking-[-0.005em] text-ink">
          {data.question}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 px-2.5 pb-3">
        {data.options.map((o) => {
          const selected = data.selected === o.letter;
          return (
            <motion.div
              key={o.letter}
              whileTap={{ scale: 0.99 }}
              animate={{
                backgroundColor: selected ? "#FFF1F0" : "#FFFFFF",
                borderColor: selected ? "#FF4E49" : "#E5E7EB",
              }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2.5 rounded-md border px-3 py-2.5 cursor-default"
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-[4px] font-mono text-[10px] font-bold ${
                  selected
                    ? "bg-coral text-white"
                    : "ring-1 ring-hairline text-muted bg-white"
                }`}
              >
                {o.letter}
              </span>
              <span className="grow text-[13px] leading-tight text-ink">{o.text}</span>
              {selected && (
                <span className="text-coral">
                  <CheckGlyph size={12} />
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function QChips({ qN, prevAnswered }: { qN: 1 | 2 | 3; prevAnswered: number[] }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((n) => {
        const answered = prevAnswered.includes(n);
        const active = n === qN && !answered;
        return (
          <span
            key={n}
            className={`inline-flex items-center justify-center w-4 h-4 rounded-[4px] font-mono text-[10px] font-bold ${
              answered
                ? "bg-green text-white"
                : active
                ? "bg-coral text-white"
                : "ring-1 ring-hairline text-faint"
            }`}
          >
            {answered ? "✓" : n}
          </span>
        );
      })}
    </div>
  );
}
