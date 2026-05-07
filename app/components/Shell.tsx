"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Beat } from "../types";
import { TopBar } from "./TopBar";
import { EditorToolbar } from "./EditorChrome";
import { EditorBody } from "./EditorBody";
import { CopilotPanel } from "./Copilot";
import { TraceabilityMap } from "./TraceabilityMap";

export function Shell({ beat }: { beat: Beat }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white text-ink antialiased">
      <TopBar />
      <div className="flex grow shrink basis-0 min-h-0 w-full">
        <section className="flex flex-col grow shrink basis-0 min-w-0">
          <EditorToolbar tabs={beat.tabs} sideBySide={beat.sideBySide} />
          <motion.div layout className="flex grow shrink basis-0 min-h-0">
            <EditorBody mode={beat.editorMode} workingBlock={beat.workingBlock} />
          </motion.div>
        </section>
        <CopilotPanel
          thread={beat.thread}
          composer={beat.composer}
          suggestions={beat.suggestions}
        />
      </div>
      <AnimatePresence>
        {beat.modal === "map" && <TraceabilityMap key="map" />}
      </AnimatePresence>
    </div>
  );
}
