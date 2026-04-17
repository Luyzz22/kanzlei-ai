/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // @vercel/blob uses Node-only APIs (undici, fs, crypto) and must never
  // be pulled into client-side bundles by Webpack via server action traces.
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    },
    serverComponentsExternalPackages: ["@vercel/blob"]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ]
      }
    ]
  }
}

export default nextConfig
