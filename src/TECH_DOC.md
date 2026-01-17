# Technical Documentation

## Architecture Overview
The application is built with **React**, **TypeScript**, and **Vite**, using **Zustand** for state management and **Tailwind CSS** for styling.

### 1. State Management (Zustand)
Located in `src/lib/store.ts`.
- **Store**: `useStore` manages global state for `cards`, `offers`, and `trackedOffers`.
- **Persistence**: Uses `persist` middleware to save data to `localStorage`.
- **Actions**: 
    - CRUD operations for Cards and Offers.
    - `trackOffer`: Links an offer to a card.
    - `importData`: Robust import function with sanitization (handles missing fields like `category`, `cardHolder`).

### 2. Custom Hooks
#### `useSearch` (`src/hooks/useSearch.ts`)
A generic hook for filtering arrays based on a search term.
- **Usage**: `const { searchTerm, setSearchTerm, filteredItems } = useSearch(items, fieldsToSearch)`;
- **Features**: Case-insensitive, multi-field search.

### 3. Key Components
- **`Dashboard.tsx`**: Main view.
    - Displays `TrackedOfferCard` list (Active & Expired).
    - Displays `CatalogOfferCard` list (Available offers).
    - Integrates `useSearch` for filtering all offers.
- **`TrackedOfferCard.tsx`**: 
    - Compact card layout (Single line for details, smart masking).
    - Visual cues for **Expired** status (Faded, strikethrough).
    - Auto-detects expiration based on `expiryDate`.
- **`CatalogOfferCard.tsx`**:
    - Displays distinct offer details.
    - Allows tracking an offer to specific cards.
- **`CardManager.tsx`**: 
    - Manage credit cards (Add/Edit/Delete).
    - Search functionality (hides when form is open).
- **`OfferManager.tsx`**:
    - Manage available offers.
    - Auto-assigns categories (e.g., 'Shopping', 'Travel').

### 4. Data Models (`src/types.ts`)
- **`CreditCard`**:
    - `id`, `name`, `issuer`, `last4`, `color`
    - `cardHolder` (Optional): Name on card.
    - `notes` (Optional): User notes.
- **`Offer`**:
    - `id`, `merchantName`, `description`, `terms`, `expiryDate`
    - `category`: 'Travel', 'Dining', 'Shopping', etc.
- **`TrackedOffer`**:
    - link between `offerId` and `cardId`.
    - `status`: 'Added' | 'Used' | 'Awarded' | 'Expired'.

## Recent Improvements
- **Robustness**: Import logic now gracefully handles legacy data files by injecting default values for missing fields.
- **Performance**: Search logic centralized in `useSearch` to prevent code duplication.
- **UX**:
    - **Smart Masking**: Hidden dots if no last 4 digits.
    - **Auto-Expiry**: Offers automatically show as 'Expired' when past date.
    - **Compact Layout**: Optimized space on dashboard cards.
