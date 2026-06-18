import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow iframe embedding (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers leaking full referrer to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year (only meaningful in production)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Disable FLoC / Topics API
  { key: "Permissions-Policy", value: "interest-cohort=()" },
  // Basic CSP — allows same-origin, cartodb tiles, open-meteo API, fonts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + event handlers
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // CartoDB dark map tiles
      "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
      // Supabase API + open-meteo + Nominatim (seed only, not runtime)
      "connect-src 'self' https://*.supabase.co https://api.open-meteo.com",
      // Google Fonts (Geist)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Leaflet loads blob workers
      "worker-src blob:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      // Security headers on all pages
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // API routes: no CDN caching, always fresh from server
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          // Defense-in-depth: API routes should never be framed
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
