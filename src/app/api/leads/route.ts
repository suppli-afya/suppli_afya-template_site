import type { Answers } from "@/engine";
import { storefrontBySlug } from "@/storefronts";

/**
 * A customer sent their selector results to the distributor on WhatsApp. If this deploy is
 * connected to the Suppli Afya app (SUPPLI_AFYA_URL) and the storefront is linked to a
 * workspace (suppliSlug), pass it on to the app's own /api/leads, the same endpoint the
 * health check link uses: it recomputes the plan on the server and files the prospect.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { slug?: unknown; answers?: unknown; ref?: unknown; phone?: unknown } | null;
  if (!body || typeof body.slug !== "string" || !body.answers || typeof body.answers !== "object" || Array.isArray(body.answers))
    return Response.json({ ok: false }, { status: 400 });
  if (typeof body.ref !== "string" || !/^SA-[A-Z2-9]{4}$/.test(body.ref)) return Response.json({ ok: false }, { status: 400 });
  if (JSON.stringify(body.answers).length > 20_000) return Response.json({ ok: false }, { status: 413 });

  const sf = storefrontBySlug(body.slug);
  if (!sf) return Response.json({ ok: false }, { status: 404 });

  const base = process.env.SUPPLI_AFYA_URL;
  if (sf.status !== "live" || !sf.suppliSlug || !base) return Response.json({ ok: true, forwarded: false });

  const res = await fetch(new URL("/api/leads", base), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: sf.suppliSlug,
      answers: body.answers as Answers,
      ref: body.ref,
      phone: typeof body.phone === "string" ? body.phone.slice(0, 20) : undefined,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  return Response.json({ ok: true, forwarded: Boolean(res?.ok) });
}
