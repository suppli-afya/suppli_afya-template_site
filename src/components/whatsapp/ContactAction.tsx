"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { buttonClass, type Size, type Variant } from "@/components/ui/Button";
import { whatsappHref } from "@/storefront/messages";

/**
 * Anything that opens a chat with the distributor. On a live storefront it's a wa.me link
 * with the message written; on a preview it shows that exact message on screen instead, so
 * nobody messages a placeholder number.
 */
export function ContactAction({
  text,
  title,
  children,
  variant = "whatsapp",
  size = "md",
  className,
  unstyled,
  onSend,
  "aria-label": ariaLabel,
}: {
  text: string;
  /** Heading of the on-screen preview. */
  title?: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  unstyled?: boolean;
  /** Runs just before WhatsApp opens (e.g. to save a lead). */
  onSend?: () => void;
  "aria-label"?: string;
}) {
  const { sf, showMessage } = useStorefront();
  const href = whatsappHref(sf, text);
  const cls = unstyled ? className : buttonClass(variant, size, className);
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={ariaLabel} onClick={() => onSend?.()}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={clsx(cls)}
      aria-label={ariaLabel}
      onClick={() => {
        onSend?.();
        showMessage({ title: title ?? `Message ${sf.distributor.firstName}`, text });
      }}
    >
      {children}
    </button>
  );
}
