"use client";

import type { ReactNode } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Tag, Truck, Wallet } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { kes } from "@/storefront/money";
import { PAYMENT_LABEL } from "@/storefront/order";
import type { Storefront } from "@/storefront/types";

function paymentPhrase(sf: Storefront): string {
  const m = sf.payment.methods.map((x) => (x === "cash" ? "cash on delivery" : PAYMENT_LABEL[x]));
  return m.length > 1 ? `${m.slice(0, -1).join(", ")} or ${m[m.length - 1]}` : (m[0] ?? "");
}

/**
 * Trust, answered in the order people worry about it: what happens after I tap order,
 * how does it reach me, how do I pay, are these the real prices.
 */
export function Ordering() {
  const { sf } = useStorefront();
  const first = sf.distributor.firstName;
  const delivery = sf.fulfilment.delivery;
  const pickup = sf.fulfilment.pickup;
  const receive = [delivery && "delivered", pickup && "collected"].filter(Boolean).join(" or ");

  const steps = [
    { title: "Choose", body: "Add what you need to your order, or use Help me choose if you're not sure." },
    { title: "Send your order", body: "It opens in WhatsApp with every product, price and your details already written." },
    { title: `${first} confirms`, body: "Stock, delivery and the final total, before you pay anything." },
    {
      title: "Pay and receive",
      body: `Pay ${first} by ${paymentPhrase(sf)}, and get your order ${receive || "as agreed"}.`,
    },
  ];

  return (
    <section id="ordering" aria-labelledby="ordering-title" className="scroll-mt-16 border-y border-ink/[0.08] bg-surface/70 py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <p className="kicker">Ordering</p>
          <h2 id="ordering-title" className="display-section mt-4 max-w-[16ch] text-ink">
            How ordering works
          </h2>
          <p className="mt-4 max-w-[34rem] text-[1rem] leading-relaxed text-ink-2">
            No account and no card details. Your order goes straight to {first}, who confirms it with you before you pay.
          </p>
        </Reveal>

        <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative border-t border-ink/15 pt-5">
              <span className="absolute -top-px left-0 h-px w-10 bg-accent" />
              <span className="font-display text-[2.1rem] leading-none text-accent">{i + 1}</span>
              <h3 className="mt-3 text-[1.05rem] font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[0.93rem] leading-relaxed text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 grid gap-3 md:grid-cols-3 md:gap-4">
          <InfoCard icon={<Truck />} title={delivery ? "Delivery" : "Collection"}>
            <ul className="grid gap-2">
              {delivery?.areas.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{a.label}</span>
                  <span className="price shrink-0 text-right text-[0.88rem] text-ink-3">
                    {a.fee === null ? "Cost confirmed with you" : a.fee === 0 ? "Free" : kes(a.fee)}
                    {a.time ? ` · ${a.time}` : ""}
                  </span>
                </li>
              ))}
              {pickup && (
                <li className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{pickup.label}</span>
                  <span className="shrink-0 text-right text-[0.88rem] text-ink-3">{pickup.detail ?? "Free"}</span>
                </li>
              )}
            </ul>
            {delivery?.note && <p className="mt-3 text-[0.88rem] text-ink-3">{delivery.note}</p>}
          </InfoCard>
          <InfoCard icon={<Wallet />} title="Payment">
            <p>
              You pay {first} directly, by {paymentPhrase(sf)}, once your order is confirmed.
              {sf.payment.mpesa
                ? ` M-Pesa ${sf.payment.mpesa.kind === "till" ? "Till" : "Paybill"} ${sf.payment.mpesa.number}${sf.payment.mpesa.account ? `, account ${sf.payment.mpesa.account}` : ""}${sf.payment.mpesa.name ? ` (${sf.payment.mpesa.name})` : ""}.`
                : ` ${first} sends the M-Pesa details with the confirmation.`}
            </p>
            <p className="mt-3 text-[0.88rem] text-ink-3">This page never asks for a card number or an M-Pesa PIN.</p>
          </InfoCard>
          <InfoCard icon={<Tag />} title="Prices">
            <p>
              The prices here are {first}&apos;s own, in Kenyan shillings, for one pack. Delivery, if there&apos;s a cost, is
              agreed with you before you pay.
            </p>
          </InfoCard>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-card bg-canvas p-5 text-[0.95rem] leading-relaxed text-ink-2 ring-1 ring-ink/[0.07] md:p-6">
      <div className="mb-3 flex items-center gap-2.5 text-ink">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">{icon}</span>
        <h3 className="text-[1.02rem] font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
