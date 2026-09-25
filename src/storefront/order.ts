import { kes } from "./money";
import { priceCart, type CartItem, type PricedCart } from "./cart";
import type { DeliveryArea, PaymentMethod, Storefront } from "./types";

/**
 * Placing an order. Suppli Afya doesn't take customers' money (see the main repo's
 * docs/BRAIN.md: collecting payments for distributors raises licensing questions), so an
 * order is a complete, priced request that reaches the distributor on WhatsApp with nothing
 * left to ask. The distributor confirms stock, delivery and the total; the customer pays them.
 */

export interface OrderDetails {
  name: string;
  /** The customer's mobile number, as typed. For delivery, and so the distributor can reach them. */
  phone: string;
  receive: "delivery" | "pickup";
  areaId: string | null;
  /** Street, building or landmark. */
  address: string;
  payment: PaymentMethod | null;
  note: string;
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  cash: "Cash",
};

export const LIMITS = { name: 40, phone: 20, address: 160, note: 280 } as const;

export function receiveModes(sf: Storefront): OrderDetails["receive"][] {
  const modes: OrderDetails["receive"][] = [];
  if (sf.fulfilment.delivery?.areas.length) modes.push("delivery");
  if (sf.fulfilment.pickup) modes.push("pickup");
  return modes;
}

export function emptyDetails(sf: Storefront): OrderDetails {
  const modes = receiveModes(sf);
  const areas = sf.fulfilment.delivery?.areas ?? [];
  return {
    name: "",
    phone: "",
    receive: modes[0] ?? "delivery",
    areaId: areas.length === 1 ? areas[0].id : null,
    address: "",
    payment: sf.payment.methods.length === 1 ? sf.payment.methods[0] : null,
    note: "",
  };
}

/** The first thing stopping this order from being sent, in words for the customer. */
export function detailsProblem(sf: Storefront, d: OrderDetails): string | null {
  const name = d.name.trim();
  if (name.length < 2) return "Add your name so " + sf.distributor.firstName + " knows who the order is from.";
  if (name.length > LIMITS.name) return "That name is a little long. A first name is fine.";
  if (!d.phone.trim()) return "Add your phone number so " + sf.distributor.firstName + " can reach you about the order.";
  if (!normaliseKenyanPhone(d.phone)) return "That phone number doesn't look right. Try it like 0712 345 678.";
  if (!receiveModes(sf).includes(d.receive)) return "Choose how you'd like to get your order.";
  if (d.receive === "delivery" && !sf.fulfilment.delivery?.areas.some((a) => a.id === d.areaId))
    return "Choose where it should be delivered.";
  if (sf.payment.methods.length && (!d.payment || !sf.payment.methods.includes(d.payment))) return "Choose how you'd like to pay.";
  if (d.address.length > LIMITS.address) return "Keep the address short: an area and a landmark is enough.";
  if (d.note.length > LIMITS.note) return "That note is a little long for a first message.";
  return null;
}

export interface PricedOrder extends PricedCart {
  delivery: { label: string; fee: number | null; time?: string | null } | null;
  total: number;
  /** False while a delivery fee still has to be confirmed by the distributor. */
  totalConfirmed: boolean;
}

export function priceOrder(sf: Storefront, cart: CartItem[], d: Pick<OrderDetails, "receive" | "areaId">): PricedOrder {
  const priced = priceCart(sf, cart);
  let delivery: PricedOrder["delivery"] = null;
  if (d.receive === "delivery") {
    const area: DeliveryArea | undefined = sf.fulfilment.delivery?.areas.find((a) => a.id === d.areaId);
    if (area) delivery = { label: area.label, fee: area.fee, time: area.time };
  } else if (sf.fulfilment.pickup) {
    delivery = { label: sf.fulfilment.pickup.label, fee: 0 };
  }
  const fee = delivery?.fee ?? 0;
  return {
    ...priced,
    delivery,
    total: priced.subtotal + fee,
    totalConfirmed: delivery !== null && delivery.fee !== null,
  };
}

export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .filter((c) => /[A-Z]/.test(c));
  return (letters.length ? letters : ["S", "A"]).slice(0, 3).join("");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ORDER_REF = /^[A-Z]{1,3}-[A-Z2-9]{4}$/;

/** A short code the customer and distributor can both quote, e.g. "KC-7QX2". */
export function newOrderRef(distributorName: string, random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < 4; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  return `${initials(distributorName)}-${code}`;
}

/** 07XX / 01XX / +2547XX → 2547XXXXXXXX (the Suppli Afya app's format). null if it isn't a Kenyan mobile number. */
export function normaliseKenyanPhone(input: string): string | null {
  const d = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const m = d.match(/^(?:254|0)?([17]\d{8})$/);
  return m ? `254${m[1]}` : null;
}

/** 254712345678 → "0712 345 678", the way people here write it. */
export function formatKenyanPhone(normalised: string): string {
  const local = `0${normalised.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** The WhatsApp message that carries the order, in the customer's voice. */
export function orderMessage(
  sf: Storefront,
  order: PricedOrder,
  d: OrderDetails,
  refs: { order: string; selector?: string | null },
): string {
  const lines: string[] = [];
  lines.push(`Hi ${sf.distributor.firstName}, I'd like to order from your page.`);
  lines.push("");
  lines.push("*My order*");
  for (const l of order.lines) lines.push(`${l.qty} × ${l.product.name} · ${kes(l.total)}`);
  lines.push(`*Subtotal:* ${kes(order.subtotal)}`);
  if (order.delivery) {
    const fee =
      d.receive === "pickup" ? "" : order.delivery.fee === null ? " (delivery cost to confirm)" : ` · ${kes(order.delivery.fee)}`;
    lines.push(`*${d.receive === "pickup" ? "Collect" : "Delivery"}:* ${order.delivery.label}${fee}`);
    if (order.totalConfirmed && order.delivery.fee) lines.push(`*Total:* ${kes(order.total)}`);
  }
  lines.push("");
  lines.push(`*Name:* ${d.name.trim()}`);
  const phone = normaliseKenyanPhone(d.phone);
  if (phone) lines.push(`*Phone:* ${formatKenyanPhone(phone)}`);
  if (d.receive === "delivery" && d.address.trim()) lines.push(`*Deliver to:* ${oneLine(d.address)}`);
  if (d.payment) lines.push(`*Paying by:* ${PAYMENT_LABEL[d.payment]}`);
  if (d.note.trim()) lines.push(`*Note:* ${oneLine(d.note)}`);
  lines.push("");
  lines.push(
    order.totalConfirmed ? "Could you confirm and let me know when it can arrive?" : "Could you confirm the total and when it can arrive?",
  );
  lines.push(`Order ref: ${refs.order}${refs.selector ? ` · Selector ref: ${refs.selector}` : ""}`);
  return lines.join("\n");
}

function oneLine(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/** Coerce untrusted input (a request body) into order details. Unknown fields are dropped. */
export function parseDetails(raw: unknown): OrderDetails {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  return {
    name: str(r.name, LIMITS.name + 10),
    phone: str(r.phone, LIMITS.phone + 10),
    receive: r.receive === "pickup" ? "pickup" : "delivery",
    areaId: typeof r.areaId === "string" ? r.areaId.slice(0, 40) : null,
    address: str(r.address, LIMITS.address + 10),
    payment: r.payment === "mpesa" || r.payment === "cash" ? r.payment : null,
    note: str(r.note, LIMITS.note + 10),
  };
}

/** What gets recorded (or sent to a webhook) for an order: priced on the server, never trusted from the browser. */
export function orderRecord(sf: Storefront, order: PricedOrder, d: OrderDetails, refs: { order: string; selector?: string | null }) {
  return {
    storefront: sf.slug,
    distributor: sf.distributor.name,
    ref: refs.order,
    selectorRef: refs.selector ?? null,
    customer: { name: d.name.trim(), phone: normaliseKenyanPhone(d.phone) },
    receive: d.receive,
    deliverTo: d.receive === "delivery" ? { area: order.delivery?.label ?? null, address: oneLine(d.address) || null } : null,
    payment: d.payment,
    note: oneLine(d.note) || null,
    lines: order.lines.map((l) => ({ id: l.id, name: l.product.name, qty: l.qty, unitPrice: l.unitPrice, total: l.total })),
    subtotal: order.subtotal,
    deliveryFee: order.delivery?.fee ?? null,
    total: order.total,
    totalConfirmed: order.totalConfirmed,
    currency: sf.catalogue.currency,
    message: orderMessage(sf, order, d, refs),
  };
}

type OrderRecord = ReturnType<typeof orderRecord>;

/**
 * What the Suppli Afya app's /api/storefront/orders takes: the order, re-priced here, filed in
 * the distributor's portal under their link name. Only what the portal uses; the WhatsApp text stays out.
 */
export function portalOrder(record: OrderRecord, suppliSlug: string) {
  return {
    suppliSlug,
    ref: record.ref,
    selectorRef: record.selectorRef,
    customer: record.customer,
    receive: record.receive,
    deliverTo: record.deliverTo,
    payment: record.payment,
    note: record.note,
    lines: record.lines,
    total: record.total,
    totalConfirmed: record.totalConfirmed,
  };
}
export type PortalOrder = ReturnType<typeof portalOrder>;
