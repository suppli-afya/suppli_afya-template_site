import clsx from "clsx";
import type { CSSProperties } from "react";
import type { Product, ProductLine } from "@/engine";
import { FORMAT_LABEL, shortName } from "@/storefront/products";

/**
 * Pack illustrations, one shape per format, tinted by product line, with the product's
 * name set on a paper label. Suppli Afya never uses BF Suma's product photography or logos
 * (the page must never look like BF Suma's own site), so these stand in for photos: the
 * product stays the visual focus without pretending to be the real packaging.
 *
 * Everything is sized in container units of the stage's shorter side (cqmin), so one
 * component works as a 64px thumbnail, a tall card and a wide banner without cropping.
 */
export const LINE_TONE: Record<ProductLine, string> = {
  "Immune Booster": "#5b4636",
  "Heart & Blood Fit": "#7a2e33",
  "Sport Fit": "#a86f22",
  "Suma Fit": "#2e5a61",
  "Men's Power": "#27303d",
  "Women's Beauty": "#9f5752",
  "Suma Living": "#6f695f",
};

type Shape = "bottle" | "box" | "pump" | "jar";
const SHAPE: Record<Product["format"], Shape> = {
  capsules: "bottle",
  tablets: "bottle",
  coffee: "box",
  drink: "box",
  tea: "box",
  wash: "pump",
  skincare: "jar",
};

const shade =
  "linear-gradient(90deg, rgb(255 255 255 / 0.16) 0%, rgb(255 255 255 / 0.04) 16%, rgb(0 0 0 / 0) 55%, rgb(0 0 0 / 0.2) 100%)";

export function PackArt({
  product,
  className,
  packClassName,
  stage = true,
  label,
  thumb,
  center,
}: {
  product: Product;
  className?: string;
  /** Extra classes on the pack itself, e.g. a hover lift driven by a parent `group`. */
  packClassName?: string;
  /** Tinted backdrop behind the pack. */
  stage?: boolean;
  /** Print the name on the pack. Defaults to on, except for thumbnails. */
  label?: boolean;
  /** Small list thumbnail: a closer crop, no printed name. */
  thumb?: boolean;
  /** Stand the pack in the middle of a tall stage instead of near its foot. */
  center?: boolean;
}) {
  const printed = label ?? !thumb;
  const tone = LINE_TONE[product.line];
  const shape = SHAPE[product.format];
  const style = { "--tone": tone } as CSSProperties;
  return (
    <div
      aria-hidden
      style={style}
      className={clsx(
        "relative isolate overflow-hidden [container-type:size]",
        stage && "bg-[color-mix(in_oklab,var(--tone)_9%,#ebe8e1)]",
        className,
      )}
    >
      {stage && (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_15%,rgb(255_255_255/0.55),transparent_60%)]" />
      )}
      <div
        className={clsx(
          "absolute inset-x-0 mx-auto h-[5cqmin] w-[62cqmin] rounded-[50%] bg-[radial-gradient(closest-side,rgb(28_26_23/0.28),transparent)] blur-[1px]",
          center ? "bottom-[calc(50%-34cqmin)]" : "bottom-[10%]",
        )}
      />
      <div
        className={clsx(
          "absolute inset-x-0 flex justify-center",
          center ? "bottom-[calc(50%-31.5cqmin)]" : "bottom-[12.5%]",
          thumb && "origin-bottom scale-[1.3]",
          packClassName,
        )}
      >
        {shape === "bottle" && <Bottle product={product} label={printed} />}
        {shape === "box" && <Box product={product} label={printed} />}
        {shape === "pump" && <Pump product={product} label={printed} />}
        {shape === "jar" && <Jar product={product} label={printed} />}
      </div>
    </div>
  );
}

function Label({ product, compact }: { product: Product; compact?: boolean }) {
  const name = shortName(product);
  // Long names get smaller type so they always sit inside the label.
  const size = name.length > 22 ? "text-[4.4cqmin]" : name.length > 13 ? (compact ? "text-[4.6cqmin]" : "text-[5.2cqmin]") : compact ? "text-[5.2cqmin]" : "text-[6.4cqmin]";
  return (
    <div className="flex h-full flex-col items-center justify-center px-[3cqmin] text-center">
      <span className="text-[2.9cqmin] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--tone)] opacity-80">
        {product.line}
      </span>
      <span
        className={clsx("mt-[1.6cqmin] font-display leading-[0.98] tracking-[-0.02em] text-[#231f1b] [text-wrap:balance]", size)}
      >
        {name}
      </span>
      <span className="mt-[1.6cqmin] h-px w-[8cqmin] bg-[var(--tone)] opacity-40" />
      <span className="mt-[1.4cqmin] text-[2.7cqmin] leading-none tracking-[0.06em] text-[#5d564d]">
        {FORMAT_LABEL[product.format].toLowerCase()}
      </span>
    </div>
  );
}

const paper = "bg-[#f7f2e8] shadow-[inset_0_0_0_0.4cqmin_rgb(0_0_0/0.05)]";

function Bottle({ product, label }: { product: Product; label: boolean }) {
  return (
    <div className="relative flex w-[40cqmin] flex-col items-center">
      <div
        className="h-[9cqmin] w-[25cqmin] rounded-[1.6cqmin_1.6cqmin_0.6cqmin_0.6cqmin]"
        style={{
          background: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.08) 0 0.8cqmin, transparent 0.8cqmin 2cqmin), ${shade}, color-mix(in oklab, var(--tone) 70%, black)`,
        }}
      />
      <div className="h-[2.2cqmin] w-[21cqmin] bg-[color-mix(in_oklab,var(--tone)_55%,black)]" />
      <div className="relative h-[52cqmin] w-full rounded-[6cqmin_6cqmin_4.5cqmin_4.5cqmin]" style={{ background: `${shade}, var(--tone)` }}>
        <div className={clsx("absolute inset-x-0 top-[12cqmin] h-[29cqmin]", paper)}>{label && <Label product={product} />}</div>
      </div>
    </div>
  );
}

function Box({ product, label }: { product: Product; label: boolean }) {
  return (
    <div className="relative w-[46cqmin]">
      <div className="h-[3cqmin] w-full rounded-t-[0.8cqmin] bg-[color-mix(in_oklab,var(--tone)_78%,black)]" />
      <div className="relative h-[55cqmin] w-full rounded-b-[1.2cqmin]" style={{ background: `${shade}, var(--tone)` }}>
        <div className="absolute inset-x-0 top-[3.5cqmin] h-px bg-white/15" />
        <div className={clsx("absolute inset-x-[4cqmin] top-[11cqmin] h-[29cqmin] rounded-[0.8cqmin]", paper)}>
          {label && <Label product={product} compact />}
        </div>
        <div className="absolute inset-x-0 bottom-[4.5cqmin] flex justify-center gap-[1.4cqmin]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[1.2cqmin] w-[1.2cqmin] rounded-full bg-white/35" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Pump({ product, label }: { product: Product; label: boolean }) {
  return (
    <div className="relative flex w-[32cqmin] flex-col items-center">
      <div className="flex w-full justify-center">
        <div className="h-[2.4cqmin] w-[12cqmin] translate-x-[3cqmin] rounded-full bg-[color-mix(in_oklab,var(--tone)_65%,black)]" />
      </div>
      <div className="h-[6cqmin] w-[3.6cqmin] bg-[color-mix(in_oklab,var(--tone)_65%,black)]" />
      <div className="h-[5cqmin] w-[15cqmin] rounded-t-[1.2cqmin] bg-[color-mix(in_oklab,var(--tone)_75%,black)]" />
      <div className="relative h-[52cqmin] w-full rounded-[7cqmin_7cqmin_5cqmin_5cqmin]" style={{ background: `${shade}, var(--tone)` }}>
        <div className={clsx("absolute inset-x-0 top-[12cqmin] h-[27cqmin]", paper)}>{label && <Label product={product} compact />}</div>
      </div>
    </div>
  );
}

function Jar({ product, label }: { product: Product; label: boolean }) {
  return (
    <div className="relative flex w-[56cqmin] flex-col items-center">
      <div
        className="h-[9cqmin] w-[58cqmin] rounded-[2cqmin]"
        style={{ background: `${shade}, color-mix(in oklab, var(--tone) 72%, black)` }}
      />
      <div className="relative h-[28cqmin] w-full rounded-b-[5cqmin]" style={{ background: `${shade}, var(--tone)` }}>
        <div className={clsx("absolute inset-x-[5cqmin] top-[3.5cqmin] bottom-[4cqmin] rounded-[0.8cqmin]", paper)}>
          {label && <Label product={product} compact />}
        </div>
      </div>
    </div>
  );
}
