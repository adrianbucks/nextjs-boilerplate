import { CloudOff } from "lucide-react"

export const metadata = {
  title: "Offline — DataBridge",
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <CloudOff className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-pretty text-muted-foreground leading-relaxed">
        This page hasn&apos;t been cached yet. Your saved data is still
        available locally — reconnect to load anything new.
      </p>
    </main>
  )
}
