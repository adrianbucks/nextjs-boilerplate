"use client"

import type { ReactNode } from "react"
import { Database, Download, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { usePwaInstall } from "@/hooks/use-pwa-install"

interface AppShellProps {
  children: ReactNode
}

/**
 * Top-level chrome for the app: brand, live network status, and the PWA
 * install affordance. Purely presentational beyond the two PWA hooks, so it can
 * be reused as the frame for any page in the boilerplate.
 */
export function AppShell({ children }: AppShellProps) {
  const isOnline = useOnlineStatus()
  const { canInstall, isInstalled, promptInstall } = usePwaInstall()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="size-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">DataBridge</p>
              <p className="text-xs text-muted-foreground">
                Offline CSV &amp; Excel workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={isOnline ? "secondary" : "outline"}
                  className="gap-1.5 font-normal"
                >
                  {isOnline ? (
                    <Wifi className="size-3.5" aria-hidden />
                  ) : (
                    <WifiOff className="size-3.5 text-muted-foreground" aria-hidden />
                  )}
                  <span className="hidden sm:inline">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isOnline
                  ? "Connected. Data is stored locally regardless."
                  : "You are offline. The app keeps working from local storage."}
              </TooltipContent>
            </Tooltip>

            {canInstall && !isInstalled ? (
              <Button size="sm" onClick={promptInstall} className="gap-1.5">
                <Download className="size-4" aria-hidden />
                <span className="hidden sm:inline">Install app</span>
                <span className="sm:hidden">Install</span>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          Local-first PWA boilerplate &middot; data stays in your browser via
          IndexedDB
        </div>
      </footer>
    </div>
  )
}
