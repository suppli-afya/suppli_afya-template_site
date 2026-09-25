import { ogSize, storefrontCard } from "@/lib/og";
import { STOREFRONTS, defaultStorefront, storefrontBySlug } from "@/storefronts";

export const alt = "Help choosing products, with prices";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return STOREFRONTS.map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return storefrontCard(storefrontBySlug(slug) ?? defaultStorefront());
}
