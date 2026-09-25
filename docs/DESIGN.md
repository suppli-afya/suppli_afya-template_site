# Design

The storefront is a distributor's shop counter, not a marketing site and not a dashboard. A customer
arrives unsure which product to choose, or already knowing. Both should feel the page was made for them.

The test for every screen: **trust + clarity + discovery + a real person + an order**, on a phone,
with one thumb, on a weak signal.

## Principles

1. **Whose page this is comes first.** The distributor's name and face are in the top bar on every
   screen, and in the first thing you read. Suppli Afya is a small "Powered by" in the footer.
2. **Two ways in, of equal weight.** "Help me choose" and "Browse products" are the same size, side by
   side. Neither is the lesser option.
3. **Prices are never behind a message.** They're on the first screen, on every card, in every result.
4. **Say why.** Every suggestion shows the reason it came up, in the engine's words ("because you
   said…"), what to expect and when, and what was left out and why.
5. **Trust is answered where the doubt appears**, not in a FAQ: the privacy line next to the questions,
   "Check before you buy" on every product, "You pay once it's confirmed" under the send button.
6. **WhatsApp is how you finish, not a fallback.** The page prepares the conversation (the order, the
   answers, a reference) so neither side starts from zero.
7. **Readable before JavaScript.** Entrances and scroll reveals are CSS; the first screen is complete
   in the HTML. Overlays are enhancements on top of a page that already works.
8. **Nothing invented.** No testimonials, no ratings, no stock photos, no credentials we haven't been
   given. Missing details are placeholders, marked as such.

## Visual language

The wellness default (green leaves, beige, spa) was avoided on purpose.

| Token | Value | Use |
|---|---|---|
| canvas | `#f5f3ee` warm porcelain | Page background |
| surface | `#fdfcfa` | Cards, inputs |
| sunken | `#ebe8e1` | Pack stages, quiet fills |
| ink / ink-2 / ink-3 | `#1c1a17` / `#48443d` / `#6b655c` | Text, all at 4.5:1 or better on canvas |
| night | `#171614` | The selector's panel, order bar, handoff: the "instrument" surfaces |
| accent | per distributor | Kate: jacaranda `#4b3a8c` (Nairobi's October trees). Guided actions, selection, progress |
| caution | `#8f4418` on `#f7e8da` | Cautions and "check with your doctor" |
| WhatsApp | `#25d366` | Only on buttons that open a chat |

- **Type.** Newsreader for display (large, tight, with an italic accent line), Hanken Grotesk for text.
  The same families as the Suppli Afya app. Small uppercase kickers open each section.
- **Shape.** Buttons 14px radius, cards 20px, panels 28px; pills only for chips and tags.
- **Depth.** Hairline rings instead of borders; one soft shadow for lifted things (the calling card,
  the lead suggestion, sheets). No glass.
- **Product imagery.** BF Suma photography and logos are off-limits (independence has to be visible),
  so each product gets a pack illustration: bottle, carton, pump or jar by format, tinted by product
  line, with the name on a paper label. Sized in container units of the stage's shorter side, so one
  component works as a thumbnail, a card and a banner.
- **The distributor's face.** A real photo when there is one. Until then, a monogram in their colour,
  and the About section becomes a letter rather than an empty picture frame.
- **Motion.** Short and causal: sheets rise from where the thumb is, the order count bumps when
  something is added, the "+" becomes a quantity stepper. Everything honours "reduce motion".

## The page, and why it's in this order

| Section | Job |
|---|---|
| Top bar | Name and face always visible; message and order one tap away |
| Hero | The question customers actually have ("Not sure which product is right for you?"), two doors, and a still life of three products with their prices beside the distributor's calling card |
| Help me choose | Goal tiles: tapping one starts the selector with that goal already chosen. After a result, this section shows the suggestions with prices |
| Products | Search by name or ingredient, filter by what it's for, six most-asked-about first, the rest one tap away. A goal filter offers "Not sure which? Help me choose" |
| How ordering works | Four steps, then delivery, payment and prices, answered plainly |
| Who you're buying from | Name, role, their own words, where they are, how to reach them, and that the page is theirs, not BF Suma's |
| Still deciding? | A low-pressure last ask |

## Overlays

| Overlay | Phone | Larger screens | URL |
|---|---|---|---|
| Selector | Full screen, slides up | Full screen, with a dark panel of "What you've told us" beside the questions | `?find` (`?find=digestion` starts with that goal) |
| Product | Bottom sheet, pull down to close, add button in thumb reach | Two-column dialog | `?p=<product id>` (shareable) |
| Order | Bottom sheet | Drawer from the right | `?order` |
| Message (preview only) | Bottom sheet | Dialog | none |

Overlays live in the URL, so the phone's back button closes a sheet instead of leaving the page, and a
distributor can send a link straight to a product. The page behind the top sheet is `inert`.

## The selector

The engine decides; the interface renders. Presentation choices:

- It opens on the engine's privacy and "not medical advice" screen, which must be accepted.
- Section screens are folded into the next question as a small header ("Part 2 of 4 · Your goals"),
  keeping their words and dropping four taps.
- Progress is four named parts, not a question count.
- On larger screens, "What you've told us" builds up as you answer: exactly what the suggestions will
  be based on, including anything we'll take care around ("Takes blood pressure medicine").
- Closing keeps your answers. "Help me choose" on the page then offers "Continue where I left off".

## Results

1. Based on what you told us (the engine's summary, goals in rank order, plan size)
2. The plan status if it needs a professional first (review, or clinic first with no products)
3. **Start with**: the lead suggestion, large: why it came up, cautions, what to expect, price, add
4. Also in your plan, then "Add the whole plan · KES total"
5. Worth considering later, what we left out and why, small changes that help, worth checking with a doctor
6. **Want to talk it through?** The engine's handoff message, sent to the distributor on WhatsApp
7. Change my answers, start again, browse all products

A suggestion that isn't on the distributor's price list stays in the result with "Ask" instead of a
price: pricing never changes what the engine recommends.

## Phones

Designed at 390px, checked at 360px by the end-to-end tests (page, product, results, order, and the
page with a result on it). A bottom bar appears once you've scrolled past the two doors: "Help me
choose" plus WhatsApp, or the order total once something's in it, which also confirms each addition.
It steps aside for sheets and the closing section.
