import { ImageResponse } from "next/og";
import { initials } from "@/storefront/order";
import { defaultStorefront } from "@/storefronts";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The browser tab shows the distributor's monogram in their colour. */
export default function Icon() {
  const sf = defaultStorefront();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          background: sf.theme.accent,
          color: sf.theme.onAccent,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        {initials(sf.distributor.name)}
      </div>
    ),
    size,
  );
}
