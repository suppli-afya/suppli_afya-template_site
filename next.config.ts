import type { NextConfig } from "next";

/**
 * The public address link previews use. NEXT_PUBLIC_SITE_URL wins. On Vercel without it, the
 * deploy's own address: the production domain (a custom domain once one is added) or, for
 * previews, the branch address. Otherwise previews in WhatsApp would point at localhost.
 */
function publicUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}
const SITE_URL = publicUrl();

const nextConfig: NextConfig = {
  // The database driver loads at runtime; keep it out of the bundle.
  serverExternalPackages: ["postgres"],
  env: SITE_URL ? { NEXT_PUBLIC_SITE_URL: SITE_URL } : {},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
