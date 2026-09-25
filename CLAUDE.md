@AGENTS.md

# Suppli Afya distributor storefront

A distributor's own page where customers get help choosing, see prices and order. Kate Cromuel's
storefront is the first one and the reference for all others. Part of Suppli Afya
(github.com/suppli-afya/suppli_afya-main_site); read that repo's `docs/BRAIN.md`, `docs/VOICE.md` and
`docs/ENGINE.md` before changing copy or anything the engine touches.

Read before working here:
- `README.md`: structure, the engine copy, adding a distributor
- `docs/DESIGN.md`: the design system and why each screen looks the way it does
- `docs/LAUNCH.md`: what's still a placeholder for Kate

## Non-negotiables

- **Never edit `src/engine/`.** It's an exact copy of the Suppli Afya engine, pinned in `engine.lock.json`;
  `npm test` fails on local edits. Change it upstream, then `npm run engine:sync`.
- Never write health claims. Products are never said to treat, cure or prevent a disease.
- Safety wins over sales: never hide a caution or an exclusion to make a sale easier.
- Never invent facts about a distributor (credentials, experience, delivery promises). Unknown means
  placeholder, listed in the storefront's `pending`.
- No BF Suma logos or product photos. No fake testimonials, ratings, scarcity or countdowns.
- No "AI", "smart", "quiz" or SaaS language in anything a customer reads. The customer voice is calm,
  warm and plain (`suppli_afya-main_site/docs/VOICE.md`).
- Components never name a distributor; everything comes from `src/storefronts/`. A test enforces it.
- Preview storefronts never open a chat to a real number.

## Code map

- `src/storefronts/`: one config per distributor, and the registry
- `src/storefront/`: pure, tested logic (prices, orders, product facts, messages, validation)
- `src/components/`: sections, selector, product, order, WhatsApp, the sheet primitive, page state
- `src/app/`: `/`, `/[slug]`, link preview image, icon, privacy, `api/leads`, `api/orders`, `api/cron/orders`
- `src/server/`: the storefront's own database (Supabase `suppli_afya-template_site`, never the app's) and filing
  orders in the distributor's portal, with a queue for orders the portal couldn't take yet
- `e2e/`: Playwright tests (desktop and phone)

## Commands

- `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`
- `npm run build && npx playwright test`: end-to-end, including 360px phones
- `npm run engine:check` / `npm run engine:sync`

Layout grids use `grid-cols-1` (or `minmax(0, …)` columns) so long content can't widen the page past a
small phone. Entrances and reveals are CSS so the page reads before JavaScript loads. Design tokens are
in `src/app/globals.css`; the distributor's accent is injected as CSS variables from their config.
