"use client";

import { useEffect, useState } from "react";
import { STEPS } from "./steps";

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
        setIdx((i) => Math.min(i + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      else if (e.key === "Home" || e.key === "r" || e.key === "R") setIdx(0);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const step = STEPS[idx];
  const Screen = step.Component;

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-[#f5f2ed]">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div key={step.id} className="absolute inset-0">
          <Screen />
        </div>
      </div>
    </main>
  );
}
