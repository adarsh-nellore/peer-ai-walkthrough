export type GraphNode = {
  id: string;
  kind: "md" | "csv" | "pdf";
  filename: string;
  subtitle: string;
  lane: "source" | "current" | "rollup";
  /** vertical index within lane (0-based) */
  row: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
  weight: "strong" | "moderate";
};

export const NODES: GraphNode[] = [
  { id: "protocol",  kind: "pdf", filename: "Protocol_v4.2",     subtitle: "§6.3 monitoring",  lane: "source",  row: 0 },
  { id: "sap",       kind: "pdf", filename: "SAP-v2.0",          subtitle: "analysis plan",    lane: "source",  row: 1 },
  { id: "lft",       kind: "csv", filename: "Phase3-LFT",        subtitle: "27 rows · ALT spike", lane: "source", row: 2 },
  { id: "phase2",    kind: "md",  filename: "Phase2-CSR-007",    subtitle: "§5.2 hepatic",     lane: "source",  row: 3 },
  { id: "ib",        kind: "pdf", filename: "IB-v3.1",           subtitle: "Investigator Bro.", lane: "source", row: 4 },
  { id: "meddra",    kind: "csv", filename: "AE-MedDRA-27.0",    subtitle: "DILI · ALT terms", lane: "source",  row: 5 },

  { id: "csr",       kind: "md",  filename: "CSR-014.md",        subtitle: "§12.4 hepatic AE", lane: "current", row: 0 },

  { id: "module25",  kind: "md",  filename: "Module-2.5",        subtitle: "Clinical overview", lane: "rollup", row: 0 },
  { id: "reviewer",  kind: "md",  filename: "Reviewer-QA",       subtitle: "simulated · 12 Q",  lane: "rollup", row: 1 },
  { id: "module27",  kind: "md",  filename: "Module-2.7",        subtitle: "Safety summary",    lane: "rollup", row: 2 },
  { id: "dsur",      kind: "pdf", filename: "DSUR-2025",         subtitle: "annual safety",     lane: "rollup", row: 3 },
];

export const EDGES: GraphEdge[] = [
  { from: "protocol", to: "csr", weight: "strong" },
  { from: "sap",      to: "csr", weight: "moderate" },
  { from: "lft",      to: "csr", weight: "strong", label: "cites" },
  { from: "phase2",   to: "csr", weight: "strong" },
  { from: "ib",       to: "csr", weight: "moderate" },
  { from: "meddra",   to: "csr", weight: "moderate" },

  { from: "csr", to: "module25", weight: "strong", label: "rolls up" },
  { from: "csr", to: "module27", weight: "strong" },
  { from: "csr", to: "reviewer", weight: "moderate" },
  { from: "csr", to: "dsur",     weight: "moderate" },

  { from: "phase2", to: "module25", weight: "moderate" },
  { from: "lft",    to: "module27", weight: "moderate" },
  { from: "module25", to: "reviewer", weight: "moderate" },
  { from: "module27", to: "dsur",     weight: "moderate" },
];

export const CURRENT_NODE_ID = "csr";
