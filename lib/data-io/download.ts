/**
 * Triggers a browser download for a Blob. Creates a temporary object URL,
 * clicks a synthetic anchor, then revokes the URL on the next tick. Works fully
 * offline since no network request is involved.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  if (typeof document === "undefined") return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
