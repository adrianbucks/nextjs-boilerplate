import { Database } from "lucide-react"
import { InstallButton } from "@/components/pwa/install-button"
import { OnlineIndicator } from "@/components/pwa/online-indicator"

/**
 * Global application header. Server component by default; the interactive
 * pieces (network + install state) are isolated client components.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">DataBridge</p>
            <p className="text-xs text-muted-foreground">Offline data workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <OnlineIndicator />
          <InstallButton />
        </div>
      </div>
    </header>
  )
}
