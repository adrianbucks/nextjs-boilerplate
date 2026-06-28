"use client"

import { useCallback, useRef, useState } from "react"
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import { ACCEPTED_IMPORT_ACCEPT, ACCEPTED_IMPORT_EXTENSIONS } from "@/lib/data-io"

interface FileDropzoneProps {
  onFile: (file: File) => void
  isParsing?: boolean
}

/**
 * Accessible drag-and-drop file picker. Atomic and dependency-free — it only
 * emits a `File`, leaving parsing concerns to the caller.
 */
export function FileDropzone({ onFile, isParsing }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a CSV or Excel file"
      aria-busy={isParsing}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-12 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "border-primary bg-accent",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMPORT_ACCEPT}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
        {isParsing ? (
          <Loader2 className="size-6 animate-spin" aria-hidden />
        ) : isDragging ? (
          <FileSpreadsheet className="size-6" aria-hidden />
        ) : (
          <UploadCloud className="size-6" aria-hidden />
        )}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isParsing
            ? "Reading file…"
            : "Drop a file here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports {ACCEPTED_IMPORT_EXTENSIONS.join(", ")}
        </p>
      </div>
    </div>
  )
}
