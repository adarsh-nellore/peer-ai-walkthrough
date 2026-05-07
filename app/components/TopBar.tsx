import { Dot, MetaText } from "./Primitives";

export function TopBar({
  breadcrumb = ["Aurora-IV", "Phase III CSR", "Module 5.3.5", "CSR-014.md"],
  savedAt = "auto-saved · 14:02",
}: {
  breadcrumb?: string[];
  savedAt?: string;
}) {
  return (
    <header className="flex items-center h-14 w-full shrink-0 border-b border-hairline bg-white px-6 gap-6">
      <div className="flex items-center gap-2">
        <PeerLogo />
        <span className="font-display text-[18px] font-medium tracking-[-0.01em] text-coral select-none">
          Peer
        </span>
      </div>
      <nav className="flex items-center gap-2 text-[13px] font-mono leading-none text-ink">
        {breadcrumb.map((seg, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-faint">/</span>}
            <span className={i === breadcrumb.length - 1 ? "text-ink" : "text-muted"}>{seg}</span>
          </span>
        ))}
      </nav>
      <div className="grow" />
      <div className="flex items-center gap-2">
        <Dot color="green" size={6} />
        <MetaText className="text-[12px] text-muted">{savedAt}</MetaText>
      </div>
      <div className="flex items-center justify-center size-7 rounded-full ring-1 ring-hairline bg-white">
        <span className="font-mono text-[10px] font-bold text-ink">AN</span>
      </div>
    </header>
  );
}

function PeerLogo() {
  return (
    <svg width={26} height={20} viewBox="0 0 26 20" fill="none">
      <circle cx={9} cy={10} r={5.5} stroke="#FF4E49" strokeWidth={1.7} />
      <circle cx={17} cy={10} r={5.5} stroke="#FF4E49" strokeWidth={1.7} />
    </svg>
  );
}
