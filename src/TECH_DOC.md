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
A lightweight Express server managing a SQLite database (`server/database.sqlite`).

#### Endpoints
- **Initial Data**: `GET /api/initial-data` (Bulk fetch for efficient startup).
- **Cards**: `POST /api/cards`, `PUT /api/cards/:id`, `DELETE /api/cards/:id`.
- **Offers**: CRUD for offers.
- **Tracked Offers**: CRUD for tracking relationships.
- **Logging**: Uses `morgan` for HTTP request logging and custom logs for database operations.
- **Architecture**: Endpoints use `async/await` and `Promise` patterns for reliable data handling (refactored from callbacks).

#### Database Schema
- **`cards`**: `id`, `name`, `issuer`, `last4`, `color`, `cardHolder`, `notes`.
- **`offers`**: `id`, `retailer`, `description`, `terms`, `category`, `expirationDate`, `url`.
- **`tracked_offers`**: 
    - Links `offerId` and `cardId`.
    - `status`: 'Added' | 'Used' | 'Awarded' | 'Expired'.
    - Foreign keys with `ON DELETE CASCADE` (conceptually, though app logic handles cleanup too).

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
