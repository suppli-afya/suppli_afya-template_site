# Suppli Afya distributor storefront

A distributor's own page, where their customers get help choosing products, see prices, and order.
Kate Cromuel's storefront is the first one and the reference for every other distributor.

A customer arriving from WhatsApp, Instagram or a QR card should know within seconds: whose page this
is, that they can get help choosing, that they can simply browse, what things cost, and how to order.

```
Kate's identity  →  two ways in: "Help me choose" or "Browse products"
                 →  the selector (the Suppli Afya recommendation engine) → suggestions, with the reason and the price
                 →  the catalogue → product details → order
                 →  the order, written into WhatsApp for Kate to confirm
```

It is part of Suppli Afya ([suppli_afya](https://github.com/eddienjeru564-ship-it/suppli_afya)): the
same engine, the same safety rules, the same voice. Suppli Afya appears only as "Powered by" in the footer.

## Running it

```bash
npm install
npm run dev            # http://localhost:3000 (Kate's storefront; also at /kate)
npm test               # storefront logic, config validation, and the engine's own tests
npm run typecheck && npm run lint
npm run build && npx playwright test   # end-to-end on desktop and a phone, including 360px screens
SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts   # review screenshots in test-results/screens/
```

## How it's put together

| Path | What it is |
|---|---|
| `src/engine/` | The recommendation engine: an **exact copy** of `suppli_afya/src/engine`, never edited here (see below) |
| `src/storefronts/` | One file per distributor (`kate.ts`) and the registry (`index.ts`) |
| `src/storefront/` | Pure logic: types, prices and order, product facts, messages, config validation. Tested |
| `src/components/StorefrontPage.tsx` | The page, in story order |
| `src/components/sections/` | Top bar, hero, "Help me choose", catalogue, ordering, about, closing, mobile bar |
| `src/components/selector/` | The selector overlay (drives the engine), the live "What you've told us" panel, results |
| `src/components/product/` | Pack illustrations, product card, product sheet, quantity controls |
| `src/components/order/` | The order sheet: review → your details → send |
| `src/components/whatsapp/` | Every chat with the distributor goes through here |
| `src/components/store/` | Page state: the order, overlays (kept in the URL), selector session, toasts |
| `src/components/ui/` | Buttons, icons, the sheet primitive |
| `src/app/api/` | `leads` (forwards selector results to the Suppli Afya app) and `orders` (re-prices, optional webhook) |
| `e2e/` | Playwright: both customer paths, safety, links and the back button, small phones, the order API |
| `docs/DESIGN.md` | The design system and why each screen looks the way it does |
| `docs/LAUNCH.md` | What Kate needs to give us before her page goes live |

### The engine is not edited here

`src/engine/` is copied byte for byte from the Suppli Afya app and pinned in `engine.lock.json`
(upstream commit and a hash per file). `npm test` fails if any engine file changes locally. To change
the engine, change it in `suppli_afya`, then:

```bash
npm run engine:sync                        # from ../suppli_afya
npm run engine:sync -- --from <checkout>   # or from another checkout
npm run engine:check                       # verify
```

What this repo builds around the engine, and what it reuses:

- The selector's driving logic follows `suppli_afya/src/components/check/HealthCheck.tsx`
  (next/back/finish, auto-advance, validation, answers in sessionStorage). Two presentation changes:
  the page itself replaces the engine's welcome screen (the privacy and "not medical advice" screen is
  still the first thing and still has to be accepted), and section screens become a header on the next
  question. Same words, four fewer taps.
- The answer inputs are ported from `components/check/inputs.tsx` with the same roles and behaviour.
- Results use the engine's output as it is: "because you said" reasons, cautions, honest expectations,
  what was left out and why, habits, see-a-doctor notes. The storefront adds prices and ordering.
- "Send to Kate on WhatsApp" uses the engine's own `whatsappMessage`, and the lead goes to the app's
  existing `/api/leads` contract, so it lands in the distributor's portal like any health check.

## Adding a distributor

1. Copy `src/storefronts/kate.ts` to `src/storefronts/<name>.ts` and fill it in: name, role, area,
   WhatsApp number, their colour (`theme`), their prices (`catalogue.offers`, keyed by engine product id),
   delivery areas and payment methods. Leave anything unconfirmed out, or list it in `pending`.
2. Add it to `STOREFRONTS` in `src/storefronts/index.ts`. It's served at `/<slug>`.
3. `npm test`. Validation catches unknown product ids, prices that aren't whole shillings, featured
   products that aren't for sale, a WhatsApp number in the wrong format, and an accent colour that white
   text can't sit on.

No component mentions a distributor by name; a test enforces it. When distributors manage their page
from the Suppli Afya portal, `storefrontBySlug` in `src/storefronts/index.ts` is the one place that changes.

## Preview and live

`status: "preview"` shows a one-line "Preview · some details are placeholders" ribbon, keeps the page out
of search engines, and never opens a chat: every WhatsApp button shows the exact message instead.
`status: "live"` requires a WhatsApp number and an empty `pending` list (validation enforces both).

## Ordering and payments

Suppli Afya doesn't take customers' money (the main repo's `docs/BRAIN.md`: collecting payments on
behalf of distributors raises licensing questions; per-distributor M-Pesa requests are Phase 3). So an
order is complete and priced on the page, then written into WhatsApp with a reference (`KC-7QX2`); the
distributor confirms stock, delivery and the total, and the customer pays them directly. The order sheet
remembers the customer's details on their phone and offers "Order the same again" next time.

## Configuration

See `.env.example`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public URL, for link previews and share links |
| `NEXT_PUBLIC_DEFAULT_STOREFRONT` | Which storefront `/` shows (default: the first) |
| `SUPPLI_AFYA_URL` | The Suppli Afya app. Selector results the customer sends are filed as prospects via its `/api/leads` (live storefronts with `suppliSlug` only) |
| `ORDER_WEBHOOK_URL` | Each order, re-priced on the server, is POSTed here as JSON (a sheet, a channel, or the portal later) |
