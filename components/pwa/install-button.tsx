"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"

/**
 * Renders a native-install trigger only when the browser has offered an
 * install prompt and the app isn't already installed. Hidden otherwise to
 * avoid dead UI.
 */
export function InstallButton() {
  const { canInstall, promptInstall } = usePwaInstall()

  if (!canInstall) return null

  async function handleClick() {
    const outcome = await promptInstall()
    if (outcome === "accepted") {
      toast.success("Installing DataBridge", {
        description: "The app is being added to your device.",
      })
    }
  }

  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={handleClick}>
      <Download className="size-4" aria-hidden />
      Install app
    </Button>
  )
}
