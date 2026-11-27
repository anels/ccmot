# CCMOT — Project Context for Claude

Credit Card Offer Tracker. Vite + React 19 + TypeScript frontend talking to a
local Express + SQLite backend.

## Quick Start

```bash
npm install
cd server && npm install && cd ..
npm run dev:all          # frontend (5173) + backend (3001) concurrent
npm run build            # tsc -b && vite build
npm run lint             # eslint
npm test                 # vitest: src/**/*.test.ts and server/test
```

Single-process variants: `npm run dev` (frontend only), `npm run server`
(backend only).

Backend DB defaults to `~/.ccmot/database.sqlite`. Set `CCMOT_DB_PATH` to use a
different local file. Wipe that file to reset state.

## Architecture

- `src/components/` — React components. Page-level: Dashboard, CardManager,
  OfferManager, Settings. Reusable: Modal, AlertDialog, ConfirmDialog,
  PageHeader, CatalogOfferCard, TrackedOfferCard, CardTypeModal, RewardConfig,
  Layout.
- `src/lib/store.ts` — Zustand store. A write sends its request first and
  changes local state only after the server accepts it. It never rejects: it
  resolves a `WriteResult`, and a form closes or clears only when `ok`. The
  store reports failures in `error` (`importData` leaves that to its caller).
  `initialize()` runs once from `App.tsx` on mount via `GET /api/initial-data`.
  Submit buttons use `useSubmit()` so a second click waits for the first.
- `src/lib/lifecycle.ts` — what a tracked offer is now and what may be done
  with it: effective status, next status, reset, days left, whether an offer's
  date has passed. Views ask it; they do not compare dates or statuses
  themselves.
- `src/lib/dashboard.ts` — `buildDashboardView` and `buildOffersExport`, the
  pure derivations behind the dashboard. `Dashboard.tsx` only renders them.
- `src/lib/utils.ts` — `cn`, `parseOfferDate`, `getReadableTextColor`,
  `resolveCards`.
- `GLOSSARY.md` — the domain terms. Use them in code and UI text.
- `src/lib/constants.tsx` — Categories, issuer colors, **STATUS_COLORS**,
  **STATUS_DOT**, **CATEGORY_COLORS** + `getCategoryColor()`.
- `src/api/client.ts` — fetch wrapper, base URL `VITE_API_URL`
  (default `http://localhost:3001/api`).
- `server/index.js` — reads the environment, opens the database, listens.
- `server/app.js` — `createApp(db)`. The `RESOURCES` table declares each
  resource's columns and required fields, and the CRUD routes, import and
  `/api/initial-data` are generated from it. Add a column there and in a
  migration. `PUT /api/offers/:id/with-cards` saves an offer and its tracked
  offers in one transaction; it removes only rows the caller says it has seen.
  Errors: 400 for validation and constraint failures, 404 for an unknown id,
  500 otherwise.
- `server/db.js` — `openDatabase()` over better-sqlite3 (synchronous). The
  schema is versioned with `PRAGMA user_version`: to change it, append a
  function to `MIGRATIONS`, never edit an existing one. The file is copied to
  `<db>.v<n>.bak` before a migration runs. Foreign keys cascade: deleting a
  card or offer removes its tracked offers, deleting a card type removes its
  rewards and unlinks its cards.
- `server/test/` — vitest + supertest against an in-memory database.
- Field names are camelCase end to end (database columns, API, frontend
  types). Only `normalizeImportData` still accepts the old snake_case names,
  for backups exported before the rename.

## Styling

- **Tailwind v4** — `@import "tailwindcss"` + `@theme` tokens + custom
  `@variant dark`. Do NOT use v3 `@layer base` for tokens.
- Design tokens live in `src/index.css` (HSL `--background`, etc.).
- Per-category colors live in `CATEGORY_COLORS` in `src/lib/constants.tsx` as
  **static string literals** so Tailwind's JIT can detect them. Never build
  class names by string concat / `.replace()` — those get purged.

## Conventions / Gotchas

- **Date parsing**: always use `parseOfferDate(offer.expiryDate)` — never
  `new Date(offer.expiryDate)`. `YYYY-MM-DD` strings parsed by the Date
  constructor are UTC midnight and render one day off in negative timezones.
  `parseOfferDate` returns local midnight.
- **Categories are open strings**: people add their own. Render icons with
  `<CategoryIcon category={...}>` and colors with `getCategoryColor()`, which
  both fall back to 'Other'. List them with `listCategories()`.
- **Card color contrast**: when rendering text over a user-picked card color
  (`card.color` hex), pass it through `getReadableTextColor()` for the
  inline `color` style. Hard-coded `text-white` fails on light user colors.
- **Card type inheritance**: a card with a `cardTypeId` shows its type's
  issuer and color. Render cards from `useCards()` (`src/hooks/useCards.ts`),
  not from `useStore().cards`, which holds the stored values and is for
  writes and export only.
- **Modal stacking**: `Modal`, `ConfirmDialog` and `AlertDialog` share
  `src/hooks/useDialogLayer.ts`, which keeps one stack of open dialogs for the
  body scroll-lock and gives Escape to the topmost one. A new dialog component
  must use that hook (or just use `Modal`) — naive `body.style.overflow`
  toggling unlocks scroll behind the outer modal when an inner one closes.
- **rtk proxy**: the developer shell wraps `git`/`ls`/etc. through `rtk` for
  token compression. For raw output (full `git diff`, etc.) prefix with
  `rtk proxy <cmd>`.
- **rollup arm64 binary bug**: `@rollup/rollup-darwin-arm64` is pinned in
  `optionalDependencies` to work around the npm bug where the platform-
  specific rollup binary fails to install. If `npm run build` says
  `Cannot find module '@rollup/rollup-darwin-arm64'`, rerun `npm install`.

## Git

- `main` is protected — see global `~/.claude/CLAUDE.md`. Create a feature
  branch for changes; commits to `main` need explicit override.
- Commit style: `feat: <Title Case sentence>.` (see existing history).
