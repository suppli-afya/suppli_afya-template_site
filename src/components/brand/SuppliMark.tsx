import clsx from "clsx";

/** Suppli Afya's wordmark, small and in ink: the platform stays in the background of a distributor's page. */
export function SuppliMark({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-ink-2", className)}>
      <svg viewBox="0 0 32 32" aria-hidden className="h-4 w-4 shrink-0">
        <path d="M5 27C5 14.3 13.6 5 27 5c0 13.4-9.3 22-22 22Z" fill="currentColor" />
        <path d="M7.5 24.5C12 20 17 15 23.5 8.5" stroke="var(--color-canvas)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-display text-[0.98rem] leading-none tracking-[-0.01em]">
        Suppli <em className="italic">Afya</em>
      </span>
    </span>
  );
}
