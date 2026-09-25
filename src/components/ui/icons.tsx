import clsx from "clsx";

type P = { className?: string };

const stroke = { stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function WhatsAppIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={clsx("h-5 w-5", className)} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function Check({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeWidth="1.8" {...stroke} />
    </svg>
  );
}

export function ChevronLeft({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M10 3.5 5.5 8l4.5 4.5" strokeWidth="1.7" {...stroke} />
    </svg>
  );
}

export function ChevronRight({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M6 3.5 10.5 8 6 12.5" strokeWidth="1.7" {...stroke} />
    </svg>
  );
}

export function ChevronDown({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M3.5 6 8 10.5 12.5 6" strokeWidth="1.7" {...stroke} />
    </svg>
  );
}

export function ArrowRight({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" strokeWidth="1.6" {...stroke} />
    </svg>
  );
}

export function Close({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M4 4l8 8M12 4l-8 8" strokeWidth="1.7" {...stroke} />
    </svg>
  );
}

export function Plus({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M8 3v10M3 8h10" strokeWidth="1.7" {...stroke} />
    </svg>
  );
}

export function Minus({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M3 8h10" strokeWidth="1.7" {...stroke} />
    </svg>
  );
}

export function Bag({ className }: P) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={clsx("h-5 w-5", className)}>
      <path d="M4.2 6.5h11.6l-.9 10.2a1.5 1.5 0 0 1-1.5 1.3H6.6a1.5 1.5 0 0 1-1.5-1.3L4.2 6.5Z" strokeWidth="1.5" {...stroke} />
      <path d="M7.2 8.8V5.6a2.8 2.8 0 0 1 5.6 0v3.2" strokeWidth="1.5" {...stroke} />
    </svg>
  );
}

export function Search({ className }: P) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={clsx("h-5 w-5", className)}>
      <circle cx="8.8" cy="8.8" r="5.6" strokeWidth="1.6" {...stroke} />
      <path d="m13 13 4 4" strokeWidth="1.6" {...stroke} />
    </svg>
  );
}

export function Alert({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M8 1.8 15 14H1L8 1.8Z" strokeWidth="1.4" {...stroke} />
      <path d="M8 6.3v3.4M8 11.6v.2" strokeWidth="1.6" {...stroke} />
    </svg>
  );
}

export function Shield({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M8 1.5 13.5 3.5v4.2c0 3.2-2.3 5.8-5.5 6.8-3.2-1-5.5-3.6-5.5-6.8V3.5L8 1.5Z" strokeWidth="1.4" {...stroke} />
      <path d="m5.6 8 1.7 1.7 3.2-3.4" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Lock({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <rect x="3" y="7" width="10" height="7" rx="1.6" strokeWidth="1.4" {...stroke} />
      <path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Pin({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M8 14.5s4.8-4.3 4.8-8.1a4.8 4.8 0 0 0-9.6 0c0 3.8 4.8 8.1 4.8 8.1Z" strokeWidth="1.4" {...stroke} />
      <circle cx="8" cy="6.4" r="1.7" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Truck({ className }: P) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={clsx("h-5 w-5", className)}>
      <path d="M2.5 5.5h9v8h-9zM11.5 8.5h3.2l2.8 2.8v2.2h-6" strokeWidth="1.4" {...stroke} />
      <circle cx="6" cy="14.8" r="1.6" strokeWidth="1.4" {...stroke} />
      <circle cx="14.5" cy="14.8" r="1.6" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Wallet({ className }: P) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={clsx("h-5 w-5", className)}>
      <path d="M3 6.2A1.7 1.7 0 0 1 4.7 4.5h9.8v2.7" strokeWidth="1.4" {...stroke} />
      <rect x="3" y="6.5" width="14" height="9.5" rx="1.8" strokeWidth="1.4" {...stroke} />
      <path d="M13 11.2h4" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Tag({ className }: P) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={clsx("h-5 w-5", className)}>
      <path d="M3.5 3.5h6.2l6.8 6.8-6.2 6.2-6.8-6.8V3.5Z" strokeWidth="1.4" {...stroke} />
      <circle cx="7" cy="7" r="1.2" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Chat({ className }: P) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={clsx("h-5 w-5", className)}>
      <path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5Z" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Phone({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M5.2 2.5 3.4 2.6A1.3 1.3 0 0 0 2.2 4c.4 5.3 4.5 9.4 9.8 9.8a1.3 1.3 0 0 0 1.4-1.2l.1-1.8-2.6-1.1-1.3 1.3a7.6 7.6 0 0 1-3.6-3.6l1.3-1.3-1.1-2.6Z" strokeWidth="1.3" {...stroke} />
    </svg>
  );
}

export function Share({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <path d="M8 10V2.5M5 5.2 8 2.3l3 2.9M3.5 8.5v4.2c0 .5.4.8.8.8h7.4c.5 0 .8-.3.8-.8V8.5" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Copy({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" strokeWidth="1.4" {...stroke} />
      <path d="M10.5 3.5v-.3c0-.8-.6-1.2-1.3-1.2H3.8c-.8 0-1.3.5-1.3 1.3v5.4c0 .7.5 1.3 1.2 1.3h.3" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}

export function Clock({ className }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("h-4 w-4", className)}>
      <circle cx="8" cy="8" r="6" strokeWidth="1.4" {...stroke} />
      <path d="M8 4.8V8l2.2 1.6" strokeWidth="1.4" {...stroke} />
    </svg>
  );
}
