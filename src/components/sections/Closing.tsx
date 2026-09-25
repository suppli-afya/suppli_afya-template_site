"use client";

import Link from "next/link";
import { SuppliMark } from "@/components/brand/SuppliMark";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";

export function Closing() {
  const { sf, openSelector } = useStorefront();
  const first = sf.distributor.firstName;
  return (
    <section id="closing" aria-labelledby="closing-title" className="container-x pb-8">
      <div className="grain relative overflow-hidden rounded-panel bg-accent px-6 py-12 text-on-accent md:px-14 md:py-16">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/15" aria-hidden />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" aria-hidden />
        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <h2 id="closing-title" className="display-section max-w-[14ch]">
              Still deciding? Ask {first}.
            </h2>
            <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-relaxed text-on-accent/80">
              A question about a product, a price or delivery. {first} answers on WhatsApp, and there&apos;s no need to
              order first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ContactAction text={askMessage(sf)} variant="light" size="lg">
              <WhatsAppIcon className="text-[#1a9e4b]" /> Message {first}
            </ContactAction>
            <Button variant="night-outline" size="lg" onClick={() => openSelector()}>
              Help me choose
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { sf } = useStorefront();
  const d = sf.distributor;
  return (
    <footer className="container-x pb-32 pt-8 text-[0.8rem] leading-relaxed text-ink-3 md:pb-12">
      <div className="grid gap-3 border-t border-ink/10 pt-8 md:grid-cols-2 md:gap-10">
        <p>
          General wellness information, not medical advice. Products here aren&apos;t intended to diagnose, treat, cure or
          prevent any disease, and supplements don&apos;t replace a varied diet or any medicine you&apos;ve been prescribed. Read
          the label before use.
        </p>
        <p>
          {d.name} is an independent distributor of BF Suma products. Product names belong to their owners. Suppli Afya is
          independent of BF Suma.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} {d.name} ·{" "}
          <Link href="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
            Privacy
          </Link>
        </span>
        <a href={process.env.NEXT_PUBLIC_SUPPLI_AFYA_SITE || "https://suppliafya.co.ke"} className="inline-flex items-center gap-2 hover:text-ink" rel="noopener">
          <span>Powered by</span>
          <SuppliMark />
        </a>
      </div>
    </footer>
  );
}
