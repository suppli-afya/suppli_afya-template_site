"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { GOALS_BY_ID, recommend, type Answers, type EngineResult, type GoalId } from "@/engine";
import { cartReducer, priceCart, sanitiseCart, type CartItem, type PricedCart } from "@/storefront/cart";
import { findListing } from "@/storefront/products";
import type { Storefront } from "@/storefront/types";

/**
 * Page-wide state for one storefront.
 *
 * Overlays (the selector, a product, the order) live in the URL: ?find, ?p=<id>, ?order.
 * That makes them shareable ("?p=probio3" is a product link a distributor can send), and
 * the phone's back button closes the sheet instead of leaving the page.
 *
 * Storage: the order is kept in localStorage (it's only product ids). Selector answers are
 * health information, so they live in sessionStorage and disappear with the tab.
 */

export interface SelectorSession {
  answers: Answers;
  currentId: string;
}
export interface SelectorOutcome {
  answers: Answers;
  salt: string;
}
export interface SentOrder {
  ref: string;
  message: string;
  total: number;
  totalConfirmed: boolean;
  count: number;
  /** What was ordered, so the customer can order the same again next time. */
  items: CartItem[];
  at: number;
}
export interface MessageRequest {
  title: string;
  text: string;
}
interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
  /** "order": something was added. On phones the order bar says it instead of a toast. */
  kind?: "order";
}
type Layer = "selector" | "product" | "order";

interface Overlays {
  selector: boolean;
  product: string | null;
  order: boolean;
}

interface StorefrontState {
  sf: Storefront;
  ready: boolean;
  cart: CartItem[];
  priced: PricedCart;
  qtyOf: (id: string) => number;
  addToOrder: (id: string, opts?: { qty?: number; from?: CartItem["from"]; quiet?: boolean }) => void;
  setQty: (id: string, qty: number) => void;
  removeFromOrder: (id: string) => void;
  clearOrder: () => void;
  /** Replace the whole order, e.g. "order the same again". */
  replaceOrder: (items: CartItem[]) => void;

  overlays: Overlays;
  openProduct: (id: string) => void;
  openSelector: (opts?: { goal?: GoalId; fresh?: boolean }) => void;
  openOrder: () => void;
  close: (layer: Layer) => void;
  /** Close whatever is open and bring a section of the page into view. */
  goToSection: (id: string) => void;

  message: MessageRequest | null;
  showMessage: (m: MessageRequest | null) => void;

  session: SelectorSession | null;
  setSession: (s: SelectorSession | null) => void;
  outcome: SelectorOutcome | null;
  setOutcome: (o: SelectorOutcome | null) => void;
  result: EngineResult | null;

  sentOrder: SentOrder | null;
  setSentOrder: (o: SentOrder | null) => void;

  toast: Toast | null;
  notify: (text: string, action?: Toast["action"], kind?: Toast["kind"]) => void;
}

const Ctx = createContext<StorefrontState | null>(null);

export function useStorefront(): StorefrontState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStorefront must be used inside <StorefrontProvider>");
  return v;
}

const PARAM: Record<Layer, string> = { selector: "find", product: "p", order: "order" };

function readOverlays(sf: Storefront): Overlays & { goal: GoalId | null } {
  const q = new URLSearchParams(window.location.search);
  const p = q.get(PARAM.product);
  const find = q.get(PARAM.selector);
  return {
    selector: find !== null,
    goal: find && find in GOALS_BY_ID ? (find as GoalId) : null,
    product: p && findListing(sf, p) ? p : null,
    order: q.has(PARAM.order),
  };
}

const store = {
  get<T>(kind: "local" | "session", key: string): T | null {
    try {
      const raw = (kind === "local" ? localStorage : sessionStorage).getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(kind: "local" | "session", key: string, value: unknown) {
    try {
      const s = kind === "local" ? localStorage : sessionStorage;
      if (value === null) s.removeItem(key);
      else s.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode or storage full: the page still works, it just won't remember */
    }
  },
};

export function StorefrontProvider({ sf, children }: { sf: Storefront; children: ReactNode }) {
  const keys = useMemo(
    () => ({
      cart: `sa-store:${sf.slug}:order`,
      sent: `sa-store:${sf.slug}:sent`,
      session: `sa-check:${sf.slug}`,
      outcome: `sa-result:${sf.slug}`,
    }),
    [sf.slug],
  );

  const [ready, setReady] = useState(false);
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [overlays, setOverlays] = useState<Overlays>({ selector: false, product: null, order: false });
  const [message, showMessage] = useState<MessageRequest | null>(null);
  const [session, setSessionState] = useState<SelectorSession | null>(null);
  const [outcome, setOutcomeState] = useState<SelectorOutcome | null>(null);
  const [sentOrder, setSentOrderState] = useState<SentOrder | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  /**
   * History. Overlay state lives in React and is updated at once; the URL follows. Layers this
   * page pushed are closed by going back (so the phone's back button and ours agree). Several
   * closes in a row are coalesced into one history.go(-n), and the popstate that causes is ours,
   * not the visitor's, so it's ignored.
   */
  const pushed = useRef<Layer[]>([]);
  const pendingBack = useRef(0);
  const expectPop = useRef(false);
  const afterBack = useRef<(() => void)[]>([]);

  // Restore everything once, after hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from storage and the URL */
    dispatch({ type: "replace", items: sanitiseCart(store.get("local", keys.cart)) });
    const s = store.get<SelectorSession>("session", keys.session);
    if (s?.answers && typeof s.currentId === "string") setSessionState(s);
    const o = store.get<SelectorOutcome>("session", keys.outcome);
    if (o?.answers && typeof o.salt === "string") setOutcomeState(o);
    setSentOrderState(store.get<SentOrder>("local", keys.sent));
    const url = readOverlays(sf);
    setOverlays({ selector: url.selector, product: url.product, order: url.order });
    if (url.selector && url.goal && !s) {
      setSessionState({ answers: { goals: [url.goal] }, currentId: "disclaimer" });
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [keys, sf]);

  useEffect(() => {
    if (ready) store.set("local", keys.cart, cart.length ? cart : null);
  }, [cart, keys.cart, ready]);

  useEffect(() => {
    const onPop = () => {
      if (expectPop.current) {
        expectPop.current = false;
        const later = afterBack.current;
        afterBack.current = [];
        later.forEach((f) => f());
        return;
      }
      const url = readOverlays(sf);
      setOverlays({ selector: url.selector, product: url.product, order: url.order });
      pushed.current = pushed.current.filter((l) => (l === "product" ? url.product : url[l]));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [sf]);

  const writeUrl = useCallback((mode: "push" | "replace", edit: (q: URLSearchParams) => void) => {
    const url = new URL(window.location.href);
    edit(url.searchParams);
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (mode === "push") window.history.pushState(null, "", next);
    else window.history.replaceState(null, "", next);
  }, []);

  const open = useCallback(
    (layer: Layer, value = "") => {
      writeUrl("push", (q) => {
        // Only one of product / order at a time; the selector can sit underneath either.
        if (layer === "product") q.delete(PARAM.order);
        if (layer === "order") q.delete(PARAM.product);
        q.set(PARAM[layer], value);
      });
      pushed.current = [...pushed.current, layer];
      setOverlays((o) => ({
        ...o,
        selector: layer === "selector" ? true : o.selector,
        product: layer === "product" ? value : layer === "order" ? null : o.product,
        order: layer === "order" ? true : layer === "product" ? false : o.order,
      }));
    },
    [writeUrl],
  );

  /** Take `layer` out of the URL: by going back if we pushed it, otherwise by rewriting the current entry. */
  const leave = useCallback(
    (layer: Layer) => {
      if (pushed.current[pushed.current.length - 1] === layer) {
        pushed.current = pushed.current.slice(0, -1);
        if (pendingBack.current++ === 0) {
          window.setTimeout(() => {
            const n = pendingBack.current;
            pendingBack.current = 0;
            expectPop.current = true;
            window.history.go(-n);
          }, 0);
        }
        return;
      }
      pushed.current = pushed.current.filter((l) => l !== layer);
      const strip = () => writeUrl("replace", (q) => q.delete(PARAM[layer]));
      if (pendingBack.current > 0 || expectPop.current) afterBack.current.push(strip);
      else strip();
    },
    [writeUrl],
  );

  const close = useCallback(
    (layer: Layer) => {
      setOverlays((o) => ({ ...o, [layer]: layer === "product" ? null : false }));
      leave(layer);
    },
    [leave],
  );

  const setSession = useCallback(
    (s: SelectorSession | null) => {
      setSessionState(s);
      store.set("session", keys.session, s);
    },
    [keys.session],
  );
  const setOutcome = useCallback(
    (o: SelectorOutcome | null) => {
      setOutcomeState(o);
      store.set("session", keys.outcome, o);
    },
    [keys.outcome],
  );
  const setSentOrder = useCallback(
    (o: SentOrder | null) => {
      setSentOrderState(o);
      store.set("local", keys.sent, o);
    },
    [keys.sent],
  );

  const openSelector = useCallback(
    (opts: { goal?: GoalId; fresh?: boolean } = {}) => {
      if (opts.fresh) {
        setOutcome(null);
        setSession(opts.goal ? { answers: { goals: [opts.goal] }, currentId: "disclaimer" } : null);
      } else if (opts.goal) {
        // Picking a goal on the page starts the selector with it chosen, or adds it to one in progress.
        const answers = session?.answers ?? {};
        const goals = Array.isArray(answers.goals) ? answers.goals : [];
        const next = goals.includes(opts.goal) ? goals : [opts.goal, ...goals].slice(0, 3);
        setSession({ answers: { ...answers, goals: next }, currentId: session?.currentId ?? "disclaimer" });
      }
      open("selector");
    },
    [open, session, setOutcome, setSession],
  );

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((text: string, action?: Toast["action"], kind?: Toast["kind"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, action, kind });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const openOrder = useCallback(() => open("order"), [open]);

  const addToOrder = useCallback<StorefrontState["addToOrder"]>(
    (id, opts = {}) => {
      const l = findListing(sf, id);
      if (!l) return;
      dispatch({ type: "add", id, qty: opts.qty, from: opts.from });
      if (!opts.quiet) notify(`Added ${l.product.name}`, { label: "View order", run: openOrder }, "order");
    },
    [notify, openOrder, sf],
  );

  const goToSection = useCallback(
    (id: string) => {
      const layers: Layer[] = ["order", "product", "selector"];
      const openLayers = layers.filter((l) => (l === "product" ? overlays.product : overlays[l]));
      if (openLayers.length) {
        setOverlays({ selector: false, product: null, order: false });
        // Top-most first, so each pushed layer is the top of the stack when it leaves.
        const order = [...pushed.current].reverse().filter((l) => openLayers.includes(l));
        for (const l of [...order, ...openLayers.filter((l) => !order.includes(l))]) leave(l);
      }
      // Wait for sheets to leave and the scroll lock to lift.
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), openLayers.length ? 380 : 0);
    },
    [leave, overlays],
  );

  const priced = useMemo(() => priceCart(sf, cart), [sf, cart]);
  const result = useMemo(() => (outcome ? recommend(outcome.answers, { salt: outcome.salt }) : null), [outcome]);

  const value: StorefrontState = {
    sf,
    ready,
    cart,
    priced,
    qtyOf: (id) => cart.find((i) => i.id === id)?.qty ?? 0,
    addToOrder,
    setQty: (id, qty) => dispatch({ type: "set", id, qty }),
    removeFromOrder: (id) => dispatch({ type: "remove", id }),
    clearOrder: () => dispatch({ type: "clear" }),
    replaceOrder: (items) => dispatch({ type: "replace", items }),
    overlays,
    openProduct: (id) => open("product", id),
    openSelector,
    openOrder,
    close,
    goToSection,
    message,
    showMessage,
    session,
    setSession,
    outcome,
    setOutcome,
    result,
    sentOrder,
    setSentOrder,
    toast,
    notify,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
