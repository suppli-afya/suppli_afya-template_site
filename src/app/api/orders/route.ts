import { sanitiseCart } from "@/storefront/cart";
import { ORDER_REF, detailsProblem, orderRecord, parseDetails, priceOrder } from "@/storefront/order";
import { storefrontBySlug } from "@/storefronts";

/**
 * An order placed on a storefront. The customer's WhatsApp message is what reaches the
 * distributor; this endpoint re-prices the order from the storefront's own price list and,
 * when ORDER_WEBHOOK_URL is set, posts the result there (a spreadsheet, a chat channel, or
 * the Suppli Afya portal once it accepts orders). Prices from the browser are never used.
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
  return Response.json({ ok: true, ref: record.ref, total: record.total, totalConfirmed: record.totalConfirmed, forwarded });
}
