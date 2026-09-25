import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Fades content up as it scrolls into view. Pure CSS (scroll-driven animation), so the
 * content is always in the HTML and visible without JavaScript; browsers without support
 * simply show it. Used for section heads, not every card.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("reveal", className)}>{children}</div>;
}
