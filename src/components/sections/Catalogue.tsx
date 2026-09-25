"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { GOALS, GOALS_BY_ID, type GoalId } from "@/engine";
import { ProductCard } from "@/components/product/ProductCard";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Close, Search, WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { listings, matchesQuery, servesGoal } from "@/storefront/products";

/** How many products show before "Show all": enough to scan, not a wall. */
const FIRST_VIEW = 6;

const dateLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return Number.isNaN(d.getTime()) ? iso : `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/**
 * For customers who know what they want: find it by name, or narrow by what it's for.
 * Featured products come first; the rest is one tap away rather than one long scroll.
 */
export function Catalogue() {
  const { sf, openSelector } = useStorefront();
  const reduce = useReducedMotion();
  const all = useMemo(() => listings(sf), [sf]);
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [expanded, setExpanded] = useState(false);
  const q = useDeferredValue(query);
  const first = sf.distributor.firstName;

  // Only offer filters that have something behind them.
  const goals = useMemo(() => GOALS.filter((g) => all.some((l) => servesGoal(l.product, g.id))), [all]);

  const matches = all.filter((l) => (!goal || servesGoal(l.product, goal)) && matchesQuery(l.product, q));
  const narrowing = Boolean(goal || q.trim());
  const shown = narrowing || expanded ? matches : matches.slice(0, FIRST_VIEW);
  const hidden = matches.length - shown.length;

  return (
    <section id="products" aria-labelledby="products-title" className="scroll-mt-16 pb-10 pt-16 md:pt-24">
      <div className="container-x">
        <Reveal className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="kicker">Browse</p>
            <h2 id="products-title" className="display-section mt-4 text-ink">
              {first}&apos;s products
            </h2>
            <p className="mt-4 max-w-[36rem] text-[1rem] leading-relaxed text-ink-2">
              {all.length} products, prices in Kenyan shillings, last checked {dateLabel(sf.catalogue.updated)}. Tap one for what
              it is, how it&apos;s taken and what to expect.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Toolbar stays under the top bar while you browse. */}
      <div className="sticky top-16 z-20 mt-8 bg-canvas/95 py-3 backdrop-blur-md">
        <div className="container-x grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-center md:gap-5">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ingredient"
              enterKeyHint="search"
              autoComplete="off"
              className="h-12 w-full rounded-control bg-surface pl-11 pr-11 text-[1rem] text-ink outline-none ring-1 ring-ink/12 transition-shadow placeholder:text-ink-3 focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:text-ink"
              >
                <Close />
              </button>
            )}
          </label>
          <div className="fade-x -mx-5 overflow-x-auto px-5 no-scrollbar md:mx-0 md:px-0" role="group" aria-label="What it's for">
            <div className="flex w-max gap-2 pr-6">
              <FilterChip active={goal === null} onClick={() => setGoal(null)}>
                All
              </FilterChip>
              {goals.map((g) => (
                <FilterChip key={g.id} active={goal === g.id} onClick={() => setGoal(goal === g.id ? null : g.id)}>
                  {g.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-x">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 pb-4 pt-3" aria-live="polite">
          <span className="text-[0.88rem] text-ink-3">
            {narrowing
              ? `${matches.length} ${matches.length === 1 ? "product" : "products"}${goal ? ` for ${GOALS_BY_ID[goal].label.toLowerCase()}` : ""}${q.trim() ? ` matching “${q.trim()}”` : ""}`
              : "Most asked about first"}
          </span>
          {goal && matches.length > 1 && (
            <button
              type="button"
              onClick={() => openSelector({ goal })}
              className="group inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-accent"
            >
              Not sure which? Help me choose
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="rounded-card bg-surface px-6 py-12 text-center ring-1 ring-ink/[0.07]">
            <p className="font-display text-[1.6rem] leading-tight text-ink">Nothing matches that.</p>
            <p className="mx-auto mt-2 max-w-sm text-[0.95rem] leading-relaxed text-ink-2">
              Try another name or ingredient, or ask {first}: if it&apos;s in the range, {first} can tell you about it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setGoal(null);
                }}
              >
                Show everything
              </Button>
              <ContactAction text={askMessage(sf)} size="sm">
                <WhatsAppIcon className="h-4 w-4" /> Ask {first}
              </ContactAction>
            </div>
          </div>
        ) : (
          <motion.ul layout={!reduce} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((l) => (
                <motion.li
                  key={l.product.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex"
                >
                  <ProductCard listing={l} className="w-full" />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        {hidden > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => setExpanded(true)}>
              Show all {matches.length} products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "h-10 shrink-0 rounded-full px-4 text-[0.88rem] font-medium transition-colors duration-200",
        active ? "bg-ink text-canvas" : "bg-surface text-ink-2 ring-1 ring-ink/12 hover:text-ink hover:ring-ink/30",
      )}
    >
      {children}
    </button>
  );
}
