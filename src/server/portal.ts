import type { PortalOrder } from "@/storefront/order";
import { json, type Db } from "./db";

/**
 * Filing storefront orders in the distributor's Suppli Afya portal (the app's
 * /api/storefront/orders, authenticated with STOREFRONT_SECRET). The customer's WhatsApp message
 * is what reaches the distributor first; this puts the order in their Orders and on Today. The
 * portal files each reference once, so sending an order again is always safe.
 */

export type Sent = { ok: true } | { ok: false; retry: boolean; error: string };
export type Send = (body: PortalOrder) => Promise<Sent>;

/** The app's order endpoint and the shared secret, or null if this deploy isn't connected to the app. */
export function portalConfig() {
  const base = process.env.SUPPLI_AFYA_URL;
  const secret = process.env.STOREFRONT_SECRET;
  return base && secret ? { url: new URL("/api/storefront/orders", base).toString(), secret } : null;
}

export async function sendToPortal(body: PortalOrder): Promise<Sent> {
  const portal = portalConfig();
  if (!portal) return { ok: false, retry: true, error: "Not connected to the Suppli Afya app" };
  const res = await fetch(portal.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${portal.secret}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  }).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e))));
  if (res instanceof Error) return { ok: false, retry: true, error: res.name === "TimeoutError" ? "The app didn't answer in time" : "Couldn't reach the app" };
  if (res.ok) return { ok: true };
  // A bad order or an unknown link name (400, 404, 422) won't file however often it's sent.
  // A wrong secret (401) is a setting someone will fix, so those keep waiting.
  const retry = res.status === 401 || res.status === 408 || res.status === 429 || res.status >= 500;
  return { ok: false, retry, error: `The app answered ${res.status}` };
}

/** Keep an order the portal couldn't take, to try again. The same order twice is kept once. */
export async function queueOrder(d: Db, storefront: string, body: PortalOrder, error: string) {
  await d.query(
    `insert into pending_orders (storefront, ref, body, last_error, next_attempt_at)
     values ($1, $2, $3::jsonb, $4, now() + interval '15 minutes')
     on conflict (storefront, ref) do nothing`,
    [storefront, body.ref, json(body), error],
  );
}

/**
 * Try the waiting orders that are due. Filed or hopeless orders are deleted, and so is anything
 * older than 7 days, so the storefront never holds customers' details for long.
 */
export async function retryPending(d: Db, send: Send = sendToPortal, limit = 50) {
  await d.query(`delete from pending_orders where created_at < now() - interval '7 days'`);
  const due = await d.query<{ id: string; storefront: string; ref: string; body: PortalOrder }>(
    `select id, storefront, ref, body from pending_orders where next_attempt_at <= now() order by created_at limit $1`,
    [limit],
  );
  const result = { filed: 0, dropped: 0, waiting: 0 };
  for (const row of due) {
    const sent = await send(row.body);
    if (sent.ok || !sent.retry) {
      await d.query(`delete from pending_orders where id = $1`, [row.id]);
      if (sent.ok) result.filed++;
      else {
        result.dropped++;
        console.warn(`Order ${row.ref} from ${row.storefront} can't be filed in the portal: ${sent.error}`);
      }
    } else {
      // 30 minutes, then an hour, two… at most six hours apart.
      await d.query(
        `update pending_orders set attempts = attempts + 1, last_error = $2,
           next_attempt_at = now() + least(interval '6 hours', interval '15 minutes' * power(2, attempts))
         where id = $1`,
        [row.id, sent.error],
      );
      result.waiting++;
    }
  }
  return result;
}
