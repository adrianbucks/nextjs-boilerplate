"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * The `beforeinstallprompt` event is not yet in the standard lib DOM types,
 * so we model the bits we rely on here.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt: () => Promise<void>
}

export interface PwaInstallState {
  /** True once the browser has fired a usable install prompt. */
  canInstall: boolean
  /** True when the app is already running in standalone (installed) mode. */
  isInstalled: boolean
  /** Triggers the native install prompt. Resolves to the user's choice. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * Encapsulates the install lifecycle of the PWA: capturing the deferred
 * `beforeinstallprompt` event, exposing whether the app can be installed,
 * and tracking whether it is already installed.
 */
export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(getIsStandalone())

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome
  }, [deferredPrompt])

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    isInstalled,
    promptInstall,
  }
}
