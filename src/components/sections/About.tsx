"use client";

import { Portrait } from "@/components/brand/Portrait";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Phone, WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage, telHref } from "@/storefront/messages";

/** "I know who I'm buying from." Human, short, and only facts the distributor has given us. */
export function About() {
  const { sf } = useStorefront();
  const d = sf.distributor;
  const tel = telHref(sf);
  const facts = [
    d.area && { label: "Based in", value: d.area },
    d.languages?.length && { label: "Chats in", value: d.languages.join(" and ") },
    d.hours && { label: "Usually replies", value: d.hours },
  ].filter(Boolean) as { label: string; value: string }[];

  const body = (
    <>
      {d.intro && (
        <blockquote className="mt-7 border-l-2 border-accent pl-5 font-display text-[clamp(1.3rem,2.2vw,1.65rem)] italic leading-[1.35] tracking-[-0.01em] text-ink">
          {d.intro}
        </blockquote>
      )}
      {facts.length > 0 && (
        <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="border-t border-ink/10 pt-3">
              <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-3">{f.label}</dt>
              <dd className="mt-1 text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-8 flex flex-wrap gap-2.5">
        <ContactAction text={askMessage(sf)} size="lg">
          <WhatsAppIcon /> Message {d.firstName}
        </ContactAction>
        {tel && (
          <ButtonLink href={tel} variant="outline" size="lg">
            <Phone /> Call
          </ButtonLink>
        )}
      </div>
      <p className="mt-6 max-w-[34rem] text-[0.85rem] leading-relaxed text-ink-3">
        {d.firstName} sells BF Suma products as an independent distributor. This is {d.firstName}&apos;s own page, not BF
        Suma&apos;s.
      </p>
    </>
  );

  // With a photo: portrait and words side by side. Without one, a letter: no space is given to a picture that isn't there.
  if (!d.photo) {
    return (
      <section id="about" aria-labelledby="about-title" className="container-x scroll-mt-16 py-20 md:py-28">
        <Reveal className="mx-auto max-w-3xl">
          <p className="kicker">Who you&apos;re buying from</p>
          <div className="mt-6 flex items-center gap-4 sm:gap-5">
            <Portrait distributor={d} size="lg" />
            <div className="min-w-0">
              <h2 id="about-title" className="display-section text-ink">
                {d.name}
              </h2>
              <p className="mt-1 text-[1rem] text-ink-3">{d.role}</p>
            </div>
          </div>
          {body}
        </Reveal>
      </section>
    );
  }

  return (
    <section id="about" aria-labelledby="about-title" className="container-x scroll-mt-16 py-20 md:py-28">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16">
        <Reveal className="mx-auto w-full max-w-[24rem] md:max-w-none">
          <div className="aspect-[4/5]">
            <Portrait distributor={d} size="xl" />
          </div>
        </Reveal>
        <Reveal>
          <p className="kicker">Who you&apos;re buying from</p>
          <h2 id="about-title" className="display-section mt-4 text-ink">
            {d.name}
          </h2>
          <p className="mt-2 text-[1rem] text-ink-3">{d.role}</p>
          {body}
        </Reveal>
      </div>
    </section>
  );
}
