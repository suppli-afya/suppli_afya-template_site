import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-dvh flex-col items-start justify-center py-24">
      <p className="kicker">Page not found</p>
      <h1 className="display-section mt-5 max-w-[16ch] text-ink">We couldn&apos;t find that page</h1>
      <p className="lede mt-5 max-w-md">If someone sent you this link, check it with them. It may have a small typo.</p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-8")}>
        Go to the shop
      </Link>
    </main>
  );
}
