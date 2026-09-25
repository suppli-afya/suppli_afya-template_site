"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { createContext, useContext, useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Close } from "./icons";
import { useIsDesktop } from "./useMediaQuery";

/**
 * One overlay primitive for the whole storefront.
 *
 * On phones every overlay is a bottom sheet you can pull down to close: it keeps actions in
 * thumb reach and matches what people know from WhatsApp and M-Pesa. On larger screens:
 *   dialog  a centred card (product details)
 *   drawer  a panel from the right (the order)
 *   screen  the whole viewport (the selector), on every size
 */
type Kind = "dialog" | "drawer" | "screen";

const ease = [0.22, 1, 0.36, 1] as const;

let locks = 0;
function lockScroll() {
  locks += 1;
  if (locks === 1) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (gap > 0) document.documentElement.style.paddingRight = `${gap}px`;
  }
  return () => {
    locks -= 1;
    if (locks === 0) {
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    }
  };
}

/**
 * Which sheets are open, oldest first. Everything behind the top one (the page, and any
 * sheet underneath) is made inert: not clickable, not focusable, hidden from screen readers.
 */
let stack: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const sheetStack = {
  push(id: string) {
    stack = [...stack.filter((x) => x !== id), id];
    emit();
  },
  remove(id: string) {
    stack = stack.filter((x) => x !== id);
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
const EMPTY: string[] = [];

/** The id of the sheet on top, or null when none is open. */
export function useTopSheet(): string | null {
  const s = useSyncExternalStore(sheetStack.subscribe, () => stack, () => EMPTY);
  return s[s.length - 1] ?? null;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SheetCtx {
  titleId: string;
  startDrag: (e: React.PointerEvent) => void;
  close: () => void;
  mobileSheet: boolean;
}
const Ctx = createContext<SheetCtx | null>(null);
export const useSheet = () => useContext(Ctx);

export function Sheet({
  open,
  onClose,
  kind = "dialog",
  z = 50,
  size = "md",
  tone = "light",
  children,
  className,
  label,
}: {
  open: boolean;
  onClose: () => void;
  kind?: Kind;
  z?: number;
  size?: "md" | "lg";
  tone?: "light" | "night";
  children: ReactNode;
  className?: string;
  /** Accessible name when the sheet has no <SheetTitle>. */
  label?: string;
}) {
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const mobileSheet = !desktop && kind !== "screen";
  const top = useTopSheet();
  const covered = open && top !== null && top !== titleId;

  useEffect(() => {
    if (!open) return;
    sheetStack.push(titleId);
    return () => sheetStack.remove(titleId);
  }, [open, titleId]);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const before = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const el = panel.current;
      if (!el || el.contains(document.activeElement)) return;
      const target = el.querySelector<HTMLElement>("[data-autofocus]") ?? el;
      target.focus({ preventScroll: true });
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      const el = panel.current;
      if (!el) return;
      // Only the top-most sheet reacts.
      if (stack[stack.length - 1] !== titleId) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      unlock();
      // Give focus back to whatever opened the sheet, if it's still on the page.
      if (before && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [open, onClose, titleId]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const motionProps = (() => {
    if (reduce) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } };
    if (kind === "screen")
      return desktop
        ? { initial: { opacity: 0, scale: 0.985 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.985 }, transition: { duration: 0.32, ease } }
        : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { duration: 0.42, ease } };
    if (mobileSheet) return { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { duration: 0.38, ease } };
    if (kind === "drawer") return { initial: { x: "104%" }, animate: { x: 0 }, exit: { x: "104%" }, transition: { duration: 0.38, ease } };
    return { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.98 }, transition: { duration: 0.3, ease } };
  })();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex: z }} inert={covered}>
          {kind !== "screen" && (
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-[rgb(20_18_16/0.42)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />
          )}
          <motion.div
            ref={panel}
            data-sheet=""
            role="dialog"
            aria-modal="true"
            aria-labelledby={label ? undefined : titleId}
            aria-label={label}
            tabIndex={-1}
            {...motionProps}
            drag={mobileSheet && !reduce ? "y" : false}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className={clsx(
              "absolute flex flex-col overflow-hidden outline-none",
              tone === "night" ? "bg-night text-white" : "bg-canvas text-ink",
              kind === "screen" && "inset-0",
              mobileSheet && "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[1.6rem] shadow-sheet",
              !mobileSheet && kind === "drawer" && "inset-y-3 right-3 w-[27rem] rounded-panel shadow-float",
              !mobileSheet &&
                kind === "dialog" &&
                clsx(
                  "inset-0 m-auto h-fit max-h-[88dvh] rounded-panel shadow-float",
                  size === "lg" ? "w-[min(58rem,calc(100vw-3rem))]" : "w-[min(34rem,calc(100vw-3rem))]",
                ),
              className,
            )}
          >
            <Ctx.Provider value={{ titleId, startDrag: (e) => drag.start(e), close: onClose, mobileSheet }}>{children}</Ctx.Provider>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Grab handle on phones: pull the sheet down to close it. */
export function SheetHandle({ className }: { className?: string }) {
  const s = useSheet();
  if (!s?.mobileSheet) return null;
  return (
    <div
      onPointerDown={(e) => s.startDrag(e)}
      className={clsx("flex h-6 shrink-0 cursor-grab touch-none items-center justify-center", className)}
      aria-hidden
    >
      <span className="h-1 w-10 rounded-full bg-ink/20" />
    </div>
  );
}

/** Sheet header: title on the left, close on the right. Dragging it pulls the sheet down on phones. */
export function SheetHeader({ children, className, onBack }: { children: ReactNode; className?: string; onBack?: ReactNode }) {
  const s = useSheet();
  return (
    <div
      onPointerDown={(e) => {
        if (s?.mobileSheet && !(e.target as HTMLElement).closest("button,a,input")) s.startDrag(e);
      }}
      className={clsx("relative flex shrink-0 touch-none items-center gap-2 px-5 pb-3", s?.mobileSheet ? "pt-1" : "pt-5", className)}
    >
      {onBack}
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={() => s?.close()}
        aria-label="Close"
        className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
      >
        <Close />
      </button>
    </div>
  );
}

export function SheetTitle({ children, className }: { children: ReactNode; className?: string }) {
  const s = useSheet();
  return (
    <h2 id={s?.titleId} className={clsx("truncate text-[1.05rem] font-semibold text-ink", className)}>
      {children}
    </h2>
  );
}

export function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}>{children}</div>;
}

export function SheetFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("safe-bottom shrink-0 border-t border-ink/10 bg-canvas/95 px-5 pt-3 backdrop-blur", className)}>{children}</div>
  );
}
