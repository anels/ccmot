# Technical Documentation

## Architecture Overview
The application is a **Full-Stack** solution with a decoupled Frontend and Backend.

- **Frontend**: **React**, **TypeScript**, **Vite**, **Zustand** (Store), **Tailwind CSS**.
- **Backend**: **Node.js**, **Express**, **SQLite**.

### 1. State Management (Zustand + API)
Located in `src/lib/store.ts`.
- **Async Store**: Actions (`addCard`, `saveOffer`, etc.) call the backend API first and update local state only when it accepts the change. Each resolves `{ ok: true }` or `{ ok: false, error }`.
- **Initialization**: `initialize()` fetches all data (`cards`, `offers`, `trackedOffers`) from `GET /api/initial-data` on app mount.
- **Failures**: The store shows the error in a banner above any dialog and reloads from the server. Forms stay open with their input.

### 2. Backend API (`server/`)
A lightweight Express server managing a SQLite database (`~/.ccmot/database.sqlite`, or `CCMOT_DB_PATH`) through better-sqlite3.

#### Endpoints
- **Initial Data**: `GET /api/initial-data` (Bulk fetch for efficient startup).
- **Resources**: `cards`, `offers`, `tracked-offers`, `card-types`, `rewards`. Each has `GET /api/<resource>`, `POST /api/<resource>`, `PUT /api/<resource>/:id` (updates only the fields sent) and `DELETE /api/<resource>/:id`, generated from the `RESOURCES` table in `server/app.js`.
- **Import**: `POST /api/import` replaces all data in one transaction.
- **Save an offer**: `PUT /api/offers/:id/with-cards` takes `{ offer, cardIds, isNew, seenRowIds }` and saves the offer and the cards tracking it in one transaction. Rows not in `seenRowIds` are never removed, and updating a missing offer is a 404.
- **Validation**: A new card needs `last4`; older cards may lack it. Creates, updates and imports reject an empty required field, an unknown tracked offer status and an offer date that is not a real date written as `YYYY-MM-DD`, optionally followed by a time (empty is allowed). A rejected import names the row.
- **Errors**: `{ "error": "..." }` with 400 (validation or constraint failure), 404 (unknown id) or 500.
- **Logging**: Uses `morgan` for HTTP request logging; request bodies are not logged.

#### Database Schema
- **`cards`**: `id`, `name`, `issuer`, `last4`, `color`, `cardHolder`, `notes`, `cardTypeId`.
- **`offers`**: `id`, `merchantName`, `description`, `terms`, `category`, `expiryDate`, `url`.
- **`tracked_offers`**:
    - Links `offerId` and `cardId`; one row per pair.
    - `status`: 'Added' | 'Used' | 'Awarded' | 'Expired'.
- **`card_types`**: `id`, `name`, `issuer`, `color`.
- **`rewards`**: `id`, `cardTypeId`, `category`, `rewardValue`, `rewardUnit`, `description`.
- Foreign keys are enforced: tracked offers are deleted with their card or offer, rewards with their card type, and a card is unlinked when its card type is deleted, keeping that type's issuer and color.
- The schema version is stored in `PRAGMA user_version`. `server/db.js` runs pending migrations on startup and first copies the file to `<db>.v<n>.bak`.

### 3. Key Components
- **`Dashboard.tsx`**: Main view.
    - Renders what `lib/dashboard.ts` builds: category sections, then used, awarded and expired offers.
    - Displays `CatalogOfferCard` list for a search or a chosen category. Expired offers cannot be tracked.
    - Exports the wallet (`buildOffersExport`) through `lib/save-file.ts`.
- **`TrackedOfferCard.tsx`**: 
    - Compact card layout (Single line for details, smart masking).
    - Visual cues for **Expired** status (Faded, strikethrough). Status and buttons come from `lib/lifecycle.ts`.
- **`CatalogOfferCard.tsx`**:
    - Displays distinct offer details.
    - Allows tracking an offer to specific cards.
- **`CardManager.tsx`**: 
    - Manage credit cards (Add/Edit/Delete).
    - Search functionality (hides when form is open).
- **`OfferManager.tsx`**:
    - Manage available offers.

### 4. Custom Hooks & Clients
- **`useSearch`**: Generic search filter over `lib/search.ts` matching.
- **`api/client.ts`**: Centralized HTTP client using `fetch`. Configurable via `VITE_API_URL` (defaults to `http://localhost:3001/api`).

## Recent Improvements
- **Persistence**: Replaced `localStorage` with a robust **SQLite Backend**.
- **Logging**: Added detailed backend logs for better debugging and monitoring.
- **Concurrency**: `npm run dev:all` runs both client and server simultaneously.
- **Robustness**: `lib/backup.ts` upgrades legacy backups on import; the server is the source of truth.
