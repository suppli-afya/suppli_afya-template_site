import { after } from "next/server";
import { db } from "@/server/db";
import { portalConfig, queueOrder, retryPending, sendToPortal } from "@/server/portal";
import { sanitiseCart } from "@/storefront/cart";
import { ORDER_REF, detailsProblem, orderRecord, parseDetails, portalOrder, priceOrder } from "@/storefront/order";
import { storefrontBySlug } from "@/storefronts";

/**
 * An order placed on a storefront. The customer's WhatsApp message is what reaches the
 * distributor; this endpoint re-prices the order from the storefront's own price list, files it
 * in the distributor's Suppli Afya portal (live storefronts with a suppliSlug, on a deploy
 * connected to the app) and, when ORDER_WEBHOOK_URL is set, posts it there too. If the portal
 * can't take it right away, it waits in this storefront's database and is tried again.
 * Prices from the browser are never used.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.slug !== "string") return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  const sf = storefrontBySlug(body.slug);
  if (!sf) return Response.json({ ok: false, error: "Unknown storefront" }, { status: 404 });
  if (typeof body.ref !== "string" || !ORDER_REF.test(body.ref)) return Response.json({ ok: false, error: "Bad reference" }, { status: 400 });

  const items = sanitiseCart(body.items).slice(0, 40);
  const details = parseDetails(body.details);
  const problem = detailsProblem(sf, details);
  if (problem) return Response.json({ ok: false, error: problem }, { status: 422 });
  const order = priceOrder(sf, items, details);
  if (!order.lines.length) return Response.json({ ok: false, error: "The order is empty" }, { status: 422 });

  const selectorRef = typeof body.selectorRef === "string" && /^SA-[A-Z2-9]{4}$/.test(body.selectorRef) ? body.selectorRef : null;
  const record = { ...orderRecord(sf, order, details, { order: body.ref, selector: selectorRef }), placedAt: new Date().toISOString() };

  let filed = false;
  let queued = false;
  if (sf.status === "live" && sf.suppliSlug && portalConfig()) {
    const toPortal = portalOrder(record, sf.suppliSlug);
    const sent = await sendToPortal(toPortal);
    filed = sent.ok;
    const store = db();
    if (store && !sent.ok && sent.retry) {
      queued = await store
        .then((d) => queueOrder(d, sf.slug, toPortal, sent.error))
        .then(() => true)
        .catch((e) => {
          console.error(`Order ${record.ref} couldn't be kept to try again`, e);
          return false;
        });
    }
    // The portal is answering: a good moment to send anything still waiting.
    if (store && sent.ok) after(() => store.then((d) => retryPending(d)).catch((e) => console.error("Retrying waiting orders failed", e)));
  }

  const hook = process.env.ORDER_WEBHOOK_URL;
  let forwarded = false;
  if (hook && sf.status === "live") {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    forwarded = Boolean(res?.ok);
  }
  return Response.json({ ok: true, ref: record.ref, total: record.total, totalConfirmed: record.totalConfirmed, filed, queued, forwarded });
}
