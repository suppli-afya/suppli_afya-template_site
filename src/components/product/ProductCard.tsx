"use client";

import clsx from "clsx";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { kes } from "@/storefront/money";
import { FORMAT_LABEL, goalsOf, oneLiner, type Listing } from "@/storefront/products";
import { AddButton } from "./AddButton";
import { PackArt } from "./PackArt";

/**
 * A product in the catalogue. A row on phones (easy to scan with one thumb, price always
 * visible), a card from tablet up. The whole card opens the product; "+" adds it directly.
 */
export function ProductCard({ listing, className }: { listing: Listing; className?: string }) {
  const { openProduct } = useStorefront();
  const { product, offer } = listing;
  const goals = goalsOf(product);
  const out = offer.inStock === false;
  return (
    <article
      className={clsx(
        "group relative flex gap-4 rounded-card bg-surface p-3 ring-1 ring-ink/[0.07] transition-[box-shadow,transform] duration-300 ease-[var(--ease-out)] hover:shadow-lift md:flex-col md:gap-0 md:p-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => openProduct(product.id)}
        className="absolute inset-0 z-[1] rounded-card"
        aria-label={`${product.name}, ${kes(offer.price)}. See details`}
      />
      <PackArt
        product={product}
        className="aspect-[4/5] w-[5.75rem] shrink-0 rounded-[0.9rem] md:aspect-[5/4] md:w-full md:rounded-none"
        packClassName="max-md:origin-bottom max-md:scale-[1.3] transition-transform duration-500 ease-[var(--ease-out)] md:group-hover:-translate-y-1.5"
      />
      <div className="flex min-w-0 flex-1 flex-col py-0.5 md:px-5 md:pb-4 md:pt-4">
        <div className="meta truncate">
          {FORMAT_LABEL[product.format]}
          {goals[0] && <> · {goals.map((g) => g.short).join(", ")}</>}
        </div>
        <h3 className="mt-0.5 text-[1.02rem] font-semibold leading-snug text-ink md:mt-1 md:font-display md:text-[1.4rem] md:font-normal md:leading-[1.1] md:tracking-[-0.015em]">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.86rem] leading-snug text-ink-2 md:mt-2 md:text-[0.9rem]">{oneLiner(product)}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2 md:pt-4">
          <div>
            <div className="price text-[1.02rem] font-semibold text-ink">{kes(offer.price)}</div>
            {out && <div className="text-[0.78rem] font-medium text-caution">Out of stock right now</div>}
          </div>
          {!out && <AddButton product={product} />}
        </div>
      </div>
    </article>
  );
}
