"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS_BY_ID } from "@/engine";
import { PackArt } from "@/components/product/PackArt";
import { QtyStepper } from "@/components/product/QtyStepper";
import { useStorefront, type SentOrder } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Check, ChevronLeft, Copy, Lock, WhatsAppIcon } from "@/components/ui/icons";
import { Sheet, SheetBody, SheetFooter, SheetHandle, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { useOpenChat } from "@/components/whatsapp/useOpenChat";
import { kes } from "@/storefront/money";
import {
  LIMITS,
  detailsProblem,
  emptyDetails,
  newOrderRef,
  orderMessage,
  priceOrder,
  receiveModes,
  type OrderDetails,
} from "@/storefront/order";
import type { Storefront } from "@/storefront/types";

type Step = "review" | "details" | "sent";
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The order: review → your details → send. Three short screens rather than one long form,
 * so each one has a single job. Sending writes the complete order into WhatsApp; the
 * distributor confirms and the customer pays them directly.
 */
export function OrderSheet() {
  const { overlays, close } = useStorefront();
  return (
    <Sheet open={overlays.order} onClose={() => close("order")} kind="drawer" z={70}>
      <OrderFlow />
    </Sheet>
  );
}

function detailsKey(sf: Storefront) {
  return `sa-store:${sf.slug}:details`;
}

function OrderFlow() {
  const store = useStorefront();
  const { sf, priced, cart, result, setSentOrder, clearOrder, sentOrder } = store;
  const openChat = useOpenChat();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("review");
  const [details, setDetails] = useState<OrderDetails>(() => emptyDetails(sf));
  const [problem, setProblem] = useState<string | null>(null);
  const [ref] = useState(() => newOrderRef(sf.distributor.name));
  const first = sf.distributor.firstName;

  // Remember delivery details on this device for next time (never the note).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(detailsKey(sf)) ?? "null") as Partial<OrderDetails> | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
      if (saved) setDetails((d) => ({ ...d, ...saved, note: "" }));
    } catch {
      /* storage unavailable */
    }
  }, [sf]);

  const order = useMemo(() => priceOrder(sf, cart, details), [sf, cart, details]);
  const selectorRef = result && cart.some((i) => i.from === "selector") ? result.ref : null;

  const send = () => {
    const issue = detailsProblem(sf, details);
    setProblem(issue);
    if (issue) return;
    const message = orderMessage(sf, order, details, { order: ref, selector: selectorRef });
    try {
      localStorage.setItem(detailsKey(sf), JSON.stringify({ ...details, note: "" }));
    } catch {
      /* ignore */
    }
    if (sf.status === "live") {
      // Also record it (webhook / portal), if the deploy is set up for it. Never blocks WhatsApp.
      try {
        fetch("/api/orders", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: sf.slug, ref, items: cart, details, selectorRef }),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }
    const sent: SentOrder = {
      ref,
      message,
      total: order.total,
      totalConfirmed: order.totalConfirmed,
      count: order.count,
      items: cart,
      at: Date.now(),
    };
    setSentOrder(sent);
    clearOrder();
    setStep("sent");
    openChat(message, `Your order to ${first}`);
  };

  const titles: Record<Step, string> = { review: "Your order", details: "Your details", sent: "Order written" };
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };

  return (
    <>
      <SheetHandle />
      <SheetHeader
        onBack={
          step === "details" ? (
            <button
              type="button"
              onClick={() => setStep("review")}
              aria-label="Back to your order"
              className="-ml-2 grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/[0.06]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : undefined
        }
      >
        <SheetTitle>{titles[step]}</SheetTitle>
        {step !== "sent" && priced.count > 0 && (
          <div className="mt-0.5 flex items-center gap-1.5" aria-hidden>
            {(["review", "details"] as const).map((s) => (
              <span key={s} className={clsx("h-1 w-6 rounded-full", s === step || step === "details" ? "bg-accent" : "bg-ink/15")} />
            ))}
            <span className="ml-1 text-[0.75rem] text-ink-3">Step {step === "review" ? 1 : 2} of 2</span>
          </div>
        )}
      </SheetHeader>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} {...slide} transition={{ duration: 0.25, ease }} className="flex min-h-0 flex-1 flex-col">
          {step === "review" && <Review onNext={() => setStep("details")} />}
          {step === "details" && (
            <Details details={details} setDetails={setDetails} order={order} problem={problem} onSend={send} />
          )}
          {step === "sent" && sentOrder && <Sent order={sentOrder} onAgain={() => openChat(sentOrder.message, `Your order to ${first}`)} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function Review({ onNext }: { onNext: () => void }) {
  const { sf, priced, setQty, removeFromOrder, openSelector, goToSection, close, sentOrder, replaceOrder } = useStorefront();
  const first = sf.distributor.firstName;

  if (priced.lines.length === 0) {
    return (
      <SheetBody className="px-5 pb-8">
        <div className="rounded-card bg-surface p-6 text-center ring-1 ring-ink/[0.07]">
          <p className="font-display text-[1.6rem] leading-tight text-ink">Your order is empty.</p>
          <p className="mx-auto mt-2 max-w-xs text-[0.95rem] leading-relaxed text-ink-2">
            Add products as you browse, or answer a few questions and see what fits.
          </p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <Button
              variant="accent"
              onClick={() => {
                close("order");
                setTimeout(() => openSelector(), 60);
              }}
            >
              Help me choose
            </Button>
            <Button variant="outline" onClick={() => goToSection("products")}>
              Browse products
            </Button>
          </div>
        </div>
        {sentOrder && sentOrder.items.length > 0 && (
          <div className="mt-4 rounded-card bg-accent-soft p-5">
            <div className="text-[0.75rem] font-semibold uppercase tracking-[0.13em] text-ink-3">Your last order</div>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">
              <span className="font-mono text-[0.85rem]">{sentOrder.ref}</span> ·{" "}
              {sentOrder.items
                .map((i) => (PRODUCTS_BY_ID[i.id] ? `${i.qty} × ${PRODUCTS_BY_ID[i.id].name}` : null))
                .filter(Boolean)
                .join(", ")}
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => replaceOrder(sentOrder.items)}>
              Order the same again
            </Button>
            <p className="mt-2 text-[0.8rem] text-ink-3">At today&apos;s prices. You can change anything before sending it to {first}.</p>
          </div>
        )}
      </SheetBody>
    );
  }

  return (
    <>
      <SheetBody className="px-5 pb-6">
        <ul className="grid gap-2.5">
          <AnimatePresence initial={false}>
            {priced.lines.map((l) => (
              <motion.li
                key={l.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease }}
                className="flex gap-3.5 overflow-hidden rounded-card bg-surface p-3 ring-1 ring-ink/[0.07]"
              >
                <PackArt product={l.product} thumb className="aspect-[4/5] w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold leading-snug text-ink">{l.product.name}</div>
                      <div className="price text-[0.84rem] text-ink-3">{kes(l.unitPrice)} each</div>
                      {l.from === "selector" && <div className="mt-1 text-[0.76rem] font-semibold text-accent">Suggested for you</div>}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <QtyStepper size="sm" name={l.product.name} value={l.qty} onChange={(n) => setQty(l.id, n)} onRemove={() => removeFromOrder(l.id)} />
                    <span className="price font-semibold text-ink">{kes(l.total)}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {priced.unavailable.length > 0 && (
          <p className="mt-3 rounded-xl bg-caution-soft p-3 text-[0.86rem] leading-snug text-ink">
            {priced.unavailable.map((u) => u.name).join(", ")} {priced.unavailable.length > 1 ? "aren't" : "isn't"} available right now,
            so {priced.unavailable.length > 1 ? "they've" : "it's"} been left out. Ask {first} when {priced.unavailable.length > 1 ? "they're" : "it's"} back.
          </p>
        )}
        <dl className="mt-5 grid gap-1.5 text-[0.95rem]">
          <Row label="Subtotal" value={kes(priced.subtotal)} strong />
          <Row label="Delivery" value="Next step" muted />
        </dl>
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="lg" className="w-full" onClick={onNext} arrow>
          Continue · <span className="price">{kes(priced.subtotal)}</span>
        </Button>
        <p className="mt-2 pb-1 text-center text-[0.78rem] text-ink-3">Nothing is charged here. You pay {first} once your order is confirmed.</p>
      </SheetFooter>
    </>
  );
}

function Details({
  details,
  setDetails,
  order,
  problem,
  onSend,
}: {
  details: OrderDetails;
  setDetails: (fn: (d: OrderDetails) => OrderDetails) => void;
  order: ReturnType<typeof priceOrder>;
  problem: string | null;
  onSend: () => void;
}) {
  const { sf } = useStorefront();
  const first = sf.distributor.firstName;
  const modes = receiveModes(sf);
  const set = (patch: Partial<OrderDetails>) => setDetails((d) => ({ ...d, ...patch }));
  const id = useId();
  const areas = sf.fulfilment.delivery?.areas ?? [];

  return (
    <>
      <SheetBody className="px-5 pb-6">
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <Field label="Your name" htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              value={details.name}
              onChange={(e) => set({ name: e.target.value })}
              autoComplete="name"
              maxLength={LIMITS.name}
              placeholder="A first name is fine"
              className={inputClass}
            />
          </Field>

          {modes.length > 1 && (
            <Field label="How would you like to get it?">
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {modes.map((m) => (
                  <Choice key={m} selected={details.receive === m} onSelect={() => set({ receive: m })}>
                    {m === "delivery" ? "Delivery" : "Collect"}
                  </Choice>
                ))}
              </div>
            </Field>
          )}

          {details.receive === "delivery" && areas.length > 0 && (
            <Field label="Deliver to">
              <div className="grid gap-2" role="radiogroup">
                {areas.map((a) => (
                  <Choice key={a.id} selected={details.areaId === a.id} onSelect={() => set({ areaId: a.id })}>
                    <span className="flex w-full items-baseline justify-between gap-3">
                      <span>{a.label}</span>
                      <span className="price text-[0.84rem] font-normal text-ink-3">
                        {a.fee === null ? "Cost confirmed with you" : a.fee === 0 ? "Free" : kes(a.fee)}
                      </span>
                    </span>
                  </Choice>
                ))}
              </div>
              <input
                aria-label="Area, street or landmark"
                value={details.address}
                onChange={(e) => set({ address: e.target.value })}
                autoComplete="street-address"
                maxLength={LIMITS.address}
                placeholder="Area and a landmark (optional)"
                className={clsx(inputClass, "mt-2.5")}
              />
            </Field>
          )}

          {details.receive === "pickup" && sf.fulfilment.pickup && (
            <div className="rounded-card bg-surface p-4 text-[0.95rem] ring-1 ring-ink/[0.07]">
              <div className="font-semibold text-ink">{sf.fulfilment.pickup.label}</div>
              {sf.fulfilment.pickup.detail && <div className="text-ink-2">{sf.fulfilment.pickup.detail}</div>}
            </div>
          )}

          {sf.payment.methods.length > 0 && (
            <Field label="How will you pay?">
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {sf.payment.methods.map((m) => (
                  <Choice key={m} selected={details.payment === m} onSelect={() => set({ payment: m })}>
                    {m === "mpesa" ? "M-Pesa" : details.receive === "pickup" ? "Cash when I collect" : "Cash on delivery"}
                  </Choice>
                ))}
              </div>
            </Field>
          )}

          <Field label={`Anything ${first} should know?`} optional htmlFor={`${id}-note`}>
            <textarea
              id={`${id}-note`}
              value={details.note}
              onChange={(e) => set({ note: e.target.value })}
              maxLength={LIMITS.note}
              rows={2}
              placeholder="A good time to deliver, a question…"
              className={clsx(inputClass, "h-auto resize-none py-3 leading-snug")}
            />
          </Field>

          <dl className="grid gap-1.5 rounded-card bg-surface p-4 text-[0.95rem] ring-1 ring-ink/[0.07]">
            <Row label={`${order.count} ${order.count === 1 ? "item" : "items"}`} value={kes(order.subtotal)} />
            {details.receive === "delivery" && (
              <Row
                label="Delivery"
                value={order.delivery ? (order.delivery.fee === null ? `Confirmed by ${first}` : order.delivery.fee === 0 ? "Free" : kes(order.delivery.fee)) : "Choose where"}
                muted={!order.delivery || order.delivery.fee === null}
              />
            )}
            <div className="my-1.5 h-px bg-ink/10" />
            <Row label={order.totalConfirmed ? "Total" : "Total before delivery"} value={kes(order.total)} strong />
          </dl>
          {/* Lets Enter submit on phones' keyboards. */}
          <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
        </form>
      </SheetBody>
      <SheetFooter>
        <AnimatePresence>
          {problem && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2.5 text-center text-[0.88rem] font-medium text-caution"
            >
              {problem}
            </motion.p>
          )}
        </AnimatePresence>
        <Button variant="whatsapp" size="lg" className="w-full" onClick={onSend}>
          <WhatsAppIcon /> Send order to {first}
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1.5 pb-1 text-center text-[0.78rem] text-ink-3">
          <Lock className="h-3 w-3" /> Opens WhatsApp with your order written. You pay once {first} confirms.
        </p>
      </SheetFooter>
    </>
  );
}

function Sent({ order, onAgain }: { order: SentOrder; onAgain: () => void }) {
  const { sf, close } = useStorefront();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const first = sf.distributor.firstName;
  const m = sf.payment.mpesa;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* blocked */
    }
  };
  return (
    <SheetBody className="px-5 pb-8">
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="grid h-14 w-14 place-items-center rounded-full bg-accent text-on-accent"
      >
        <Check className="h-6 w-6" />
      </motion.div>
      <h2 className="display-card mt-5 text-ink">Now press send in WhatsApp.</h2>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-2">
        Your order is written and waiting in your chat with {first}. Once {first} has it, {first} confirms stock, delivery
        and the total. Then you pay.
      </p>
      <div className="mt-6 rounded-card bg-surface p-4 ring-1 ring-ink/[0.07]">
        <Row label="Order reference" value={<span className="font-mono">{order.ref}</span>} />
        <div className="mt-1.5">
          <Row label={order.totalConfirmed ? "Total" : "Total before delivery"} value={kes(order.total)} strong />
        </div>
      </div>
      {m && (
        <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-2">
          When {first} confirms, pay by M-Pesa to {m.kind === "till" ? "Till" : "Paybill"}{" "}
          <span className="font-semibold text-ink">{m.number}</span>
          {m.account ? `, account ${m.account}` : ""}
          {m.name ? ` (${m.name})` : ""}.
        </p>
      )}
      <div className="mt-6 grid gap-2.5">
        <Button variant="whatsapp" onClick={onAgain}>
          <WhatsAppIcon /> Open WhatsApp again
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy order"}
          </Button>
          <Button variant="outline" onClick={() => close("order")}>
            Done
          </Button>
        </div>
      </div>
    </SheetBody>
  );
}

// ------------------------------------------------------------------ small parts

const inputClass =
  "h-12 w-full rounded-control bg-surface px-4 text-[1rem] text-ink outline-none ring-1 ring-ink/15 transition-shadow placeholder:text-ink-3 focus:ring-2 focus:ring-accent";

function Field({ label, children, optional, htmlFor }: { label: string; children: ReactNode; optional?: boolean; htmlFor?: string }) {
  const Tag = htmlFor ? "label" : "div";
  return (
    <div>
      <Tag {...(htmlFor ? { htmlFor } : {})} className="mb-2 block text-[0.9rem] font-semibold text-ink">
        {label} {optional && <span className="font-normal text-ink-3">(optional)</span>}
      </Tag>
      {children}
    </div>
  );
}

function Choice({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={clsx(
        "flex min-h-12 items-center gap-3 rounded-control px-4 py-3 text-left text-[0.95rem] font-medium transition-[box-shadow,background-color] duration-200",
        selected ? "bg-accent-soft text-ink shadow-[inset_0_0_0_1.5px_var(--color-accent)]" : "bg-surface text-ink shadow-[inset_0_0_0_1px_rgb(28_26_23/0.14)] hover:shadow-[inset_0_0_0_1px_rgb(28_26_23/0.35)]",
      )}
    >
      <span className={clsx("grid h-4 w-4 shrink-0 place-items-center rounded-full border", selected ? "border-accent bg-accent" : "border-ink/30 bg-white")}>
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-on-accent" />}
      </span>
      {children}
    </button>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={clsx(strong ? "font-semibold text-ink" : "text-ink-2")}>{label}</dt>
      <dd className={clsx("price text-right", strong ? "text-[1.1rem] font-semibold text-ink" : muted ? "text-[0.88rem] text-ink-3" : "text-ink")}>{value}</dd>
    </div>
  );
}
