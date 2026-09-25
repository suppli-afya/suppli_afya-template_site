import type { Theme } from "./types";

/**
 * The distributor's colours as CSS variables on :root, read by the accent tokens in
 * globals.css. Rendered on the server with the page, so there's no flash of the default
 * colour, and sheets (rendered at the end of <body>) pick them up too.
 * Values are validated as hex colours by validateStorefront.
 */
export function themeCss(theme: Theme): string {
  const safe = (v: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000");
  return `:root{--accent:${safe(theme.accent)};--accent-strong:${safe(theme.accentStrong)};--accent-soft:${safe(theme.accentSoft)};--on-accent:${safe(theme.onAccent)}}`;
}
