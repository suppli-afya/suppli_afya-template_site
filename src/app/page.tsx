import type { Metadata } from "next";
import { StorefrontPage, storefrontMetadata } from "@/components/StorefrontPage";
import { defaultStorefront } from "@/storefronts";

/** "/" is the deploy's default storefront (NEXT_PUBLIC_DEFAULT_STOREFRONT), e.g. on a distributor's own domain. */
export function generateMetadata(): Metadata {
  return storefrontMetadata(defaultStorefront(), "/");
}

export default function Home() {
  return <StorefrontPage sf={defaultStorefront()} />;
}
