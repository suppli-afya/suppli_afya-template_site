"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { GOALS_BY_ID, whatsappMessage, type Answers, type EngineResult } from "@/engine";
import { Portrait } from "@/components/brand/Portrait";
import { PackArt } from "@/components/product/PackArt";
import { QtyStepper } from "@/components/product/QtyStepper";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Alert, Check, Plus, Shield, WhatsAppIcon } from "@/components/ui/icons";
import { ChatPreview } from "@/components/whatsapp/ChatPreview";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { FORMAT_LABEL, supplyLabel } from "@/storefront/products";
import { priceSuggestions, type Suggestion } from "@/storefront/suggestions";

const ease = [0.22, 1, 0.36, 1] as const;

const PREFERENCE: Record<string, string> = {
  one: "You'd like to start with the one product that matters most.",
  focused: "You'd like a focused plan of two or three products.",
  complete: "You're open to a complete plan.",
};

function Appear({ children, i = 0, className }: { children: ReactNode; i?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.07 * i, ease }}
    >
      {children}
    </motion.div>
  );
}

function Heading({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.13em] text-ink-3">{children}</h3>
      {note && <p className="mt-1 text-[0.9rem] text-ink-2">{note}</p>}
    </div>
  );
}

/**
 * What the selector found, and why. The engine's words are used as they are: "because you
 * said" reasons, honest expectations, cautions, what was left out. This screen adds the
 * distributor's prices and a way to order or to talk it through.
 */
export function Results({
  result,
  answers,
  onEdit,
  onRestart,
}: {
  result: EngineResult;
  answers: Answers;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const { sf, qtyOf, addToOrder, openOrder, goToSection, priced: cart } = useStorefront();
  const s = priceSuggestions(sf, result);
  const p = result.profile;
  const clinic = result.status === "clinic-first";
  const [lead, ...more] = s.core;
  const name = p.name || "Here";
  const title = clinic
    ? `${name}, let's start with your clinic.`
    : s.core.length === 0
      ? `${name}, here's what we found.`
      : s.core.length === 1
        ? `${name}, here's where to start.`
        : `${name}, here's what fits.`;
  const allIn = s.orderableCore.length > 0 && s.orderableCore.every((x) => qtyOf(x.rec.product.id) > 0);
  let step = 0;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-4 sm:px-8 sm:pt-8">
      <Appear i={step++}>
        <p className="kicker">
          Your suggestions · <span className="font-mono tracking-normal">{result.ref}</span>
        </p>
        <h1 className="display-section mt-4 text-ink">{title}</h1>
      </Appear>

      <Appear i={step++} className="mt-7">
        <div className="rounded-card bg-surface p-5 ring-1 ring-ink/[0.07] sm:p-6">
          <Heading>Based on what you told us</Heading>
          <div className="grid gap-1 text-[1rem] leading-relaxed text-ink">
            {result.heard.map((h) => (
              <p key={h}>{h}</p>
            ))}
            {!clinic && PREFERENCE[p.planSize] && <p className="text-ink-2">{PREFERENCE[p.planSize]}</p>}
          </div>
          {p.goals.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.goals.map((g, i) => (
                <span key={g} className="rounded-full bg-accent-soft px-3 py-1 text-[0.82rem] font-medium text-ink">
                  <span className="text-accent">{i + 1}.</span> {GOALS_BY_ID[g]?.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </Appear>

      {result.planNotes.length > 0 && (
        <Appear i={step++} className="mt-4">
          <div
            className={clsx(
              "rounded-card p-5",
              result.status === "ready" ? "bg-surface ring-1 ring-ink/[0.07]" : "bg-caution-soft ring-1 ring-caution/20",
            )}
          >
            <div className="flex items-center gap-2 text-[0.92rem] font-semibold text-caution">
              <Shield />
              {clinic ? "Speak to your clinic first" : result.status === "review" ? "Check with your doctor or pharmacist first" : "Good to know"}
            </div>
            <div className="mt-2 grid gap-2 text-[0.95rem] leading-relaxed text-ink">
              {result.planNotes.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </div>
          </div>
        </Appear>
      )}

      {lead && (
        <Appear i={step++} className="mt-10">
          <Heading>{s.core.length === 1 ? "Where to start" : "Start with"}</Heading>
          <SuggestionCard s={lead} result={result} lead />
        </Appear>
      )}

      {more.length > 0 && (
        <Appear i={step++} className="mt-8">
          <Heading>Also in your plan</Heading>
          <div className="grid gap-3">
            {more.map((x) => (
              <SuggestionCard key={x.rec.product.id} s={x} result={result} />
            ))}
          </div>
        </Appear>
      )}

      {s.orderableCore.length > 1 && (
        <Appear i={step++} className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-night p-4 pl-5 text-white">
            <div className="leading-tight">
              <div className="text-[0.84rem] text-white/60">
                The whole plan · {s.orderableCore.length} products, one pack each
              </div>
              <div className="price mt-1 text-[1.3rem] font-semibold">{kes(s.coreTotal)}</div>
            </div>
            {allIn ? (
              <Button variant="light" onClick={openOrder}>
                <Check /> In your order · View
              </Button>
            ) : (
              <Button
                variant="light"
                onClick={() => {
                  for (const x of s.orderableCore) if (!qtyOf(x.rec.product.id)) addToOrder(x.rec.product.id, { from: "selector", quiet: true });
                  openOrder();
                }}
              >
                Add the whole plan
              </Button>
            )}
          </div>
        </Appear>
      )}

      {s.addons.length > 0 && (
        <Appear i={step++} className="mt-10">
          <Heading note="Good matches that didn't make the first plan. No need to start with them.">Worth considering later</Heading>
          <ul className="grid gap-2">
            {s.addons.map((x) => (
              <li key={x.rec.product.id} className="flex items-center gap-3.5 rounded-card bg-surface p-3 ring-1 ring-ink/[0.07]">
                <PackArt product={x.rec.product} thumb className="aspect-square w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-snug text-ink">{x.rec.product.name}</div>
                  <p className="text-[0.86rem] leading-snug text-ink-2">{x.rec.reasons[0]}</p>
                  {x.rec.cautions[0] && <p className="mt-1 text-[0.8rem] leading-snug text-caution">{x.rec.cautions[0]}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="price text-[0.92rem] font-semibold text-ink">{x.listing ? kes(x.listing.offer.price) : "Ask"}</span>
                  {x.orderable && !qtyOf(x.rec.product.id) && (
                    <button
                      type="button"
                      onClick={() => addToOrder(x.rec.product.id, { from: "selector" })}
                      aria-label={`Add ${x.rec.product.name} to your order`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-ink/[0.06] text-ink transition-colors hover:bg-ink hover:text-canvas"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {qtyOf(x.rec.product.id) > 0 && <Check className="h-4 w-4 text-accent" />}
                </div>
              </li>
            ))}
          </ul>
        </Appear>
      )}

      {result.excluded.length > 0 && (
        <Appear i={step++} className="mt-10">
          <Heading note="Products that would otherwise have come up, and the reason each was left out.">What we left out, and why</Heading>
          <ul className="divide-y divide-ink/10 rounded-card bg-surface ring-1 ring-ink/[0.07]">
            {result.excluded.map((e) => (
              <li key={e.product.id} className="p-4">
                <div className="font-semibold text-ink line-through decoration-ink/30">{e.product.name}</div>
                <p className="mt-0.5 text-[0.9rem] leading-snug text-ink-2">{e.reason}</p>
              </li>
            ))}
          </ul>
        </Appear>
      )}

      {result.habits.length > 0 && (
        <Appear i={step++} className="mt-10">
          <Heading note="No products needed. These make everything else work better.">Small changes that help</Heading>
          <ol className="grid gap-2.5 sm:grid-cols-2">
            {result.habits.map((h, i) => (
              <li key={h.id} className="rounded-card bg-accent-soft/70 p-4">
                <div className="font-display text-[1rem] text-accent">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-1 font-semibold leading-snug text-ink">{h.title}</div>
                <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-2">{h.detail}</p>
              </li>
            ))}
          </ol>
        </Appear>
      )}

      {result.seeDoctor.length > 0 && (
        <Appear i={step++} className="mt-10">
          <Heading>Worth checking with a doctor</Heading>
          <ul className="grid gap-2.5">
            {result.seeDoctor.map((x) => (
              <li key={x} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-ink">
                <Shield className="mt-1 h-4 w-4 shrink-0 text-caution" />
                {x}
              </li>
            ))}
          </ul>
        </Appear>
      )}

      <Appear i={step++} className="mt-12">
        <Handoff result={result} answers={answers} />
      </Appear>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Change my answers
        </Button>
        <Button variant="ghost" size="sm" onClick={onRestart}>
          Start again
        </Button>
        <Button variant="ghost" size="sm" onClick={() => goToSection("products")}>
          Browse all products
        </Button>
      </div>

      <p className="mt-6 text-center text-[0.78rem] leading-relaxed text-ink-3">
        General wellness guidance, not medical advice. Supplements don&apos;t replace a varied diet or any medicine you&apos;ve
        been prescribed. Read the label before use.
      </p>

      {/* The order, one tap away while reading. */}
      <AnimatePresence>
        {cart.count > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="safe-bottom sticky bottom-0 z-10 -mx-5 mt-8 px-3 pt-3 sm:-mx-8"
          >
            <div className="mx-auto flex max-w-xl items-center gap-2 rounded-[1.1rem] bg-night p-2 text-white shadow-float">
              <div className="min-w-0 flex-1 pl-2.5 leading-tight">
                <div className="text-[0.78rem] text-white/60">
                  {cart.count} {cart.count === 1 ? "item" : "items"} in your order
                </div>
                <div className="price text-[1.02rem] font-semibold">{kes(cart.subtotal)}</div>
              </div>
              <Button variant="light" onClick={openOrder}>
                Review order
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionCard({ s, result, lead }: { s: Suggestion; result: EngineResult; lead?: boolean }) {
  const { sf, qtyOf, addToOrder, setQty, removeFromOrder, openProduct } = useStorefront();
  const { rec, listing } = s;
  const p = rec.product;
  const qty = qtyOf(p.id);
  const first = sf.distributor.firstName;
  const goals = result.profile.goals;

  return (
    <article className={clsx("overflow-hidden rounded-panel bg-surface ring-1 ring-ink/[0.07]", lead && "shadow-lift")}>
      <div className={clsx(lead ? "grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]" : "flex flex-col sm:flex-row")}>
        <button
          type="button"
          onClick={() => openProduct(p.id)}
          aria-label={`More about ${p.name}`}
          className={clsx("group block shrink-0", !lead && "sm:w-40")}
        >
          <PackArt
            product={p}
            center
            className={clsx(lead ? "aspect-[16/10] w-full md:aspect-auto md:h-full md:min-h-[20rem]" : "aspect-[16/9] w-full sm:aspect-auto sm:h-full")}
            packClassName="transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1.5"
          />
        </button>
        <div className={clsx("min-w-0 flex-1", lead ? "p-5 sm:p-7" : "p-5")}>
          {rec.covers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rec.covers.map((g) => {
                const rank = goals.indexOf(g);
                return (
                  <span key={g} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.76rem] font-semibold text-accent">
                    {rank === 0 ? "Main goal" : rank > 0 ? `Goal ${rank + 1}` : "Goal"} · {GOALS_BY_ID[g]?.label}
                  </span>
                );
              })}
            </div>
          )}
          <h4 className={clsx("mt-3 text-ink", lead ? "display-card" : "font-display text-[1.35rem] leading-tight")}>{p.name}</h4>
          <div className="meta mt-1">
            {FORMAT_LABEL[p.format]} · {supplyLabel(p.supplyDays)}
          </div>

          <div className="mt-5">
            <div className="text-[0.75rem] font-semibold uppercase tracking-[0.13em] text-ink-3">Why this came up</div>
            <ul className="mt-2 grid gap-2">
              {rec.reasons.map((r) => (
                <li key={r} className="flex gap-2.5 text-[0.97rem] leading-relaxed text-ink">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {rec.cautions.length > 0 && (
            <div className="mt-4 grid gap-1.5 rounded-xl bg-caution-soft p-3.5">
              {rec.cautions.map((c) => (
                <p key={c} className="flex gap-2 text-[0.88rem] leading-snug text-ink">
                  <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" />
                  {c}
                </p>
              ))}
            </div>
          )}

          <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">What to expect. </span>
            {p.expectation}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink/10 pt-5">
            {listing ? (
              <>
                <span className="price mr-auto text-[1.35rem] font-semibold text-ink">{kes(listing.offer.price)}</span>
                {!s.orderable ? (
                  <ContactAction text={askMessage(sf, p)} size="md">
                    <WhatsAppIcon className="h-4 w-4" /> Out of stock · Ask {first}
                  </ContactAction>
                ) : qty > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-accent">
                      <Check className="h-4 w-4" /> In your order
                    </span>
                    <QtyStepper size="sm" name={p.name} value={qty} onChange={(n) => setQty(p.id, n)} onRemove={() => removeFromOrder(p.id)} />
                  </div>
                ) : (
                  <Button variant={lead ? "accent" : "primary"} onClick={() => addToOrder(p.id, { from: "selector" })}>
                    Add to order
                  </Button>
                )}
              </>
            ) : (
              <>
                <span className="mr-auto text-[0.92rem] text-ink-2">Not on {first}&apos;s price list yet.</span>
                <ContactAction text={askMessage(sf, p)} size="md">
                  <WhatsAppIcon className="h-4 w-4" /> Ask {first}
                </ContactAction>
              </>
            )}
            <button
              type="button"
              onClick={() => openProduct(p.id)}
              className={clsx("text-[0.9rem] font-semibold text-ink underline-offset-4 hover:underline", !listing && "hidden")}
            >
              More about it
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Suppli Afya prepares the context; the distributor takes over the conversation. */
function Handoff({ result, answers }: { result: EngineResult; answers: Answers }) {
  const { sf } = useStorefront();
  const [preview, setPreview] = useState(false);
  const [phone, setPhone] = useState("");
  const d = sf.distributor;
  const message = whatsappMessage(result, { distributorName: d.name, distributorFirstName: d.firstName });
  const recorded = sf.status === "live" && Boolean(sf.suppliSlug);

  /** Save the lead in the distributor's Suppli Afya workspace. Never blocks the WhatsApp handoff. */
  const saveLead = () => {
    if (!recorded) return;
    try {
      fetch("/api/leads", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: sf.slug, answers, ref: result.ref, phone: phone || undefined }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  return (
    <section aria-labelledby="handoff-title" className="grain overflow-hidden rounded-panel bg-night p-6 text-white sm:p-8">
      <div className="flex items-center gap-3">
        <Portrait distributor={d} size="md" />
        <div className="leading-tight">
          <h2 id="handoff-title" className="font-display text-[1.6rem] leading-tight">
            Want to talk it through?
          </h2>
          <div className="mt-0.5 text-[0.85rem] text-white/60">{d.name} · on WhatsApp</div>
        </div>
      </div>
      <p className="mt-5 max-w-[34rem] text-[0.98rem] leading-relaxed text-white/75">
        Send your answers and these suggestions to {d.firstName}, so you don&apos;t have to explain everything again.{" "}
        {d.firstName} can answer your questions, confirm stock and help you get started.
      </p>
      {recorded && (
        <label className="mt-5 block max-w-sm text-[0.84rem] font-medium text-white/75">
          Your WhatsApp number <span className="text-white/45">(optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="07XX XXX XXX"
            className="mt-1.5 w-full rounded-control bg-white/[0.07] px-3.5 py-3 text-[1rem] text-white outline-none ring-1 ring-white/15 placeholder:text-white/30 focus:ring-white/50"
          />
        </label>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ContactAction text={message} title={`Your message to ${d.firstName}`} size="lg" onSend={saveLead}>
          <WhatsAppIcon /> Send to {d.firstName} on WhatsApp
        </ContactAction>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          aria-expanded={preview}
          className="h-12 px-2 text-[0.9rem] font-semibold text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          {preview ? "Hide the message" : "See the message first"}
        </button>
      </div>
      <p className="mt-3 max-w-[34rem] text-[0.78rem] leading-snug text-white/45">
        {recorded
          ? `Sending shares your answers and suggestions with ${d.firstName}, in WhatsApp and in ${d.firstName}'s Suppli Afya workspace.`
          : "This opens WhatsApp with the message written. Nothing is sent until you press send there."}
      </p>
      <AnimatePresence initial={false}>
        {preview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <ChatPreview message={message} to={d.name} className="mt-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
