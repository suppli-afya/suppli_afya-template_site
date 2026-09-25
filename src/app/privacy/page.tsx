import type { Metadata } from "next";
import Link from "next/link";
import { SuppliMark } from "@/components/brand/SuppliMark";

export const metadata: Metadata = { title: "Privacy", robots: { index: false } };

/*
 * DRAFT. A plain-language summary of how a distributor's storefront handles information.
 * Health answers are sensitive personal data under Kenya's Data Protection Act, 2019. Have
 * this reviewed with the Suppli Afya privacy notice before any storefront goes live
 * (see the main repo's docs/DECISIONS.md).
 */
export default function PrivacyPage() {
  return (
    <main className="container-x max-w-2xl py-16 md:py-24">
      <Link href="/" className="text-[0.9rem] font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
        ← Back to the shop
      </Link>
      <p className="kicker mt-10">Privacy</p>
      <h1 className="display-section mt-4 text-ink">How your information is handled</h1>
      <div className="mt-8 grid gap-7 text-[1.02rem] leading-relaxed text-ink-2">
        <p>
          This page belongs to an independent distributor and runs on Suppli Afya. Here is, in plain words, what happens to
          what you tell it.
        </p>
        <section>
          <h2 className="font-display text-[1.5rem] text-ink">Help me choose</h2>
          <p className="mt-2">
            Your answers are used in your browser to suggest products, and are kept there only until you close the tab. They
            are shared with the distributor only if you choose to send them, by tapping the WhatsApp button at the end. If the
            distributor uses a Suppli Afya workspace, sending also saves your answers and suggestions there, so they can help you.
          </p>
        </section>
        <section>
          <h2 className="font-display text-[1.5rem] text-ink">Orders</h2>
          <p className="mt-2">
            When you send an order, it opens in WhatsApp with the products, your name, your phone number and the delivery
            details you entered, and the distributor receives it when you press send. If the distributor uses a Suppli Afya
            workspace, the order is also saved there so they can deliver it and follow up. If that can&apos;t happen straight
            away, the order waits on this page&apos;s server and is tried again for up to seven days, then deleted. This page
            remembers what&apos;s in your order, your name, your phone number and your delivery choice on this device, so you
            don&apos;t have to type them again. Clearing your browser&apos;s data removes them.
          </p>
        </section>
        <section>
          <h2 className="font-display text-[1.5rem] text-ink">Payments</h2>
          <p className="mt-2">
            You pay the distributor directly. This page never asks for card numbers or M-Pesa PINs, and doesn&apos;t take
            payments.
          </p>
        </section>
        <section>
          <h2 className="font-display text-[1.5rem] text-ink">Your rights</h2>
          <p className="mt-2">
            Under Kenya&apos;s Data Protection Act, you can ask to see, correct or delete information held about you. Ask the
            distributor directly, or contact the Suppli Afya team.
          </p>
        </section>
        <p className="text-[0.85rem] text-ink-3">Last updated September 2026.</p>
      </div>
      <div className="mt-16 flex items-center gap-2 text-[0.8rem] text-ink-3">
        Powered by <SuppliMark />
      </div>
    </main>
  );
}
