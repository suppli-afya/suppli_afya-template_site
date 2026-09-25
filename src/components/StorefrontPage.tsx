import type { Metadata } from "next";
import { OrderSheet } from "@/components/order/OrderSheet";
import { ProductSheet } from "@/components/product/ProductSheet";
import { About } from "@/components/sections/About";
import { Catalogue } from "@/components/sections/Catalogue";
import { ChooseSection } from "@/components/sections/ChooseSection";
import { Closing, Footer } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { MobileBar, Toaster } from "@/components/sections/MobileBar";
import { Ordering } from "@/components/sections/Ordering";
import { PreviewRibbon, TopBar } from "@/components/sections/TopBar";
import { SelectorOverlay } from "@/components/selector/SelectorOverlay";
import { PageShell } from "@/components/store/PageShell";
import { StorefrontProvider } from "@/components/store/StorefrontProvider";
import { MessageSheet } from "@/components/whatsapp/MessageSheet";
import { themeCss } from "@/storefront/theme";
import type { Storefront } from "@/storefront/types";

/**
 * One distributor's storefront. The page reads top to bottom as one journey:
 *   who this is and the two ways in (help me choose / browse)
 *   → the selector, the page's centrepiece
 *   → the products, with prices
 *   → how ordering, delivery and payment work
 *   → who you're buying from
 *   → a last, low-pressure "ask".
 * Overlays (selector, product, order) sit on top of the page rather than replacing it,
 * so nobody loses their place.
 */
export function StorefrontPage({ sf }: { sf: Storefront }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss(sf.theme) }} />
      <StorefrontProvider sf={sf}>
        <PageShell>
          <PreviewRibbon />
          <TopBar />
          <main>
            <Hero />
            <ChooseSection />
            <Catalogue />
            <Ordering />
            <About />
            <Closing />
          </main>
          <Footer />
          <MobileBar />
        </PageShell>
        <Toaster />
        <SelectorOverlay />
        <ProductSheet />
        <OrderSheet />
        <MessageSheet />
      </StorefrontProvider>
    </>
  );
}

export function storefrontMetadata(sf: Storefront, path: string): Metadata {
  const d = sf.distributor;
  const count = Object.keys(sf.catalogue.offers).length;
  const title = `${d.name} · Help choosing BF Suma products, with prices`;
  const description = `Not sure which product is right for you? Answer a few questions and see what fits, with prices and the reasons why. Or browse ${count} products and order from ${d.firstName} on WhatsApp.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${d.name}${d.area ? ` · ${d.area}` : ""}`, description, siteName: d.name, locale: "en_KE", type: "website", url: path },
    twitter: { card: "summary_large_image" },
    // Preview storefronts carry placeholder details; keep them out of search results.
    robots: sf.status === "live" ? undefined : { index: false, follow: false },
  };
}
