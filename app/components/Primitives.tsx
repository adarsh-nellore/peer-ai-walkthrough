import type { ReactNode } from "react";
import type { TabKind } from "../types";

/** Type badge for a file: md / csv / pdf. Used in tabs, source chips, map nodes. */
export function KindBadge({ kind, size = "sm" }: { kind: TabKind; size?: "sm" | "md" }) {
  const palette = {
    md: { bg: "bg-soft", text: "text-muted" },
    csv: { bg: "bg-green-soft", text: "text-green" },
    pdf: { bg: "bg-pink", text: "text-pink-ink" },
  } as const;
  const dim = size === "md" ? "h-5 px-2 text-[10px]" : "h-4 px-1.5 text-[9px]";
  const { bg, text } = palette[kind];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[4px] font-mono font-semibold tracking-[0.04em] ${bg} ${text} ${dim}`}
    >
      {kind}
    </span>
  );
}

/** A small status dot. */
export function Dot({ color = "coral", size = 6 }: { color?: "coral" | "green"; size?: number }) {
  const bg = color === "coral" ? "bg-coral" : "bg-green";
  return <span className={`shrink-0 rounded-full ${bg}`} style={{ width: size, height: size }} />;
}

/** Mono caption. */
export function MetaText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] leading-[1.3] tracking-[0.04em] text-faint ${className}`}>
      {children}
    </span>
  );
}

/** Inconsolata uppercase label. */
export function MetaLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`font-mono text-[10px] leading-[1.3] uppercase tracking-[0.06em] font-semibold text-muted ${className}`}
    >
      {children}
    </span>
  );
}

/** Generic pill. */
export function Pill({
  children,
  variant = "default",
  className = "",
  onClick,
}: {
  children: ReactNode;
  variant?: "default" | "summary" | "accepted" | "reasoned" | "suggestion";
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full ring-1 transition-colors text-[12px] leading-none font-mono";
  const skin = {
    default: "bg-white ring-hairline px-3 py-1.5 text-muted",
    summary: "bg-stripe ring-hairline px-3 py-1.5 text-muted",
    accepted: "bg-stripe ring-hairline px-3 py-1.5 text-muted",
    reasoned: "bg-stripe ring-hairline px-3 py-1.5 text-muted hover:ring-coral cursor-pointer",
    suggestion: "bg-white ring-hairline px-3 py-1.5 text-ink hover:ring-coral cursor-pointer",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${skin} ${className}`}
    >
      {children}
    </button>
  );
}

/** Inline check glyph (green ✓). */
export function CheckGlyph({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5,12 10,17 19,7" />
    </svg>
  );
}

/** Small disclosure chevron (▾ or ▸). */
export function Chev({ open }: { open: boolean }) {
  return (
    <svg
      width={9}
      height={9}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}
    >
      <polyline points="3,4 6,8 9,4" />
    </svg>
  );
}

/** Sparkle glyph for suggestion pills. */
export function Sparkle({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0 L9 6 L15 7 L9 8 L8 14 L7 8 L1 7 L7 6 Z" />
    </svg>
  );
}
