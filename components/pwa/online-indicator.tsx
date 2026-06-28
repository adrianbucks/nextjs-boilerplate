"use client"

import { Wifi, WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Compact, accessible badge reflecting live network status. Because the app is
 * fully offline-capable, this is informational rather than blocking.
 */
export function OnlineIndicator({ className }: { className?: string }) {
  const isOnline = useOnlineStatus()

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        isOnline
          ? "border-primary/30 text-primary"
          : "border-muted-foreground/30 text-muted-foreground",
        className,
      )}
    >
      {isOnline ? (
        <Wifi className="size-3.5" aria-hidden />
      ) : (
        <WifiOff className="size-3.5" aria-hidden />
      )}
      <span>{isOnline ? "Online" : "Offline"}</span>
      <span className="sr-only">
        {isOnline
          ? "You are connected to the network."
          : "You are offline. The app continues to work with local data."}
      </span>
    </Badge>
  )
}
