import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontPage, storefrontMetadata } from "@/components/StorefrontPage";
import { STOREFRONTS, defaultStorefront, storefrontBySlug } from "@/storefronts";

export const dynamicParams = false;

export function generateStaticParams() {
  return STOREFRONTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const sf = storefrontBySlug(slug);
  if (!sf) return {};
  // The default storefront is also served at "/"; that's its canonical address.
  return storefrontMetadata(sf, sf.slug === defaultStorefront().slug ? "/" : `/${sf.slug}`);
}

export default async function DistributorStorefront(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const sf = storefrontBySlug(slug);
  if (!sf) notFound();
  return <StorefrontPage sf={sf} />;
}
