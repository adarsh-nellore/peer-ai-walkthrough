"use client";

import { useEffect, useState } from "react";
import { BEATS } from "./beats";
import { Shell } from "./components/Shell";

const FRAME_W = 1440;
const FRAME_H = 900;

export default function Home() {
  const [idx, setIdx] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const recalc = () => {
      const s = Math.min(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H);
      setScale(s);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter")
        setIdx((i) => Math.min(i + 1, BEATS.length - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      else if (e.key === "Home" || e.key === "r" || e.key === "R") setIdx(0);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const beat = BEATS[idx];

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-warm">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <Shell beat={beat} />
      </div>
      {/* Tiny beat counter — bottom-left corner, low-opacity */}
      <div className="pointer-events-none absolute left-4 bottom-3 font-mono text-[10px] tracking-[0.06em] text-ink/40 select-none">
        {String(idx + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
      </div>
    </main>
  );
}
