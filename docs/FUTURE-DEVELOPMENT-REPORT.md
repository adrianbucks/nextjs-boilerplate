# DataBridge — Future Development Report

**Version:** 1.0  
**Date:** June 28, 2026  
**Purpose:** Guide future development to make DataBridge robust, comprehensive, modular, and easy to adopt in new projects.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Industry Research & Best Practices](#3-industry-research--best-practices)
4. [Gap Analysis](#4-gap-analysis)
5. [Recommended Architecture Evolution](#5-recommended-architecture-evolution)
6. [Modularity & Atomic Component Strategy](#6-modularity--atomic-component-strategy)
7. [Robustness & Resilience](#7-robustness--resilience)
8. [Developer Experience & Tooling](#8-developer-experience--tooling)
9. [Testing Strategy](#9-testing-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Performance Optimizations](#11-performance-optimizations)
12. [Extensibility & Boilerplate Reusability](#12-extensibility--boilerplate-reusability)
13. [PWA Enhancements](#13-pwa-enhancements)
14. [Accessibility Requirements](#14-accessibility-requirements)
15. [CI/CD & Release Engineering](#15-cicd--release-engineering)
16. [Prioritized Roadmap](#16-prioritized-roadmap)
17. [New Project Adoption Guide](#17-new-project-adoption-guide)
18. [References](#18-references)

---

## 1. Executive Summary

**DataBridge** is an offline-first Next.js PWA boilerplate with a well-designed **lib layer** (data-io engine, Dexie repository, resource pattern) but **incomplete product integration**. The home page is a placeholder; hooks, components, and repositories exist but are not wired into routes.

| Dimension | Current Maturity | Target State |
| --- | --- | --- |
| `lib/data-io` engine | **High** — portable, testable, documented | Add workers, size limits, export sanitization |
| `lib/db` layer | **Medium** — clean repository pattern | Resource registry, error handling, migrations guide |
| UI components | **Medium (isolated)** — atoms exist, features missing | Feature-sliced composition with public APIs |
| Integration | **Low** — ~40% complete as a product | Full demo: import → persist → list → export |
| Testing | **None** | Vitest for lib/hooks; Playwright for E2E |
| DX / Tooling | **Low** — broken lint, TS errors ignored | ESLint, typecheck, Prettier, CI pipeline |
| PWA | **Partial** — Serwist configured, assets missing | Icons, update UX, safer online reload policy |
| Security | **Unaddressed** — no file limits, no CSV injection guard | Defense-in-depth for untrusted spreadsheet data |

**Strategic direction:** Preserve the strong portable `lib/` modules. Restructure the application surface using **Feature-Sliced Design (FSD) layered on Atomic Design**. Complete the reference implementation (Contacts demo) to prove the boilerplate pattern, then extract reusable packages when a second project needs them.

---

## 2. Current State Assessment

### 2.1 What Works Well

**Portable data-io engine** (`lib/data-io/`)

- Framework-agnostic pipeline: parse → map → validate → export
- Declarative `ResourceDefinition<T>` drives the entire import/export lifecycle
- Pure `importRows()` function — explicitly designed for unit testing and Web Worker offload
- Composable validators and transformers
- Clean public API via `lib/data-io/index.ts`

**Repository pattern** (`lib/db/`)

- Generic `Repository<T>` with CRUD, bulk operations, and reactive hooks
- `BaseEntity` contract (`id`, `createdAt`, `updatedAt`)
- HMR-safe Dexie singleton via `globalThis.__appDb`

**PWA foundation**

- Serwist integration with offline document fallback to `/offline`
- Service worker disabled in development (correct for DX)
- Install prompt hook and online status indicator built

**UI primitives**

- shadcn/ui components installed and ready
- `FileDropzone` is well-factored (emits `File` only; parsing stays external)
- `useImportWizard` hook orchestrates select → map → review flow

### 2.2 Critical Gaps

| Gap | Impact | Files |
| --- | --- | --- |
| Home page is a v0 placeholder | Boilerplate cannot be evaluated or demoed | `app/page.tsx` |
| Built components never imported by routes | Infrastructure appears complete but is unusable | `AppShell`, `FileDropzone`, hooks |
| No persist/list/export UI | End-to-end flow stops at validation | `useImportWizard`, `contactsRepository` |
| `typescript.ignoreBuildErrors: true` | Type errors ship silently | `next.config.mjs` |
| `pnpm lint` references missing ESLint | CI would fail immediately | `package.json` |
| No tests | Regressions in core engine undetectable | — |
| Missing PWA icon assets | Install prompt may fail; broken favicons | `app/manifest.ts`, `app/layout.tsx` |
| `reloadOnOnline: true` | Page reloads when connectivity returns — data loss risk during edits | `next.config.mjs` |

### 2.3 End-to-End Flow Status

```
Parse → Map → Validate → Persist → List → Export
  ✓       ✓       ✓         ✗        ✗       ✗   (in UI)
```

The lib layer supports the full pipeline. No UI completes persist, list, or export.

### 2.4 Type Safety Issues

- `ImportedRow<T>.data` is typed as full `T`, but import produces `Partial<T>` without `id` / timestamps — unsafe cast in `import-engine.ts`
- Zod is declared on `FieldDefinition.schema` and `ResourceDefinition.schema` but unused in the demo resource
- Contact status parser silently defaults invalid values to `"lead"` instead of failing validation
- `repository.update` uses `as any` for partial updates

---

## 3. Industry Research & Best Practices

Research synthesized from current offline-first PWA, Dexie, modular React, and testing guidance (2025–2026).

### 3.1 Offline-First Architecture

Sources: [LogRocket — Next.js 16 PWA offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/), [Stripe Systems — Offline-First PWAs](https://www.stripesys.com/blog/offline-first-pwa-nextjs), [Towards Dev — missing piece in PWA tutorials](https://towardsdev.com/the-missing-piece-in-most-next-js-pwa-tutorials-4991a5384f73)

| Principle | Recommendation for DataBridge |
| --- | --- |
| Local DB is source of truth | Already aligned — Dexie is primary; no API layer |
| Network is enhancement, not dependency | Already aligned — fully client-side |
| Optimistic UI | Apply on persist: update UI immediately, handle Dexie errors with rollback toast |
| Background Sync | Not needed today (no server). Document as future extension if sync is added |
| `reloadOnOnline: false` | **Change from current `true`** — prevents forced refresh mid-edit ([Serwist guidance](https://sukechris.medium.com/building-offline-apps-with-next-js-and-serwist-a395ed4ae6ba)) |
| Test offline in production build | Already documented in README — enforce in CI smoke test |

> Most PWA tutorials stop at "app opens offline." Real offline-first means **reads, writes, and user feedback** all work without network. DataBridge's lib layer supports this; the UI must surface errors and state clearly.

### 3.2 Dexie / IndexedDB Patterns

Sources: [Dexie React tutorial](https://dexie.org/docs/Tutorial/React), [JB — Offline-first with Dexie](https://jb.desishub.com/blog/offline-first-with-dexie), [DEV — local-first financial architecture](https://dev.to/emmanueln07/your-financial-data-should-live-on-your-device-here-is-the-architecture-that-makes-that-possible-1764)

| Pattern | Current | Recommended |
| --- | --- | --- |
| UUID primary keys | ✓ Uses supplied UUIDs | Keep — avoids sync conflicts if server added later |
| `useLiveQuery` / `dexie-react-hooks` | ✓ Implemented | Keep; consider TanStack Query as orchestration layer for mutation states |
| Schema versioning | v1 only, hardcoded | Versioned migrations with documented upgrade path |
| Soft deletes | Not implemented | Add `isDeleted` if sync planned; skip if local-only forever |
| Repository abstraction | ✓ Generic `Repository<T>` | Add `IRepository<T>` interface for future cloud/local swap |
| Singleton DB instance | ✓ HMR-safe | Keep |
| Storage quota awareness | Missing | Add `navigator.storage.estimate()` helper |

**Optional enhancement:** TanStack Query with query functions reading from Dexie (not fetch) provides centralized loading/error/mutation states without replacing Dexie as source of truth. Useful when the app grows beyond simple CRUD.

### 3.3 Modular Architecture (FSD + Atomic Design)

Sources: [Feature-Sliced Design — monorepo guide](https://feature-sliced.design/blog/frontend-monorepo-explained), [FSD — Atomic Design complement](https://feature-sliced.design/blog/atomic-design-architecture), [Bedrock engineering standards](https://github.com/Zero-One-Stack/bedrock)

**Recommended hybrid for DataBridge:**

| Layer | Role | Import direction |
| --- | --- | --- |
| `app/` | Next.js routes, layout, providers | Imports from pages/widgets/features |
| `pages/` (or route segments) | Route composition only — no business logic | Imports from widgets, features |
| `widgets/` | Self-contained UI blocks (AppHeader, ContactTable) | Imports from features, entities, shared |
| `features/` | User capabilities (import-wizard, export-data) | Imports from entities, shared |
| `entities/` | Domain models + thin UI (ContactCard, ContactRow) | Imports from shared only |
| `shared/` | UI kit, lib, config, hooks (non-domain) | No upward imports |

**Atomic Design placement:**

| Atomic tier | Location |
| --- | --- |
| Atoms | `components/ui/` (existing shadcn primitives) |
| Molecules | `shared/ui/` or `components/data-io/` (FileDropzone) |
| Organisms | `widgets/` or `features/*/ui/` |
| Templates | `pages/*/ui/` layout scaffolds |
| Pages | `app/**/page.tsx` — composition only |

**Public API rule:** Every slice exports through `index.ts`. No deep imports across feature boundaries.

### 3.4 Testing

Sources: [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest), [Next.js Launchpad — Vitest + Playwright](https://nextjslaunchpad.com/article/testing-nextjs-app-router-complete-guide-vitest-playwright-server-components)

| Layer | Tool | Scope |
| --- | --- | --- |
| Pure lib logic | Vitest | `importRows`, `autoMapColumns`, validators, transformers, export matrix |
| Hooks | Vitest + `@testing-library/react` | `useImportWizard` step transitions |
| Client components | Vitest + RTL | FileDropzone, feature dialogs |
| Async Server Components | Playwright | Not heavily used today; E2E when added |
| Full flows | Playwright | Import file → review → persist → export |
| Dexie | Vitest + `fake-indexeddb` | Repository CRUD, bulkCreate |

> Vitest cannot render async Server Components. Extract testable logic from server components; use Playwright for integration.

---

## 4. Gap Analysis

### 4.1 Architecture & Modularity

| Issue | Severity | Recommendation |
| --- | --- | --- |
| DB schema coupled to `Contact` type in `lib/db/client.ts` | P1 | Bootstrap tables from resource registry |
| No central resource registry | P1 | `lib/resources/registry.ts` exporting `{ resource, repository, tableName }[]` |
| Duplicate layout: `AppShell` vs `AppHeader` | P2 | Consolidate to one; other becomes thin wrapper or deprecated |
| No `features/` layer | P0 | Create `features/import-wizard/`, `features/contact-list/`, `features/export/` |
| Domain ↔ resource type drift | P1 | Single Zod schema → infer TS types |

### 4.2 Component Atomicity

| Component | Tier | Status | Action |
| --- | --- | --- | --- |
| `components/ui/*` | Atoms | Present, mostly unused | Keep; use in feature components |
| `FileDropzone` | Molecule | Built, unwired | Wire to import feature |
| `AppShell` / `AppHeader` | Organism | Built, unwired | Wire to layout |
| `ImportWizardDialog` | Organism | **Missing** | Build: Dialog + steps + mapping form + review table |
| `ContactTable` | Organism | **Missing** | Build with `useLiveAll(contactsRepository)` |
| `ExportMenu` | Molecule | **Missing** | Build with `exportRecords` + download trigger |

### 4.3 Type Safety & Validation

| Issue | Severity | Fix |
| --- | --- | --- |
| `ignoreBuildErrors: true` | P0 | Remove; add `"typecheck": "tsc --noEmit"` |
| Import output typed as full `T` | P0 | Introduce `CreateInput<T> = Omit<T, keyof BaseEntity>` |
| Zod unused despite being in types | P1 | Co-locate `contactRowSchema`; derive types via `z.infer` |
| Status silent default to `"lead"` | P1 | Return `undefined` for blank/invalid; let validators reject |
| `FieldValidator` defaults `T = any` | P2 | Tighten gradually without breaking validator library |

### 4.4 Error Handling & Resilience

| Scenario | Current | Target |
| --- | --- | --- |
| File parse failure | String error in hook | Structured error codes + retry UI |
| Dexie `bulkCreate` failure | Unhandled | Map `QuotaExceededError`, show toast, offer partial import |
| Large file upload | No size limit | `MAX_IMPORT_BYTES` (10–25 MB) before `arrayBuffer()` |
| Large row count | Main-thread block | Chunk inserts (500 rows); worker for parse/validate |
| SW registration failure | `console.error` only | Toast notification |
| Empty Excel workbook | Silent empty sheet | Throw descriptive error |

### 4.5 Developer Experience

| Item | Status | Action |
| --- | --- | --- |
| ESLint | Script exists, package missing | Add `eslint`, `eslint-config-next` |
| Typecheck script | Missing | Add `"typecheck": "tsc --noEmit"` |
| Prettier | Missing | Add with `"format"` script |
| Package name `"my-project"` | Mismatch | Rename to `databridge` |
| `shadcn` in dependencies | Wrong tier | Move to devDependencies |
| `next-themes` installed, unused | Orphan dep | Mount `ThemeProvider` or remove |
| Storybook | Missing | P2 — document components for boilerplate adopters |
| ADRs | Missing | P2 — document key decisions in `docs/adr/` |

### 4.6 CI/CD

| Item | Status |
| --- | --- |
| GitHub Actions workflow | Missing |
| Lockfile integrity in CI | Not enforced |
| Preview deployments | Not configured |

---

## 5. Recommended Architecture Evolution

### 5.1 Target Folder Structure

Phase 1 (single-app refactor — recommended first):

```
c:\dev\nextjs-boilerplate\
├── app/                          # Next.js App Router (thin route files)
│   ├── layout.tsx
│   ├── page.tsx                  # Composes widgets only
│   ├── manifest.ts
│   ├── sw.ts
│   └── offline/page.tsx
├── src/                          # Optional: migrate non-route code here
│   ├── widgets/
│   │   ├── app-shell/
│   │   └── contact-table/
│   ├── features/
│   │   ├── import-wizard/
│   │   │   ├── ui/
│   │   │   ├── model/
│   │   │   └── index.ts
│   │   └── export-data/
│   ├── entities/
│   │   └── contact/
│   │       ├── model/types.ts
│   │       ├── ui/contact-row.tsx
│   │       └── index.ts
│   └── shared/
│       ├── ui/                   # Re-export or extend components/ui
│       └── lib/
├── components/ui/                # shadcn atoms (keep for CLI compatibility)
├── lib/                          # Portable, framework-agnostic modules
│   ├── data-io/                  # No React imports — extractable to package
│   ├── db/
│   └── resources/
├── hooks/                        # Migrate domain hooks into features/ over time
└── docs/
```

Phase 2 (multi-project reuse — when a second app needs the same engine):

```
packages/
├── data-io/          # @databridge/data-io
├── db-core/          # @databridge/db-core (Repository, BaseEntity)
└── ui-primitives/    # Shared shadcn extensions
apps/
└── web/              # Next.js app consuming packages
```

> Do not monorepo prematurely. The current `lib/` separation already supports extraction. Monorepo adds overhead until a second consumer exists.

### 5.2 Dependency Rules (Enforceable)

```
app → widgets → features → entities → shared
lib/data-io ← entities (resource definitions only)
lib/db ← entities (table registration only)
components/ui ← shared, features, widgets (never imports features)
```

Consider [Steiger](https://feature-sliced.design/docs/guides/tech/forbidden-imports) or ESLint `no-restricted-imports` to enforce layer boundaries.

### 5.3 Resource Registry Pattern

Replace manual 3-file edits with a single registration point:

```typescript
// lib/resources/registry.ts (proposed)
export const resourceRegistry = [
  {
    resource: contactResource,
    repository: contactsRepository,
    tableName: "contacts" as const,
  },
  // Add new entities here
] as const

export type RegisteredResource = (typeof resourceRegistry)[number]
```

Bootstrap Dexie schema from registry entries. Import wizard and export menu iterate registry for multi-entity support.

---

## 6. Modularity & Atomic Component Strategy

### 6.1 Component Classification

| Category | Criteria | Example |
| --- | --- | --- |
| **Dumb / presentational** | Props in, JSX out; no data fetching | `Button`, `FileDropzone`, `ImportReviewTable` |
| **Smart / container** | Uses hooks, passes data to children | `ImportWizardDialog`, `ContactListPage` |
| **Headless** | Logic only, no UI | `useImportWizard`, `usePwaInstall` |

**Rule:** Headless hooks live in `features/*/model/` or `hooks/`. Presentational components receive data via props. Containers connect hooks to presentational components.

### 6.2 Missing Feature Components (Build Order)

1. **`ImportWizardDialog`** — Dialog shell with step indicator (select / map / review)
2. **`ColumnMappingForm`** — One `Select` per resource field, bound to `ColumnMapping`
3. **`ImportReviewTable`** — Valid/invalid tabs, issue list per row, confirm action
4. **`ContactTable`** — Live-query table with sort, delete, empty state
5. **`ExportButton`** — Format picker (CSV/XLSX), triggers `exportRecords`
6. **`TemplateDownloadButton`** — Calls `downloadTemplate(contactResource)`

### 6.3 Composition Example (Target Home Page)

```tsx
// app/page.tsx (target state)
import { AppShell } from "@/widgets/app-shell"
import { ContactTable } from "@/widgets/contact-table"
import { ImportWizardTrigger } from "@/features/import-wizard"
import { ExportMenu } from "@/features/export-data"

export default function Page() {
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1>Contacts</h1>
        <div className="flex gap-2">
          <ImportWizardTrigger resource={contactResource} />
          <ExportMenu resource={contactResource} repository={contactsRepository} />
        </div>
      </div>
      <ContactTable />
    </AppShell>
  )
}
```

### 6.4 Public API Exports

Each feature folder must expose a minimal surface:

```typescript
// features/import-wizard/index.ts
export { ImportWizardDialog } from "./ui/import-wizard-dialog"
export { ImportWizardTrigger } from "./ui/import-wizard-trigger"
export { useImportWizard } from "./model/use-import-wizard"
```

Internal files (`ui/column-mapping-form.tsx`, etc.) are not imported from outside the feature.

---

## 7. Robustness & Resilience

### 7.1 Import Pipeline Hardening

```typescript
// Proposed constants (lib/data-io/constants.ts)
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024   // 10 MB
export const MAX_IMPORT_ROWS = 50_000
export const BULK_INSERT_CHUNK_SIZE = 500
```

**Guards to add:**

1. Reject files exceeding `MAX_IMPORT_BYTES` before reading buffer
2. Truncate or reject imports exceeding `MAX_IMPORT_ROWS` with clear message
3. Chunk `bulkCreate` into transactions of `BULK_INSERT_CHUNK_SIZE`
4. Return structured errors: `{ code: "FILE_TOO_LARGE" | "PARSE_FAILED" | "QUOTA_EXCEEDED", message: string }`

### 7.2 Dexie Error Mapping

| Dexie Error | User Message | Recovery |
| --- | --- | --- |
| `QuotaExceededError` | "Storage full. Delete old records or free browser storage." | Link to settings |
| Constraint / duplicate key | "Some rows already exist." | Show duplicate IDs |
| Unknown | "Could not save data. Try again." | Retry button |

### 7.3 Partial Import Strategy

When some rows are valid and some invalid:

- Persist valid rows immediately (with user confirmation)
- Offer download of rejected rows as CSV for correction
- Never silently drop invalid rows without surfacing them

### 7.4 Service Worker Update Flow

Current: `skipWaiting: true` + `clientsClaim: true` — updates apply silently.

Recommended:

1. Set `skipWaiting: false` for data-entry apps
2. Add `SwUpdatePrompt` component listening for `registration.waiting`
3. User clicks "Refresh" to activate new SW
4. Optionally preserve form state in `sessionStorage` before reload

---

## 8. Developer Experience & Tooling

### 8.1 Required Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ci": "vitest run",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 8.2 Config Fixes (Immediate)

| Change | File |
| --- | --- |
| Remove `typescript.ignoreBuildErrors` | `next.config.mjs` |
| Set `reloadOnOnline: false` | `next.config.mjs` |
| Rename `"name"` to `"databridge"` | `package.json` |
| Add ESLint flat config | `eslint.config.mjs` |
| Add Vitest config | `vitest.config.ts` |
| Add Prettier config | `.prettierrc` |

### 8.3 Documentation to Add

| Document | Purpose |
| --- | --- |
| `docs/ADDING-A-RESOURCE.md` | Step-by-step: resource → Dexie table → repository → UI |
| `docs/ARCHITECTURE.md` | Layer diagram, dependency rules |
| `docs/PWA-TESTING.md` | Production build checklist, Lighthouse criteria |
| `docs/adr/001-fsd-over-pages-by-type.md` | Record architectural decisions |

### 8.4 Code Generation (Future)

Consider a CLI script or plop generator:

```bash
pnpm generate:resource --name=product --fields=name,price,sku
```

Scaffolds: `lib/resources/product.ts`, Dexie migration snippet, repository entry, feature folder stub.

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
        ┌─────────────┐
        │  Playwright │  5–10 E2E flows
        ├─────────────┤
        │  RTL + Vitest│  Feature components, hooks
        ├─────────────┤
        │  Vitest unit │  lib/data-io, lib/db (majority of tests)
        └─────────────┘
```

### 9.2 Priority Test Cases

**P0 — lib/data-io (pure functions)**

| Module | Cases |
| --- | --- |
| `autoMapColumns` | Exact match, alias match, case insensitivity, duplicate headers |
| `importRows` | Valid rows, missing required, invalid email, row-level validator |
| `validators` | `required`, `email`, `oneOf`, `maxLength` edge cases |
| `transformers` | Empty string → undefined, number parsing |
| `export-engine` | Header order, hidden fields, empty dataset |
| CSV injection | Cells starting with `=`, `+`, `-`, `@` get sanitized on export |

**P1 — hooks & components**

| Target | Cases |
| --- | --- |
| `useImportWizard` | Step transitions, parse error, reset |
| `FileDropzone` | Drag, click, keyboard, disabled state |

**P2 — integration**

| Target | Cases |
| --- | --- |
| Repository + fake-indexeddb | bulkCreate, clear, live query updates |
| Playwright | Full import → list → export roundtrip |

### 9.3 CI Test Command

```yaml
- run: pnpm test:ci
- run: pnpm test:e2e  # optional, against built app
```

---

## 10. Security Considerations

Sources: [OWASP CSV Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/21-Testing_for_CSV_Injection), [OWASP CSV Injection community](https://github.com/OWASP/www-community/blob/master/pages/attacks/CSV_Injection.md)

### 10.1 Threat Model (Client-Only App)

| Threat | Risk | Mitigation |
| --- | --- | --- |
| Malicious XLSX (zip bomb) | **High** | File size limit before parse |
| CSV formula injection on export | **Medium** | Sanitize cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` |
| XSS from imported strings | **Low today** | React text rendering is safe; ban `dangerouslySetInnerHTML`; ESLint rule |
| Prototype pollution via headers | **Low** | Never merge raw row keys into object prototypes |
| IndexedDB data visible on device | **Inherent** | Document: data is local and unencrypted |

### 10.2 Export Sanitization (Implement in `lib/data-io/export-engine.ts`)

```typescript
function sanitizeExportCell(value: CellValue): CellValue {
  if (typeof value !== "string") return value
  const trimmed = value.replace(/^\s+/, "")
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${value}` // or tab-prefix inside quoted field for Excel
  }
  return value
}
```

Apply to every cell in CSV and XLSX export paths. Add unit tests with OWASP payloads: `=1+1`, `=CMD|' /C calc'!A0`, `@SUM(1+1)`.

### 10.3 Content Security Policy

Add explicit CSP headers in `next.config.mjs` when deploying:

```javascript
headers: async () => [{
  source: "/(.*)",
  headers: [
    { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..." },
  ],
}]
```

Tune for Serwist service worker requirements.

---

## 11. Performance Optimizations

### 11.1 Bundle Size

| Issue | Recommendation |
| --- | --- |
| `xlsx` (~300KB+) always loaded | Dynamic import on Excel file detection only |
| PapaParse loaded statically | Dynamic import in CSV parser path |
| No route-level code splitting | `next/dynamic` for ImportWizardDialog |

### 11.2 Main-Thread Offload

The import engine comments already note Web Worker compatibility. Implement:

```
User selects file
  → dynamic import parsers (main thread, small)
  → if rows > 1000 OR file > 1MB: post to Worker
  → Worker runs readSpreadsheet + importRows
  → postMessage ImportResult back
  → UI shows progress spinner during worker execution
```

Libraries: native `Worker` + `comlink` (optional sugar).

### 11.3 React Performance

| Pattern | When |
| --- | --- |
| `useLiveQuery` with deps | Already correct in db hooks |
| Virtualized table | When contact list exceeds ~200 visible rows (`@tanstack/react-virtual`) |
| Memoized row components | ContactTable rows |
| Debounced search | When filtering is added |

### 11.4 Serwist Caching Tuning

| Asset type | Strategy |
| --- | --- |
| App shell (JS/CSS/HTML) | Precache (current) |
| Static icons | CacheFirst with long TTL |
| No API routes | N/A |

Use git commit hash as cache revision for reliable updates ([Serwist pattern](https://sukechris.medium.com/building-offline-apps-with-next-js-and-serwist-a395ed4ae6ba)).

---

## 12. Extensibility & Boilerplate Reusability

### 12.1 Adding a New Entity (Target Checklist)

1. Create `lib/resources/{entity}.ts` with `defineResource`
2. Add Zod schema co-located; export `type Entity = z.infer<typeof entitySchema>`
3. Register in `lib/resources/registry.ts`
4. Add Dexie table in versioned migration
5. Export repository from registry
6. (Optional) Scaffold feature UI with generator script
7. Add unit tests for resource validators and import roundtrip
8. Document in CHANGELOG

### 12.2 Second Demo Entity

Add a **`Product`** or **`Task`** entity to prove the pattern is not Contact-specific. This validates:

- Registry-driven Dexie bootstrap
- Generic import wizard accepting any `ResourceDefinition<T>`
- Multi-entity navigation (tabs or sidebar)

### 12.3 Extractable Packages (When Ready)

| Package | Contents | Extraction trigger |
| --- | --- | --- |
| `@databridge/data-io` | Entire `lib/data-io/` | Second project needs import/export |
| `@databridge/db` | Repository, BaseEntity, hooks | Shared across apps |
| `@databridge/pwa` | SW helpers, install hook, online status | Multiple PWAs |

Keep packages framework-agnostic where possible. No React in `@databridge/data-io`.

### 12.4 Template vs. Fork Strategy

For future projects:

- **Fork** for heavy customization (different domain, different UI framework)
- **Template** (GitHub template repo) for same stack, new entity
- **Package consume** when monorepo exists

Mark repo as GitHub Template after Phase 1 completion.

---

## 13. PWA Enhancements

### 13.1 Missing Assets (P0)

Create and add to `public/`:

| File | Referenced by |
| --- | --- |
| `/icons/icon-192.png` | `app/manifest.ts` |
| `/icons/icon-512.png` | `app/manifest.ts` |
| `/icons/icon-maskable-512.png` | `app/manifest.ts` |
| `/icon-light-32x32.png` | `app/layout.tsx` |
| `/icon-dark-32x32.png` | `app/layout.tsx` |
| `/apple-icon.png` | `app/layout.tsx` |

Generate from existing `public/icon.svg` using a script (e.g., `sharp` CLI or [PWA Asset Generator](https://www.npmjs.com/package/pwa-asset-generator)).

### 13.2 Config Changes

```javascript
// next.config.mjs (recommended)
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,  // was true
  cacheOnNavigation: true,
})
```

```typescript
// app/sw.ts (recommended)
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,      // was true — let user control update
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: { entries: [{ url: "/offline", matcher: ({ request }) => request.mode === "navigate" }] },
})
```

### 13.3 Installability Checklist

- [ ] HTTPS in production (localhost exempt for dev)
- [ ] Valid manifest with 192 + 512 icons
- [ ] Service worker registered
- [ ] `start_url` responds 200
- [ ] Lighthouse PWA audit ≥ 90

---

## 14. Accessibility Requirements

### 14.1 Current Strengths

- `FileDropzone`: keyboard support, `aria-label`, `aria-busy`
- `OnlineIndicator`: screen reader text
- `Dialog`: sr-only close label
- `html lang="en"`

### 14.2 Gaps to Fix

| Area | Requirement |
| --- | --- |
| Home page | Proper `<h1>`, landmark regions (`<main>`, `<header>`, `<footer>`) |
| Import wizard | Step announcements via `aria-live="polite"` |
| Review table | Associate error messages with cells via `aria-describedby` |
| AppShell badge | Add sr-only context for online/offline state |
| Skip link | "Skip to main content" link in AppShell |
| FileDropzone | Prefer `<button>` over `role="button"` div, or add `aria-describedby` for format hint |
| Color contrast | Verify badge and muted text meet WCAG AA in light and dark themes |

### 14.3 Testing

Add `@axe-core/playwright` to E2E suite for automated a11y checks on key flows.

---

## 15. CI/CD & Release Engineering

### 15.1 Minimum GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml (proposed)
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:ci
      - run: pnpm build
```

### 15.2 Branch Protection

- Require CI pass before merge
- Require PR review for `main`
- No direct pushes to `main` after initial setup

### 15.3 Release Process

1. Conventional commits (`feat:`, `fix:`, `docs:`)
2. CHANGELOG.md maintained per release
3. Tag releases (`v0.2.0`) when boilerplate milestones complete
4. Optional: GitHub Release with generated notes

---

## 16. Prioritized Roadmap

### Phase 0 — Foundation (P0, ~1–2 weeks)

| # | Task | Outcome |
| --- | --- | --- |
| 1 | Fix tooling: ESLint, remove `ignoreBuildErrors`, add typecheck | CI-ready |
| 2 | Add Vitest + core `lib/data-io` tests (~20 cases) | Regression safety |
| 3 | Add missing PWA icons | Installable app |
| 4 | Set `reloadOnOnline: false`; add SW update prompt | Safer offline UX |
| 5 | Add file size limits + Dexie error handling | Resilience |
| 6 | Fix import typing (`CreateInput<T>`) + status parser | Type safety |
| 7 | GitHub Actions CI workflow | Automated quality gate |

### Phase 1 — Reference Implementation (P0, ~2–3 weeks)

| # | Task | Outcome |
| --- | --- | --- |
| 8 | Wire home page with AppShell + ContactTable | Demoable app |
| 9 | Build ImportWizardDialog feature components | End-to-end import |
| 10 | Wire persist via `contactsRepository.bulkCreate` | Data survives refresh |
| 11 | Build ExportMenu + template download | End-to-end export |
| 12 | Add export cell sanitization + tests | Security baseline |
| 13 | Add `ThemeProvider` or remove `next-themes` | Fix orphan dependency |

### Phase 2 — Architecture & Extensibility (P1, ~2–3 weeks)

| # | Task | Outcome |
| --- | --- | --- |
| 14 | Resource registry + registry-driven Dexie bootstrap | Single registration point |
| 15 | Add second demo entity (Product or Task) | Proves extensibility |
| 16 | Restructure into FSD layers with public APIs | Modular codebase |
| 17 | Zod schemas co-located with resources | Single source of truth |
| 18 | Consolidate AppShell / AppHeader | Less duplication |
| 19 | Dynamic import for xlsx/papaparse | Smaller initial bundle |
| 20 | `docs/ADDING-A-RESOURCE.md` | Adopter documentation |

### Phase 3 — Polish & Scale (P2, ongoing)

| # | Task | Outcome |
| --- | --- | --- |
| 21 | Web Worker for large imports | Performance |
| 22 | Playwright E2E suite | Integration confidence |
| 23 | Virtualized ContactTable | Large dataset UX |
| 24 | Storybook for shared components | Component catalog |
| 25 | Resource generator CLI | Faster adoption |
| 26 | TanStack Query orchestration layer | Richer mutation states |
| 27 | Storage quota UX | User awareness |
| 28 | Monorepo extraction (`@databridge/data-io`) | Multi-project reuse |
| 29 | LICENSE file + GitHub template flag | Open-source readiness |
| 30 | `@axe-core/playwright` a11y checks | Accessibility CI |

---

## 17. New Project Adoption Guide

When starting a new project from this boilerplate:

### Quick Start

1. Clone or use GitHub Template
2. `pnpm install && pnpm dev`
3. Rename branding in `app/layout.tsx`, `app/manifest.ts`
4. Replace `Contact` entity with your domain entity
5. Wire your home page using existing widgets/features pattern

### What to Keep Unchanged

- `lib/data-io/` — import/export engine
- `lib/db/repository.ts` — generic CRUD
- `components/ui/` — shadcn primitives
- PWA infrastructure (`app/sw.ts`, Serwist config)

### What to Customize

- `lib/resources/` — your domain entities
- `lib/db/client.ts` — your tables (or registry bootstrap)
- `features/` — your business UI
- `app/page.tsx` — your route composition

### What to Add

- Your entity-specific validation rules
- Your branding assets (icons, colors in `globals.css`)
- Your LICENSE
- CI workflow (copy from boilerplate once added)

### Anti-Patterns to Avoid

- Importing Dexie directly in components (use repositories)
- Putting business logic in `app/page.tsx` (compose from features)
- Parsing spreadsheets inside UI components (use hooks/engine)
- Deep-importing across feature boundaries
- Skipping tests for custom validators and resource definitions

---

## 18. References

### Offline-First & PWA

- [Build a Next.js 16 PWA with true offline support — LogRocket](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Offline-First PWAs with Next.js — Stripe Systems](https://www.stripesys.com/blog/offline-first-pwa-nextjs)
- [The Missing Piece in Most Next.js PWA Tutorials — Towards Dev](https://towardsdev.com/the-missing-piece-in-most-next-js-pwa-tutorials-4991a5384f73)
- [Building Offline Apps with Next.js and Serwist — Medium](https://sukechris.medium.com/building-offline-apps-with-next-js-and-serwist-a395ed4ae6ba)

### Dexie & Local-First Data

- [Get started with Dexie in React — Dexie.js Docs](https://dexie.org/docs/Tutorial/React)
- [Building an Offline-First App with Next.js, Dexie, Prisma & PWA — JB](https://jb.desishub.com/blog/offline-first-with-dexie)
- [Local-first financial architecture — DEV Community](https://dev.to/emmanueln07/your-financial-data-should-live-on-your-device-here-is-the-architecture-that-makes-that-possible-1764)

### Architecture & Modularity

- [Monorepo Architecture — Feature-Sliced Design](https://feature-sliced.design/blog/frontend-monorepo-explained)
- [Atomic Design: Build UIs That Actually Scale — FSD](https://feature-sliced.design/blog/atomic-design-architecture)
- [Bedrock — enforced Next.js engineering standards](https://github.com/Zero-One-Stack/bedrock)

### Testing

- [Testing with Vitest — Next.js Docs](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js Testing: Vitest + Playwright — Next.js Launchpad](https://nextjslaunchpad.com/article/testing-nextjs-app-router-complete-guide-vitest-playwright-server-components)

### Security

- [Testing for CSV Injection — OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/21-Testing_for_CSV_Injection)
- [CSV Injection — OWASP Community](https://github.com/OWASP/www-community/blob/master/pages/attacks/CSV_Injection.md)
- [CSV Injection Prevention Guide — SecureCodingHub](https://www.securecodinghub.com/guides/csv-injection)

---

*This report should be reviewed and updated after each major phase completion. Next review recommended after Phase 1 (reference implementation) is shipped.*
