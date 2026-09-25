# Before Kate's page goes live

Kate's storefront (`src/storefronts/kate.ts`) is in **preview**. Only her name is confirmed. Everything
else is a placeholder, marked `PLACEHOLDER` in the file and listed in `pending`, so the page shows a
"Preview" ribbon and never opens a chat to a real number.

## Ask Kate for

| What | Where it goes | Notes |
|---|---|---|
| WhatsApp number | `distributor.whatsapp` | International format, `2547XXXXXXXX` |
| Phone number for calls (optional) | `distributor.phone` | Adds a "Call" button |
| Her price list | `catalogue.offers` | One price per product she sells, whole KES. Remove any she doesn't sell |
| Pack sizes (optional) | `catalogue.offers[id].pack` | From the label, e.g. "60 capsules". Shown as "how much is included" |
| Date prices were checked | `catalogue.updated` | Shown to customers |
| Her most-asked-about products | `catalogue.featured` | Shown first, and the first three stand in the hero |
| Where she's based | `distributor.area` | |
| Delivery areas, fees and times | `fulfilment.delivery.areas` | `fee: null` means she confirms it with the customer |
| Pickup point, if any | `fulfilment.pickup` | |
| Payment methods | `payment.methods` | M-Pesa, cash |
| M-Pesa Till or Paybill | `payment.mpesa` | Shown after an order is sent. Leave `null` if she sends details herself |
| A photo | `distributor.photo` | A real photo of Kate, in `public/storefronts/`. Never a stock photo |
| One or two sentences in her own words | `distributor.intro` | About the customer, not about her. No credentials we can't check |
| Languages, reply hours (optional) | `distributor.languages`, `distributor.hours` | |
| Her colour (optional) | `theme` | Tests check white text is readable on it |
| Her Suppli Afya link name | `suppliSlug` | Once she has a workspace, so sent results and orders reach her portal |

Then set `pending: []` and `status: "live"`, and run `npm test` (a live storefront without a WhatsApp
number, or with anything still pending, fails validation).

## Also needed (shared with the Suppli Afya app)

These are launch blockers in `suppli_afya-main_site/docs/DECISIONS.md` and apply here too:

- **The catalogue is unverified.** Every product in the engine is `verified: false`; product pages say
  so until it's checked against the official BF Suma Kenya catalogue. Fix it upstream, then
  `npm run engine:sync`.
- **Pharmacist review** of the engine's safety rules.
- **Legal review** of `/privacy` and the disclaimers, and ODPC registration. The storefront stores
  nothing on a server unless `SUPPLI_AFYA_URL` or `ORDER_WEBHOOK_URL` is set; with them, sent results
  and orders leave the browser.
- **BF Suma's distributor policy** on online price lists and product names.

## Deploying

A standard Next.js app on Vercel (see the README, "Deploying"). `NEXT_PUBLIC_SITE_URL` defaults to the deploy's
own address; set it once Kate's page has its own domain. Set `NEXT_PUBLIC_DEFAULT_STOREFRONT=kate` if `/` should
be Kate's page.
