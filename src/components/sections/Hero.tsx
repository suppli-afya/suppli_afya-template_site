"use client";

import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { Portrait } from "@/components/brand/Portrait";
import { PackArt } from "@/components/product/PackArt";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { ArrowRight, Pin, WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { listings } from "@/storefront/products";

/**
 * First screen. It answers three questions in a few seconds: whose page is this, can I get
 * help choosing, can I just browse. The two paths sit side by side at the same size, so
 * neither feels like the lesser option.
 */
export function Hero() {
  const { sf, openSelector, goToSection } = useStorefront();
  const count = Object.keys(sf.catalogue.offers).length;
  const d = sf.distributor;
  const rise = (i: number) => ({ className: "rise", style: { "--i": i } as CSSProperties });

  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="container-x grid grid-cols-1 gap-10 pb-14 pt-7 md:pt-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-16 lg:pb-20 lg:pt-14">
        <div>
          <p {...rise(0)}>
            <span className="kicker">{[d.role, d.area].filter(Boolean).join(" · ")}</span>
          </p>
          <h1 {...rise(1)} id="hero-title">
            <span className="display-hero mt-5 block text-ink sm:max-w-[14ch]">
              Not sure which product is right for you? <em className="block italic text-accent">Let&apos;s narrow it down.</em>
            </span>
          </h1>
          <p {...rise(2)}>
            <span className="lede mt-6 block max-w-[33rem]">
              Answer a few quick questions and see what fits what you&apos;re looking for, with prices and the reasons why.
              Already know what you want? Go straight to the products.
            </span>
          </p>

          <div {...rise(3)}>
            <div className="mt-8 grid max-w-[37rem] gap-3 sm:grid-cols-2">
              <PathCard tone="accent" title="Help me choose" detail="About 3 minutes" onClick={() => openSelector()} />
              <PathCard tone="plain" title="Browse products" detail={`${count} products, prices shown`} onClick={() => goToSection("products")} />
            </div>
          </div>
        </div>

        <div {...rise(4)}>
          <StillLife />
        </div>
      </div>
    </section>
  );
}

function PathCard({
  tone,
  title,
  detail,
  onClick,
}: {
  tone: "accent" | "plain";
  title: ReactNode;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "group flex min-h-[5.5rem] items-center justify-between gap-4 rounded-card px-5 py-4 text-left transition-[background-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] active:scale-[0.99]",
        tone === "accent" ? "bg-accent text-on-accent hover:bg-accent-strong" : "bg-surface text-ink ring-1 ring-ink/12 hover:ring-ink/30",
      )}
    >
      <span>
        <span className="block text-[1.1rem] font-semibold leading-tight">{title}</span>
        <span className={clsx("mt-1 block text-[0.84rem]", tone === "accent" ? "text-on-accent/75" : "text-ink-3")}>{detail}</span>
      </span>
      <span
        className={clsx(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5",
          tone === "accent" ? "bg-white/15" : "bg-ink/[0.05]",
        )}
      >
        <ArrowRight />
      </span>
    </button>
  );
}

/**
 * The distributor's calling card in front of three of their products, prices on the shelf.
 * It says "a real person, real products, real prices" before a word is read.
 */
function StillLife() {
  const { sf, openProduct } = useStorefront();
  const d = sf.distributor;
  const [center, left, right] = listings(sf);
  const shelf = [
    { l: left, cls: "left-[2%] w-[36%]", i: 6 },
    { l: center, cls: "left-1/2 w-[50%] -translate-x-1/2", i: 5 },
    { l: right, cls: "right-[2%] w-[38%]", i: 7 },
  ].filter((s) => s.l);

  return (
    <div className="relative mx-auto max-w-[36rem]">
      <div className="relative aspect-[1/0.92] overflow-hidden rounded-panel bg-accent-soft sm:aspect-[1/0.8] lg:aspect-[1/1.02]">
        {/* An arch behind the products, like a shop window. */}
        <div className="absolute bottom-[32%] left-1/2 h-[60%] w-[58%] -translate-x-1/2 rounded-t-full bg-white/55" />
        <div className="absolute inset-x-0 bottom-0 h-[32%] bg-[color-mix(in_oklab,var(--color-accent)_14%,white)]" />
        <div className="absolute inset-x-0 bottom-[32%] h-px bg-accent/20" />

        {shelf.map(({ l, cls, i }) => (
          <button
            key={l!.product.id}
            type="button"
            onClick={() => openProduct(l!.product.id)}
            aria-label={`${l!.product.name}, ${kes(l!.offer.price)}`}
            className={clsx("group absolute bottom-[22%] aspect-[4/5]", cls)}
          >
            <span className="rise absolute inset-0" style={{ "--i": i } as CSSProperties}>
              <PackArt
                product={l!.product}
                stage={false}
                className="h-full w-full"
                packClassName="transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-2"
              />
              <span className="price absolute -bottom-[0.9rem] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-[0.74rem] font-semibold text-ink shadow-lift transition-colors group-hover:bg-ink group-hover:text-canvas sm:text-[0.8rem]">
                {kes(l!.offer.price)}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Calling card */}
      <div className="relative z-10 mx-3 -mt-10 flex items-center gap-3.5 rounded-card bg-surface p-3.5 pr-2.5 shadow-float sm:mx-8 lg:absolute lg:-bottom-8 lg:-left-8 lg:mx-0 lg:mt-0 lg:w-[21rem]">
        <Portrait distributor={d} size="md" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-semibold text-ink">{d.name}</div>
          <div className="mt-1 text-[0.8rem] leading-snug text-ink-3">
            {d.area && (
              <span className="mr-1 inline-flex items-center gap-1 whitespace-nowrap">
                <Pin className="h-3.5 w-3.5 shrink-0" /> {d.area} ·
              </span>
            )}
            Orders and questions on WhatsApp
          </div>
        </div>
        <ContactAction
          text={askMessage(sf)}
          unstyled
          aria-label={`Message ${d.firstName} on WhatsApp`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wa text-wa-ink transition hover:brightness-95"
        >
          <WhatsAppIcon />
        </ContactAction>
      </div>
    </div>
  );
}
