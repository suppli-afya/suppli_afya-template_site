"use client";

import type { ReactNode } from "react";
import { useTopSheet } from "@/components/ui/Sheet";

/** The page behind any open sheet is inert, so focus and screen readers stay in the sheet. */
export function PageShell({ children }: { children: ReactNode }) {
  const top = useTopSheet();
  return <div inert={top !== null}>{children}</div>;
}
