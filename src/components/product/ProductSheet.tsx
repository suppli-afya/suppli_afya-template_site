"use client";

import { useState, type ReactNode } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Alert, Check, Share, WhatsAppIcon } from "@/components/ui/icons";
import { Sheet, SheetBody, SheetFooter, SheetHandle, SheetHeader, useSheet } from "@/components/ui/Sheet";
import { useIsDesktop } from "@/components/ui/useMediaQuery";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { ALWAYS_CHECK, FORMAT_LABEL, checkNotes, findListing, goalsOf, supplyLabel, type Listing } from "@/storefront/products";
import { PackArt } from "./PackArt";
import { QtyStepper } from "./QtyStepper";

/**
 * A product, explained without leaving the page. The order of sections follows the
 * questions a customer has, in the order they have them: what is it, why would I take it,
 * what's in it, how is it taken, what does it cost and how much do I get, then order or ask.
 */
export function ProductSheet() {
  const { sf, overlays, close } = useStorefront();
  const listing = overlays.product ? findListing(sf, overlays.product) : null;
  // Keep the last product rendered while the sheet animates out.
  const [shown, setShown] = useState<Listing | null>(listing);
  if (listing && listing !== shown && listing.product.id !== shown?.product.id) setShown(listing);

  return (
    <Sheet open={Boolean(listing)} onClose={() => close("product")} kind="dialog" size="lg" z={60}>
      {shown && <ProductDetail key={shown.product.id} listing={shown} />}
    </Sheet>
  );
}

function ProductDetail({ listing }: { listing: Listing }) {
  const { sf, addToOrder, qtyOf, close, openSelector, notify } = useStorefront();
  const desktop = useIsDesktop();
  const sheet = useSheet();
  const { product: p, offer } = listing;
  const [qty, setQty] = useState(1);
  const inOrder = qtyOf(p.id);
  const out = offer.inStock === false;
  const notes = checkNotes(p, sf.distributor.firstName);
  const first = sf.distributor.firstName;

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?p=${p.id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `${p.name} · ${kes(offer.price)}`, url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const add = () => {
    addToOrder(p.id, { qty });
    close("product");
  };

  const facts = (
    <div className="grid gap-7">
      <Block title={`Often chosen for`}>
        <ul className="grid gap-2">
          {goalsOf(p).map((g) => (
            <li key={g.id} className="flex items-baseline justify-between gap-3 rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-ink/[0.06]">
              <span className="font-semibold text-ink">{g.label}</span>
              <span className="text-right text-[0.85rem] text-ink-3">{g.hint}</span>
            </li>
          ))}
        </ul>
      </Block>
      <Block title="What's in it">
        <ul className="grid gap-1.5">
          {p.keyIngredients.map((k) => (
            <li key={k} className="flex gap-2.5">
              <span className="mt-[0.6rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
              {k}
            </li>
          ))}
        </ul>
      </Block>
      <Block title="How it's taken">
        <p>
          {FORMAT_LABEL[p.format]}. Follow the dose on the label, or as {first} advises. {supplyLabel(p.supplyDays)} at the
          usual dose{offer.pack ? ` (${offer.pack})` : ""}.
        </p>
      </Block>
      <Block title="What to expect">
        <p>{p.expectation}</p>
      </Block>
      {p.note && (
        <Block title="Good to know">
          <p>{p.note}</p>
        </Block>
      )}
      <Block title="Check before you buy">
        <ul className="grid gap-2">
          {notes.map((n) => (
            <li key={n} className="flex gap-2.5 text-caution">
              <Alert className="mt-1 h-3.5 w-3.5 shrink-0" />
              <span className="text-ink">{n}</span>
            </li>
          ))}
          <li className="flex gap-2.5">
            <Alert className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-3" />
            <span>{ALWAYS_CHECK}</span>
          </li>
        </ul>
      </Block>

      <div className="rounded-card bg-accent-soft p-4">
        <p className="text-[0.92rem] leading-relaxed text-ink">
          <span className="font-semibold">Not sure it suits you?</span> Help me choose asks about your goals, medicines,
          allergies and pregnancy, and leaves out anything that doesn&apos;t fit, with the reason.
        </p>
        <Button
          variant="accent"
          size="sm"
          className="mt-3"
          arrow
          onClick={() => {
            close("product");
            setTimeout(() => openSelector({ goal: p.goals[0] }), 60);
          }}
        >
          Help me choose
        </Button>
      </div>

      {!p.verified && (
        <p className="text-[0.8rem] leading-relaxed text-ink-3">
          Product details are still being checked against the official BF Suma catalogue. Always read the pack label before
          use.
        </p>
      )}
    </div>
  );

  const header = (
    <div>
      <div className="meta">
        {p.line} · {FORMAT_LABEL[p.format]}
      </div>
      <h2 id={sheet?.titleId} className="display-card mt-1.5 text-ink">
        {p.name}
      </h2>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="price text-[1.35rem] font-semibold text-ink">{kes(offer.price)}</span>
        <span className="text-[0.88rem] text-ink-3">{offer.pack ?? supplyLabel(p.supplyDays)}</span>
      </div>
      {out && <p className="mt-1 text-[0.88rem] font-medium text-caution">Out of stock right now. Ask {first} when it&apos;s back.</p>}
      <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">{p.summary}</p>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2.5">
      {!out && <QtyStepper value={qty} onChange={setQty} name={p.name} />}
      {out ? (
        <ContactAction text={askMessage(sf, p)} className="flex-1" size="lg">
          <WhatsAppIcon /> Ask {first} about it
        </ContactAction>
      ) : (
        <Button variant="primary" size="lg" className="flex-1" onClick={add}>
          Add to order · <span className="price">{kes(offer.price * qty)}</span>
        </Button>
      )}
    </div>
  );

  const secondary = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {!out && (
        <ContactAction text={askMessage(sf, p)} unstyled className="inline-flex h-10 items-center gap-2 text-[0.9rem] font-semibold text-ink hover:text-accent">
          <WhatsAppIcon className="h-4 w-4 text-[#1a9e4b]" /> Ask {first} about it
        </ContactAction>
      )}
      {inOrder > 0 && (
        <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-ink-3">
          <Check className="h-3.5 w-3.5 text-accent" /> {inOrder} in your order
        </span>
      )}
    </div>
  );

  const shareButton = (
    <button
      type="button"
      onClick={share}
      aria-label="Share this product"
      className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
    >
      <Share />
    </button>
  );

  if (desktop) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PackArt product={p} className="h-full min-h-[34rem]" />
        <div className="flex min-h-0 flex-col">
          <SheetHeader className="pb-0">
            <div className="flex justify-end">{shareButton}</div>
          </SheetHeader>
          <SheetBody className="px-8 pb-8">
            {header}
            <div className="mt-6 grid gap-4">
              {actions}
              {secondary}
            </div>
            <div className="mt-8 border-t border-ink/10 pt-8 text-[0.95rem] leading-relaxed text-ink-2">{facts}</div>
          </SheetBody>
        </div>
      </div>
    );
  }

  return (
    <>
      <SheetHandle />
      <SheetBody>
        <div className="relative">
          <PackArt product={p} className="mx-5 aspect-[16/11] rounded-card" />
          <div className="absolute right-7 top-2 flex gap-1">
            <span className="rounded-full bg-canvas/80 backdrop-blur">{shareButton}</span>
            <button
              type="button"
              onClick={() => close("product")}
              aria-label="Close"
              className="grid h-11 w-11 place-items-center rounded-full bg-canvas/80 text-ink backdrop-blur"
            >
              <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-5 pb-8 pt-5">
          {header}
          <div className="mt-3">{secondary}</div>
          <div className="mt-7 text-[0.95rem] leading-relaxed text-ink-2">{facts}</div>
        </div>
      </SheetBody>
      <SheetFooter>{actions}</SheetFooter>
    </>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-3">{title}</h3>
      {children}
    </section>
  );
}
