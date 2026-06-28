"use client"

import { useCallback, useMemo, useState } from "react"
import {
  autoMapColumns,
  importRows,
  isMappingComplete,
  readSpreadsheet,
} from "@/lib/data-io"
import type {
  ColumnMapping,
  ImportResult,
  ParsedSheet,
  ResourceDefinition,
} from "@/lib/data-io"

export type ImportStep = "select" | "map" | "review"

/**
 * Headless state machine for the import flow. It owns the parsed sheet, the
 * editable column mapping, and the derived validation result, exposing simple
 * transitions to the UI. Keeping this logic out of the dialog component makes
 * the flow reusable and unit-testable, and lets any resource reuse it as-is.
 */
export function useImportWizard<T>(resource: ResourceDefinition<T>) {
  const [step, setStep] = useState<ImportStep>("select")
  const [fileName, setFileName] = useState<string | null>(null)
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep("select")
    setFileName(null)
    setSheet(null)
    setMapping({})
    setIsParsing(false)
    setError(null)
  }, [])

  const loadFile = useCallback(
    async (file: File) => {
      setIsParsing(true)
      setError(null)
      try {
        const parsed = await readSpreadsheet(file)
        setSheet(parsed)
        setFileName(file.name)
        setMapping(autoMapColumns(parsed.headers, resource))
        setStep("map")
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not read this file.",
        )
      } finally {
        setIsParsing(false)
      }
    },
    [resource],
  )

  const setFieldMapping = useCallback(
    (fieldKey: string, header: string | null) => {
      setMapping((prev) => ({ ...prev, [fieldKey]: header }))
    },
    [],
  )

  const mappingComplete = useMemo(
    () => isMappingComplete(resource, mapping),
    [resource, mapping],
  )

  const result: ImportResult<T> | null = useMemo(() => {
    if (!sheet || step !== "review") return null
    return importRows(sheet, resource, mapping)
  }, [sheet, resource, mapping, step])

  return {
    step,
    setStep,
    fileName,
    sheet,
    mapping,
    setFieldMapping,
    mappingComplete,
    isParsing,
    error,
    result,
    loadFile,
    reset,
  }
}
