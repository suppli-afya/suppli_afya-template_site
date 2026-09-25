"use client";

import clsx from "clsx";
import { GOALS, GOALS_BY_ID, SECTIONS, QUESTIONS_BY_ID, type GoalId } from "@/engine";
import { PackArt } from "@/components/product/PackArt";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Lock } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { kes } from "@/storefront/money";
import { priceSuggestions } from "@/storefront/suggestions";

const PARTS: Record<string, string> = {
  about: "A few basics, so nothing unsuitable is suggested.",
  goals: "Up to three, with a short follow-up for each.",
  life: "Food, water, sleep and movement.",
  safety: "Medicines, conditions and allergies. Anything that doesn't suit you is left out.",
};

/**
 * The selector's home on the page. Picking what you'd like help with is the first answer,
 * so a tap on a goal starts the questions with that goal already chosen. Once there's a
 * result, this section shows it instead.
 */
export function ChooseSection() {
  const { sf, result, session, openSelector } = useStorefront();
  const first = sf.distributor.firstName;
  const inProgress = !result && session && session.currentId !== "disclaimer" ? session : null;
  const part = inProgress ? SECTIONS.findIndex((s) => s.id === QUESTIONS_BY_ID[inProgress.currentId]?.section) + 1 : 0;

  return (
    <section id="choose" aria-labelledby="choose-title" className="container-x scroll-mt-20 py-6 md:py-10">
      <div className="grain relative overflow-hidden rounded-panel bg-night px-5 py-12 text-white sm:px-8 md:px-12 md:py-16">
        {/* Phones: heading, then the goals straight away, then how it works. Large screens: two columns. */}
        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-14 lg:gap-y-10">
          <Reveal className="min-w-0">
            <p className="kicker text-white/60">Help me choose</p>
            <h2 id="choose-title" className="display-section mt-4 max-w-[14ch]">
              {result ? "What fits, based on what you told us." : "What would you like help with?"}
            </h2>
            <p className="mt-5 max-w-[30rem] text-[1.02rem] leading-relaxed text-white/70">
              {result
                ? `Each suggestion comes with the reason it came up. Add what you'd like to your order, or send the whole thing to ${first} to talk it through.`
                : "Pick what matters most. A few short questions follow, then you'll see what fits, what to leave out and why."}
            </p>
          </Reveal>

          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {result ? (
              <Suggestions />
            ) : (
              <>
                {inProgress && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <div>
                      <div className="font-semibold">You&apos;re part-way through</div>
                      <div className="text-[0.86rem] text-white/60">
                        Part {Math.max(1, part)} of {SECTIONS.length}: {SECTIONS[Math.max(0, part - 1)]?.label}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="light" size="sm" onClick={() => openSelector()} arrow>
                        Continue
                      </Button>
                      <Button variant="night-outline" size="sm" onClick={() => openSelector({ fresh: true })}>
                        Start again
                      </Button>
                    </div>
                  </div>
                )}
                <GoalGrid onPick={(g) => openSelector({ goal: g })} onStart={() => openSelector()} resuming={Boolean(inProgress)} />
              </>
            )}
          </div>

          <div className="min-w-0">
            {!result && (
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {SECTIONS.map((s, i) => (
                  <li key={s.id} className="flex gap-4">
                    <span className="font-display text-[1.3rem] leading-none text-white/40">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-semibold">{s.label}</span>
                      <span className="mt-0.5 block text-[0.88rem] leading-snug text-white/55">{PARTS[s.id]}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className={clsx("flex items-start gap-2 text-[0.84rem] leading-snug text-white/55", !result && "mt-8")}>
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Your answers stay in this browser. {first} only sees them if you choose to send them. General guidance, not
                medical advice.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function GoalGrid({ onPick, onStart, resuming }: { onPick: (g: GoalId) => void; onStart: () => void; resuming: boolean }) {
  const tile =
    "group flex h-full w-full items-start justify-between gap-2 rounded-card p-4 text-left transition-[background-color,box-shadow] duration-300";
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {GOALS.map((g) => (
        <li key={g.id}>
          <button
            type="button"
            onClick={() => onPick(g.id)}
            className={clsx(tile, "bg-white/[0.045] ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-white/30")}
          >
            <span className="min-w-0">
              <span className="block text-[0.98rem] font-semibold leading-snug">{g.label}</span>
              <span className="mt-1 block text-[0.8rem] leading-snug text-white/55">{g.hint}</span>
            </span>
            <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/35 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
          </button>
        </li>
      ))}
      {/* Fills the grid's last row, and gives the unsure a way in. */}
      <li className="col-span-1 sm:col-span-2">
        <button type="button" onClick={onStart} className={clsx(tile, "items-center bg-canvas text-ink hover:bg-white")}>
          <span>
            <span className="block text-[0.98rem] font-semibold leading-snug">{resuming ? "Carry on where I left off" : "Not sure? Start without choosing"}</span>
            <span className="mt-1 block text-[0.8rem] leading-snug text-ink-3">About 3 minutes. Most answers are one tap.</span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-canvas transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </li>
    </ul>
  );
}

/** A compact version of the result: what came up and what it costs, one tap from the order. */
function Suggestions() {
  const { sf, result, openSelector, addToOrder, qtyOf, openOrder } = useStorefront();
  if (!result) return null;
  const priced = priceSuggestions(sf, result);
  const goals = result.profile.goals.map((g) => GOALS_BY_ID[g]?.label).filter(Boolean);
  const clinic = result.status === "clinic-first";
  const allIn = priced.orderableCore.length > 0 && priced.orderableCore.every((s) => qtyOf(s.rec.product.id) > 0);

  return (
    <div className="rounded-card bg-white/[0.05] p-5 ring-1 ring-white/10 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white/50">Your suggestions</span>
        <span className="font-mono text-[0.78rem] text-white/45">{result.ref}</span>
      </div>
      {goals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {goals.map((g, i) => (
            <span key={g} className="rounded-full bg-white/10 px-2.5 py-1 text-[0.78rem] font-medium">
              {i + 1}. {g}
            </span>
          ))}
        </div>
      )}

      {clinic ? (
        <p className="mt-5 text-[0.95rem] leading-relaxed text-white/75">{result.planNotes[0]}</p>
      ) : priced.core.length === 0 ? (
        <p className="mt-5 text-[0.95rem] leading-relaxed text-white/75">
          Nothing in the range suited your answers well enough to suggest. {sf.distributor.firstName} can talk you through
          other options.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-2.5">
          {priced.core.map((s) => (
            <li key={s.rec.product.id} className="flex items-center gap-3.5 rounded-xl bg-white/[0.04] p-2.5 pr-3">
              <PackArt product={s.rec.product} thumb className="aspect-square w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-snug">{s.rec.product.name}</div>
                <div className="hidden truncate text-[0.82rem] text-white/55 sm:block">{s.rec.reasons[0]}</div>
              </div>
              <div className="price shrink-0 text-right text-[0.92rem] font-semibold">
                {s.listing ? kes(s.listing.offer.price) : <span className="text-white/55">Ask</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        {!clinic && priced.orderableCore.length > 0 && (
          <Button
            variant="light"
            onClick={() => {
              if (allIn) return openOrder();
              for (const s of priced.orderableCore) if (!qtyOf(s.rec.product.id)) addToOrder(s.rec.product.id, { from: "selector", quiet: true });
              openOrder();
            }}
          >
            {allIn ? "View order" : priced.orderableCore.length > 1 ? `Add all · ${kes(priced.coreTotal)}` : `Add to order · ${kes(priced.coreTotal)}`}
          </Button>
        )}
        <Button variant="night-outline" onClick={() => openSelector()} arrow>
          Why these came up
        </Button>
      </div>
      <button
        type="button"
        onClick={() => openSelector({ fresh: true })}
        className={clsx("mt-4 text-[0.84rem] font-medium text-white/55 underline-offset-4 hover:text-white hover:underline")}
      >
        Start again with different answers
      </button>
    </div>
  );
}
