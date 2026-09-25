"use client";

import clsx from "clsx";
import { MAX_QTY } from "@/storefront/cart";
import { Minus, Plus } from "@/components/ui/icons";

/** − 2 +. At 1, the minus removes the item when `onRemove` is given. */
export function QtyStepper({
  value,
  onChange,
  onRemove,
  name,
  size = "md",
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  onRemove?: () => void;
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn = clsx(
    "grid place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.07] disabled:opacity-30",
    size === "sm" ? "h-9 w-9" : "h-11 w-11",
  );
  const canDecrease = value > 1 || Boolean(onRemove);
  return (
    <div
      className={clsx("inline-flex items-center rounded-full bg-surface ring-1 ring-ink/12", className)}
      role="group"
      aria-label={`Quantity of ${name}`}
    >
      <button
        type="button"
        className={btn}
        disabled={!canDecrease}
        aria-label={value === 1 && onRemove ? `Remove ${name}` : `One fewer ${name}`}
        onClick={() => (value === 1 ? onRemove?.() : onChange(value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={clsx("price min-w-6 text-center font-semibold", size === "sm" ? "text-[0.9rem]" : "text-base")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} disabled={value >= MAX_QTY} aria-label={`One more ${name}`} onClick={() => onChange(value + 1)}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
