"use client"

import { useEffect } from "react"

/**
 * Registers the Serwist-generated service worker on the client.
 *
 * The service worker is only emitted in production builds (it is disabled in
 * development via `next.config.mjs`), so registration is a no-op during local
 * development. Mount this once, high in the tree (e.g. the root layout).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch (error) {
        console.error("[v0] Service worker registration failed:", error)
      }
    }

    // Register after the window has loaded to avoid competing with the
    // critical rendering path.
    if (document.readyState === "complete") {
      void register()
    } else {
      window.addEventListener("load", register, { once: true })
      return () => window.removeEventListener("load", register)
    }
  }, [])

  return null
}
