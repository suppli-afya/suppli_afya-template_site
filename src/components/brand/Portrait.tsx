import clsx from "clsx";
import type { DistributorProfile } from "@/storefront/types";
import { initials } from "@/storefront/order";

/**
 * The distributor's face on the page. A real photo when there is one; until then a
 * monogram in their colour, set like stationery, so the page never shows a stock person.
 */
export function Portrait({
  distributor,
  className,
  size = "md",
}: {
  distributor: Pick<DistributorProfile, "name" | "photo">;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const box = {
    sm: "h-9 w-9 text-[0.95rem]",
    md: "h-12 w-12 text-[1.25rem]",
    lg: "h-16 w-16 text-[1.7rem]",
    xl: "h-full w-full text-[clamp(3rem,10vw,6.5rem)]",
  }[size];

  if (distributor.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- storefront photos are small, local and already sized
      <img
        src={distributor.photo.src}
        alt={distributor.photo.alt}
        className={clsx("shrink-0 object-cover", size === "xl" ? "rounded-panel" : "rounded-full", box, className)}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={distributor.name}
      className={clsx(
        "relative grid shrink-0 place-items-center overflow-hidden font-display italic leading-none tracking-[-0.04em]",
        size === "xl" ? "rounded-panel bg-accent-soft text-accent" : "grain rounded-full bg-accent text-on-accent",
        box,
        className,
      )}
    >
      {size === "xl" && (
        <>
          <span aria-hidden className="absolute inset-[5%] rounded-[1.2rem] border border-accent/20" />
          <span aria-hidden className="absolute bottom-[12%] left-1/2 h-px w-[18%] -translate-x-1/2 bg-accent/30" />
        </>
      )}
      <span className={size === "xl" ? "" : "-translate-y-[0.03em]"}>{initials(distributor.name)}</span>
    </span>
  );
}
