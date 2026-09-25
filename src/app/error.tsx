"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-x flex min-h-dvh flex-col items-start justify-center py-24">
      <p className="kicker">Something went wrong</p>
      <h1 className="display-section mt-5 max-w-[18ch] text-ink">This page didn&apos;t load properly</h1>
      <p className="lede mt-5 max-w-md">
        It&apos;s usually the connection. Try again; anything in your order is saved on this phone.
      </p>
      <Button variant="primary" size="lg" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
