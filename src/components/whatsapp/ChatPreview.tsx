import clsx from "clsx";
import type { ReactNode } from "react";

/** Renders WhatsApp-style *bold* markers. */
function formatLine(line: string, i: number): ReactNode {
  const parts = line.split(/(\*[^*]+\*)/g);
  return (
    <span key={i} className="block min-h-[1em]">
      {parts.map((p, j) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <strong key={j} className="font-semibold">
            {p.slice(1, -1)}
          </strong>
        ) : (
          <span key={j}>{p}</span>
        ),
      )}
    </span>
  );
}

/** The customer's message as it will sit in their chat with the distributor, ready to send. */
export function ChatPreview({ message, to, className }: { message: string; to: string; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-card bg-wa-bg text-[#111b21]", className)}>
      <div className="flex items-center gap-3 bg-wa-deep px-4 py-3 text-white">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-semibold text-wa-deep">
          {to.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[0.95rem] font-semibold">{to}</div>
          <div className="text-[0.72rem] text-white/75">WhatsApp</div>
        </div>
      </div>
      <div
        className="px-3 py-4"
        style={{
          backgroundImage: "radial-gradient(rgb(0 0 0 / 0.035) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 pb-2 pt-2 text-[0.84rem] leading-[1.45] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]">
          {message.split("\n").map(formatLine)}
        </div>
      </div>
    </div>
  );
}
