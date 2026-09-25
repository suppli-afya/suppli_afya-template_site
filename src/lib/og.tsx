import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { initials } from "@/storefront/order";
import type { Storefront } from "@/storefront/types";

export const ogSize = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [regular, italic, sans] = await Promise.all([
    readFile(join(dir, "Newsreader-Regular.woff")),
    readFile(join(dir, "Newsreader-Italic.woff")),
    readFile(join(dir, "HankenGrotesk-SemiBold.woff")),
  ]);
  return [
    { name: "Newsreader", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Newsreader", data: italic, style: "italic" as const, weight: 400 as const },
    { name: "Hanken", data: sans, style: "normal" as const, weight: 600 as const },
  ];
}

/** The link preview. It mostly appears in WhatsApp chats, so it has to read at thumbnail size. */
export async function storefrontCard(sf: Storefront) {
  const d = sf.distributor;
  const accent = sf.theme.accent;
  const count = Object.keys(sf.catalogue.offers).length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f5f3ee",
          fontFamily: "Hanken",
          color: "#1c1a17",
          padding: "60px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: accent,
                color: sf.theme.onAccent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Newsreader",
                fontStyle: "italic",
                fontSize: 30,
              }}
            >
              {initials(d.name)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30 }}>{d.name}</div>
              <div style={{ fontSize: 22, color: "#6b655c" }}>{[d.role, d.area].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Newsreader", fontSize: 78, lineHeight: 1.02, letterSpacing: -2.4, maxWidth: 900 }}>
            <span>Not sure which product is right for you?</span>
            <span style={{ fontStyle: "italic", color: accent }}>Let&apos;s narrow it down.</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#48443d" }}>
            <span>Help choosing</span>
            <span style={{ color: accent }}>·</span>
            <span>{count} products with prices</span>
            <span style={{ color: accent }}>·</span>
            <span>Order on WhatsApp</span>
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}
