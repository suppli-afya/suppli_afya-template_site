"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/brand/Portrait";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Bag, WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";

/** The distributor's name is always in view; so are "message" and "your order". */
export function TopBar() {
  const { sf, priced, openOrder, goToSection } = useStorefront();
  const d = sf.distributor;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const nav = [
    { id: "choose", label: "Help me choose" },
    { id: "products", label: "Products" },
    { id: "ordering", label: "How ordering works" },
    { id: "about", label: `About ${d.firstName}` },
  ];

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 transition-[background-color,box-shadow] duration-300",
        "bg-canvas",
        scrolled && "shadow-[0_1px_0_rgb(28_26_23/0.08)]",
      )}
    >
      <div className="container-x flex h-16 items-center gap-3">
        <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label={`${d.name}, back to the top`}>
          <Portrait distributor={d} size="sm" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.98rem] font-semibold text-ink">{d.name}</span>
            <span className="block truncate text-[0.75rem] text-ink-3">{d.role}</span>
          </span>
        </a>

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => goToSection(n.id)}
              className="rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-3">
          <ContactAction
            text={askMessage(sf)}
            unstyled
            aria-label={`Message ${d.firstName} on WhatsApp`}
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
          >
            <WhatsAppIcon className="h-[1.3rem] w-[1.3rem]" />
          </ContactAction>
          <button
            type="button"
            onClick={openOrder}
            aria-label={priced.count ? `Your order: ${priced.count} item${priced.count > 1 ? "s" : ""}` : "Your order"}
            className="relative grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
          >
            <Bag className="h-[1.35rem] w-[1.35rem]" />
            {priced.count > 0 && (
              <span
                key={priced.count}
                className="price absolute right-0.5 top-0.5 grid h-[1.15rem] min-w-[1.15rem] animate-bump place-items-center rounded-full bg-accent px-1 text-[0.68rem] font-bold text-on-accent"
              >
                {priced.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Shown only while a storefront is in preview, so a template value is never mistaken for a
 * fact. A short sentence that wraps like one on small phones (a flex row broke it into columns);
 * the list of what's still a placeholder opens on tap.
 */
export function PreviewRibbon() {
  const { sf } = useStorefront();
  if (sf.status !== "preview") return null;
  const list = sf.pending.length ? sf.pending : ["some details"];
  const joined = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0];
  return (
    <details className="group bg-night text-[0.75rem] leading-snug text-white/70">
      <summary className="block cursor-pointer list-none px-4 py-2 text-center [&::-webkit-details-marker]:hidden">
        <span className="font-semibold text-white">Preview of {sf.distributor.firstName}&apos;s page</span>
        <span aria-hidden> · </span>
        <span>some details are placeholders</span>{" "}
        <span className="whitespace-nowrap underline underline-offset-2 group-open:hidden">Which?</span>
      </summary>
      <p className="px-4 pb-2.5 text-center">
        {joined.charAt(0).toUpperCase() + joined.slice(1)} are placeholders until they&apos;re confirmed.
      </p>
    </details>
  );
}
