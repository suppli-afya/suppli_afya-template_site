"use client";

import { useCallback } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { whatsappHref } from "@/storefront/messages";

/**
 * Open a chat with the distributor from code (after validating a form, say). Same rules as
 * <ContactAction>: live storefronts open WhatsApp; previews show the message on screen.
 */
export function useOpenChat() {
  const { sf, showMessage } = useStorefront();
  return useCallback(
    (text: string, title?: string) => {
      const href = whatsappHref(sf, text);
      if (!href) {
        showMessage({ title: title ?? `Message ${sf.distributor.firstName}`, text });
        return;
      }
      // A new tab keeps the page open on computers; phones hand straight over to the app.
      const w = window.open(href, "_blank");
      if (w) w.opener = null;
      else window.location.assign(href);
    },
    [sf, showMessage],
  );
}
