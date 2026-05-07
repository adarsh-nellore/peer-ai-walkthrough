import type { ComponentType } from "react";
import V_00 from "./screens/V_00";
import V_01 from "./screens/V_01";
import V_02 from "./screens/V_02";
import V_03 from "./screens/V_03";
import V_04 from "./screens/V_04";
import V_05 from "./screens/V_05";
import V_06 from "./screens/V_06";
import V_07 from "./screens/V_07";
import V_08 from "./screens/V_08";
import V_09 from "./screens/V_09";
import V_10 from "./screens/V_10";
import V_11 from "./screens/V_11";
import V_12 from "./screens/V_12";
import V_13 from "./screens/V_13";
import V_14 from "./screens/V_14";
import V_15 from "./screens/V_15";
import V_16 from "./screens/V_16";
import V_17 from "./screens/V_17";
import V_18 from "./screens/V_18";
import V_19 from "./screens/V_19";
import V_20 from "./screens/V_20";
import V_21 from "./screens/V_21";
import V_22 from "./screens/V_22";
import V_23 from "./screens/V_23";
import V_24 from "./screens/V_24";
import V_25 from "./screens/V_25";
import V_26 from "./screens/V_26";
import V_27 from "./screens/V_27";
import V_28 from "./screens/V_28";
import V_29 from "./screens/V_29";
import V_30 from "./screens/V_30";
import V_31 from "./screens/V_31";
import V_32 from "./screens/V_32";
import V_33 from "./screens/V_33";
import V_34 from "./screens/V_34";
import V_35 from "./screens/V_35";
import V_36 from "./screens/V_36";
import V_37 from "./screens/V_37";
import V_38 from "./screens/V_38";
import V_39 from "./screens/V_39";
import V_40 from "./screens/V_40";
import V_41 from "./screens/V_41";
import V_42 from "./screens/V_42";
import V_43 from "./screens/V_43";

export type Step = {
  id: string;
  paperId: string;
  label: string;
  ctaHint: string;
  Component: ComponentType;
};

// Chronological top→bottom, left→right order from the Paper file.
export const STEPS: Step[] = [
  { id: "v2-0",     paperId: "948-0", label: "Idle",                              ctaHint: "composer field",            Component: V_00 },
  { id: "v2-0a",    paperId: "998-0", label: "Prompt typed",                      ctaHint: "send button",               Component: V_01 },
  { id: "v2-0b",    paperId: "9DM-0", label: "User bubble",                       ctaHint: "auto",                      Component: V_02 },
  { id: "v2-0c",    paperId: "9UA-0", label: "Thinking…",                         ctaHint: "auto",                      Component: V_03 },
  { id: "v2-0d",    paperId: "9YY-0", label: "Three quick choices",               ctaHint: "auto",                      Component: V_04 },
  { id: "v2-1",     paperId: "9O5-0", label: "Q1 unanswered",                     ctaHint: "option B",                  Component: V_05 },
  { id: "v2-1a",    paperId: "A8L-0", label: "Q1 selected",                       ctaHint: "auto",                      Component: V_06 },
  { id: "v2-2",     paperId: "AIX-0", label: "Q2 unanswered",                     ctaHint: "option B",                  Component: V_07 },
  { id: "v2-2a",    paperId: "AU3-0", label: "Q2 selected (Subgroup table)",      ctaHint: "auto",                      Component: V_08 },
  { id: "v2-3",     paperId: "BBK-0", label: "Q3 unanswered",                     ctaHint: "option A",                  Component: V_09 },
  { id: "v2-3a",    paperId: "BHP-0", label: "Q3 selected",                       ctaHint: "auto",                      Component: V_10 },
  { id: "v2-3b",    paperId: "BWJ-0", label: "3/3 answered",                      ctaHint: "auto",                      Component: V_11 },
  { id: "v2-3c",    paperId: "GMV-0", label: "Summary pill",                      ctaHint: "auto",                      Component: V_12 },
  { id: "v2-4a",    paperId: "HLV-0", label: "Step 1 · reading Phase 2 §5.2",     ctaHint: "auto",                      Component: V_13 },
  { id: "v2-4b",    paperId: "HBZ-0", label: "Step 2 · LFT rows",                 ctaHint: "auto",                      Component: V_14 },
  { id: "v2-4c",    paperId: "I13-0", label: "Step 2 ✓",                          ctaHint: "auto",                      Component: V_15 },
  { id: "v2-4d",    paperId: "II8-0", label: "Steps 1-2 ✓ collapsed",             ctaHint: "auto",                      Component: V_16 },
  { id: "v2-4e",    paperId: "INT-0", label: "Step 3 · cross-checking",           ctaHint: "auto",                      Component: V_17 },
  { id: "v2-4f",    paperId: "ISI-0", label: "Step 3 ✓",                          ctaHint: "auto",                      Component: V_18 },
  { id: "v2-4g",    paperId: "IWY-0", label: "Step 4 · FDA/EMA · Protocol §6.3",  ctaHint: "auto",                      Component: V_19 },
  { id: "v2-4h",    paperId: "J29-0", label: "Drafting 3 options…",               ctaHint: "auto",                      Component: V_20 },
  { id: "v2-4i",    paperId: "J75-0", label: "Reasoned · 6 steps · 12s",          ctaHint: "auto",                      Component: V_21 },
  { id: "v2-4j",    paperId: "JON-0", label: "Settle",                            ctaHint: "auto",                      Component: V_22 },
  { id: "v2-5",     paperId: "JBZ-0", label: "v1 of 3 · conservative",            ctaHint: "▸ next",                    Component: V_23 },
  { id: "v2-6",     paperId: "JTR-0", label: "v2 of 3 · direct",                  ctaHint: "▸ next",                    Component: V_24 },
  { id: "v2-7",     paperId: "K0M-0", label: "v3 of 3 · comparative",             ctaHint: "accept ✓",                  Component: V_25 },
  { id: "v2-7a",    paperId: "KCS-0", label: "v3 accepted + suggestion pills",    ctaHint: "Reasoned pill",             Component: V_26 },
  { id: "v2-7b",    paperId: "KKW-0", label: "Reasoning re-expanded",             ctaHint: "step 2 csv chip",           Component: V_27 },
  { id: "v2-7c",    paperId: "KUO-0", label: "csv rows inline",                   ctaHint: "Open in editor ↗",          Component: V_28 },
  { id: "v2-7d",    paperId: "MD9-0", label: "Settle",                            ctaHint: "csv chip",                  Component: V_29 },
  { id: "v2-10",    paperId: "M01-0", label: "csv as new tab",                    ctaHint: "side-by-side",              Component: V_30 },
  { id: "v2-11",    paperId: "MUD-0", label: "Side-by-side + pills",              ctaHint: "× csv tab",                 Component: V_31 },
  { id: "v2-h-clean", paperId: "OFC-0", label: "Clean (split closed)",            ctaHint: "auto",                      Component: V_32 },
  { id: "v2-h-clean2", paperId: "NN2-0", label: "Clean (settle)",                 ctaHint: "composer (turn 2)",         Component: V_33 },
  { id: "v2-h-2",   paperId: "OL2-0", label: "Turn-2 prompt + Thinking",          ctaHint: "auto",                      Component: V_34 },
  { id: "v2-h-3",   paperId: "OON-0", label: "Pulling resolution time data",     ctaHint: "auto",                      Component: V_35 },
  { id: "v2-h-4",   paperId: "OXS-0", label: "Pulled ✓",                          ctaHint: "auto",                      Component: V_36 },
  { id: "v2-h-5",   paperId: "P2J-0", label: "FDA / EMA differ — pick",           ctaHint: "auto",                      Component: V_37 },
  { id: "v2-12",    paperId: "P72-0", label: "v1 of 2 · FDA wording",             ctaHint: "▸ next",                    Component: V_38 },
  { id: "v2-13",    paperId: "PAZ-0", label: "v2 of 2 · EMA wording",             ctaHint: "accept ✓",                  Component: V_39 },
  { id: "v2-13a",   paperId: "PHY-0", label: "EMA accepted + pills",              ctaHint: "Trace the citations",       Component: V_40 },
  { id: "v2-13b",   paperId: "PO7-0", label: "Settle + pills",                    ctaHint: "map icon",                  Component: V_41 },
  { id: "v2-14",    paperId: "PTV-0", label: "Traceability map",                  ctaHint: "Protocol_v4.2 node",        Component: V_42 },
  { id: "v2-16",    paperId: "QAN-0", label: "Protocol PDF as tab",               ctaHint: "terminal",                  Component: V_43 },
];
