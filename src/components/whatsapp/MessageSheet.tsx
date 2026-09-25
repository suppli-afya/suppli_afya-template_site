"use client";

import { useState } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Check, Copy } from "@/components/ui/icons";
import { Sheet, SheetBody, SheetHandle, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { ChatPreview } from "./ChatPreview";

/** Preview storefronts show the message a customer would send, instead of opening WhatsApp. */
export function MessageSheet() {
  const { sf, message, showMessage } = useStorefront();
  const [copied, setCopied] = useState(false);
  const first = sf.distributor.firstName;
  const copy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <Sheet open={message !== null} onClose={() => showMessage(null)} kind="dialog" z={80}>
      <SheetHandle />
      <SheetHeader>
        <SheetTitle>{message?.title}</SheetTitle>
      </SheetHeader>
      <SheetBody className="px-5 pb-6">
        <p className="text-[0.92rem] leading-relaxed text-ink-2">
          This page is a preview, so nothing is sent. On {first}&apos;s live page, this opens WhatsApp with the message
          below already written, ready to send.
        </p>
        {message && <ChatPreview message={message.text} to={sf.distributor.name} className="mt-4" />}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy message"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => showMessage(null)}>
            Done
          </Button>
        </div>
      </SheetBody>
    </Sheet>
  );
}
