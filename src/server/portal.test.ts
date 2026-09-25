import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PortalOrder } from "@/storefront/order";
import type { Storefront } from "@/storefront/types";
import { kate } from "@/storefronts/kate";
import { migrate, type Db } from "./db";
import { queueOrder, retryPending, sendToPortal, type Sent } from "./portal";

/** The storefront's database as Supabase sets it up: the Data API's roles are granted every new table. */
const pg = new PGlite("memory://");
const d: Db = {
  query: async <T,>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows,
  exec: async (text: string) => {
    await pg.exec(text);
  },
};

// A live storefront connected to a Suppli Afya workspace, standing in for the registry.
const live: Storefront = {
  ...kate,
  slug: "amani",
  status: "live",
  pending: [],
  suppliSlug: "amani-otieno",
  distributor: { ...kate.distributor, name: "Amani Otieno", firstName: "Amani", whatsapp: "254700000001" },
  catalogue: { ...kate.catalogue, offers: { probio3: { price: 3900 } }, featured: [] },
  fulfilment: { delivery: { areas: [{ id: "cbd", label: "Nairobi CBD", fee: 200 }] }, pickup: null },
  payment: { methods: ["mpesa"] },
};
vi.mock("@/storefronts", () => ({ storefrontBySlug: (slug: string) => (slug === "amani" ? live : null) }));
vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), db: () => Promise.resolve(d) }));
// Work the route leaves for after the response, run by hand here.
const later: (() => unknown)[] = [];
vi.mock("next/server", () => ({ after: (fn: () => unknown) => later.push(fn) }));

beforeAll(async () => {
  await pg.exec(`
    create role anon nologin;
    create role authenticated nologin;
    alter default privileges in schema public grant all on tables to anon, authenticated;
  `);
  await migrate(d);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await d.exec(`delete from pending_orders`);
});

const order = (ref: string): PortalOrder => ({
  suppliSlug: "amani-otieno",
  ref,
  selectorRef: null,
  customer: { name: "Wanjiru", phone: "254712345678" },
  receive: "delivery",
  deliverTo: { area: "Nairobi CBD", address: null },
  payment: "mpesa",
  note: null,
  lines: [{ id: "probio3", name: "Probio3", qty: 1, unitPrice: 3900, total: 3900 }],
  total: 4100,
  totalConfirmed: true,
});
const waiting = () => d.query<{ ref: string; attempts: number; last_error: string; due_later: boolean }>(
  `select ref, attempts, last_error, next_attempt_at > now() as due_later from pending_orders order by ref`,
);

describe("the storefront's database", () => {
  it("keeps every table out of Supabase's Data API", async () => {
    const tables = await d.query<{ name: string; rls: boolean; api: boolean }>(
      `select c.relname as name, c.relrowsecurity as rls, has_table_privilege('anon', c.oid, 'select, insert, update, delete') as api
       from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`,
    );
    expect(tables).toEqual([
      { name: "pending_orders", rls: true, api: false },
      { name: "schema_migrations", rls: true, api: false },
    ]);
  });
});

describe("orders waiting for the portal", () => {
  it("keeps the same order once", async () => {
    await queueOrder(d, "amani", order("AO-7QX2"), "Couldn't reach the app");
    await queueOrder(d, "amani", order("AO-7QX2"), "Couldn't reach the app");
    expect(await waiting()).toHaveLength(1);
  });

  it("sends what's due, deletes what's filed or hopeless, and waits longer for the rest", async () => {
    for (const ref of ["AO-AAAA", "AO-BBBB", "AO-CCCC", "AO-DDDD"]) await queueOrder(d, "amani", order(ref), "first try failed");
    await d.exec(`update pending_orders set next_attempt_at = now() where ref <> 'AO-DDDD'`);
    const answers: Record<string, Sent> = {
      "AO-AAAA": { ok: true },
      "AO-BBBB": { ok: false, retry: false, error: "The app answered 404" },
      "AO-CCCC": { ok: false, retry: true, error: "The app answered 503" },
    };
    const sent: string[] = [];
    const result = await retryPending(d, async (b) => (sent.push(b.ref), answers[b.ref]));

    expect(sent).toEqual(["AO-AAAA", "AO-BBBB", "AO-CCCC"]); // AO-DDDD isn't due yet
    expect(result).toEqual({ filed: 1, dropped: 1, waiting: 1 });
    expect(await waiting()).toEqual([
      { ref: "AO-CCCC", attempts: 2, last_error: "The app answered 503", due_later: true },
      { ref: "AO-DDDD", attempts: 1, last_error: "first try failed", due_later: true },
    ]);
  });

  it("never holds a customer's details longer than a week", async () => {
    await queueOrder(d, "amani", order("AO-OLD1"), "down");
    await d.exec(`update pending_orders set created_at = now() - interval '8 days', next_attempt_at = now()`);
    const send = vi.fn();
    await retryPending(d, send);
    expect(send).not.toHaveBeenCalled();
    expect(await waiting()).toEqual([]);
  });
});

describe("sending to the portal", () => {
  it("signs with the shared secret, and knows which failures are worth retrying", async () => {
    vi.stubEnv("SUPPLI_AFYA_URL", "https://app.example");
    vi.stubEnv("STOREFRONT_SECRET", "s3cret");
    let status = 200;
    const fetchMock = vi.fn(async () => new Response("{}", { status }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendToPortal(order("AO-7QX2"))).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.example/api/storefront/orders");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer s3cret");

    for (const [code, retry] of [[401, true], [404, false], [422, false], [429, true], [500, true], [503, true]] as const) {
      status = code;
      expect(await sendToPortal(order("AO-7QX2"))).toMatchObject({ ok: false, retry });
    }
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await sendToPortal(order("AO-7QX2"))).toEqual({ ok: false, retry: true, error: "Couldn't reach the app" });
  });
});

describe("POST /api/orders", () => {
  const place = async () => {
    const { POST } = await import("@/app/api/orders/route");
    return POST(
      new Request("http://store.test/api/orders", {
        method: "POST",
        body: JSON.stringify({
          slug: "amani",
          ref: "AO-7QX2",
          items: [{ id: "probio3", qty: 1 }],
          details: { name: "Wanjiru", phone: "0712 345 678", receive: "delivery", areaId: "cbd", payment: "mpesa" },
        }),
      }),
    );
  };

  it("files the order in the distributor's portal, then sends anything still waiting", async () => {
    vi.stubEnv("SUPPLI_AFYA_URL", "https://app.example");
    vi.stubEnv("STOREFRONT_SECRET", "s3cret");
    await queueOrder(d, "amani", order("AO-WAIT"), "down earlier");
    await d.exec(`update pending_orders set next_attempt_at = now()`);
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await (await place()).json()).toMatchObject({ ok: true, filed: true, queued: false });
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ suppliSlug: "amani-otieno", ref: "AO-7QX2", customer: { name: "Wanjiru", phone: "254712345678" }, total: 4100 });

    await Promise.all(later.splice(0).map((fn) => fn()));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await waiting()).toEqual([]);
  });

  it("keeps it to try again when the portal is down", async () => {
    vi.stubEnv("SUPPLI_AFYA_URL", "https://app.example");
    vi.stubEnv("STOREFRONT_SECRET", "s3cret");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    expect(await (await place()).json()).toMatchObject({ ok: true, filed: false, queued: true });
    expect(await waiting()).toMatchObject([{ ref: "AO-7QX2", last_error: "The app answered 503" }]);
    expect(later).toEqual([]);
  });

  it("sends nothing when this deploy isn't connected to the app", async () => {
    vi.stubEnv("SUPPLI_AFYA_URL", "");
    vi.stubEnv("STOREFRONT_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await (await place()).json()).toMatchObject({ ok: true, filed: false, queued: false, forwarded: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
