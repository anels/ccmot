# CCMOT — Project Context for Claude

Credit Card Offer Tracker. Vite + React 19 + TypeScript frontend talking to a
local Express + SQLite backend. Also packaged for Android via Capacitor.

## Quick Start

```bash
npm install
cd server && npm install && cd ..
npm run dev:all          # frontend (5173) + backend (3001) concurrent
npm run build            # tsc -b && vite build
npm run lint             # eslint
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
- `src/lib/store.ts` — Zustand store. **Async** actions hit the backend first;
  `initialize()` runs once from `App.tsx` on mount via
  `GET /api/initial-data`.
- `src/lib/utils.ts` — `cn`, `parseOfferDate`, `isOfferExpired`,
  `getReadableTextColor`, `generateOffersExport`.
- `src/lib/constants.tsx` — Categories, issuer colors, **STATUS_COLORS**,
  **STATUS_DOT**, **CATEGORY_COLORS** + `getCategoryColor()`.
- `src/api/client.ts` — fetch wrapper, base URL `VITE_API_URL`
  (default `http://localhost:3001/api`).
- `server/index.js` — Express routes for cards / offers / trackedOffers /
  cardTypes / rewards. Uses `async/await` + `Promise`s (refactored from
  callbacks).
- `server/db.js` — SQLite schema + connection. Foreign keys are enabled on
  connection; tracked offers cascade when cards/offers are deleted.

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
- **Category icon lookup**: use `CATEGORY_ICONS[cat] || CATEGORY_ICONS['Other']`,
  NOT `CATEGORY_ICONS[cat || 'Other']`. The second form returns `undefined`
  for user-created custom categories and crashes React.
- **Card color contrast**: when rendering text over a user-picked card color
  (`card.color` hex), pass it through `getReadableTextColor()` for the
  inline `color` style. Hard-coded `text-white` fails on light user colors.
- **Modal stacking**: `Modal.tsx` uses a module-level open counter for the
  body scroll-lock. If you add a new dialog component, use the same pattern
  (or just use `Modal`) — naive `body.style.overflow` toggling unlocks scroll
  behind the outer modal when an inner one closes.
- **rtk proxy**: the developer shell wraps `git`/`ls`/etc. through `rtk` for
  token compression. For raw output (full `git diff`, etc.) prefix with
  `rtk proxy <cmd>`.
- **rollup arm64 binary bug**: `@rollup/rollup-darwin-arm64` is pinned in
  `optionalDependencies` to work around the npm bug where the platform-
  specific rollup binary fails to install. If `npm run build` says
  `Cannot find module '@rollup/rollup-darwin-arm64'`, rerun `npm install`.
- **Capacitor**: `capacitor.config.ts` targets `appId: com.ccmot.app`,
  `webDir: dist`. Build with `npm run build` then `npx cap sync` /
  `cap run android`. Capacitor only packages the frontend; set `VITE_API_URL`
  to a reachable backend for native builds.

## Git

- `main` is protected — see global `~/.claude/CLAUDE.md`. Create a feature
  branch for changes; commits to `main` need explicit override.
- Commit style: `feat: <Title Case sentence>.` (see existing history).
