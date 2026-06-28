import withSerwistInit from "@serwist/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

const withSerwist = withSerwistInit({
  // The service worker source written in TypeScript.
  swSrc: "app/sw.ts",
  // The generated service worker output served from the public dir.
  swDest: "public/sw.js",
  // Disable the SW in development to keep HMR fast and predictable.
  disable: process.env.NODE_ENV === "development",
  // Reload all open tabs once the device comes back online.
  reloadOnOnline: true,
})

export default withSerwist(nextConfig)
