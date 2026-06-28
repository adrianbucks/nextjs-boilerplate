# DataBridge

An offline-first Progressive Web App boilerplate for working with spreadsheet data entirely in the browser. Import and export CSV and Excel files, validate rows with a declarative resource engine, and persist everything locally via IndexedDB — no backend required.

> **Status:** Core infrastructure (PWA, local database, import/export engine, UI primitives) is in place. The home page is still a placeholder; feature UI can be composed from the existing hooks and components.

## Features

- **Offline-first PWA** — Installable app with Serwist service worker, precaching, and an `/offline` fallback page
- **Local storage** — Dexie (IndexedDB) with a generic repository pattern and reactive live-query hooks
- **Import / export engine** — Parse CSV and Excel, auto-map columns, validate rows, and export back to spreadsheet formats
- **Declarative resources** — Define entities once; the same schema drives persistence, validation, mapping, and templates
- **UI scaffolding** — shadcn/ui components, app shell with online status and install prompt, file dropzone, and a 3-step import wizard hook

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database | Dexie + dexie-react-hooks |
| Spreadsheets | PapaParse (CSV), SheetJS/xlsx (Excel), Zod (validation) |
| PWA | Serwist, `@serwist/next` |
| Package manager | pnpm |

## Getting Started

### Prerequisites

- Node.js
- [pnpm](https://pnpm.io/)

### Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
pnpm build
pnpm start
```

Service worker registration and PWA install behavior are enabled in production only. Use `pnpm build && pnpm start` to test offline mode and install prompts — they are disabled during `pnpm dev`.

### Other scripts

```bash
pnpm lint    # ESLint
```

No environment variables are required for local development.

## Project Structure

```
app/                  Next.js routes, layout, PWA manifest, service worker
components/
  ui/                 shadcn/ui primitives
  pwa/                Service worker registration, install button, online indicator
  layout/             AppShell and AppHeader
  data-io/            File dropzone
hooks/                Import wizard, PWA install, online status
lib/
  db/                 Dexie client, repository pattern, live-query hooks
  data-io/            Import/export engine (parsers, mapping, validators)
  resources/          Domain resource definitions (demo: contacts)
public/               Static assets and PWA icons
```

There are no API routes — the app is fully client-side and local-first.

## Architecture

### Repository pattern

Entities extend a shared `BaseEntity` contract (`id`, `createdAt`, `updatedAt`). A generic `Repository<T>` wraps Dexie tables with CRUD, bulk operations, and reactive hooks (`useLiveAll`, `useLiveOne`, `useLiveCount`).

### Resource definitions

Each domain entity is described in `lib/resources/` using `defineResource` and `defineField`. A single resource definition drives:

- Column auto-mapping from spreadsheet headers
- Row validation and parsing
- Blank template generation
- Export formatting

To adapt the boilerplate, add a resource file, register a matching Dexie table, and export a repository — the import/export engine stays unchanged.

### Import pipeline

1. **Parse** — CSV (`.csv`, `.tsv`, `.txt`) or Excel (`.xlsx`, `.xls`, `.ods`)
2. **Map** — Auto-match columns to resource fields (with alias support)
3. **Validate** — Per-field validators and optional Zod schemas; rows split into valid / invalid
4. **Persist** — Bulk insert via repository

The `useImportWizard` hook orchestrates a select → map → review flow. `FileDropzone` handles drag-and-drop file selection.

### Demo entity: Contacts

The included `Contact` resource demonstrates the pattern with fields for name, email, company, phone, status (`lead` | `active` | `churned`), and score.

## PWA Notes

- Manifest: `/manifest.webmanifest`
- Service worker source: `app/sw.ts` (built to `public/sw.js` on production build)
- Offline navigation falls back to `/offline`
- Vercel Analytics runs in production only

## License

No license file is included yet. Add one before distributing or open-sourcing the project.
