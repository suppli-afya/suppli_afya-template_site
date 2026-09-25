"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import type { Product } from "@/engine";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Plus } from "@/components/ui/icons";
import { QtyStepper } from "./QtyStepper";

/** Quick add on a product card: a "+" that becomes a quantity stepper once the product is in the order. */
export function AddButton({ product, className, from }: { product: Product; className?: string; from?: "selector" }) {
  const { qtyOf, addToOrder, setQty, removeFromOrder } = useStorefront();
  const qty = qtyOf(product.id);
  return (
    <div className={clsx("relative z-10 flex h-11 items-center justify-end", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {qty === 0 ? (
          <motion.button
            key="add"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            onClick={() => addToOrder(product.id, { from })}
            aria-label={`Add ${product.name} to your order`}
            className="grid h-11 w-11 place-items-center rounded-full bg-ink text-canvas transition-colors hover:bg-black active:scale-95"
          >
            <Plus />
          </motion.button>
        ) : (
          <motion.div
            key="qty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            <QtyStepper
              size="sm"
              name={product.name}
              value={qty}
              onChange={(n) => setQty(product.id, n)}
              onRemove={() => removeFromOrder(product.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
