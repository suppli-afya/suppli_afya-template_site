import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

/**
 * Button hierarchy:
 *   primary   ink on canvas: the one main action on a screen
 *   accent    the distributor's colour: guided actions (help me choose, add to order)
 *   outline   secondary actions
 *   ghost     tertiary, inline actions
 *   whatsapp  anything that opens a chat with the distributor
 *   light     the main action on a dark panel
 */
export type Variant = "primary" | "accent" | "outline" | "ghost" | "whatsapp" | "light" | "night-outline";
export type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-canvas hover:bg-black",
  accent: "bg-accent text-on-accent hover:bg-accent-strong",
  outline: "border border-ink/15 bg-surface text-ink hover:border-ink/40",
  ghost: "text-ink hover:bg-ink/[0.05]",
  whatsapp: "bg-wa text-wa-ink hover:brightness-95",
  light: "bg-canvas text-ink hover:bg-white",
  "night-outline": "border border-white/20 text-white hover:border-white/50 hover:bg-white/[0.04]",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.875rem]",
  md: "h-12 px-5 text-[0.95rem]",
  lg: "h-14 px-6 text-[1rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={clsx("h-4 w-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5", className)}
    >
      <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Button({
  variant,
  size,
  className,
  children,
  arrow,
  type = "button",
  ...rest
}: { variant?: Variant; size?: Size; arrow?: boolean; children: ReactNode } & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  arrow,
  ...rest
}: { variant?: Variant; size?: Size; arrow?: boolean; children: ReactNode } & ComponentProps<"a">) {
  return (
    <a className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </a>
  );
}
