# Technical Documentation

## Architecture Overview
The application is a **Full-Stack** solution with a decoupled Frontend and Backend.

- **Frontend**: **React**, **TypeScript**, **Vite**, **Zustand** (Store), **Tailwind CSS**.
- **Backend**: **Node.js**, **Express**, **SQLite**.

### 1. State Management (Zustand + API)
Located in `src/lib/store.ts`.
- **Async Store**: The store is now asynchronous. Actions (`addCard`, `updateOffer`, etc.) call the backend API first.
- **Initialization**: `initialize()` fetches all data (`cards`, `offers`, `trackedOffers`) from `GET /api/initial-data` on app mount.
- **Optimistic Updates**: Some actions update the UI immediately while waiting for server confirmation.

### 2. Backend API (`server/`)
A lightweight Express server managing a SQLite database (`~/.ccmot/database.sqlite`, or `CCMOT_DB_PATH`) through better-sqlite3.

#### Endpoints
- **Initial Data**: `GET /api/initial-data` (Bulk fetch for efficient startup).
- **Resources**: `cards`, `offers`, `tracked-offers`, `card-types`, `rewards`. Each has `GET /api/<resource>`, `POST /api/<resource>`, `PUT /api/<resource>/:id` (updates only the fields sent) and `DELETE /api/<resource>/:id`, generated from the `RESOURCES` table in `server/app.js`.
- **Import**: `POST /api/import` replaces all data in one transaction.
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
- Foreign keys are enforced: tracked offers are deleted with their card or offer, rewards with their card type, and a card is unlinked when its card type is deleted.
- The schema version is stored in `PRAGMA user_version`. `server/db.js` runs pending migrations on startup and first copies the file to `<db>.v<n>.bak`.

### 3. Key Components
- **`Dashboard.tsx`**: Main view.
    - Displays `TrackedOfferCard` list (Active & Expired).
    - Displays `CatalogOfferCard` list (Available offers).
    - Integrates `useSearch` for filtering all offers.
- **`TrackedOfferCard.tsx`**: 
    - Compact card layout (Single line for details, smart masking).
    - Visual cues for **Expired** status (Faded, strikethrough).
- **`CatalogOfferCard.tsx`**:
    - Displays distinct offer details.
    - Allows tracking an offer to specific cards.
- **`CardManager.tsx`**: 
    - Manage credit cards (Add/Edit/Delete).
    - Search functionality (hides when form is open).
- **`OfferManager.tsx`**:
    - Manage available offers.
    - Auto-assigns categories (e.g., 'Shopping', 'Travel').

### 4. Custom Hooks & Clients
- **`useSearch`**: Generic search filter.
- **`useSearch`**: Generic search filter.
- **`api/client.ts`**: Centralized HTTP client using `fetch`. Configurable via `VITE_API_URL` (defaults to `http://localhost:3001/api`).

## Recent Improvements
- **Persistence**: Replaced `localStorage` with a robust **SQLite Backend**.
- **Logging**: Added detailed backend logs for better debugging and monitoring.
- **Concurrency**: `npm run dev:all` runs both client and server simultaneously.
- **Robustness**: Import logic handles legacy data, though the primary source of truth is now the server.
