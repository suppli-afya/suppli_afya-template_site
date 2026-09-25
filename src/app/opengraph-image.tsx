import { ogSize, storefrontCard } from "@/lib/og";
import { defaultStorefront } from "@/storefronts";

export const alt = "Help choosing products, with prices";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  return storefrontCard(defaultStorefront());
}
