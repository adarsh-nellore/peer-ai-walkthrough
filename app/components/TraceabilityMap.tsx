"use client";

import { motion } from "framer-motion";
import { CURRENT_NODE_ID, EDGES, NODES, type GraphNode } from "../doc/TraceabilityGraph";
import { KindBadge, MetaText } from "./Primitives";

const NODE_W = 200;
const NODE_H = 56;
const GAP_Y = 16;

const LANE_X = {
  source: 80,
  current: 540,
  rollup: 1000,
};

function nodePos(n: GraphNode) {
  const lane = LANE_X[n.lane];
  return { x: lane, y: 80 + n.row * (NODE_H + GAP_Y) };
}

function nodeAnchor(n: GraphNode, side: "left" | "right" | "center") {
  const p = nodePos(n);
  const x = side === "left" ? p.x : side === "right" ? p.x + NODE_W : p.x + NODE_W / 2;
  return { x, y: p.y + NODE_H / 2 };
}

export function TraceabilityMap() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className="absolute inset-0 z-50 flex items-center justify-center px-6 py-6"
    >
      <div className="absolute inset-0 bg-ink/15 backdrop-blur-sm" />
      <div className="relative w-full max-w-[1280px] h-full max-h-[760px] bg-white rounded-[20px] shadow-modal ring-1 ring-hairline overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-6 h-14 shrink-0 border-b border-hairline">
          <div className="flex items-center gap-3">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="text-ink">
              <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" strokeLinejoin="round" />
              <line x1={9} y1={3} x2={9} y2={18} />
              <line x1={15} y1={6} x2={15} y2={21} />
            </svg>
            <h2 className="font-display text-[18px] tracking-[-0.005em] text-ink font-medium">
              Aurora-IV — Phase III CSR · Traceability
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-green" />
              <MetaText className="text-muted">11 nodes · 14 edges · synced</MetaText>
            </div>
            <div className="flex items-center rounded-md ring-1 ring-hairline">
              <button className="w-8 h-7 text-faint">−</button>
              <span className="px-2 font-mono text-[11px] text-muted">100%</span>
              <button className="w-8 h-7 text-faint">+</button>
              <div className="w-px h-4 bg-hairline" />
              <button className="px-2 h-7 font-mono text-[11px] text-muted">⤢ fit</button>
            </div>
            <button className="size-7 inline-flex items-center justify-center rounded-md ring-1 ring-hairline text-muted hover:text-ink">
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1={6} y1={6} x2={18} y2={18} />
                <line x1={18} y1={6} x2={6} y2={18} />
              </svg>
            </button>
          </div>
        </header>

        <div className="grow shrink basis-0 relative bg-stripe overflow-hidden">
          <svg
            viewBox={`0 0 ${LANE_X.rollup + NODE_W + 80} 600`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
          >
            {/* lane labels */}
            <text x={LANE_X.source} y={48} className="font-mono uppercase" fontSize={10} letterSpacing={1.2} fill="#8E939A">
              SOURCES
            </text>
            <text x={LANE_X.current + NODE_W / 2} y={48} textAnchor="middle" className="font-mono uppercase" fontSize={10} letterSpacing={1.2} fill="#8E939A">
              ACTIVE DRAFT
            </text>
            <text x={LANE_X.rollup + NODE_W} y={48} textAnchor="end" className="font-mono uppercase" fontSize={10} letterSpacing={1.2} fill="#8E939A">
              ROLL-UPS
            </text>

            {/* Edges (rendered first so nodes sit on top) */}
            {EDGES.map((e, i) => {
              const from = NODES.find((n) => n.id === e.from)!;
              const to = NODES.find((n) => n.id === e.to)!;
              const a = nodeAnchor(from, "right");
              const b = nodeAnchor(to, "left");
              const isStrong = e.weight === "strong";
              const involvesCurrent = from.id === CURRENT_NODE_ID || to.id === CURRENT_NODE_ID;
              const stroke = involvesCurrent ? "#FF4E49" : "#D5DDE3";
              const opacity = involvesCurrent ? 0.55 : 0.55;
              const dash = isStrong ? "0" : "4 4";
              const midX = (a.x + b.x) / 2;
              const path = `M ${a.x},${a.y} C ${midX},${a.y} ${midX},${b.y} ${b.x},${b.y}`;
              return (
                <g key={i}>
                  <path d={path} stroke={stroke} strokeWidth={isStrong ? 1.5 : 1} fill="none" strokeDasharray={dash} opacity={opacity} />
                  {e.label && (
                    <g>
                      <rect
                        x={midX - 26}
                        y={(a.y + b.y) / 2 - 8}
                        width={52}
                        height={16}
                        rx={3}
                        fill="#FFFFFF"
                        stroke="#E5E7EB"
                      />
                      <text
                        x={midX}
                        y={(a.y + b.y) / 2 + 3}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#5A5E66"
                        className="font-mono"
                      >
                        {e.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              const p = nodePos(n);
              const isCurrent = n.id === CURRENT_NODE_ID;
              return (
                <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
                  {isCurrent && (
                    <rect x={-6} y={-6} width={NODE_W + 12} height={NODE_H + 12} rx={14} fill="#FF4E49" opacity={0.08} />
                  )}
                  <rect
                    x={0}
                    y={0}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill="#FFFFFF"
                    stroke={isCurrent ? "#FF4E49" : "#E5E7EB"}
                    strokeWidth={isCurrent ? 1.5 : 1}
                  />
                  {/* badge */}
                  <foreignObject x={12} y={10} width={NODE_W - 24} height={NODE_H - 16}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <KindBadge kind={n.kind} />
                        <span className="font-mono text-[12px] text-ink leading-none truncate">
                          {n.filename}
                        </span>
                      </div>
                      <span className="font-mono text-[10.5px] tracking-[0.02em] text-muted leading-none">
                        {n.subtitle}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        <footer className="flex items-center justify-between h-10 shrink-0 border-t border-hairline px-6">
          <MetaText className="text-faint">
            drag to pan · scroll to zoom · click a node to open as tab
          </MetaText>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-coral/15 ring-1 ring-coral" />
              <MetaText className="text-muted">current</MetaText>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-px bg-coral" />
              <MetaText className="text-muted">strong</MetaText>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width={14} height={2} viewBox="0 0 14 2">
                <path d="M0,1 L14,1" stroke="#D5DDE3" strokeDasharray="2 2" />
              </svg>
              <MetaText className="text-muted">moderate</MetaText>
            </span>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
